// 📱 CelestialPulseScreen.js – Deeply Enhanced UI + GPT-Driven Content

import AskAIBox from '../components/AskAIBox';


import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Share
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import ViewShot from 'react-native-view-shot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { BASE_URL } from '../config/constants';

import { RefreshControl } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function CelestialPulseScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState({});
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const viewShotRef = useRef();
  const scrollRef = useRef();
  const [pulseData, setPulseData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchedDate, setLastFetchedDate] = useState(null);



  useEffect(() => {
    const loadEnergy = async () => {
      try {
        const stored = await AsyncStorage.getItem('@daily_energy');
        // const parsed = JSON.parse(dailyEnergy);
        // setData(parsed);
        if (stored) setData(JSON.parse(stored));
      } catch (err) {
        console.error('❌ Error loading energy:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEnergy();
  }, []);

  // const dasha = data?.user_Chart?.dasha || {};

  useEffect(() => {
    const loadCachedAiData = async () => {
      try {
        const stored = await AsyncStorage.getItem('@celestial_ai_data');
        if (stored) {
          setAiData(JSON.parse(stored));
          console.log('📦 Loaded cached AI data from AsyncStorage');
        }
      } catch (err) {
        console.warn('⚠️ Failed to load cached AI data:', err);
      }
    };
    loadCachedAiData();
  }, []);

  const fetchPulse = async () => {
    try {

      const today = new Date().toISOString().split("T")[0];
      const lastFetched = await AsyncStorage.getItem('@celestial_ai_date');

      if (lastFetched === today) {
        console.log('🛑 Skipping GPT fetch, already loaded today');
        return;
      }

      const user = auth.currentUser;
      const token = await user.getIdToken();

      const profileStr = await AsyncStorage.getItem('userProfile');
      const profile = JSON.parse(profileStr || '{}');

      const zone = data?.zone || 'UNKNOWN';
      const topPlanet = Object.entries(data?.scores || {}).sort(([, a], [, b]) => b.score - a.score)?.[0]?.[0] || 'UNKNOWN';
      const moonSign = data?.moon_sign || 'UNKNOWN';
      const nakshatraName = data?.user_Chart?.nakshatra || 'UNKNOWN';

      const dobDate = new Date(profile.dob);
      const tobDate = new Date(profile.tob);

      const payload = {
        user_id: user.uid,
        my_name: profile.name,
        my_dob: dobDate.toISOString().split("T")[0],                    // "YYYY-MM-DD"
        my_tob: tobDate.toISOString().split("T")[1].slice(0, 5),   
        my_pob: profile.pob,
        date: new Date().toISOString().split("T")[0],
        question: "Generate today’s celestial pulse summary, rituals, and spiritual guidance.",
        context: {
          topic: "celestial-pulse",
          zone: zone,
          top_planet: topPlanet,
          moon_sign: moonSign,
          nakshatra: nakshatraName
        }
      };

      const res = await fetch(`${BASE_URL}/api/ask-ai`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      console.log('📥 Celestial Pulse AI Reply:', json);
      const parsedReply = JSON.parse(json.reply || '{}');
      setAiData(parsedReply);
      await AsyncStorage.setItem('@celestial_ai_data', JSON.stringify(parsedReply));
      await AsyncStorage.setItem('@celestial_ai_date', today);
      console.log('✅ Fresh GPT data cached');
      setLastFetchedDate(today);

    } catch (err) {
      console.warn('⚠️ Failed to fetch GPT Celestial Pulse insight:', err);
    }
  };

  useEffect(() => {
    const checkAndFetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      if (lastFetchedDate !== today) {
        await fetchPulse();
      }
    };
    if (data) checkAndFetch();
  }, [data, lastFetchedDate]);
  
  
  const onRefresh = async () => {
    setRefreshing(true);
    await AsyncStorage.removeItem('@celestial_ai_date');
    await AsyncStorage.removeItem('@celestial_ai_data');
    setAiData({});
    setLastFetchedDate(null); // 🔁 Triggers useEffect again
    setTimeout(() => setRefreshing(false), 1000);
  };
  

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      await Share.share({ message: `${aiData.summary}\n\n— via Kundli Sutra`, url: uri });
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  const suggestedQuestions = [
    'Why is today emotionally intense?',
    'What should I avoid saying today?',
    'Is this a good day to take a bold step?',
    'How should I handle Mars influence today?'
  ];

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} size="large" />;

  const safeRiskData = (data?.hourly_risk || []).map((r, i) => ({ hour: i, risk: r })).filter(r => typeof r.risk === 'number');
  const sortedScores = Object.entries(data?.scores || {}).sort(([, a], [, b]) => b.score - a.score);

  return (

    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // adjust for your header
  >
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[styles.container, { paddingBottom: 200 }]} // add padding for keyboard space
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#000"
        />
      }
      keyboardShouldPersistTaps="handled"
    >


      
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>

        <Text style={styles.title}>🌌 Celestial Pulse for {new Date().toDateString()}</Text>
        <Text style={styles.zoneBanner}>{data.zone} • {aiData.zone_commentary || '...'}</Text>

        {aiData.emotion_forecast && <Text style={styles.emotionBadge}>{aiData.emotion_forecast}</Text>}

        <View style={styles.card}><Text style={styles.label}>🧭 Karma Energy Score</Text><Text>{aiData.karma_score ? `${aiData.karma_score}/100` : '...'}</Text></View>

        <View style={styles.card}><Text style={styles.label}>🪐 Dominant Planet</Text><Text>{aiData.planet_insight || sortedScores[0]?.[0]}</Text>
          <Text style={styles.label}>🌕 Moon & Nakshatra</Text><Text>{data.moon_sign} — {data.user_Chart?.nakshatra} (Pada {data.user_Chart?.pada})</Text><Text>{aiData.nakshatra_summary || '...'}</Text>
          {/* <Text style={styles.label}>🔮 Current Dasha</Text><Text>{data.dasha?.mahadasha} > {data.dasha?.antardasha} > {data.dasha?.pratyantar} > {data.dasha?.sookshma} > {data.dasha?.prana}</Text> */}
          <Text style={styles.label}>📜 Summary</Text><Text>{aiData.summary || '...'}</Text>
          <Text style={styles.label}>🧭 Astro Alert</Text><Text>{aiData.astro_alert || '...'}</Text>
        </View>

        <View style={styles.card}><Text style={styles.label}>📅 Timeline</Text><Text>{aiData.timeline || '...'}</Text></View>

        <View style={styles.card}><Text style={styles.label}>🔆 Spiritual Symbol</Text><Text>{aiData.symbol || '...'}</Text>
          <Text style={styles.label}>🕊️ Divine Suggestion</Text><Text>{aiData.divine_blessing || '...'}</Text>
        </View>

        <View style={styles.card}><Text style={styles.label}>🧘‍♀️ Ritual of the Day</Text>
          <Text>{aiData.ritual_name}</Text>
          <Text>📿 Mantra: {aiData.ritual_mantra}</Text>
          <Text>🕯️ Action: {aiData.ritual_action}</Text>
          <Text>🕘 Time: {aiData.ritual_time}</Text>
        </View>

        <View style={styles.card}><Text style={styles.label}>💬 Mantra Reflection</Text><Text>{aiData.mantra_reflection || '...'}</Text>
          <Text style={styles.label}>🎯 Morning Focus</Text><Text>{aiData.focus || '...'}</Text>
          <Text style={styles.label}>🌙 Evening Reflection</Text><Text>{aiData.reflection || '...'}</Text>
        </View>

        {safeRiskData.length > 0 && (
          <View style={styles.card}><Text style={styles.label}>📊 Hourly Risk Chart</Text>
            <LineChart
              data={{ labels: safeRiskData.map(r => `${r.hour}`), datasets: [{ data: safeRiskData.map(r => r.risk) }] }}
              width={screenWidth - 32} height={220} yAxisSuffix="%"
              chartConfig={{ backgroundColor: '#fff', backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff', decimalPlaces: 0, color: (opacity = 1) => `rgba(255, 100, 100, ${opacity})`, labelColor: () => `#000`, propsForDots: { r: '3', strokeWidth: '1', stroke: '#ff0000' } }}
              style={{ marginVertical: 10, borderRadius: 8 }}
            />
          </View>
        )}

    {/* ✅ Ask AI Box */}
    <AskAIBox chatKey="ask_ai_celestial" />

{/* ✅ Share Button */}
<TouchableOpacity style={styles.shareButton} onPress={handleShare}>
  <Text style={{ color: '#fff' }}>📸 Share Today’s Pulse</Text>
</TouchableOpacity>
</ViewShot>
</ScrollView>
</KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  zoneBanner: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b00000',
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12
  },
  emotionBadge: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#ff3333',
    marginBottom: 14
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    color: '#333'
  },
  text: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22
  },
   button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#1e88e5',
    borderRadius: 6,
    alignItems: 'center'
  },
  ai: { marginTop: 10, fontStyle: 'italic' },
  replyCard: {
    backgroundColor: '#fffbe6',
    marginTop: 12,
    padding: 12,
    borderRadius: 6,
    borderColor: '#ffeaa7',
    borderWidth: 1
  },
  suggestedRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 4
  },
  suggestionBubble: {
    backgroundColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8
  },
  shareButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 40
  }
  
});