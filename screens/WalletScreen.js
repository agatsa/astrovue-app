/**
 * WalletScreen — Dharma Coins: balance, earn history, spend history
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../config/firebase';
import { BASE_URL } from '../config/constants';

const EARN_LABELS = {
  post_created:    { icon: '✍', label: 'Posted content',      color: '#10B981' },
  post_liked:      { icon: '♥', label: 'Post liked',          color: '#10B981' },
  daily_login:     { icon: '☀', label: 'Daily login bonus',   color: '#10B981' },
  referral:        { icon: '👥', label: 'Referred a friend',  color: '#10B981' },
  comment_posted:  { icon: '💬', label: 'Posted a comment',   color: '#10B981' },
  profile_complete:{ icon: '✓', label: 'Completed profile',   color: '#10B981' },
  jyotish_message: { icon: '🔮', label: 'Ask Astro message',  color: '#EF4444' },
  vastu_scan:      { icon: '🏠', label: 'Vastu scan',         color: '#EF4444' },
  muhurat_report:  { icon: '🗓', label: 'Muhurat report',     color: '#EF4444' },
  booking_discount:{ icon: '📅', label: 'Session discount',   color: '#EF4444' },
};

const HOW_TO_EARN = [
  { icon: '✍', label: 'Create a post',   coins: '+5'  },
  { icon: '☀', label: 'Daily login',     coins: '+2'  },
  { icon: '♥', label: 'Post liked',      coins: '+1'  },
  { icon: '👥', label: 'Refer friend',   coins: '+50' },
  { icon: '✓', label: 'Full profile',    coins: '+20' },
];

const HOW_TO_SPEND = [
  { icon: '🔮', label: 'Extra Ask Astro message', coins: '2'         },
  { icon: '🏠', label: 'Vastu scan',              coins: '10'        },
  { icon: '🗓', label: 'Muhurat report',           coins: '5'         },
  { icon: '📅', label: 'Session discount',         coins: '20 = ₹50' },
];

function TxRow({ item }) {
  const cfg    = EARN_LABELS[item.reason] || { icon: '🪙', label: item.reason || 'Transaction', color: item.type === 'earn' ? '#10B981' : '#EF4444' };
  const isEarn = item.type === 'earn';
  const d      = item.created_at ? new Date(item.created_at) : null;
  const dateStr= d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <View style={s.txRow}>
      <View style={[s.txIcon, { backgroundColor: cfg.color + '18' }]}>
        <Text style={{ fontSize: 18 }}>{cfg.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.txLabel}>{cfg.label}</Text>
        <Text style={s.txDate}>{dateStr}</Text>
      </View>
      <Text style={[s.txAmount, { color: cfg.color }]}>
        {isEarn ? '+' : ''}{Math.abs(item.amount)} 🪙
      </Text>
    </View>
  );
}

export default function WalletScreen({ navigation }) {
  const [balance, setBalance]    = useState(0);
  const [freeJyotish, setFree]   = useState(5);
  const [transactions, setTxs]   = useState([]);
  const [loading, setLoading]    = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [tab, setTab]            = useState('all');
  const topPad = StatusBar.currentHeight || 0;

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const h = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const [b, hist] = await Promise.all([
        fetch(`${BASE_URL}/api/coins/balance`, { method: 'POST', headers: h, body: '{}' }),
        fetch(`${BASE_URL}/api/coins/history`, { method: 'POST', headers: h, body: JSON.stringify({ limit: 100 }) }),
      ]);
      const bd = await b.json(); const hd = await hist.json();
      setBalance(bd.balance || 0);
      setFree(bd.jyotish_free_remaining ?? 5);
      setTxs(hd.transactions || []);
    } catch {}
    setLoading(false); setRefresh(false);
  };

  const collectDaily = async () => {
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const res = await fetch(`${BASE_URL}/api/coins/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: 'daily_login' }),
      });
      const d = await res.json();
      if (d.success) { setBalance(d.balance); load(); }
      else alert('Already collected today! Come back tomorrow.');
    } catch {}
  };

  const filtered = tab === 'all' ? transactions : transactions.filter(t => t.type === (tab === 'earn' ? 'earn' : 'spend'));

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#060412' }}>
      <ActivityIndicator color="#F4B942" />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#060412' }}>
      <LinearGradient colors={['#0D0829','#1E0A5C']} style={[s.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44 }}>
          <Text style={{ fontSize: 28, color: '#fff' }}>&#8249;</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Dharma Wallet</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor="#F4B942" />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Balance */}
        <LinearGradient colors={['#1E0A5C','#3B1FA8','#1E0A5C']} style={s.balCard}>
          <Text style={s.balLabel}>YOUR DHARMA COINS</Text>
          <Text style={s.balNum}>{balance.toLocaleString()}</Text>
          <Text style={s.balSub}>Earn by engaging. Spend on cosmic tools.</Text>
          <View style={s.freeBar}>
            <Text style={s.freeBarTxt}>Ask Astro free messages today</Text>
            <View style={s.freeDotsRow}>
              {[...Array(5)].map((_, i) => (
                <View key={i} style={[s.freeDot, i < freeJyotish ? s.freeDotOn : s.freeDotOff]} />
              ))}
            </View>
            <Text style={s.freeCount}>{freeJyotish} of 5 remaining</Text>
          </View>
          <TouchableOpacity style={s.collectBtn} onPress={collectDaily}>
            <Text style={s.collectTxt}>Collect Today's Login Bonus  +2 🪙</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Earn */}
        <View style={s.section}>
          <Text style={s.sectionHead}>How to Earn</Text>
          <View style={s.grid}>
            {HOW_TO_EARN.map((r, i) => (
              <View key={i} style={s.gridCard}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</Text>
                <Text style={s.gridLabel}>{r.label}</Text>
                <Text style={s.gridCoins}>{r.coins} 🪙</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Spend */}
        <View style={s.section}>
          <Text style={s.sectionHead}>What Coins Unlock</Text>
          <View style={s.spendBox}>
            {HOW_TO_SPEND.map((r, i) => (
              <View key={i} style={[s.spendRow, i === HOW_TO_SPEND.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={{ fontSize: 20, width: 28 }}>{r.icon}</Text>
                <Text style={s.spendLabel}>{r.label}</Text>
                <Text style={s.spendCoins}>{r.coins} 🪙</Text>
              </View>
            ))}
          </View>
        </View>

        {/* History */}
        <View style={s.section}>
          <Text style={s.sectionHead}>History</Text>
          <View style={s.tabRow}>
            {[['all','All'],['earn','Earned'],['spend','Spent']].map(([k, lbl]) => (
              <TouchableOpacity key={k} style={[s.tabChip, tab === k && s.tabChipOn]} onPress={() => setTab(k)}>
                <Text style={[s.tabTxt, tab === k && s.tabTxtOn]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 34, marginBottom: 10 }}>🪙</Text>
              <Text style={s.emptyTxt}>No transactions yet</Text>
              <Text style={s.emptySub}>Post content and log in daily to earn your first coins.</Text>
            </View>
          ) : filtered.map((tx, i) => <TxRow key={tx.id || i} item={tx} />)}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14 },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: '#fff' },
  balCard:      { margin: 16, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(244,185,66,0.2)' },
  balLabel:     { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 8 },
  balNum:       { fontSize: 62, fontWeight: '900', color: '#F4B942', letterSpacing: -3, lineHeight: 66 },
  balSub:       { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, marginBottom: 20, textAlign: 'center' },
  freeBar:      { width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, alignItems: 'center', gap: 8, marginBottom: 14 },
  freeBarTxt:   { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  freeDotsRow:  { flexDirection: 'row', gap: 8 },
  freeDot:      { width: 14, height: 14, borderRadius: 7 },
  freeDotOn:    { backgroundColor: '#7C3AED' },
  freeDotOff:   { backgroundColor: 'rgba(255,255,255,0.12)' },
  freeCount:    { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  collectBtn:   { backgroundColor: 'rgba(244,185,66,0.15)', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(244,185,66,0.3)' },
  collectTxt:   { fontSize: 13, color: '#F4B942', fontWeight: '700' },
  section:      { paddingHorizontal: 16, marginTop: 20 },
  sectionHead:  { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 14, letterSpacing: -0.3 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard:     { width: '30%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  gridLabel:    { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 4, lineHeight: 15 },
  gridCoins:    { fontSize: 13, color: '#10B981', fontWeight: '800' },
  spendBox:     { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  spendRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  spendLabel:   { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  spendCoins:   { fontSize: 13, color: '#EF4444', fontWeight: '700' },
  tabRow:       { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabChip:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabChipOn:    { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  tabTxt:       { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  tabTxtOn:     { color: '#fff' },
  txRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  txIcon:       { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txLabel:      { fontSize: 14, color: '#fff', fontWeight: '600', marginBottom: 2 },
  txDate:       { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  txAmount:     { fontSize: 15, fontWeight: '800' },
  empty:        { alignItems: 'center', paddingVertical: 40 },
  emptyTxt:     { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptySub:     { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 19 },
});
