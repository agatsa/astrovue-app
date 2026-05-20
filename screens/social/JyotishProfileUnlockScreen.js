/**
 * JyotishProfileUnlockScreen — THE killer feature
 * See who someone ACTUALLY IS in your life through Vedic synastry
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, Image, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserProfile, getJyotishSynastry, followUser, unfollowUser, isFollowing } from '../../services/socialService';
import { colors, spacing, radius, typography, shadows, gradients } from '../../config/theme';

const HOUSE_MEANINGS = {
  1: 'Self, identity, physical appearance',
  2: 'Wealth, family, speech',
  3: 'Courage, siblings, communication',
  4: 'Home, mother, emotional security',
  5: 'Creativity, children, romance',
  6: 'Health, enemies, daily work',
  7: 'Marriage, partnerships, contracts',
  8: 'Transformation, secrets, occult',
  9: 'Dharma, father, long journeys, luck',
  10: 'Career, status, authority',
  11: 'Gains, friends, fulfillment of desires',
  12: 'Loss, liberation, foreign lands',
};

export default function JyotishProfileUnlockScreen({ navigation, route }) {
  const { uid: targetUid, profile: passedProfile } = route.params || {};

  const [profile, setProfile]     = useState(passedProfile || null);
  const [synastry, setSynastry]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [following, setFollowing] = useState(false);
  const [unlocked, setUnlocked]   = useState(false);
  const unlockAnim               = useState(new Animated.Value(0))[0];
  const pulseAnim                = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Pulse animation for unlock button
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ])).start();

    init();
  }, []);

  const init = async () => {
    setLoading(true);
    const [prof, following_] = await Promise.all([
      targetUid && !passedProfile ? getUserProfile(targetUid) : Promise.resolve(passedProfile),
      isFollowing(targetUid),
    ]);
    if (prof) setProfile(prof);
    setFollowing(following_);
    setLoading(false);
  };

  const unlockJyotishView = async () => {
    if (!profile) return;
    setLoading(true);
    const result = await getJyotishSynastry(targetUid, profile);
    setSynastry(result);
    setUnlocked(true);
    setLoading(false);
    Animated.timing(unlockAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  };

  const toggleFollow = async () => {
    if (following) { await unfollowUser(targetUid); setFollowing(false); }
    else           { await followUser(targetUid);   setFollowing(true);  }
  };

  if (loading && !profile) {
    return (
      <LinearGradient colors={gradients.cosmic} style={s.loading}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={s.loadingTxt}>Loading profile...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

        {/* Header gradient */}
        <LinearGradient colors={gradients.cosmic} style={s.heroBg}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backTxt}>←</Text>
          </TouchableOpacity>

          {/* Profile card */}
          <View style={s.profileCard}>
            {profile?.photo
              ? <Image source={{ uri: profile.photo }} style={s.avatar} />
              : <View style={s.avatarFallback}><Text style={s.avatarInitial}>{profile?.name?.[0] || '?'}</Text></View>
            }
            <Text style={s.profileName}>{profile?.name || 'Unknown'}</Text>
            <View style={s.profileChips}>
              {profile?.nakshatra && <View style={s.chip}><Text style={s.chipTxt}>🌙 {profile.nakshatra}</Text></View>}
              {profile?.moon_sign && <View style={s.chip}><Text style={s.chipTxt}>♍ {profile.moon_sign}</Text></View>}
              {profile?.ascendant && <View style={s.chip}><Text style={s.chipTxt}>⬆️ {profile.ascendant}</Text></View>}
              {profile?.is_influencer && <View style={[s.chip, { backgroundColor: colors.gold + '30' }]}><Text style={[s.chipTxt, { color: colors.gold }]}>⭐ Influencer</Text></View>}
            </View>

            {/* Follow button */}
            <TouchableOpacity style={[s.followBtn, following && s.followingBtn]} onPress={toggleFollow}>
              <Text style={[s.followBtnTxt, following && s.followingBtnTxt]}>
                {following ? '✓ Following' : '+ Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* The unlock section */}
        {!unlocked ? (
          <View style={s.unlockSection}>
            <Text style={s.unlockTitle}>🔮 Jyotish View</Text>
            <Text style={s.unlockDesc}>
              Unlock the Vedic truth about who {profile?.name || 'this person'} is in your life.{'\n\n'}
              See which houses they activate in your chart, your karmic connection, the hidden dynamics between you, and the best timing for your interactions.
            </Text>

            <View style={s.unlockPreview}>
              {['Which house they rule in your chart', 'Past life karmic connection', 'What they trigger in your chart', 'Best & challenging timing', 'The hidden truth of this relationship'].map((item, i) => (
                <View key={i} style={s.unlockPreviewItem}>
                  <Text style={s.unlockPreviewDot}>🔒</Text>
                  <Text style={s.unlockPreviewTxt}>{item}</Text>
                </View>
              ))}
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity onPress={unlockJyotishView} disabled={loading} style={s.unlockBtn}>
                <LinearGradient colors={['#7C3AED', '#4F46E5']} style={s.unlockBtnGrad}>
                  {loading
                    ? <ActivityIndicator color={colors.white} />
                    : <>
                        <Text style={s.unlockBtnEmoji}>🔮</Text>
                        <Text style={s.unlockBtnTxt}>Unlock Jyotish View</Text>
                        <Text style={s.unlockBtnSub}>Uses your birth chart for analysis</Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : synastry ? (
          <Animated.View style={{ opacity: unlockAnim }}>
            {/* Overall relationship reading */}
            <LinearGradient colors={['#1A0640', '#0F0328']} style={s.synCard}>
              <Text style={s.synTitle}>🔮 Jyotish Reading</Text>
              <Text style={s.synSubtitle}>You & {profile?.name}</Text>
              <Text style={s.synOverall}>{synastry.overall_narrative}</Text>
            </LinearGradient>

            {/* Compatibility score */}
            {synastry.compatibility_score && (
              <View style={s.section}>
                <View style={s.scoreRow}>
                  <View style={[s.scoreCircle, { borderColor: synastry.compatibility_score >= 70 ? colors.success : synastry.compatibility_score >= 50 ? colors.gold : colors.error }]}>
                    <Text style={[s.scoreNum, { color: synastry.compatibility_score >= 70 ? colors.success : synastry.compatibility_score >= 50 ? colors.gold : colors.error }]}>
                      {synastry.compatibility_score}
                    </Text>
                    <Text style={s.scorePct}>%</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.lg }}>
                    <Text style={s.scoreLabel}>Compatibility</Text>
                    <Text style={s.scoreVerdict}>{synastry.compatibility_verdict}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* House overlays */}
            {synastry.house_overlays?.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>🏠 House Activation</Text>
                <Text style={s.sectionSub}>Which houses {profile?.name} activates in YOUR chart</Text>
                {synastry.house_overlays.map((h, i) => (
                  <View key={i} style={s.houseCard}>
                    <View style={s.houseNum}>
                      <Text style={s.houseNumTxt}>{h.house}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.housePlanet}>{h.planet} in your {h.house}{h.house === 1 ? 'st' : h.house === 2 ? 'nd' : h.house === 3 ? 'rd' : 'th'} house</Text>
                      <Text style={s.houseMeaning}>{HOUSE_MEANINGS[h.house] || ''}</Text>
                      <Text style={s.houseEffect}>{h.effect}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Karmic connection */}
            {synastry.karmic_connection && (
              <LinearGradient colors={['#1A0533', '#2D0F7A']} style={s.karmicCard}>
                <Text style={s.karmicTitle}>☊ Karmic Connection</Text>
                <Text style={s.karmicTxt}>{synastry.karmic_connection}</Text>
              </LinearGradient>
            )}

            {/* Hidden truth */}
            {synastry.hidden_truth && (
              <View style={[s.section, { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' }]}>
                <Text style={[s.sectionTitle, { color: colors.goldDeep }]}>✨ The Hidden Truth</Text>
                <Text style={s.sectionTxt}>{synastry.hidden_truth}</Text>
              </View>
            )}

            {/* Best timing */}
            {synastry.best_timing && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>📅 Best Timing for Interaction</Text>
                <Text style={s.sectionTxt}>{synastry.best_timing}</Text>
              </View>
            )}

            {/* Warning */}
            {synastry.caution && (
              <View style={[s.section, { backgroundColor: colors.errorLight, borderWidth: 1, borderColor: '#FECACA' }]}>
                <Text style={[s.sectionTitle, { color: colors.error }]}>⚠️ Caution</Text>
                <Text style={s.sectionTxt}>{synastry.caution}</Text>
              </View>
            )}

            {/* Ask Jyotish about this person */}
            <TouchableOpacity
              style={s.askJyotishBtn}
              onPress={() => navigation.navigate('AiJyotish')}
            >
              <LinearGradient colors={gradients.violet} style={s.askJyotishGrad}>
                <Text style={s.askJyotishTxt}>🔮 Ask Jyotish about {profile?.name} →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={s.errorWrap}>
            <Text style={s.errorTxt}>Could not generate Jyotish reading. This person may not have shared their birth chart.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: colors.surface },
  loading:           { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  loadingTxt:        { color: colors.white, ...typography.body },
  heroBg:            { paddingTop: 52, paddingBottom: 24 },
  backBtn:           { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  backTxt:           { color: colors.white, fontSize: 22, fontWeight: '600' },
  profileCard:       { alignItems: 'center', paddingHorizontal: spacing.lg },
  avatar:            { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.gold, marginBottom: spacing.md },
  avatarFallback:    { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.violetMuted, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, borderWidth: 3, borderColor: colors.gold },
  avatarInitial:     { ...typography.h1, color: colors.violet },
  profileName:       { ...typography.h2, color: colors.white, marginBottom: spacing.md },
  profileChips:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  chip:              { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  chipTxt:           { ...typography.micro, color: colors.white, fontWeight: '600' },
  followBtn:         { backgroundColor: colors.white, paddingHorizontal: spacing.xxxl, paddingVertical: spacing.sm, borderRadius: radius.full },
  followingBtn:      { backgroundColor: 'rgba(255,255,255,0.2)' },
  followBtnTxt:      { ...typography.bodyBold, color: colors.cosmicDeep },
  followingBtnTxt:   { color: colors.white },
  unlockSection:     { padding: spacing.xl },
  unlockTitle:       { ...typography.h2, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md },
  unlockDesc:        { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: spacing.xl },
  unlockPreview:     { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.xl, ...shadows.sm },
  unlockPreviewItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  unlockPreviewDot:  { fontSize: 16, width: 24 },
  unlockPreviewTxt:  { ...typography.body, color: colors.textSecondary, flex: 1 },
  unlockBtn:         { borderRadius: radius.xl, overflow: 'hidden' },
  unlockBtnGrad:     { padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  unlockBtnEmoji:    { fontSize: 32 },
  unlockBtnTxt:      { ...typography.h4, color: colors.white },
  unlockBtnSub:      { ...typography.micro, color: 'rgba(255,255,255,0.7)' },
  synCard:           { margin: spacing.lg, borderRadius: radius.xl, padding: spacing.xl },
  synTitle:          { ...typography.label, color: colors.gold, marginBottom: spacing.xs },
  synSubtitle:       { ...typography.h3, color: colors.white, marginBottom: spacing.lg },
  synOverall:        { ...typography.body, color: 'rgba(255,255,255,0.85)', lineHeight: 24 },
  section:           { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, ...shadows.sm },
  sectionTitle:      { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  sectionSub:        { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  sectionTxt:        { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  scoreRow:          { flexDirection: 'row', alignItems: 'center' },
  scoreCircle:       { width: 72, height: 72, borderRadius: 36, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  scoreNum:          { ...typography.h2 },
  scorePct:          { ...typography.micro, color: colors.textMuted },
  scoreLabel:        { ...typography.label, color: colors.textMuted, marginBottom: spacing.xs },
  scoreVerdict:      { ...typography.h4, color: colors.textPrimary },
  houseCard:         { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  houseNum:          { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cosmicMid, justifyContent: 'center', alignItems: 'center' },
  houseNumTxt:       { ...typography.bodyBold, color: colors.gold },
  housePlanet:       { ...typography.bodyBold, color: colors.textPrimary, marginBottom: 2 },
  houseMeaning:      { ...typography.micro, color: colors.textMuted, marginBottom: 4 },
  houseEffect:       { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  karmicCard:        { margin: spacing.lg, borderRadius: radius.xl, padding: spacing.xl },
  karmicTitle:       { ...typography.h4, color: colors.gold, marginBottom: spacing.md },
  karmicTxt:         { ...typography.body, color: 'rgba(255,255,255,0.85)', lineHeight: 24 },
  askJyotishBtn:     { margin: spacing.lg, borderRadius: radius.xl, overflow: 'hidden' },
  askJyotishGrad:    { padding: spacing.lg, alignItems: 'center' },
  askJyotishTxt:     { ...typography.h4, color: colors.white },
  errorWrap:         { padding: spacing.xl, alignItems: 'center' },
  errorTxt:          { ...typography.body, color: colors.textMuted, textAlign: 'center' },
})
