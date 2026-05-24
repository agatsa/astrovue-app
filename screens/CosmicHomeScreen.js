/**
 * CosmicHomeScreen — Premium Daily Briefing
 * Melooha-beating design: immersive, personal, magazine-quality
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Image, RefreshControl, Share, ActivityIndicator,
  Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/constants';

const { width: SW, height: SH } = Dimensions.get('window');
const TOP = StatusBar.currentHeight || 0;

// ── Constants ──────────────────────────────────────────────────────────────────
const PLANET_SYMBOLS = {
  Sun: '☀', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

const ZONE_CFG = {
  'Green Zone':   { color: '#10B981', bg: 'rgba(16,185,129,0.15)', label: 'Favourable',   sub: 'Flow with confidence today' },
  'Red Zone':     { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',  label: 'Navigate Care', sub: 'Pause before big decisions' },
  'Neutral Zone': { color: '#F4B942', bg: 'rgba(244,185,66,0.15)', label: 'Balanced',      sub: 'Steady, grounded energy' },
};

const TOOLS = [
  { key: 'AiJyotish',          label: 'Ask Jyotish',    icon: '🔮', grad: ['#4C1D95','#7C3AED'] },
  { key: 'MuhuratScreen',      label: 'Muhurat',         icon: '🗓', grad: ['#78350F','#B45309'] },
  { key: 'VastuScanner',       label: 'Vastu Scan',      icon: '🏠', grad: ['#1A0533','#4C1D95'] },
  { key: 'RelationshipCosmos', label: 'Compatibility',   icon: '💞', grad: ['#881337','#BE185D'] },
  { key: 'HealthRhythm',       label: 'Health Rhythm',   icon: '⚡', grad: ['#064E3B','#059669'] },
  { key: 'Kundli',             label: 'My Kundli',       icon: '📜', grad: ['#0C4A6E','#0284C7'] },
];

function cosmicScore(energy) {
  if (!energy?.scores) return energy?.zone === 'Green Zone' ? 78 : energy?.zone === 'Red Zone' ? 32 : 55;
  const vals = Object.values(energy.scores).map(d => d?.score ?? d).filter(n => typeof n === 'number');
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 55;
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ photo, name, size = 44, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[av.ring, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2 }]}>
      <LinearGradient colors={['#F4B942','#7C3AED']} style={[av.grad, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
        <View style={[av.inner, { width: size, height: size, borderRadius: size / 2 }]}>
          {photo
            ? <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} />
            : <Text style={{ color: '#F4B942', fontWeight: '800', fontSize: size * 0.4 }}>{(name || '?')[0].toUpperCase()}</Text>
          }
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
const av = StyleSheet.create({
  ring:  { justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  grad:  { justifyContent: 'center', alignItems: 'center', padding: 2 },
  inner: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0829', borderWidth: 2, borderColor: '#0D0829', overflow: 'hidden' },
});

// ── Cosmic Score Ring ──────────────────────────────────────────────────────────
function ScoreRing({ score, zone }) {
  const cfg = ZONE_CFG[zone] || ZONE_CFG['Neutral Zone'];
  const size = 110;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      {/* Outer glow ring */}
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: cfg.color + '40' }} />
      <View style={{ position: 'absolute', width: size - 12, height: size - 12, borderRadius: (size - 12) / 2, borderWidth: 1.5, borderColor: cfg.color + '60' }} />
      {/* Score */}
      <Text style={{ fontSize: 36, fontWeight: '900', color: cfg.color, letterSpacing: -2 }}>{score}</Text>
      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: -2 }}>score</Text>
    </View>
  );
}

