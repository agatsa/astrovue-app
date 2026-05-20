/**
 * Discover — Hub for all 8 features
 * Muhurat, Relationship Cosmos, Health Rhythm, Nakshatra Community, Vastu, more
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, typography, shadows, gradients } from '../config/theme';

// Screens that need daily_energy chart data to function
const NEEDS_ENERGY = ['AstroCareer', 'AstroMoney', 'HourlyRisk', 'CelestialPulse', 'AstroAlert', 'AstroLove'];

const FEATURES = [
  {
    key:   'MuhuratScreen',
    emoji: '🗓️',
    title: 'Muhurat',
    sub:   'Auspicious timing for every life decision',
    grad:  ['#78350F', '#B45309'],
  },
  {
    key:   'RelationshipCosmos',
    emoji: '💞',
    title: 'Relationship Cosmos',
    sub:   'Deep Vedic compatibility — beyond sun signs',
    grad:  ['#881337', '#BE185D'],
  },
  {
    key:   'HealthRhythm',
    emoji: '⚡',
    title: 'Health Rhythm',
    sub:   'Your body synced with planetary movements',
    grad:  ['#064E3B', '#059669'],
  },
  {
    key:   'NakshatraCommunity',
    emoji: '🌌',
    title: 'Nakshatra Community',
    sub:   'Your cosmic tribe by birth nakshatra',
    grad:  gradients.dusk,
  },
  {
    key:   'VastuScanner',
    emoji: '🏠',
    title: 'Vastu Scanner',
    sub:   'AI-powered room analysis with live camera',
    grad:  ['#1A0533', '#4C1D95'],
  },
  {
    key:   'CelestialPulse',
    emoji: '🌌',
    title: 'Celestial Pulse',
    sub:   'Deep-dive into today\'s planetary energy',
    grad:  ['#0F172A', '#1E3A5F'],
  },
  {
    key:   'HourlyRisk',
    emoji: '⏱️',
    title: 'Hourly Risk Meter',
    sub:   'Hour-by-hour astrological risk forecast',
    grad:  ['#450A0A', '#991B1B'],
  },
  {
    key:   'AstroCareer',
    emoji: '💼',
    title: 'Astro Career',
    sub:   'Career path, timing and planetary guidance',
    grad:  ['#0C4A6E', '#0284C7'],
  },
  {
    key:   'AstroMoney',
    emoji: '💰',
    title: 'Astro Money',
    sub:   'Financial timing and wealth indicators',
    grad:  ['#365314', '#4D7C0F'],
  },
  {
    key:   'RelationshipCosmos',
    emoji: '💑',
    title: 'Quick Match',
    sub:   'Deep Vedic compatibility by birth details',
    grad:  ['#500724', '#9F1239'],
  },
];

export default function DiscoverScreen({ navigation }) {
  const [hasEnergy, setHasEnergy] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@daily_energy').then(s => {
      if (s) {
        const d = JSON.parse(s);
        setHasEnergy(!!(d?.user_Chart?.mahadasha));
      }
    });
  }, []);

  const handleFeaturePress = async (key) => {
    if (NEEDS_ENERGY.includes(key) && !hasEnergy) {
      Alert.alert(
        'Loading your chart...',
        'Your daily cosmic data is loading. Go to Today tab first to load your chart, then come back here.',
        [
          { text: 'Go to Today', onPress: () => navigation.navigate('Today') },
          { text: 'Try Anyway',  onPress: () => navigation.navigate(key) },
        ]
      );
      return;
    }
    navigation.navigate(key);
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <LinearGradient colors={gradients.cosmic} style={s.header}>
        <Text style={s.headerTitle}>Discover</Text>
        <Text style={s.headerSub}>Explore every dimension of your cosmic life</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Featured 2-column grid */}
        <View style={s.grid}>
          {FEATURES.map(f => (
            <TouchableOpacity
              key={f.key}
              style={s.featureCard}
              onPress={() => handleFeaturePress(f.key)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={f.grad} style={s.featureGrad}>
                <Text style={s.featureEmoji}>{f.emoji}</Text>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureSub}>{f.sub}</Text>
                <Text style={s.featureArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending */}
        <View style={s.trendingSection}>
          <Text style={s.trendingTitle}>🔥 Trending in India</Text>
          {[
            'Saturn transit through Pisces affecting career',
            'Rahu-Ketu axis shift — who gets affected?',
            'Jupiter in Gemini — education & travel boom',
          ].map((t, i) => (
            <View key={i} style={s.trendingItem}>
              <Text style={s.trendingNum}>{i + 1}</Text>
              <Text style={s.trendingTxt}>{t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.surface },
  header:         { paddingTop: 56, paddingBottom: 24, paddingHorizontal: spacing.lg },
  headerTitle:    { ...typography.h1, color: colors.white },
  headerSub:      { ...typography.body, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  scroll:         { padding: spacing.lg, paddingBottom: spacing.xxxl },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  featureCard:    { width: '47.5%', borderRadius: radius.xl, overflow: 'hidden', ...shadows.md },
  featureGrad:    { padding: spacing.lg, minHeight: 150, justifyContent: 'space-between' },
  featureEmoji:   { fontSize: 32, marginBottom: spacing.sm },
  featureTitle:   { ...typography.h4, color: colors.white },
  featureSub:     { ...typography.micro, color: 'rgba(255,255,255,0.7)', lineHeight: 16, marginTop: 4 },
  featureArrow:   { ...typography.h4, color: 'rgba(255,255,255,0.5)', alignSelf: 'flex-end', marginTop: spacing.sm },
  trendingSection:{ backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.lg, ...shadows.sm },
  trendingTitle:  { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.lg },
  trendingItem:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  trendingNum:    { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.cosmicMid, textAlign: 'center', lineHeight: 28, color: colors.gold, fontWeight: '800', fontSize: 13 },
  trendingTxt:    { ...typography.body, color: colors.textSecondary, flex: 1 },
})
