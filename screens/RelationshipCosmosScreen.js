/**
 * Relationship Cosmos — Deep Vedic compatibility
 * Dasha synastry, navamsa, emotional compatibility, not just sun sign
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, SafeAreaView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/constants';
import { auth } from '../config/firebase';
import { colors, spacing, radius, typography, shadows, gradients } from '../config/theme';

const ASPECTS = [
  { key: 'overall',    label: 'Overall',    emoji: '✨' },
  { key: 'emotional',  label: 'Emotional',  emoji: '💗' },
  { key: 'physical',   label: 'Physical',   emoji: '🔥' },
  { key: 'mental',     label: 'Mental',     emoji: '🧠' },
  { key: 'spiritual',  label: 'Spiritual',  emoji: '🕉️' },
  { key: 'financial',  label: 'Financial',  emoji: '💰' },
];

export default function RelationshipCosmosScreen({ navigation }) {
  const [profile, setProfile]     = useState(null);
  const [partnerName, setPName]   = useState('');
  const [partnerDob,  setPDob]    = useState('');
  const [partnerTob,  setPTob]    = useState('');
  const [partnerPob,  setPPob]    = useState('');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [step, setStep]           = useState('input'); // 'input' | 'result'
  const scoreAnim                 = useState(new Animated.Value(0))[0];

  useEffect(() => {
    AsyncStorage.getItem('userProfile').then(s => { if (s) setProfile(JSON.parse(s)); });
  }, []);

  const analyse = async () => {
    if (!partnerDob.trim()) return;
    setLoading(true);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
      const de      = JSON.parse(await AsyncStorage.getItem('@daily_energy') || '{}');
      const res     = await fetch(`${BASE_URL}/api/relationship-cosmos`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({
          person1: { name: profile?.name, dob: profile?.dob, tob: profile?.tob, pob: profile?.pob, moon_sign: de?.moon_sign },
          person2: { name: partnerName || 'Partner', dob: partnerDob, tob: partnerTob || '12:00', pob: partnerPob || 'India' },
          chart1:  de?.user_Chart || {},
        }),
      });
      const data = await res.json();
      setResult(data);
      setStep('result');
      Animated.timing(scoreAnim, { toValue: data.overall_score || 75, duration: 1500, useNativeDriver: false }).start();
    } catch {
      alert('Could not analyse. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ScoreRing = ({ score, label, color }) => (
    <View style={s.scoreRing}>
      <View style={[s.scoreCircle, { borderColor: color || colors.gold }]}>
        <Text style={[s.scoreNum, { color: color || colors.gold }]}>{score}</Text>
        <Text style={s.scorePct}>%</Text>
      </View>
      <Text style={s.scoreLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#500724', '#881337', '#9F1239']} style={s.header}>
        <TouchableOpacity onPress={() => step === 'result' ? setStep('input') : navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.headerEmoji}>💞</Text>
          <View>
            <Text style={s.headerTitle}>Relationship Cosmos</Text>
            <Text style={s.headerSub}>Deep Vedic compatibility analysis</Text>
          </View>
        </View>
      </LinearGradient>

      {step === 'input' ? (
        <ScrollView contentContainerStyle={s.inputScroll} keyboardShouldPersistTaps="handled">
          <View style={s.inputCard}>
            <Text style={s.sectionTitle}>Your Details</Text>
            <View style={s.profileRow}>
              <Text style={s.profileName}>{profile?.name || 'You'}</Text>
              <Text style={s.profileDob}>{profile?.dob || 'Profile needed'}</Text>
            </View>

            <Text style={[s.sectionTitle, { marginTop: spacing.xl }]}>Partner's Details</Text>
            <TextInput style={s.input} placeholder="Partner's name (optional)" placeholderTextColor={colors.textMuted} value={partnerName} onChangeText={setPName} />
            <TextInput style={s.input} placeholder="Date of birth (YYYY-MM-DD) *" placeholderTextColor={colors.textMuted} value={partnerDob} onChangeText={setPDob} keyboardType="numeric" />
            <TextInput style={s.input} placeholder="Time of birth (HH:MM, optional)" placeholderTextColor={colors.textMuted} value={partnerTob} onChangeText={setPTob} keyboardType="numeric" />
            <TextInput style={s.input} placeholder="Place of birth (optional)" placeholderTextColor={colors.textMuted} value={partnerPob} onChangeText={setPPob} />

            <TouchableOpacity onPress={analyse} disabled={loading || !partnerDob.trim()} style={s.analyseBtn}>
              <LinearGradient colors={['#881337', '#500724']} style={s.analyseBtnGrad}>
                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={s.analyseBtnTxt}>✨ Analyse Compatibility</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={s.disclaimer}>Analysis uses Vedic birth chart calculations, Kuta points (Ashtakoot), and dasha compatibility.</Text>
          </View>
        </ScrollView>
      ) : result ? (
        <ScrollView contentContainerStyle={s.resultScroll} showsVerticalScrollIndicator={false}>
          {/* Overall score */}
          <LinearGradient colors={['#500724', '#881337']} style={s.overallCard}>
            <Text style={s.overallNames}>{profile?.name || 'You'} & {partnerName || 'Partner'}</Text>
            <View style={[s.scoreCircleLarge, { borderColor: colors.gold }]}>
              <Text style={s.scoreNumLarge}>{result.overall_score || '--'}</Text>
              <Text style={s.scorePctLarge}>/ 100</Text>
            </View>
            <Text style={s.overallLabel}>{result.overall_verdict || 'Compatibility Score'}</Text>
          </LinearGradient>

          {/* Aspect scores */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.aspectScroll} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
            {ASPECTS.map(a => (
              <ScoreRing key={a.key} score={result.scores?.[a.key] || '--'} label={`${a.emoji} ${a.label}`} color={a.key === 'emotional' ? '#EC4899' : a.key === 'physical' ? colors.saffron : colors.gold} />
            ))}
          </ScrollView>

          {/* Strengths */}
          {result.strengths?.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionHead}>💚 Strengths</Text>
              {result.strengths.map((s_, i) => <Text key={i} style={s.bullet}>• {s_}</Text>)}
            </View>
          )}

          {/* Challenges */}
          {result.challenges?.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionHead}>⚡ Challenges</Text>
              {result.challenges.map((c, i) => <Text key={i} style={s.bullet}>• {c}</Text>)}
            </View>
          )}

          {/* Kuta points */}
          {result.kuta_points && (
            <View style={s.section}>
              <Text style={s.sectionHead}>📿 Ashtakoot Kuta Points</Text>
              <Text style={s.kutaScore}>{result.kuta_points.score} / {result.kuta_points.max_score}</Text>
              {result.kuta_points.details?.map((k, i) => (
                <View key={i} style={s.kutaRow}>
                  <Text style={s.kutaName}>{k.name}</Text>
                  <Text style={s.kutaVal}>{k.score}/{k.max}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Advice */}
          {result.advice && (
            <View style={[s.section, { backgroundColor: '#FFF7ED' }]}>
              <Text style={s.sectionHead}>🔮 Vedic Guidance</Text>
              <Text style={s.adviceTxt}>{result.advice}</Text>
            </View>
          )}

          <TouchableOpacity style={s.resetBtn} onPress={() => { setStep('input'); setResult(null); }}>
            <Text style={s.resetTxt}>← Analyse Another</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.surface },
  header:          { paddingTop: 52, paddingBottom: 20, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  backBtn:         { marginRight: 12 },
  backTxt:         { color: colors.white, fontSize: 22, fontWeight: '600' },
  headerContent:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerEmoji:     { fontSize: 28 },
  headerTitle:     { color: colors.white, ...typography.h4 },
  headerSub:       { color: '#FDA4AF', ...typography.micro },
  inputScroll:     { padding: spacing.lg },
  inputCard:       { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, ...shadows.md },
  sectionTitle:    { ...typography.label, color: colors.textMuted, marginBottom: spacing.md },
  profileRow:      { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  profileName:     { ...typography.h4, color: colors.textPrimary },
  profileDob:      { ...typography.caption, color: colors.textMuted },
  input:           { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...typography.body, color: colors.textPrimary, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  analyseBtn:      { marginTop: spacing.lg, borderRadius: radius.xl, overflow: 'hidden' },
  analyseBtnGrad:  { padding: spacing.lg, alignItems: 'center' },
  analyseBtnTxt:   { ...typography.h4, color: colors.white },
  disclaimer:      { ...typography.micro, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, lineHeight: 16 },
  resultScroll:    { paddingBottom: spacing.xxxl },
  overallCard:     { padding: spacing.xl, alignItems: 'center', paddingTop: spacing.xxxl },
  overallNames:    { ...typography.bodyBold, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xl },
  scoreCircleLarge:{ width: 120, height: 120, borderRadius: 60, borderWidth: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  scoreNumLarge:   { ...typography.hero, color: colors.white, lineHeight: 52 },
  scorePctLarge:   { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  overallLabel:    { ...typography.h4, color: colors.white, marginTop: spacing.lg, textAlign: 'center' },
  aspectScroll:    { marginVertical: spacing.xl },
  scoreRing:       { alignItems: 'center', marginRight: spacing.lg, width: 80 },
  scoreCircle:     { width: 64, height: 64, borderRadius: 32, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  scoreNum:        { ...typography.h3 },
  scorePct:        { ...typography.micro, color: colors.textMuted },
  scoreLabel:      { ...typography.micro, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  section:         { backgroundColor: colors.white, margin: spacing.lg, borderRadius: radius.lg, padding: spacing.lg, ...shadows.sm },
  sectionHead:     { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
  bullet:          { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: 4 },
  kutaScore:       { ...typography.h2, color: colors.gold, marginBottom: spacing.md },
  kutaRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  kutaName:        { ...typography.body, color: colors.textSecondary },
  kutaVal:         { ...typography.bodyBold, color: colors.textPrimary },
  adviceTxt:       { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  resetBtn:        { margin: spacing.lg, padding: spacing.lg, alignItems: 'center' },
  resetTxt:        { ...typography.bodyBold, color: colors.violet },
})
