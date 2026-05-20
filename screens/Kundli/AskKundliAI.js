import React, { useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BASE_URL } from '../../config/constants'; // Adjust the import path as needed
import { auth } from '../../config/firebase';

const TOPICS = [
  { label: 'General', value: 'general' },
  { label: 'Money', value: 'astro-money' },
  { label: 'Love', value: 'astro-love' },
  { label: 'Bond', value: 'astro-bond' },
];

export default function AskAI() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi there! Ask me anything about your birth chart. 🌌' },
  ]);
  const [input, setInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [typingDots, setTypingDots] = useState('');
  const scrollRef = useRef();





  const handleSend = async () => {
    const trimmed = input.trim();
    if (trimmed === '') return;

    const userMessage = { from: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const loaderMessage = { from: 'bot', text: '🤖 Kundli AI is thinking' };
    setMessages((prev) => [...prev, loaderMessage]);

    let dotCount = 0;
    const interval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      setTypingDots('...'.repeat(dotCount));
    }, 500);

    const greetings = ['hi', 'hii', 'hello', 'hey', 'hey there', 'namaste', 'yo', 'radhe radhe', 'Radhe'];
    if (greetings.includes(trimmed.toLowerCase())) {
      clearInterval(interval);
      setTypingDots('');
      setMessages((prev) => {
        const withoutLoader = prev.slice(0, -1);
        return [
          ...withoutLoader,
          {
            from: 'bot',
            text:
              '🙏 Namaste! I am here to guide you through your cosmic journey. 🌌✨\n\nYou can ask about love, money, career, or anything from your birth chart!',
          },
        ];
      });
      return;
    }

    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      const profile = JSON.parse(profileStr || '{}');

      const formatDate = (iso) => iso?.split('T')[0] || '';
      const formatTime = (iso) => {
        if (!iso) return '';
        const date = new Date(iso);
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      // Validate required profile fields
      if (!profile.dob || !profile.tob || !profile.pob) {
        throw new Error('Incomplete birth profile. Please update your birth details.');
      }

      const birth_time = profile.tob.split(':').map(Number); // converts ["23", "45"] → [23, 45]
      // console.log("TOB:", tob);
      console.log("birth_time:", birth_time);

      const hour = birth_time[0] || 0;
      const minute = birth_time[1] || 0;
      console.log("Hour:", hour, "Minute:", minute);

      const payload = {
        user_id: profile.email || 'anonymous',
        question: trimmed,
        context: { topic: selectedTopic },
        date: new Date().toISOString().split('T')[0],
        my_dob: formatDate(profile.dob),
        my_tob: profile.tob,
        my_pob: profile.pob,
        my_name: profile.name || 'User',
        // their_dob: '1996-04-22',
        // their_tob: '09:00',
        // their_pob: 'Mumbai',
        // their_name: 'Priyansh Mehta',
      };
      console.log("payload_ASK_AI", payload);


      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : null;
      const res = await fetch(`${BASE_URL}/api/ask-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      const parsed = JSON.parse(json.reply);
      console.log("parsed_data", parsed);

      let botText = '';

      switch (selectedTopic) {
        case 'astro-money':
          if (parsed?.prediction) {
            botText += `📊 Prediction:\n${parsed.prediction}\n\n`;
          }
          if (parsed?.riskPeriod) {
            botText += `⚠️ Risk Period:\n${parsed.riskPeriod}\n\n`;
          }
          if (parsed?.dasha) {
            botText += `🔮 Dasha: ${parsed.dasha}\n`;
          }
          if (parsed?.luckyGemstone) {
            botText += `💎 Lucky Gemstone: ${parsed.luckyGemstone}\n`;
          }
          if (parsed?.mantra) {
            botText += `🕉️ Mantra: ${parsed.mantra}\n\n`;
          }
          if (Array.isArray(parsed?.recommendedRituals) && parsed.recommendedRituals.length > 0) {
            botText += `🙏 Recommended Rituals:\n${parsed.recommendedRituals.join('\n')}\n`;
          }

          for (const [key, value] of Object.entries(parsed)) {
            if (
              ['prediction', 'riskPeriod', 'dasha', 'luckyGemstone', 'mantra', 'recommendedRituals'].includes(key) ||
              !value
            ) continue;

            const sectionTitle = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

            if (typeof value === 'object') {
              botText += `\n\n🔹 ${sectionTitle}:\n`;

              for (const [subKey, subVal] of Object.entries(value)) {
                if (!subVal) continue;

                const subTitle = subKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

                if (Array.isArray(subVal)) {
                  if (subVal.length > 0) {
                    botText += `\n🔸 ${subTitle}:\n${subVal.map((item) => `• ${item}`).join('\n')}`;
                  }
                } else if (typeof subVal === 'object') {
                  const nestedList = Object.entries(subVal)
                    .map(([k, v]) => `• ${k.replace(/_/g, ' ')}: ${v}`)
                    .join('\n');
                  if (nestedList.trim()) {
                    botText += `\n🔸 ${subTitle}:\n${nestedList}`;
                  }
                } else {
                  botText += `\n🔸 ${subTitle}:\n${subVal}`;
                }
              }
            }
          }
          break;

        case 'astro-love':
          if (parsed?.loveBond) {
            botText += `💞 Love Bond:\n${parsed.loveBond}\n\n`;
          }
          if (parsed?.romanticChemistry) {
            botText += `💓 Romantic Chemistry: ${parsed.romanticChemistry}%\n\n`;
          }
          if (Array.isArray(parsed?.strengths) && parsed.strengths.length > 0) {
            botText += `✅ Strengths:\n${parsed.strengths.join('\n')}\n\n`;
          }
          if (Array.isArray(parsed?.weaknesses) && parsed.weaknesses.length > 0) {
            botText += `⚠️ Weaknesses:\n${parsed.weaknesses.join('\n')}\n`;
          }

          for (const [key, value] of Object.entries(parsed)) {
            if (
              ['loveBond', 'romanticChemistry', 'strengths', 'weaknesses'].includes(key) ||
              !value
            ) continue;

            const sectionTitle = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

            if (typeof value === 'object') {
              botText += `\n\n🔹 ${sectionTitle}:\n`;

              for (const [subKey, subVal] of Object.entries(value)) {
                if (!subVal) continue;

                const subTitle = subKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

                if (Array.isArray(subVal)) {
                  if (subVal.length > 0) {
                    botText += `\n🔸 ${subTitle}:\n${subVal.map((item) => `• ${item}`).join('\n')}`;
                  }
                } else if (typeof subVal === 'object') {
                  const nestedList = Object.entries(subVal)
                    .map(([k, v]) => `• ${k.replace(/_/g, ' ')}: ${v}`)
                    .join('\n');
                  if (nestedList.trim()) {
                    botText += `\n🔸 ${subTitle}:\n${nestedList}`;
                  }
                } else {
                  botText += `\n🔸 ${subTitle}:\n${subVal}`;
                }
              }
            }
          }
          break;

        case 'astro-bond':
          if (parsed?.career_pulse?.insights) {
            botText += `🧠 Career Insights:\n${parsed.career_pulse.insights}\n\n`;
          }
          if (parsed?.career_pulse?.advice) {
            botText += `📌 Advice:\n${parsed.career_pulse.advice}\n`;
          }

          for (const [key, value] of Object.entries(parsed)) {
            if (key === 'career_pulse' || !value) continue;

            const sectionTitle = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

            if (typeof value === 'object') {
              botText += `\n\n🔹 ${sectionTitle}:\n`;

              for (const [subKey, subVal] of Object.entries(value)) {
                if (!subVal) continue;

                const subTitle = subKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

                if (Array.isArray(subVal)) {
                  if (subVal.length > 0) {
                    botText += `\n🔸 ${subTitle}:\n${subVal.map((item) => `• ${item}`).join('\n')}`;
                  }
                } else if (typeof subVal === 'object') {
                  const nestedList = Object.entries(subVal)
                    .map(([k, v]) => `• ${k.replace(/_/g, ' ')}: ${v}`)
                    .join('\n');
                  if (nestedList.trim()) {
                    botText += `\n🔸 ${subTitle}:\n${nestedList}`;
                  }
                } else {
                  botText += `\n🔸 ${subTitle}:\n${subVal}`;
                }
              }
            }
          }
          break;

        case 'general':
        default:
          if (parsed && typeof parsed === 'object') {
            for (const [sectionKey, sectionValue] of Object.entries(parsed)) {
              if (!sectionValue) continue;

              const sectionTitle = sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
              botText += `🔹 ${sectionTitle}:\n`;

              for (const [key, value] of Object.entries(sectionValue)) {
                if (value === undefined || value === null || value === '') continue;

                const keyTitle = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

                if (Array.isArray(value)) {
                  if (value.length === 0) continue;
                  const list = value.map((item) => `• ${item}`).join('\n');
                  botText += `\n🔸 ${keyTitle}:\n${list}\n`;
                } else if (typeof value === 'object') {
                  const nestedList = Object.entries(value)
                    .map(([subKey, subVal]) => `• ${subKey.replace(/_/g, ' ')}: ${subVal}`)
                    .join('\n');
                  if (nestedList.trim() !== '') {
                    botText += `\n🔸 ${keyTitle}:\n${nestedList}\n`;
                  }
                } else {
                  botText += `\n🔸 ${keyTitle}:\n${value}\n`;
                }
              }

              botText += '\n';
            }
          }

          if (!botText.trim()) {
            botText = 'No detailed insights available for this topic.';
          }
          break;
      }



      clearInterval(interval);
      setTypingDots('');
      setMessages((prev) => {
        const withoutLoader = prev.slice(0, -1);
        return [...withoutLoader, { from: 'bot', text: botText }];
      });

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Ask AI error:', err);
      clearInterval(interval);
      setTypingDots('');
      setMessages((prev) => {
        const withoutLoader = prev.slice(0, -1);
        return [...withoutLoader, { from: 'bot', text: err.message || 'Sorry, something went wrong. Please try again.' }];
      });
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            scrollEventThrottle={16}
            decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.98}
          >
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.messageBubble,
                  msg.from === 'user' ? styles.userBubble : styles.botBubble,
                ]}
              >
                {msg.text.includes('Kundli AI is thinking') ? (
                  <Text style={styles.messageText}>
                    {msg.text}
                    {typingDots}
                  </Text>
                ) : (
                  <Text style={styles.messageText}>{msg.text}</Text>
                )}
              </View>
            ))}
          </ScrollView>
         




          <View style={styles.topicBar}>
            {TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.value}
                style={[
                  styles.topicButton,
                  selectedTopic === topic.value && styles.topicButtonSelected,
                ]}
                onPress={() => setSelectedTopic(topic.value)}
              >
                <Text
                  style={[
                    styles.topicText,
                    selectedTopic === topic.value && styles.topicTextSelected,
                  ]}
                >
                  {topic.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Type your question..."
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  chatArea: { padding: 16, paddingBottom: 20 },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
    maxWidth: '80%',
  },
  userBubble: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end' },
  botBubble: { backgroundColor: '#E2E2E2', alignSelf: 'flex-start' },
  messageText: { fontSize: 16 },
  inputArea: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f1f1f1',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  topicButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  topicButtonSelected: {
    backgroundColor: '#4A90E2',
  },
  topicText: {
    fontSize: 14,
    color: '#333',
  },
  topicTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});