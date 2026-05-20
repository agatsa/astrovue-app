/**
 * Muhurat Engine — Auspicious timing calendar
 * Best days for: contracts, travel, medical, marriage, business, investments
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/constants';
import { auth } from '../config/firebase';
import { colors, spacing, radius, typography, shadows, gradients } from '../config/theme';

const CATEGORIES = [
  { key: 'all',        label: 'All',         emoji: '✨' },
  { key: 'business',   label: 'Business',    emoji: '💼' },
  { key: 'travel',     label: 'Travel',      emoji: '✈️' },
  { key: 'medical',    label: 'Medical',     emoji: '🏥' },
  { key: 'marriage',   label: 'Marriage',    emoji: '💍' },
  { key: 'investment', label: 'Investment',  emoji: '📈' },
  { key: 'property',   label: 'Property',   emoji: '🏠' },
  { key: 'education',  label: 'Education',   emoji: '📚' },
];

const QUALITY_COLOR = {
  excellent: colors.success,
  good:      colors.gold,
  neutral:   colors.textMuted,
  avoid:     colors.error,
};

export default function MuhuratScreen({ navigation }) {
  const [muhurats, setMuhurats]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState('all');
  const [selectedDay, setDay]     = useState(0);
  const [profile, setProfile]     = useState(null);
  const [dailyEnergy, setDE]      = useState(null);
  const [error, setError]         = useState(null);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    (async () => {
      const ps = await AsyncStorage.getItem('userProfile');
      const ds = await AsyncStorage.getItem('@daily_energy');
      if (ps) setProfile(JSON.parse(ps));
      if (ds) setDE(JSON.parse(ds));
    })();
  }, []);

  useEffect(() => {
    if (profile) fetchMuhurats();
  }, [profile, selectedDay, category]);

  const fetchMuhurats = async () => {
    setLoading(true);
    setError(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
      const targetDate = days[selectedDay].toISOString().split('T')[0];
      const res = await fetch(`${BASE_URL}/api/muhurat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({
          date:      targetDate,
          category,
          profile:   { name: profile?.name, dob: profile?.dob, moon_sign: dailyEnergy?.moon_sign },
          dasha:     { mahadasha: dailyEnergy?.user_Chart?.mahadasha, antardasha: dailyEnergy?.user_Chart?.antardasha },
        }),
      });
      const data = await res.json();
      setMuhurats(data.muhurats || []);
    } catch (e) {
      setError('Could not fetch Muhurat data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const DayTab = ({ date, index }) => {
    const isToday = index === 0;
    const isSelected = index === selectedDay;
    const dayName = isToday ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayNum  = date.getDate();
    return (
      <TouchableOpacity onPress={() => setDay(index)} style={[s.dayTab, isSelected && s.dayTabSelected]}>
        {isSelected
          ? <LinearGradient colors={gradients.gold} style={s.dayTabGrad}>
              <Text style={[s.dayName, { color: colors.cosmicDeep }]}>{dayName}</Text>
              <Text style={[s.dayNum,  { color: colors.cosmicDeep }]}>{dayNum}</Text>
            </LinearGradient>
          : <>
              <Text style={s.dayName}>{dayName}</Text>
              <Text style={s.dayNum}>{dayNum}</Text>
            </>
        }
      </TouchableOpacity>
    );
  };

  const MuhuratCard = ({ item }) => (
    <View style={[s.card, { borderLeftColor: QUALITY_COLOR[item.quality] || colors.gold, ...shadows.sm }]}>
      <View style={s.cardTop}>
        <View style={s.cardLeft}>
          <Text style={s.cardEmoji}>{item.emoji || '⭐'}</Text>
          <View>
            <Text style={s.cardTitle}>{item.activity}</Text>
            <Text style={s.cardTime}>{item.time_range}</Text>
          </View>
        </View>
        <View style={[s.qualityBadge, { backgroundColor: (QUALITY_COLOR[item.quality] || colors.gold) + '20' }]}>
          <Text style={[s.qualityTxt, { color: QUALITY_COLOR[item.quality] || colors.gold }]}>
            {item.quality?.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={s.cardReason}>{item.reason}</Text>
      {item.avoid_reason && (
        <Text style={s.cardAvoid}>⚠️ {item.avoid_reason}</Text>
      )}
      {item.nakshatra && (
        <View style={s.nakshatraRow}>
          <Text style={s.nakshatraTxt}>🌙 {item.nakshatra}</Text>
          {item.tithi && <Text style={s.nakshatraTxt}>📅 {item.tithi}</Text>}
          {item.yoga && <Text style={s.nakshatraTxt}>✨ {item.yoga}</Text>}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <LinearGradient colors={['#78350F', '#92400E', '#B45309']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.headerEmoji}>🗓️</Text>
          <View>
            <Text style={s.headerTitle}>Muhurat Calendar</Text>
            <Text style={s.headerSub}>Auspicious timing for your life</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>
        {/* Day picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dayScroll} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
          {days.map((d, i) => <DayTab key={i} date={d} index={i} />)}
        </ScrollView>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[s.catChip, category === c.key && s.catChipActive]}
              onPress={() => setCategory(c.key)}
            >
              <Text style={s.catEmoji}>{c.emoji}</Text>
              <Text style={[s.catLabel, category === c.key && s.catLabelActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <View style={s.results}>
          {loading ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={s.loadingTxt}>Consulting planetary positions...</Text>
            </View>
          ) : error ? (
            <View style={s.errorWrap}>
              <Text style={s.errorTxt}>{error}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={fetchMuhurats}>
                <Text style={s.retryTxt}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : muhurats.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>🌙</Text>
              <Text style={s.emptyTxt}>No specific Muhurats found for this combination. Any time works neutrally.</Text>
            </View>
          ) : (
            muhurats.map((m, i) => <MuhuratCard key={i} item={m} />)
          )}
        </View>
      </ScrollView>
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
  headerSub:     { color: '#FDE68A', ...typography.micro },
  scroll:        { flex: 1 },
  dayScroll:     { marginTop: spacing.lg },
  dayTab:        { width: 60, height: 64, borderRadius: radius.md, backgroundColor: colors.white, marginRight: spacing.sm, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', ...shadows.sm },
  dayTabSelected:{ ...shadows.gold },
  dayTabGrad:    { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  dayName:       { ...typography.micro, color: colors.textMuted, marginBottom: 2 },
  dayNum:        { ...typography.h3, color: colors.textPrimary },
  catScroll:     { marginTop: spacing.lg, marginBottom: spacing.sm },
  catChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.white, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
  catChipActive: { backgroundColor: colors.goldLight, borderColor: colors.gold },
  catEmoji:      { fontSize: 14 },
  catLabel:      { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  catLabelActive:{ color: colors.goldDeep },
  results:       { padding: spacing.lg },
  card:          { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderLeftWidth: 4 },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardLeft:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  cardEmoji:     { fontSize: 24 },
  cardTitle:     { ...typography.h4, color: colors.textPrimary },
  cardTime:      { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  qualityBadge:  { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  qualityTxt:    { ...typography.label, fontSize: 10 },
  cardReason:    { ...typography.body, color: colors.textSecondary, lineHeight: 20 },
  cardAvoid:     { ...typography.caption, color: colors.error, marginTop: spacing.sm },
  nakshatraRow:  { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  nakshatraTxt:  { ...typography.micro, color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  loadingWrap:   { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.lg },
  loadingTxt:    { ...typography.body, color: colors.textMuted },
  errorWrap:     { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.lg },
  errorTxt:      { ...typography.body, color: colors.error, textAlign: 'center' },
  retryBtn:      { backgroundColor: colors.gold, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full },
  retryTxt:      { ...typography.bodyBold, color: colors.white },
  emptyWrap:     { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.lg },
  emptyEmoji:    { fontSize: 48 },
  emptyTxt:      { ...typography.body, color: colors.textMuted, textAlign: 'center' },
})
