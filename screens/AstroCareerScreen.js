import { BASE_URL } from "../config/constants";
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, StatusBar
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import AskAIBox from '../components/AskAIBox';

import { KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';



// const BASE_URL = 'https://kundli-auth-api1-731436072433.asia-south1.run.app';

// const BASE_URL = 'http://192.168.1.13:8080';

export default function AstroCareer({ navigation }) {
  const [data, setData] = useState(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRef = useRef();

  const loadDailyEnergy = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@daily_energy');
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue);
        console.log('🔮 Loaded myDailyEnergy in AstroCareer:', parsed);
        return parsed;
      } else {
        console.log('⚠️ No dailyEnergy found in AsyncStorage (AstroCareer)');
        return null;
      }
    } catch (e) {
      console.error('❌ Error loading dailyEnergy in AstroCareer:', e);
      return null;
    }
  };

  function sanitizeGPTJsonReply(raw) {
    if (!raw || typeof raw !== 'string') {
      console.warn('❌ sanitizeGPTJsonReply failed: raw input missing or not a string');
      return null;
    }
  
    try {
      let cleaned = raw.replace(/```json|```/gi, '').trim();
      cleaned = cleaned.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  
      // Quote unquoted keys
      cleaned = cleaned.replace(/([,{\\s])(\\w+):/g, '$1"$2":');
  
      let parsed = JSON.parse(cleaned);
      if (typeof parsed === 'string' && parsed.trim().startsWith('{')) {
        parsed = JSON.parse(parsed);
      }
  
      return parsed;
    } catch (err) {
      console.warn('❌ sanitizeGPTJsonReply failed:', err.message);
      return null;
    }
  }
  
  

  function validateGPTCareerJson(data) {
    if (!data || typeof data !== 'object') return false;

    const requiredKeys = [
      'career_pulse', 'zone', 'traits', 'roles',
      'dasha_timeline', 'karmic_blocks', 'remedies', 'gpt_summary'
    ];

    for (const key of requiredKeys) {
      if (!(key in data)) {
        console.warn(`⚠️ Missing required key in GPT response: ${key}`);
        return false;
      }
    }

    if (
      typeof data.career_pulse?.title !== 'string' ||
      typeof data.traits?.workstyle !== 'string' ||
      !Array.isArray(data.roles)
    ) {
      console.warn("⚠️ Some fields in GPT response have invalid types.");
      return false;
    }

    return true;
  }

  useEffect(() => {
    const loadCareerInsight = async () => {
      try {
        setLoading(true);

        // const cached = await AsyncStorage.getItem('@careerInsight');
        // if (cached) {
        //   setData(JSON.parse(cached));
        //   setLoading(false);
        //   return;
        // }

        const daily = await loadDailyEnergy();
        if (!daily || !daily.user_Chart) {
          setData({ error: 'Missing daily energy or chart data.' });
          return;
        }

        const chart = daily.user_Chart;
        if (!chart.dob || !chart.tob || !chart.pob) {
          setData({ error: 'Incomplete birth chart information.' });
          return;
        }
        console.log("chart:", chart);
        


        const prompt = `
          You are a Vedic astrologer. Based on: 
          - Name: User
          - DOB: ${chart.dob}
          - TOB: ${chart.tob}
          - POB: ${chart.pob}
          - Ascendant: ${daily.ascendant}
          - Moon Sign: ${daily.moon_sign}
          - Sun Sign: ${daily.sun_sign}
          - Mahadasha: ${daily.mahadasha}
          - Antardasha: ${daily.antardasha}
         

          Return a valid JSON object with:
          1. career_pulse: { "title": string, "message": string, "risk_level": string }
          2. zone: "Red Zone" | "Yellow Zone" | "Green Zone"
          3. traits: { "strengths": [string], "workstyle": string, "element": string }
          4. roles: [string]
          5. dasha_timeline: [string]
          6. karmic_blocks: [string]
          7. remedies: [string]
          8. gpt_summary: string (1–2 lines max)

          Only return a valid JSON object — no markdown, no prefix, no explanation.
          `.trim();

        const idToken = await auth.currentUser.getIdToken();
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
            my_tob: chart.tob,
            my_pob: chart.pob,
            my_name: 'User'
          }),
        });

        const json = await res.json();
        

        if (!json || !json.reply) {
          console.warn("⚠️ No reply field in GPT response:", json);
          setData({ error: 'GPT response was empty or invalid.' });
          return;
        }



        const parsed = sanitizeGPTJsonReply(json.reply);

        if (!parsed || !validateGPTCareerJson(parsed)) {
          setData({ error: 'GPT reply was incomplete or invalid.' });
          return;
        }

        setData(parsed);
        await AsyncStorage.setItem('@careerInsight', JSON.stringify(parsed));
      } catch (e) {
        console.error("❌ Failed to parse GPT response as JSON:", e);
        setData({ error: 'Could not understand GPT reply.' });
      } finally {
        setLoading(false);
      }
    };

    loadCareerInsight();
  }, []);

  const handleAskAI = async () => {
    if (!question.trim()) return;
    setAiResponse('Thinking...');

    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${BASE_URL}/api/ask-ai`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      setAiResponse(json.reply || 'No response');
      setQuestion('');
    } catch (err) {
      setAiResponse('Error retrieving response.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B4397" />
        <Text style={{ marginTop: 10 }}>Generating career guidance...</Text>
      </View>
    );
  }

  if (!data || data.error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red', fontWeight: '600', textAlign: 'center' }}>
          🚫 {data?.error || 'Something went wrong.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <ScreenHeader title="Astro Career" navigation={navigation} />
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>💼 AstroCareer Dashboard</Text>
  
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📌 Career Pulse</Text>
          <Text style={styles.highlight}>{data.career_pulse?.title}</Text>
          <Text style={styles.body}>{data.career_pulse?.message}</Text>
          <Text
            style={[
              styles.body,
              {
                fontWeight: '600',
                color: data.zone === 'Red Zone' ? 'red' : 'green',
              },
            ]}
          >
            Zone: {data.zone}
          </Text>
        </View>
  
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🌠 Traits & Role Fit</Text>
          <Text style={styles.body}>
            Strengths: {data.traits?.strengths?.join(', ')}
          </Text>
          <Text style={styles.body}>Workstyle: {data.traits?.workstyle}</Text>
          <Text style={styles.body}>Element: {data.traits?.element}</Text>
          <Text style={styles.body}>
            Suggested Roles: {data.roles?.join(', ')}
          </Text>
        </View>
  
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📆 Dasha Timeline</Text>
          {(data.dasha_timeline || []).map((item, i) => (
            <Text key={i} style={styles.bullet}>
              🗓️ {item}
            </Text>
          ))}
        </View>
  
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🧱 Karmic Blocks</Text>
          {(data.karmic_blocks || []).map((item, i) => (
            <Text key={i} style={styles.bullet}>
              ⚠️ {item}
            </Text>
          ))}
        </View>
  
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🌿 Remedies</Text>
          {(data.remedies || []).map((item, i) => (
            <Text key={i} style={styles.bullet}>
              🕉️ {item}
            </Text>
          ))}
        </View>
  
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🧠 AI Insight</Text>
          <Text style={styles.body}>{data.gpt_summary}</Text>
        </View>
  
        <AskAIBox
          chatKey="ask_ai_career"
          context={{
            topic: 'career',
            zone: data?.zone || '',
            current_dasha: data?.career_pulse?.title || '',
            ascendant: data?.ascendant || '',
            moon_sign: data?.moon_sign || '',
            traits: data?.traits || {},
            roles: data?.roles || [],
            timeline: data?.dasha_timeline || [],
            karmic_blocks: data?.karmic_blocks || [],
            remedies: data?.remedies || [],
          }}
        />
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fefefe', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#4b3b73' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  askCard: { backgroundColor: '#f5f0ff', padding: 16, borderRadius: 12, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 6 },
  highlight: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 4 },
  body: { fontSize: 14, color: '#444', marginBottom: 2 },
  bullet: { fontSize: 14, marginVertical: 2, color: '#555' },
  input: { borderColor: '#ccc', borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 10, backgroundColor: '#fff' },
  askButton: { backgroundColor: '#4b3b73', padding: 10, borderRadius: 8, alignItems: 'center' },
  askText: { color: '#fff', fontWeight: 'bold' },
  aiReply: { marginTop: 10, color: '#2c3e50', fontStyle: 'italic' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});