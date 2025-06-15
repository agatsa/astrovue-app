import { BASE_URL } from "../config/constants";
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

// const BASE_URL = 'http://192.168.1.13:8080';

export default function AstroMoneyScreen() {
  const [moneyAdvice, setMoneyAdvice] = useState(null);
  const [loading, setLoading] = useState(true);

  const sanitizeGPTJsonReply = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    try {
      let cleaned = raw.replace(/```json|```/gi, '').trim();
      cleaned = cleaned.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
      cleaned = cleaned.replace(/([,{\s])(\w+):/g, '$1"$2":');
      let parsed = JSON.parse(cleaned);
      if (typeof parsed === 'string' && parsed.trim().startsWith('{')) {
        parsed = JSON.parse(parsed);
      }
      return parsed;
    } catch (err) {
      console.warn('❌ sanitizeGPTJsonReply failed:', err.message);
      return null;
    }
  };

  useEffect(() => {
    const fetchMoneyAdvice = async () => {
      try {
        setLoading(true);

        // const cached = await AsyncStorage.getItem('@money_insight');
        // if (cached) {
        //   setMoneyAdvice(JSON.parse(cached));
        //   setLoading(false);
        //   return;
        // }

        const raw = await AsyncStorage.getItem('@daily_energy');
        const stored = raw ? JSON.parse(raw) : {};
        const chart = stored.user_Chart || {};

        console.log('📦 Loaded daily energy:', stored);

        let tob = chart?.tob || '';
        if (tob.length > 5) {
          tob = tob.slice(11, 16);
        }

        if (!chart.dob || !tob || !chart.pob) {
          console.warn('🚫 Missing birth details:', { dob: chart.dob, tob, pob: chart.pob });
          setMoneyAdvice({ error: 'Missing birth chart data' });
          return;
        }

        const prompt = `You are a Vedic astrologer. Based on:\n- Name: ${stored?.name || 'User'}\n- DOB: ${chart?.dob?.slice?.(0, 10)}\n- TOB: ${tob}\n- POB: ${chart?.pob || 'Kanpur, UP, India'}\n- Ascendant: ${stored.ascendant}\n- Moon Sign: ${stored.moon_sign}\n- Sun Sign: ${stored.sun_sign}\n- Mahadasha: ${stored.mahadasha}\n- Antardasha: ${stored.antardasha}\n- Planet Scores: ${JSON.stringify(stored.scores)}\n\nReturn a JSON object with:\n1. dasha (string)\n2. riskPeriod (string)\n3. luckyTime (string)\n4. suggestion (string)\n5. karmaScore (int)\n6. karmaNote (string)\n7. wealthTimeline ([{period, trend}])\n8. planets ([{planet, effect, advice}])\n9. products ([{name, price}])\n10. mantra (string)\n11. remedy (string)\n12. remedyActivated (bool)\n13. activationDate (string)\n\nOnly return valid JSON — no markdown, no text outside the object.`;

        const idToken = await auth.currentUser.getIdToken();

        console.log('📡 Hitting /api/ask-ai with prompt:', prompt);
        console.log('🛒 Sending payload:', {
          question: prompt,
          user_id: auth.currentUser.uid,
          my_dob: chart.dob,
          my_tob: tob,
          my_pob: chart.pob,
          my_name: stored?.name || 'User',
          context: { topic: 'astro-money' }
        });

        const res = await fetch(`${BASE_URL}/api/ask-ai`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: prompt,
            user_id: auth.currentUser.uid,
            my_dob: chart.dob,
            my_tob: tob,
            my_pob: chart.pob,
            my_name: stored?.name || 'User',
            context: { topic: 'astro-money' }
          })
        });

        const json = await res.json();
        if (!json.reply) throw new Error('Missing GPT reply');
        const parsed = sanitizeGPTJsonReply(json.reply);

        if (!parsed || typeof parsed !== 'object') {
          setMoneyAdvice({ error: 'Could not parse GPT response' });
          return;
        }

        setMoneyAdvice(parsed);
        await AsyncStorage.setItem('@money_insight', JSON.stringify(parsed));
      } catch (e) {
        console.warn('❌ Failed to load AstroMoney data:', e);
        setMoneyAdvice({ error: e.message });
      } finally {
        setLoading(false);
      }
    };

    fetchMoneyAdvice();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B008B" />
        <Text style={styles.loadingText}>Fetching your financial guidance...</Text>
      </View>
    );
  }

  if (!moneyAdvice || moneyAdvice.error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red' }}>🚫 {moneyAdvice?.error || 'Something went wrong.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>💰 AstroMoney Guidance</Text>

      <View style={styles.card}>
        <Text style={styles.section}>💫 Dasha: {moneyAdvice.dasha}</Text>
        <Text>📉 Risk Period: {moneyAdvice.riskPeriod}</Text>
        <Text>🍀 Lucky Time: {moneyAdvice.luckyTime}</Text>
        <Text>📌 Suggestion: {moneyAdvice.suggestion}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>🧭 Karmic Profile</Text>
        <Text>Karma Score: {moneyAdvice.karmaScore} / 100</Text>
        <Text>{moneyAdvice.karmaNote}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>📈 Wealth Timeline</Text>
        {(moneyAdvice.wealthTimeline || []).map((item, i) => (
          <Text key={i}>🗓️ {item.period} → {item.trend}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>🪐 Planetary Influences</Text>
        {(moneyAdvice.planets || []).map((p, i) => (
          <Text key={i}>🔸 {p.planet}: {p.effect} | {p.advice}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>🛍️ Wealth Products</Text>
        {(moneyAdvice.products || []).map((p, i) => (
          <Text key={i}>💎 {p.name} — ₹{p.price}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>🕉️ Remedies</Text>
        <Text>Mantra: {moneyAdvice.mantra}</Text>
        <Text>Remedy: {moneyAdvice.remedy}</Text>
        <Text>Status: {moneyAdvice.remedyActivated ? '✅ Activated' : '❌ Not Activated'}</Text>
        <Text>Since: {moneyAdvice.activationDate}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#4b0082', textAlign: 'center' },
  card: { backgroundColor: '#f9f9f9', padding: 14, marginBottom: 16, borderRadius: 12 },
  section: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#555' },
});
