/**
 * ProviderDashboardScreen — Astrologer/Influencer business dashboard
 * Revenue, upcoming bookings, client history, alerts
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../../config/firebase';
import { BASE_URL } from '../../config/constants';

const STATUS_CFG = {
  pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  label: 'Pending'   },
  confirmed: { color: '#10B981', bg: 'rgba(16,185,129,0.15)',  label: 'Confirmed' },
  cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   label: 'Cancelled' },
  completed: { color: '#7C3AED', bg: 'rgba(124,58,237,0.15)',  label: 'Done'      },
};

function BookingCard({ item, onAction }) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.pending;
  const isPast = item.date < new Date().toISOString().split('T')[0];

  return (
    <View style={bc.card}>
      <View style={bc.top}>
        <View style={{ flex: 1 }}>
          <Text style={bc.clientName}>{item.client_name || 'Client'}</Text>
          <Text style={bc.meta}>{item.service_name} · {item.service_duration} min</Text>
          <Text style={bc.datetime}>{item.date} at {item.time_slot}</Text>
          {item.client_phone ? <Text style={bc.phone}>📱 {item.client_phone}</Text> : null}
          {item.message ? <Text style={bc.msg} numberOfLines={2}>"{item.message}"</Text> : null}
        </View>
        <View style={bc.right}>
          <Text style={bc.price}>₹{item.service_price}</Text>
          <View style={[bc.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[bc.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
      </View>

      {item.status === 'pending' && !isPast && (
        <View style={bc.actions}>
          <TouchableOpacity style={bc.confirmBtn} onPress={() => onAction(item.id, 'confirm')}>
            <Text style={bc.confirmTxt}>Confirm Session</Text>
          </TouchableOpacity>
          <TouchableOpacity style={bc.cancelBtn} onPress={() => onAction(item.id, 'cancel')}>
            <Text style={bc.cancelTxt}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const bc = StyleSheet.create({
  card:        { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  top:         { flexDirection: 'row', gap: 12 },
  clientName:  { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 3 },
  meta:        { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  datetime:    { fontSize: 13, color: '#F4B942', fontWeight: '600', marginBottom: 2 },
  phone:       { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  msg:         { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 4 },
  right:       { alignItems: 'flex-end', gap: 8 },
  price:       { fontSize: 20, fontWeight: '900', color: '#10B981' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:   { fontSize: 12, fontWeight: '700' },
  actions:     { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)' },
  confirmBtn:  { flex: 1, backgroundColor: '#10B981', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  confirmTxt:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelBtn:   { flex: 0.5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  cancelTxt:   { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 13 },
});

export default function ProviderDashboardScreen({ navigation }) {
  const [data, setData]          = useState(null);
  const [loading, setLoading]    = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [tab, setTab]            = useState('upcoming');
  const topPad = StatusBar.currentHeight || 0;

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const res = await fetch(`${BASE_URL}/api/provider/dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: '{}',
      });
      const d = await res.json();
      setData(d);
    } catch {}
    setLoading(false); setRefresh(false);
  };

  const handleAction = async (bookingId, action) => {
    const label = action === 'confirm' ? 'Confirm' : 'Decline';
    Alert.alert(`${label} booking?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label, style: action === 'cancel' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
            await fetch(`${BASE_URL}/api/provider/booking-action`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ booking_id: bookingId, action }),
            });
            load();
          } catch {}
        },
      },
    ]);
  };

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#060412' }}>
      <ActivityIndicator color="#F4B942" />
    </View>
  );

  const upcoming     = data?.upcoming || [];
  const past         = data?.past || [];
  const pendingCount = data?.pending_count || 0;
  const revenue      = data?.total_revenue || 0;
  const sessions     = data?.total_sessions || 0;
  const thisMonth    = past.filter(b => b.date?.startsWith(new Date().toISOString().slice(0, 7))).reduce((a, b) => a + (b.service_price || 0), 0);

  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <View style={{ flex: 1, backgroundColor: '#060412' }}>
      <LinearGradient colors={['#0D0829','#1E0A5C']} style={[s.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44 }}>
          <Text style={{ fontSize: 28, color: '#fff' }}>&#8249;</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Dashboard</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor="#F4B942" />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Revenue stats */}
        <View style={s.statsRow}>
          <LinearGradient colors={['#10B981','#059669']} style={s.statCard}>
            <Text style={s.statNum}>₹{revenue.toLocaleString()}</Text>
            <Text style={s.statLabel}>Total Revenue</Text>
          </LinearGradient>
          <LinearGradient colors={['#7C3AED','#5B21B6']} style={s.statCard}>
            <Text style={s.statNum}>₹{thisMonth.toLocaleString()}</Text>
            <Text style={s.statLabel}>This Month</Text>
          </LinearGradient>
          <View style={s.statCardPlain}>
            <Text style={s.statNumDark}>{sessions}</Text>
            <Text style={s.statLabelDark}>Sessions Done</Text>
          </View>
          <View style={[s.statCardPlain, pendingCount > 0 && { borderColor: '#F59E0B' }]}>
            <Text style={[s.statNumDark, pendingCount > 0 && { color: '#F59E0B' }]}>{pendingCount}</Text>
            <Text style={s.statLabelDark}>Pending</Text>
          </View>
        </View>

        {/* Alert for pending bookings */}
        {pendingCount > 0 && (
          <View style={s.alert}>
            <Text style={s.alertIcon}>🔔</Text>
            <Text style={s.alertTxt}>
              You have <Text style={{ color: '#F59E0B', fontWeight: '800' }}>{pendingCount} pending</Text> booking{pendingCount > 1 ? 's' : ''} waiting for your confirmation.
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={s.section}>
          <View style={s.tabRow}>
            <TouchableOpacity style={[s.tabChip, tab === 'upcoming' && s.tabChipOn]} onPress={() => setTab('upcoming')}>
              <Text style={[s.tabTxt, tab === 'upcoming' && s.tabTxtOn]}>
                Upcoming {upcoming.length > 0 ? `(${upcoming.length})` : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tabChip, tab === 'past' && s.tabChipOn]} onPress={() => setTab('past')}>
              <Text style={[s.tabTxt, tab === 'past' && s.tabTxtOn]}>
                History {past.length > 0 ? `(${past.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {displayed.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>
                {tab === 'upcoming' ? '📅' : '📋'}
              </Text>
              <Text style={s.emptyTxt}>
                {tab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions yet'}
              </Text>
              <Text style={s.emptySub}>
                {tab === 'upcoming'
                  ? 'Share your profile on the feed so users can book you.'
                  : 'Completed sessions will appear here.'}
              </Text>
            </View>
          ) : (
            displayed.map((b, i) => <BookingCard key={b.id || i} item={b} onAction={handleAction} />)
          )}
        </View>

        {/* Tips */}
        <View style={s.section}>
          <Text style={s.sectionHead}>Grow Your Practice</Text>
          <View style={s.tipsBox}>
            {[
              { icon: '📸', tip: 'Post a sample reading on the social feed to attract clients.' },
              { icon: '🌟', tip: 'Ask happy clients to leave you a review — it builds trust fast.' },
              { icon: '💬', tip: 'Use Ask Astro to answer questions publicly — it shows your expertise.' },
              { icon: '🗓', tip: 'Share auspicious muhurats daily — free value builds followers.' },
            ].map((t, i) => (
              <View key={i} style={[s.tipRow, i === 3 && { borderBottomWidth: 0 }]}>
                <Text style={{ fontSize: 20, width: 30 }}>{t.icon}</Text>
                <Text style={s.tipTxt}>{t.tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14 },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: '#fff' },
  statsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  statCard:     { width: '47%', borderRadius: 16, padding: 16 },
  statNum:      { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statLabel:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '600' },
  statCardPlain:{ width: '47%', borderRadius: 16, padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statNumDark:  { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statLabelDark:{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: '600' },
  alert:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 4, backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  alertIcon:    { fontSize: 20 },
  alertTxt:     { flex: 1, fontSize: 13.5, color: 'rgba(255,255,255,0.8)', lineHeight: 19 },
  section:      { paddingHorizontal: 16, marginTop: 16 },
  sectionHead:  { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 14, letterSpacing: -0.3 },
  tabRow:       { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tabChip:      { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabChipOn:    { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  tabTxt:       { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  tabTxtOn:     { color: '#fff' },
  empty:        { alignItems: 'center', paddingVertical: 50 },
  emptyTxt:     { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptySub:     { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 19 },
  tipsBox:      { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  tipRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tipTxt:       { flex: 1, fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 19 },
});