// ── Planet Bar ─────────────────────────────────────────────────────────────────
function PlanetBar({ name, score, sign }) {
  const color = score >= 75 ? '#10B981' : score >= 55 ? '#F4B942' : score >= 35 ? '#F97316' : '#EF4444';
  const w     = `${score}%`;
  return (
    <View style={pb.row}>
      <Text style={pb.sym}>{PLANET_SYMBOLS[name] || '★'}</Text>
      <View style={{ flex: 1 }}>
        <View style={pb.trackBg}>
          <View style={[pb.trackFill, { width: w, backgroundColor: color }]} />
        </View>
      </View>
      <Text style={pb.sign}>{sign || name}</Text>
      <Text style={[pb.score, { color }]}>{score}</Text>
    </View>
  );
}
const pb = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sym:     { width: 22, fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  trackBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, flex: 1, overflow: 'hidden' },
  trackFill:{ height: '100%', borderRadius: 2 },
  sign:    { width: 60, fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'right' },
  score:   { width: 28, fontSize: 12, fontWeight: '800', textAlign: 'right' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function CosmicHomeScreen({ navigation }) {
  const [energy, setEnergy]        = useState(null);
  const [profile, setProfile]      = useState(null);
  const [loading, setLoading]      = useState(true);
  const [refreshing, setRefreshing]= useState(false);
  const [error, setError]          = useState(null);
  const [greeting, setGreeting]    = useState('');
  const [coinBalance, setCoins]    = useState(null);

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 5)       setGreeting('Late Night');
    else if (hr < 12) setGreeting('Good Morning');
    else if (hr < 17) setGreeting('Good Afternoon');
    else if (hr < 21) setGreeting('Good Evening');
    else              setGreeting('Good Night');
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      let prof = {};
      try {
        const ps = await AsyncStorage.getItem('userProfile');
        if (ps) { prof = JSON.parse(ps); setProfile(prof); }
      } catch { await AsyncStorage.removeItem('userProfile'); }

      const today = new Date().toISOString().split('T')[0];
      try {
        const cached     = await AsyncStorage.getItem('@daily_energy');
        const cachedDate = await AsyncStorage.getItem('@daily_energy_date');
        if (cached && cachedDate === today) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.moon_sign || parsed.zone)) {
            setEnergy(parsed); setLoading(false); return;
          }
        }
      } catch { await AsyncStorage.multiRemove(['@daily_energy', '@daily_energy_date']); }
      await fetchFreshEnergy(prof);
    } catch (e) {
      setError('Network error. Pull down to retry.'); setLoading(false);
    }
  };

  const fetchFreshEnergy = async (prof) => {
    const today = new Date().toISOString().split('T')[0];
    const p = prof || profile;
    if (!p?.dob || !p?.pob) { setError('complete_profile'); setLoading(false); setRefreshing(false); return; }
    try {
      const res  = await fetch(`${BASE_URL}/api/daily-energy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: p.name, dob: p.dob, tob: p.tob || '12:00', pob: p.pob }),
      });
      const data = await res.json();
      if (!data.error) {
        setEnergy(data);
        await AsyncStorage.setItem('@daily_energy', JSON.stringify(data));
        await AsyncStorage.setItem('@daily_energy_date', today);
      } else { setError(data.error); }
    } catch { setError('Network error. Please try again.'); }
    finally  { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setError(null);
    await AsyncStorage.removeItem('@daily_energy_date');
    const ps = await AsyncStorage.getItem('userProfile');
    await fetchFreshEnergy(ps ? JSON.parse(ps) : profile);
  }, [profile]);

  const share = async () => {
    if (!energy) return;
    Share.share({ message: `${greeting}, I'm in ${energy.zone || 'Neutral Zone'} today.\n\n"${energy.gpt_summary?.split('.')[0]}."\n\n🌙 ${energy.moon_sign}  ·  ↑ ${energy.ascendant}\n\nVia AstroVue` });
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <LinearGradient colors={['#060412','#12063A','#1E0A5C']} style={s.fill}>
      <Text style={s.loadLogo}>AstroVue</Text>
      <ActivityIndicator color="#F4B942" size="large" style={{ marginTop: 24 }} />
      <Text style={s.loadSub}>Reading the stars for you...</Text>
    </LinearGradient>
  );

  // ── Complete Profile ────────────────────────────────────────────────────────
  if (error === 'complete_profile') return (
    <LinearGradient colors={['#060412','#12063A','#1E0A5C']} style={s.fill}>
      <Text style={{ fontSize: 56, marginBottom: 24 }}>🌟</Text>
      <Text style={s.onboardH}>Set up your chart</Text>
      <Text style={s.onboardSub}>Your birth date, time and place unlock your personalised cosmic briefing.</Text>
      <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={s.goldBtn}>
        <LinearGradient colors={['#F4B942','#E09000']} style={s.goldBtnInner}>
          <Text style={s.goldBtnTxt}>Complete Profile</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) return (
    <LinearGradient colors={['#060412','#12063A','#1E0A5C']} style={s.fill}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
      <Text style={s.onboardH}>Could not load</Text>
      <Text style={s.onboardSub}>{error}</Text>
      <TouchableOpacity onPress={() => { setError(null); setLoading(true); loadData(); }} style={s.goldBtn}>
        <LinearGradient colors={['#F4B942','#E09000']} style={s.goldBtnInner}>
          <Text style={s.goldBtnTxt}>Try Again</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );

  const zone  = energy?.zone || 'Neutral Zone';
  const cfg   = ZONE_CFG[zone] || ZONE_CFG['Neutral Zone'];
  const score = cosmicScore(energy);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const planets = energy?.scores
    ? Object.entries(energy.scores)
        .map(([name, d]) => ({ name, score: d?.score ?? d, sign: d?.sign || '' }))
        .filter(p => typeof p.score === 'number')
        .sort((a, b) => b.score - a.score)
    : [];

  return (
    <ScrollView
      style={s.root}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F4B942" />}
    >

      {/* ═══════════════════════════════════════════════════
          HERO — immersive, full-width, magazine cover feel
      ═══════════════════════════════════════════════════ */}
      <LinearGradient
        colors={['#060412','#0D0432','#1A0650','#0D0432']}
        style={[s.hero, { paddingTop: TOP + 16 }]}
      >
        {/* Top bar */}
        <View style={s.topBar}>
          <View>
            <Text style={s.dateLabel}>{today}</Text>
            <Text style={s.greetTxt}>{greeting}</Text>
          </View>
          <Avatar
            photo={profile?.photo}
            name={profile?.name || '?'}
            size={42}
            onPress={() => navigation.navigate('EditProfile')}
          />
        </View>

        {/* Name — large, personal */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
          <Text style={[s.heroName, { marginBottom: 0 }]}>{profile?.name?.split(' ')[0] || 'Seeker'}</Text>
          {coinBalance !== null && (
            <TouchableOpacity onPress={() => navigation.navigate('WalletScreen')} style={s.coinPill}>
              <Text style={s.coinPillTxt}>🪙 {coinBalance.toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Score + Zone — the hero moment */}
        <View style={s.heroCenter}>
          <ScoreRing score={score} zone={zone} />
          <View style={s.heroRight}>
            <View style={[s.zoneBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '50' }]}>
              <View style={[s.zoneDot, { backgroundColor: cfg.color }]} />
              <Text style={[s.zoneLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={s.zoneSub}>{cfg.sub}</Text>
            <View style={s.vitals}>
              {[
                { icon: '☽', val: energy?.moon_sign,             label: 'Moon'       },
                { icon: '↑', val: energy?.ascendant,             label: 'Ascendant'  },
                { icon: '⏳', val: energy?.user_Chart?.mahadasha, label: 'Mahadasha'  },
              ].filter(v => v.val).map((v, i) => (
                <View key={i} style={s.vitalRow}>
                  <Text style={s.vitalIcon}>{v.icon}</Text>
                  <Text style={s.vitalVal}>{v.val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={s.heroDivider} />

        {/* Nakshatra pill */}
        {energy?.user_Chart?.nakshatra && (
          <View style={s.nakRow}>
            <Text style={s.nakLabel}>Born in</Text>
            <View style={s.nakPill}>
              <Text style={s.nakTxt}>{energy.user_Chart.nakshatra} Nakshatra</Text>
            </View>
            {energy?.user_Chart?.pada ? <Text style={s.nakLabel}>Pada {energy.user_Chart.pada}</Text> : null}
          </View>
        )}
      </LinearGradient>

      {/* ═══════════════════════════════════════════════════
          DAILY INSIGHT — the "one thing to know" card
      ═══════════════════════════════════════════════════ */}
      {energy?.gpt_summary && (
        <View style={s.insightWrap}>
          <LinearGradient colors={['#12063A','#1E0A5C','#12063A']} style={s.insightCard}>
            <View style={s.insightTop}>
              <Text style={s.insightBadge}>TODAY'S COSMIC BRIEFING</Text>
              <TouchableOpacity onPress={share} style={s.shareBtn}>
                <Text style={s.shareTxt}>↗ Share</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.insightQuote}>"</Text>
            <Text style={s.insightTxt}>{energy.gpt_summary}</Text>
            {energy.astro_alert && (
              <View style={s.alertRow}>
                <View style={s.alertDot} />
                <Text style={s.alertTxt}>{energy.astro_alert}</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          TOOLS — 2×3 premium grid
      ═══════════════════════════════════════════════════ */}
      <View style={s.section}>
        <Text style={s.sectionHead}>Your Tools</Text>
        <View style={s.toolGrid}>
          {TOOLS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={s.toolCard}
              onPress={() => navigation.navigate(t.key)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={t.grad} style={s.toolGrad}>
                <Text style={s.toolIcon}>{t.icon}</Text>
                <Text style={s.toolLabel}>{t.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════
          PLANET ENERGY — bar chart style
      ═══════════════════════════════════════════════════ */}
      {planets.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionHead}>Planetary Energy</Text>
            <Text style={s.sectionSub}>Today</Text>
          </View>
          <LinearGradient colors={['#0D0829','#12063A']} style={s.planetCard}>
            {planets.slice(0, 7).map(p => (
              <PlanetBar key={p.name} name={p.name} score={p.score} sign={p.sign} />
            ))}
          </LinearGradient>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          DASHA — elegant timeline
      ═══════════════════════════════════════════════════ */}
      {energy?.user_Chart?.mahadasha && (
        <View style={s.section}>
          <View style={s.dashaCard}>
            <Text style={s.dashaTitle}>📿 Current Dasha Period</Text>
            <View style={s.dashaChain}>
              {[
                { label: 'Maha',       value: energy.user_Chart.mahadasha  },
                { label: 'Antar',      value: energy.user_Chart.antardasha },
                { label: 'Pratyantar', value: energy.user_Chart.pratyantar },
                { label: 'Sookshma',   value: energy.user_Chart.sookshma   },
              ].filter(d => d.value).map((d, i) => (
                <View key={i} style={s.dashaItem}>
                  {i > 0 && <Text style={s.dashaArrow}>→</Text>}
                  <View style={s.dashaItemInner}>
                    <Text style={s.dashaLbl}>{d.label}</Text>
                    <Text style={s.dashaPlanet}>{d.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Kundli')}>
              <Text style={s.dashaLinkTxt}>View Full Dasha Timeline →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#060412' },
  fill:          { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },

  // Loading / Onboard
  loadLogo:      { fontSize: 28, fontWeight: '900', color: '#F4B942', letterSpacing: -0.5, fontStyle: 'italic' },
  loadSub:       { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 16, letterSpacing: 0.5 },
  onboardH:      { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  onboardSub:    { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  goldBtn:       { borderRadius: 28, overflow: 'hidden' },
  goldBtnInner:  { paddingHorizontal: 40, paddingVertical: 16 },
  goldBtnTxt:    { fontSize: 16, fontWeight: '800', color: '#060412', letterSpacing: 0.3 },

  // Hero
  hero:          { paddingHorizontal: 22, paddingBottom: 28 },
  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  dateLabel:     { fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  greetTxt:      { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  heroName:      { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1.5, marginBottom: 24, lineHeight: 46 },
  heroCenter:    { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 24 },
  heroRight:     { flex: 1, gap: 10 },
  zoneBadge:     { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  zoneDot:       { width: 7, height: 7, borderRadius: 3.5 },
  zoneLabel:     { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  zoneSub:       { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 17 },
  vitals:        { gap: 5 },
  vitalRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vitalIcon:     { fontSize: 13, color: 'rgba(255,255,255,0.4)', width: 16, textAlign: 'center' },
  vitalVal:      { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  heroDivider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 18 },
  nakRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nakLabel:      { fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },
  nakPill:       { backgroundColor: 'rgba(244,185,66,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(244,185,66,0.25)' },
  nakTxt:        { fontSize: 12, color: '#F4B942', fontWeight: '700', letterSpacing: 0.3 },

  // Insight card
  insightWrap:   { paddingHorizontal: 16, paddingVertical: 4 },
  insightCard:   { borderRadius: 20, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  insightTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  insightBadge:  { fontSize: 10, color: '#F4B942', fontWeight: '800', letterSpacing: 2 },
  shareBtn:      { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  shareTxt:      { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  insightQuote:  { fontSize: 48, color: 'rgba(244,185,66,0.25)', lineHeight: 40, marginBottom: -8, fontFamily: 'serif' },
  insightTxt:    { fontSize: 15.5, color: 'rgba(255,255,255,0.82)', lineHeight: 26, fontStyle: 'italic', letterSpacing: 0.1 },
  alertRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, backgroundColor: 'rgba(244,185,66,0.08)', borderRadius: 12, padding: 12 },
  alertDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F4B942', marginTop: 5 },
  alertTxt:      { fontSize: 13, color: 'rgba(255,255,255,0.6)', flex: 1, lineHeight: 19 },

  // Section
  section:       { paddingHorizontal: 16, marginTop: 24 },
  sectionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  sectionHead:   { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 14 },
  sectionSub:    { fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },

  // Tools grid
  toolGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toolCard:      { width: (SW - 52) / 3, borderRadius: 18, overflow: 'hidden' },
  toolGrad:      { paddingVertical: 18, paddingHorizontal: 10, alignItems: 'center', gap: 8 },
  toolIcon:      { fontSize: 26 },
  toolLabel:     { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },

  // Planet card
  planetCard:    { borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },

  // Coin pill
  coinPill:      { backgroundColor: 'rgba(244,185,66,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(244,185,66,0.3)' },
  coinPillTxt:   { fontSize: 13, color: '#F4B942', fontWeight: '800' },
  // Dasha — original style
  dashaCard:     { backgroundColor: '#1E0A4F', borderRadius: 20, padding: 20, marginBottom: 8 },
  dashaTitle:    { fontSize: 14, fontWeight: '700', color: '#F4B942', marginBottom: 16 },
  dashaChain:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 12 },
  dashaItem:     { flexDirection: 'row', alignItems: 'center' },
  dashaArrow:    { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginHorizontal: 4 },
  dashaItemInner:{ alignItems: 'center' },
  dashaLbl:      { fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  dashaPlanet:   { fontSize: 13, color: '#fff', fontWeight: '700', textAlign: 'center' },
  dashaLinkTxt:  { fontSize: 13, color: '#A78BFA', fontWeight: '600' },
});
