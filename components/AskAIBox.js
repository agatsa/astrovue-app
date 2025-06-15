import React, { useState, useRef, useEffect } from 'react';
import { BASE_URL } from "../config/constants";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AskAIBox({ chatKey = "ask_ai", selectedData = null, fullRiskData = null, extraContext = {} }) {


  const [question, setQuestion] = useState('');
  const [aiResponse, setAIResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [contextData, setContextData] = useState({});

  const scrollRef = useRef();
  useEffect(() => {
    const loadContextAndHistory = async () => {
      try {
        // 🪐 Load Astro context
        const energyStr = await AsyncStorage.getItem('@daily_energy');
        const profileStr = await AsyncStorage.getItem('userProfile');
        const energy = JSON.parse(energyStr || '{}');
        const profile = JSON.parse(profileStr || '{}');
  
        setUserProfile(profile);
  
        const topPlanet = Object.entries(energy?.scores || {}).sort(
          ([, a], [, b]) => b.score - a.score
        )?.[0]?.[0];
  
        setContextData({
          zone: energy?.zone,
          moon_sign: energy?.moon_sign,
          top_planet: topPlanet,
          nakshatra: energy?.user_Chart?.nakshatra,
          dasha: `${energy?.mahadasha} > ${energy?.antardasha}`,
          ...extraContext, // 👈 merged in
        });
        
  
        // 💬 Load chat history (important)
        const savedHistory = await AsyncStorage.getItem(`@${chatKey}_history`);
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          setHistory(parsed);
          console.log('✅ Restored chat history:', parsed);
        } else {
          console.log('ℹ️ No previous chat history found');
        }
  
      } catch (e) {
        console.warn('⚠️ Failed to load Astro context or chat history in AskAIBox:', e);
      }
    };
  
    loadContextAndHistory();
  }, []);
  

  const handleAsk = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setAIResponse('');
    scrollToBottom();

    try {
      const user = getAuth().currentUser;
      const idToken = await user.getIdToken();

      const dobDate = new Date(userProfile?.dob).toISOString().split("T")[0];
      const tobString = new Date(userProfile?.tob).toISOString().split("T")[1].slice(0, 5); // HH:mm

      const payload = {
        user_id: user.uid,
        my_name: userProfile?.name,
        my_dob: dobDate,
        my_tob: tobString,
        my_pob: userProfile?.pob,
        question,
        context: {
          topic: "ask-ai",
          ...contextData,
          ...(selectedData && {
            selected_hour: selectedData.hour,
            selected_score: selectedData.score,
            selected_reason: selectedData.reason,
            context_hint: `The user is asking about risk at ${selectedData.hour} with score ${selectedData.score}`
          })
        }
        
        
      };

      const response = await fetch(`${BASE_URL}/api/ask-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      let answer = result?.reply || '⚠️ No reply received.';

      // ✨ Clean unwanted signature endings like "Rahul – Your Vedic Astrologer"
      answer = answer.replace(
        /(Regards,|Warm regards,|Best wishes,)?\s*(Rahul|[Yy]our\s+[Nn]ame)?\s*–?\s*Your Vedic Astrologer\.?/gi,
        'AstroAI – Your Vedic Astrologer'
      );
      const now = new Date().toISOString();
      const entry = { question, answer, timestamp: now };
      setAIResponse(answer);
     
      setHistory((prev) => {
        const updated = [...prev, entry];
        AsyncStorage.setItem(`@${chatKey}_history`, JSON.stringify(updated));
        return updated;
      });
      setAIResponse(''); // 🧹 clear standalone reply box
      setQuestion('');
      scrollToBottom();
    } catch (err) {
      console.error('❌ Ask AI failed:', err.message || err);
      setAIResponse('⚠️ Failed to get a reply. Try again.');
    }

    setIsLoading(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef?.current?.scrollToEnd({ animated: true });
    }, 500);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {history.map((entry, index) => (
          <View key={index} style={styles.qaBlock}>
            <Text style={styles.q}>Q: {entry.question}</Text>
            <Text style={styles.a}>A: {entry.answer}</Text>
          </View>
        ))}
      
      </ScrollView>
  
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask your question..."
          value={question}
          onChangeText={setQuestion}
          onSubmitEditing={handleAsk}
        />
              <TouchableOpacity
        onPress={() => {
          setHistory([]);
          AsyncStorage.removeItem(`@${chatKey}_history`);
        }}
        style={{ alignSelf: 'flex-end', marginBottom: 8 }}
      >
        <Text style={{ color: 'red', fontSize: 12 }}>🗑️ Clear Chat</Text>
      </TouchableOpacity>

        <TouchableOpacity onPress={handleAsk} style={styles.sendBtn}>
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
  
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    maxHeight: 350,
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  qaBlock: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  q: {
    fontWeight: '600',
    color: '#222',
  },
  a: {
    color: '#444',
    marginTop: 4,
  },
  responseBox: {
    backgroundColor: '#fff9e6',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  sendBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 25,
    padding: 10,
    marginLeft: 8,
  },
});
