import { BASE_URL } from "../config/constants";
// HourlyRiskMeterScreen.js – Updated to parse full API response
import AskAIBox from '../components/AskAIBox'; // adjust path as needed


import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Share
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

import { KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';


// const BASE_URL = 'http://192.168.1.13:8080';
const screenWidth = Dimensions.get('window').width;

export default function HourlyRiskMeterScreen() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [selectedHourIndex, setSelectedHourIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const viewShotRef = useRef();
  const getMoodFromScore = (score) => {
    if (score < 30) return { mood: "🧘 Calm", color: "#d9fdd3" };
    if (score < 50) return { mood: "😌 Steady", color: "#fff5cc" };
    if (score < 65) return { mood: "😐 Mixed", color: "#ffecc7" };
    if (score < 80) return { mood: "😟 Tense", color: "#ffd6cc" };
    return { mood: "🔥 Volatile", color: "#ffc9c9" };
  };
  

  useEffect(() => {
    const fetchRiskFromApi = async () => {
      try {
        const userCred = await signInWithEmailAndPassword(auth, 'info@kundlisutra.com', 'test123');
        const idToken = await userCred.user.getIdToken();

        const raw = await AsyncStorage.getItem('@daily_energy');
        const stored = raw ? JSON.parse(raw) : {};
        const chart = stored.user_Chart || {};

        console.log('📤 getting chart from asyncstorage:', chart);

        let tob = chart?.tob || '';
        if (tob.length > 5) {
          tob = tob.slice(11, 16);
        }

        const payload = {
          user_id: stored?.uid,
          dob: chart?.dob?.slice?.(0, 10),
          tob: tob,
          pob: chart?.pob || 'Kanpur, UP, India',
          name: stored?.name || 'User'
        };

        console.log('📤 Sending payload to /api/hourly-risk:', payload);

        if (!payload.dob || !payload.tob || !payload.pob) {
          console.warn('🚫 Missing data for /hourly-risk:', payload);
          return;
        }

        const res = await fetch(`${BASE_URL}/api/hourly-risk`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        console.log('🛰️ API hourly-risk response:', json);

        if (json?.hourly_data) {
          const updated = { ...stored, hourly_risk: json.hourly_data };
          await AsyncStorage.setItem('@daily_energy', JSON.stringify(updated));

          setData(json.hourly_data); // ✅ set graph data
          setMeta({
            moon_sign: json.moon_sign,
            ascendant: json.ascendant,
            mahadasha: json.mahadasha,
            antardasha: json.antardasha,
            sookshma: json.sookshma,
            summary: json.summary
          });
        }
      } catch (e) {
        console.error('❌ Failed to fetch /api/hourly-risk:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskFromApi();
  }, []);

  const getRiskColor = (score) => {
    if (score >= 75) return '#ffe5e5';
    if (score >= 50) return '#fff5cc';
    return '#e7fff1';
  };

  const shareShot = async () => {
    const uri = await viewShotRef.current.capture();
    await Share.share({
      message: `🌌 My hourly risk energy for today`,
      url: uri
    });
  };

  if (loading || !data.length)
    return <ActivityIndicator style={{ marginTop: 100 }} size="large" color="#6e00ff" />;

  const labels = data.map((item, index) => index % 3 === 0 ? item.hour : '');
  const values = data.map(item => item.score);
  const selectedData = selectedHourIndex !== null ? data[selectedHourIndex] : null;
  const moodInfo = selectedData ? getMoodFromScore(selectedData.score) : null;



  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80} // Adjust if you have a custom header
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }} // enough space for AskAIBox
        enableOnAndroid
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </Text>
  
        <View style={styles.contextRow}>
          <Text style={styles.contextText}>🌙 Moon Sign: {meta.moon_sign || '—'}</Text>
          <Text style={styles.contextText}>⬆️ Ascendant: {meta.ascendant || '—'}</Text>
          <Text style={styles.contextText}>🔱 Dasha: {meta.mahadasha || '—'} / {meta.antardasha || '—'}</Text>
        </View>
  
        <LineChart
          data={{ labels, datasets: [{ data: values }] }}
          width={screenWidth - 20}
          height={250}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#f3f3f3',
            backgroundGradientTo: '#f3f3f3',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(110, 0, 255, ${opacity})`,
            labelColor: () => '#333',
          }}
          bezier
          withInnerLines={false}
          yAxisSuffix=""
          style={{ marginVertical: 8, borderRadius: 12 }}
          onDataPointClick={({ index }) => {
            if (data[index]) setSelectedHourIndex(index);
          }}
        />
  
        {selectedData && (
          <View style={[styles.insightCard, { backgroundColor: getRiskColor(selectedData.score) }]}>
            <Text style={styles.insightTitle}>🕐 Hour: {selectedData.hour}</Text>
            <Text style={styles.insightScore}>Risk Score: {selectedData.score}</Text>
            <Text style={{ marginTop: 4 }}>🌈 Mood: {moodInfo.mood}</Text>
            <Text style={{ marginTop: 4 }}>🔍 {selectedData.reason}</Text>
            <Text style={{ marginTop: 4 }}>🪬 {selectedData.remedy || '—'}</Text>
          </View>
        )}
  
        <View style={styles.summaryStrip}>
          <Text style={styles.summaryText}>🔎 {meta.summary}</Text>
        </View>
  
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={{ height: 1 }} />
  
        {/* 🔮 Ask AI Chat */}
        <View style={{ marginBottom: 20 }}>
          <AskAIBox chatKey="ask_ai_risk" selectedData={selectedData} />
        </View>
  
        <TouchableOpacity onPress={shareShot} style={styles.shareBtn}>
          <Text style={styles.shareText}>📤 Share My Risk Map</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
  
  
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingHorizontal: 10,
    backgroundColor: '#fff'
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6e00ff',
    fontWeight: '600',
    marginBottom: 10
  },
  contextRow: {
    backgroundColor: '#e6f0ff',
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e0d6ff'
  },
  contextText: {
    fontSize: 15,
    color: '#333'
  },
  insightCard: {
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  insightTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
    color: '#111'
  },
  insightScore: {
    fontSize: 16,
    color: '#6e00ff'
  },
  summaryStrip: {
    backgroundColor: '#e7f0fa',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10
  },
  summaryText: {
    fontSize: 15,
    textAlign: 'center'
  },
  shareBtn: {
    marginTop: 10,
    backgroundColor: '#6e00ff',
    padding: 10,
    borderRadius: 8
  },
  shareText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600'
  }
});
