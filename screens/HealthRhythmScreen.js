/**
 * Health Rhythm — Astrology + Wearable data correlation
 * HRV, sleep, steps from Samsung Watch meets planetary positions
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/constants';
import { auth } from '../config/firebase';
import { colors, spacing, radius, typography, shadows, gradients } from '../config/theme';

const METRIC_ICONS = { hr: '❤️', hrv: '🌊', sleep: '😴', steps: '🏃', spo2: '💧' };

export default function HealthRhythmScreen({ navigation }) {
  const [rhythm, setRhythm]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchData, setWatch] = useState(null);
  const [dailyEnergy, setDE]  = useState(null);

  useEffect(() => {
    (async () => {
      const ds = await AsyncStorage.getItem('@daily_energy');
      const wd = await AsyncStorage.getItem('@band_daily_latest');
      if (ds) setDE(JSON.parse(ds));
      if (wd) setWatch(JSON.parse(wd));
      fetchRhythm();
    })();
  }, []);

  const fetchRhythm = async () => {
    setLoading(true);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
      const de      = JSON.parse(await AsyncStorage.getItem('@daily_energy') || '{}');
      const ps      = JSON.parse(await AsyncStorage.getItem('userProfile') || '{}');
      const res     = await fetch(`${BASE_URL}/api/health-rhythm`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({
          profile:   { name: ps.name, dob: ps.dob, moon_sign: de?.moon_sign },
          chart:     de?.user_Chart || {},
          zone:      de?.zone,
          dasha:     { mahadasha: de?.user_Chart?.mahadasha, antardasha: de?.user_Chart?.antardasha },
        }),
      });
      const data = await res.json();
      setRhythm(data);
    } catch (e) {
      setRhythm({ error: true });
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ icon, label, value, unit, interpretation, color }) => (
    <View style={[s.metricCard, { borderTopColor: color, borderTopWidth: 3, ...shadows.sm }]}>
      <Text style={s.metricIcon}>{icon}</Text>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={[s.metricValue, { color }]}>{value || '--'}<Text style={s.metricUnit}> {unit}</Text></Text>
      {interpretation && <Text style={s.metricInterp}>{interpretation}</Text>}
    </View>
  );

  const CorrelationCard = ({ item }) => (
    <View style={s.correlCard}>
      <View style={s.correlTop}>
        <Text style={s.correlPlanet}>{item.planet} {item.transit}</Text>
        <View style={[s.correlBadge, { backgroundColor: item.positive ? colors.successLight : colors.errorLight }]}>
          <Text style={[s.correlBadgeTxt, { color: item.positive ? colors.success : colors.error }]}>
            {item.positive ? '✓ Supports' : '⚠ Challenges'}
          </Text>
        </View>
      </View>
      <Text style={s.correlMetric}>{item.health_metric}</Text>
      <Text style={s.correlDesc}>{item.description}</Text>
      {item.remedy && <Text style={s.correlRemedy}>💡 {item.remedy}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#064E3B', '#065F46', '#047857']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.headerEmoji}>⚡</Text>
          <View>
            <Text style={s.headerTitle}>Health Rhythm</Text>
            <Text style={s.headerSub}>Body + Cosmos alignment</Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.success} />
          <Text style={s.loadingTxt}>Reading your health patterns...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
          {/* Today's health energy score */}
          {rhythm?.health_score && (
            <LinearGradient colors={['#064E3B', '#065F46']} style={s.scoreCard}>
              <Text style={s.scoreLabel}>Health-Cosmos Alignment</Text>
              <Text style={s.scoreNum}>{rhythm.health_score}</Text>
              <Text style={s.scoreMax}>/100</Text>
              <Text style={s.scoreVerdict}>{rhythm.verdict}</Text>
            </LinearGradient>
          )}

          {/* Watch metrics */}
          <Text style={s.sectionHead}>📊 Today's Biometrics</Text>
          {watchData ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
              <MetricCard icon="❤️" label="Heart Rate" value={watchData.avg_hr || watchData.resting_hr} unit="bpm" color={colors.error} interpretation={rhythm?.hr_interpretation} />
              <MetricCard icon="🌊" label="HRV" value={watchData.avg_hrv} unit="ms" color={colors.info} interpretation={rhythm?.hrv_interpretation} />
              <MetricCard icon="😴" label="Sleep" value={watchData.sleep_mins ? (watchData.sleep_mins / 60).toFixed(1) : null} unit="hrs" color={colors.violet} interpretation={rhythm?.sleep_interpretation} />
              <MetricCard icon="🏃" label="Steps" value={watchData.steps?.toLocaleString()} unit="" color={colors.success} interpretation={rhythm?.steps_interpretation} />
              <MetricCard icon="💧" label="SpO2" value={watchData.avg_spo2} unit="%" color={colors.info} interpretation={rhythm?.spo2_interpretation} />
            </ScrollView>
          ) : (
            <View style={s.noWatchCard}>
              <Text style={s.noWatchEmoji}>⌚</Text>
              <Text style={s.noWatchTitle}>Connect Samsung Galaxy Watch</Text>
              <Text style={s.noWatchSub}>Sync your watch to see how your body responds to planetary movements</Text>
              <TouchableOpacity style={s.connectBtn} onPress={() => navigation.navigate('HomeMain')}>
                <Text style={s.connectBtnTxt}>Connect Watch →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Planetary health correlations */}
          {rhythm?.correlations?.length > 0 && (
            <>
              <Text style={s.sectionHead}>🪐 Planetary Influence on Health</Text>
              <View style={s.correlWrap}>
                {rhythm.correlations.map((c, i) => <CorrelationCard key={i} item={c} />)}
              </View>
            </>
          )}

          {/* This week's health forecast */}
          {rhythm?.weekly_forecast && (
            <View style={s.forecastCard}>
              <Text style={s.forecastTitle}>📅 This Week's Health Forecast</Text>
              <Text style={s.forecastTxt}>{rhythm.weekly_forecast}</Text>
            </View>
          )}

          {/* Recommendations */}
          {rhythm?.recommendations?.length > 0 && (
            <View style={s.recoWrap}>
              <Text style={s.sectionHead}>💚 Vedic Health Recommendations</Text>
              {rhythm.recommendations.map((r, i) => (
                <View key={i} style={s.recoItem}>
                  <Text style={s.recoEmoji}>{r.emoji || '•'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.recoTitle}>{r.title}</Text>
                    <Text style={s.recoDesc}>{r.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {rhythm?.error && (
            <View style={s.errorCard}>
              <Text style={s.errorTxt}>Could not load health rhythm analysis.</Text>
              <TouchableOpacity onPress={fetchRhythm} style={s.retryBtn}>
                <Text style={s.retryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.surface },
  header:        { paddingTop: 52, paddingBottom: 20, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  backBtn:       { marginRight: 12 },
  backTxt:       { color: colors.white, fontSize: 22, fontWeight: '600' },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerEmoji:   { fontSize: 28 },
  headerTitle:   { color: colors.white, ...typography.h4 },
  headerSub:     { color: '#6EE7B7', ...typography.micro },
  loadingWrap:   { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  loadingTxt:    { ...typography.body, color: colors.textMuted },
  scoreCard:     { margin: spacing.lg, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  scoreLabel:    { ...typography.label, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.sm },
  scoreNum:      { ...typography.hero, color: colors.white },
  scoreMax:      { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  scoreVerdict:  { ...typography.h4, color: colors.white, marginTop: spacing.sm, textAlign: 'center' },
  sectionHead:   { ...typography.h4, color: colors.textPrimary, paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  metricCard:    { width: 130, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginRight: spacing.sm, alignItems: 'center' },
  metricIcon:    { fontSize: 24, marginBottom: spacing.xs },
  metricLabel:   { ...typography.micro, color: colors.textMuted, marginBottom: 4 },
  metricValue:   { ...typography.h2 },
  metricUnit:    { ...typography.caption, color: colors.textMuted },
  metricInterp:  { ...typography.micro, color: colors.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 14 },
  noWatchCard:   { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', ...shadows.md },
  noWatchEmoji:  { fontSize: 48, marginBottom: spacing.md },
  noWatchTitle:  { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  noWatchSub:    { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  connectBtn:    { backgroundColor: colors.success, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full },
  connectBtnTxt: { ...typography.bodyBold, color: colors.white },
  correlWrap:    { paddingHorizontal: spacing.lg },
  correlCard:    { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm, ...shadows.sm },
  correlTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  correlPlanet:  { ...typography.bodyBold, color: colors.textPrimary },
  correlBadge:   { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  correlBadgeTxt:{ ...typography.label, fontSize: 9 },
  correlMetric:  { ...typography.caption, color: colors.gold, fontWeight: '700', marginBottom: 4 },
  correlDesc:    { ...typography.body, color: colors.textSecondary, lineHeight: 20 },
  correlRemedy:  { ...typography.caption, color: colors.success, marginTop: spacing.sm },
  forecastCard:  { margin: spacing.lg, backgroundColor: '#ECFDF5', borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: '#A7F3D0' },
  forecastTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
  forecastTxt:   { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  recoWrap:      { paddingHorizontal: spacing.lg },
  recoItem:      { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm, ...shadows.sm },
  recoEmoji:     { fontSize: 24, width: 32 },
  recoTitle:     { ...typography.bodyBold, color: colors.textPrimary, marginBottom: 4 },
  recoDesc:      { ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  errorCard:     { margin: spacing.lg, backgroundColor: colors.errorLight, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  errorTxt:      { ...typography.body, color: colors.error },
  retryBtn:      { backgroundColor: colors.error, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.full },
  retryTxt:      { ...typography.bodyBold, color: colors.white },
})
