/**
 * CosmicHomeScreen — Daily Briefing
 * The beautiful morning ritual screen. Pillar #1.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, SafeAreaView, Image, RefreshControl, Share, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { BASE_URL } from '../config/constants';
import { colors, spacing, radius, typography, shadows, gradients } from '../config/theme';
import { onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

const PLANET_EMOJIS = {
  Sun: '☀️', Moon: '🌙', Mars: '♂️', Mercury: '☿️',
  Jupiter: '♃', Venus: '♀️', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

const ZONE_CONFIG = {
  'Green Zone':   { color: colors.success,   label: 'Green Zone',  icon: '🟢', desc: 'Flowing energy' },
  'Red Zone':     { color: colors.error,     label: 'Red Zone',    icon: '🔴', desc: 'Navigate carefully' },
  'Neutral Zone': { color: colors.gold,      label: 'Neutral Zone',icon: '🟡', desc: 'Balanced day' },
};

const QUICK_ACTIONS = [
  { key: 'AiJyotish',           emoji: '🔮', label: 'Ask\nJyotish'   },
  { key: 'MuhuratScreen',       emoji: '🗓️', label: 'Muhurat\nToday' },
  { key: 'VastuScanner',        emoji: '🏠', label: 'Vastu\nScan'    },
  { key: 'RelationshipCosmos',  emoji: '💞', label: 'Compat-\nibility'},
  { key: 'HealthRhythm',        emoji: '⚡', label: 'Health\nRhythm'  },
  { key: 'NakshatraCommunity',  emoji: '🌌', label: 'Community'      },
];

export default function CosmicHomeScreen({ navigation }) {
  const [energy, setEnergy]       = useState(null);
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing]= useState(false);
  const [error, setError]         = useState(null);
  const [greeting, setGreeting]   = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeIn  = useRef(new Animated.Value(0)).current;

  // Greeting based on time
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('🌅 Suprabhat');
    else if (hr < 17) setGreeting('☀️ Namaste');
    else if (hr < 20) setGreeting('🌇 Shubh Saam');
    else setGreeting('🌙 Shubh Ratri');
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load profile
      let profile = {};
      try {
        const ps = await AsyncStorage.getItem('userProfile');
        if (ps) { profile = JSON.parse(ps); setProfile(profile); }
      } catch { await AsyncStorage.removeItem('userProfile'); }

      // Try valid cache first
      const today = new Date().toISOString().split('T')[0];
      try {
        const cached     = await AsyncStorage.getItem('@daily_energy');
        const cachedDate = await AsyncStorage.getItem('@daily_energy_date');
        if (cached && cachedDate === today) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.moon_sign || parsed.zone)) {
            setEnergy(parsed);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Corrupted cache — clear it and fetch fresh
        await AsyncStorage.multiRemove(['@daily_energy', '@daily_energy_date']);
      }

      await fetchFreshEnergy(profile);
    } catch (e) {
      console.warn('[CosmicHome] loadData error:', e?.message);
      setError('Network error. Pull down to retry.');
      setLoading(false);
    }
  };

  const fetchFreshEnergy = async (prof) => {
    const p = prof || profile;
    if (!p?.dob || !p?.pob) {
      setError('complete_profile');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const storedPhone = await AsyncStorage.getItem('@phoneNumber') || p?.phone?.replace(/^\+91/, '') || '';
      let idToken = null;
      try {
        const tokenRes = await fetch(`${BASE_URL}/api/firebase-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: storedPhone, countryCode: '91' }),
        });
        const td = await tokenRes.json();
        if (td.token) {
          const cred = await signInWithCustomToken(auth, td.token);
          idToken = await cred.user.getIdToken();
        }
      } catch {}

      const res = await fetch(`${BASE_URL}/api/daily-energy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ name: p.name, dob: p.dob, tob: p.tob || '12:00', pob: p.pob, photo: p.photo }),
      });
      const data = await res.json();
      if (!data.error) {
        setEnergy(data);
        await AsyncStorage.setItem('@daily_energy', JSON.stringify(data));
        await AsyncStorage.setItem('@daily_energy_date', new Date().toISOString().split('T')[0]);
        Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    fadeIn.setValue(0);
    await AsyncStorage.removeItem('@daily_energy_date');
    const ps = await AsyncStorage.getItem('userProfile');
    await fetchFreshEnergy(ps ? JSON.parse(ps) : profile);
  }, [profile]);

  const shareCard = async () => {
    if (!energy) return;
    const text = `🌟 My Cosmic Day — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n🌙 Moon: ${energy.moon_sign}\n⬆️ Ascendant: ${energy.ascendant}\n${energy.zone === 'Green Zone' ? '🟢' : energy.zone === 'Red Zone' ? '🔴' : '🟡'} Zone: ${energy.zone}\n\n🔮 "${energy.gpt_summary?.split('. ')[0]}"\n\nVia AstroVue 🪐`;
    Share.share({ message: text });
  };

  const zone = energy?.zone ? ZONE_CONFIG[energy.zone] || ZONE_CONFIG['Neutral Zone'] : null;

  if (loading) {
    return (
      <LinearGradient colors={gradients.cosmic} style={s.loadingScreen}>
        <Text style={s.loadingLogo}>🪐 AstroVue</Text>
        <ActivityIndicator color={colors.gold} size="large" style={{ marginTop: spacing.xl }} />
        <Text style={s.loadingTxt}>Reading the cosmos for you...</Text>
      </LinearGradient>
    );
  }

  if (error === 'complete_profile') {
    return (
      <LinearGradient colors={gradients.cosmic} style={s.loadingScreen}>
        <Text style={{ fontSize: 48 }}>🌟</Text>
        <Text style={[typography.h2, { color: colors.white, textAlign: 'center', marginTop: spacing.lg }]}>Complete Your Profile</Text>
        <Text style={[typography.body, { color: 'rgba(255,255,255,0.7)', textAlign: 'center', margin: spacing.xl, lineHeight: 22 }]}>
          Add your date, time, and place of birth to unlock your personalised cosmic briefing.
        </Text>
        <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('EditProfile')}>
          <LinearGradient colors={gradients.gold} style={s.ctaBtnGrad}>
            <Text style={s.ctaBtnTxt}>Set Up Profile →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // Show any non-profile error with a retry button
  if (error && error !== 'complete_profile') {
    return (
      <LinearGradient colors={gradients.cosmic} style={s.loadingScreen}>
        <Text style={{ fontSize: 48 }}>⚠️</Text>
        <Text style={[typography.h3, { color: colors.white, textAlign: 'center', marginTop: spacing.lg }]}>Could not load</Text>
        <Text style={[typography.body, { color: 'rgba(255,255,255,0.7)', textAlign: 'center', margin: spacing.xl }]}>{error}</Text>
        <TouchableOpacity style={s.ctaBtn} onPress={() => { setError(null); setLoading(true); loadData(); }}>
          <LinearGradient colors={gradients.gold} style={s.ctaBtnGrad}>
            <Text style={s.ctaBtnTxt}>Try Again →</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', textDecorationLine: 'underline' }}>Check profile settings</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero: Cosmic briefing card ── */}
        <View>
          <LinearGradient colors={gradients.cosmic} style={s.hero}>
            {/* Top row */}
            <View style={s.heroTop}>
              <View>
                <Text style={s.greetingTxt}>{greeting}</Text>
                <Text style={s.userName}>{profile?.name || 'Seeker'}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={s.avatarBtn}>
                {profile?.photo
                  ? <Image source={{ uri: profile.photo }} style={s.avatar} />
                  : <View style={s.avatarPlaceholder}><Text style={s.avatarInitial}>{profile?.name?.[0] || '?'}</Text></View>
                }
              </TouchableOpacity>
            </View>

            {/* Date */}
            <Text style={s.dateStr}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>

            {/* Zone indicator */}
            {zone && (
              <View style={[s.zonePill, { backgroundColor: zone.color + '25', borderColor: zone.color + '60' }]}>
                <Text style={s.zoneIcon}>{zone.icon}</Text>
                <Text style={[s.zoneLabel, { color: zone.color }]}>{zone.label}</Text>
                <Text style={s.zoneDesc}>· {zone.desc}</Text>
              </View>
            )}

            {/* Moon + Ascendant */}
            {energy && (
              <View style={s.vitalsRow}>
                <View style={s.vitalPill}>
                  <Text style={s.vitalIcon}>🌙</Text>
                  <View>
                    <Text style={s.vitalLabel}>Moon</Text>
                    <Text style={s.vitalValue}>{energy.moon_sign}</Text>
                  </View>
                </View>
                <View style={s.vitalPill}>
                  <Text style={s.vitalIcon}>⬆️</Text>
                  <View>
                    <Text style={s.vitalLabel}>Ascendant</Text>
                    <Text style={s.vitalValue}>{energy.ascendant}</Text>
                  </View>
                </View>
                <View style={s.vitalPill}>
                  <Text style={s.vitalIcon}>🕉️</Text>
                  <View>
                    <Text style={s.vitalLabel}>Dasha</Text>
                    <Text style={s.vitalValue}>{energy.user_Chart?.mahadasha}</Text>
                  </View>
                </View>
              </View>
            )}
          </LinearGradient>
        </View>

        <View>
          {/* ── Today's GPT Insight ── */}
          {energy?.gpt_summary && (
            <View style={s.insightCard}>
              <View style={s.insightHeader}>
                <Text style={s.insightIcon}>🔮</Text>
                <Text style={s.insightTitle}>Today's Cosmic Insight</Text>
                <TouchableOpacity onPress={shareCard} style={s.shareBtn}>
                  <Text style={s.shareTxt}>Share ↗</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.insightText}>{energy.gpt_summary}</Text>
              {energy.astro_alert && (
                <View style={s.alertBox}>
                  <Text style={s.alertTxt}>⚡ {energy.astro_alert}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Quick actions ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Your Tools</Text>
            <View style={s.quickGrid}>
              {QUICK_ACTIONS.map(a => (
                <TouchableOpacity
                  key={a.key}
                  style={s.quickItem}
                  onPress={() => navigation.navigate(a.key)}
                  activeOpacity={0.75}
                >
                  <LinearGradient colors={[colors.cosmicMid, colors.cosmicLight]} style={s.quickGrad}>
                    <Text style={s.quickEmoji}>{a.emoji}</Text>
                    <Text style={s.quickLabel}>{a.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Planet scores ── */}
          {energy?.scores && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Planetary Energy Today</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.planetsRow}>
                {Object.entries(energy.scores)
                  .sort(([, a], [, b]) => (b).score - (a).score)
                  .map(([planet, data]: any) => {
                    const score = data?.score ?? data;
                    const color = score >= 80 ? colors.success : score >= 60 ? colors.gold : score >= 40 ? colors.saffron : colors.error;
                    return (
                      <View key={planet} style={s.planetCard}>
                        <Text style={s.planetEmoji}>{PLANET_EMOJIS[planet] || '⭐'}</Text>
                        <Text style={s.planetName}>{planet}</Text>
                        <View style={[s.planetScorePill, { backgroundColor: color + '20' }]}>
                          <Text style={[s.planetScore, { color }]}>{score}</Text>
                        </View>
                        <Text style={s.planetSign}>{data?.sign || ''}</Text>
                      </View>
                    );
                  })}
              </ScrollView>
            </View>
          )}

          {/* ── Dasha timeline ── */}
          {energy?.user_Chart?.mahadasha && (
            <View style={s.dashaCard}>
              <Text style={s.dashaTitle}>📿 Current Dasha Period</Text>
              <View style={s.dashaChain}>
                {[
                  { label: 'Maha', value: energy.user_Chart.mahadasha },
                  { label: 'Antar', value: energy.user_Chart.antardasha },
                  { label: 'Pratyantar', value: energy.user_Chart.pratyantar },
                  { label: 'Sookshma', value: energy.user_Chart.sookshma },
                ].filter(d => d.value).map((d, i) => (
                  <View key={i} style={s.dashaItem}>
                    {i > 0 && <Text style={s.dashaArrow}>→</Text>}
                    <View style={s.dashaItemInner}>
                      <Text style={s.dashaLabel}>{d.label}</Text>
                      <Text style={s.dashaValue}>{d.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Kundli')}>
                <Text style={s.dashaLink}>View Full Dasha Timeline →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Error state ── */}
          {error && error !== 'complete_profile' && (
            <View style={s.errorCard}>
              <Text style={s.errorTxt}>{error}</Text>
              <TouchableOpacity onPress={onRefresh} style={s.retryBtn}>
                <Text style={s.retryTxt}>↺ Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: spacing.xxxl }} />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: colors.cream },
  loadingScreen:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingLogo:       { ...typography.h1, color: colors.white },
  loadingTxt:        { ...typography.body, color: 'rgba(255,255,255,0.6)', marginTop: spacing.md },
  ctaBtn:            { borderRadius: radius.full, overflow: 'hidden', marginTop: spacing.lg },
  ctaBtnGrad:        { paddingHorizontal: spacing.xxxl, paddingVertical: spacing.lg },
  ctaBtnTxt:         { ...typography.h4, color: colors.cosmicDeep },

  // Hero
  hero:              { paddingTop: 56, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  heroTop:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greetingTxt:       { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  userName:          { ...typography.h2, color: colors.white },
  avatarBtn:         {},
  avatar:            { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.gold },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.cosmicLight, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.gold },
  avatarInitial:     { ...typography.h3, color: colors.gold },
  dateStr:           { ...typography.caption, color: 'rgba(255,255,255,0.5)', marginBottom: spacing.lg },
  zonePill:          { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, marginBottom: spacing.lg, gap: spacing.sm },
  zoneIcon:          { fontSize: 14 },
  zoneLabel:         { ...typography.bodyBold },
  zoneDesc:          { ...typography.caption, color: 'rgba(255,255,255,0.5)' },
  vitalsRow:         { flexDirection: 'row', gap: spacing.sm },
  vitalPill:         { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, padding: spacing.sm, gap: spacing.sm },
  vitalIcon:         { fontSize: 16 },
  vitalLabel:        { ...typography.micro, color: 'rgba(255,255,255,0.5)' },
  vitalValue:        { ...typography.caption, color: colors.white, fontWeight: '700' },

  // Insight card
  insightCard:       { backgroundColor: colors.white, margin: spacing.lg, borderRadius: radius.xl, padding: spacing.xl, ...shadows.md },
  insightHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  insightIcon:       { fontSize: 20 },
  insightTitle:      { ...typography.h4, color: colors.textPrimary, flex: 1 },
  shareBtn:          { backgroundColor: colors.violetMuted, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  shareTxt:          { ...typography.micro, color: colors.violet, fontWeight: '700' },
  insightText:       { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  alertBox:          { backgroundColor: colors.warningLight, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  alertTxt:          { ...typography.caption, color: colors.warning, fontWeight: '600' },

  // Quick actions
  section:           { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle:      { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
  quickGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickItem:         { width: '30%', borderRadius: radius.lg, overflow: 'hidden', ...shadows.sm },
  quickGrad:         { padding: spacing.md, alignItems: 'center', aspectRatio: 1 },
  quickEmoji:        { fontSize: 28, marginBottom: spacing.sm },
  quickLabel:        { ...typography.micro, color: colors.gold, textAlign: 'center', lineHeight: 14 },

  // Planets
  planetsRow:        { paddingLeft: 0, gap: spacing.sm },
  planetCard:        { width: 80, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', ...shadows.sm },
  planetEmoji:       { fontSize: 20, marginBottom: 4 },
  planetName:        { ...typography.micro, color: colors.textMuted, marginBottom: 4 },
  planetScorePill:   { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  planetScore:       { ...typography.caption, fontWeight: '800' },
  planetSign:        { ...typography.micro, color: colors.textMuted },

  // Dasha
  dashaCard:         { backgroundColor: colors.cosmicMid, marginHorizontal: spacing.lg, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg },
  dashaTitle:        { ...typography.bodyBold, color: colors.gold, marginBottom: spacing.lg },
  dashaChain:        { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  dashaItem:         { flexDirection: 'row', alignItems: 'center' },
  dashaArrow:        { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginHorizontal: 4 },
  dashaItemInner:    { alignItems: 'center' },
  dashaLabel:        { ...typography.micro, color: 'rgba(255,255,255,0.5)' },
  dashaValue:        { ...typography.caption, color: colors.white, fontWeight: '700' },
  dashaLink:         { ...typography.caption, color: colors.violetLight, marginTop: spacing.md },

  // Error
  errorCard:         { backgroundColor: colors.errorLight, margin: spacing.lg, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  errorTxt:          { ...typography.body, color: colors.error, textAlign: 'center' },
  retryBtn:          { backgroundColor: colors.error, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.full },
  retryTxt:          { ...typography.bodyBold, color: colors.white },
})
