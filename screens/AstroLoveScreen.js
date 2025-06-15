import React, { useEffect, useState } from 'react';

import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Modal, FlatList, SafeAreaView, Image } from 'react-native';

import LottieView from 'lottie-react-native';
import { Button, Icon } from 'react-native-elements';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { BASE_URL } from "../config/constants";

import { doc, getDoc } from 'firebase/firestore'; // add this at the top

import AskAIBox from '../components/AskAIBox';

import { getFirestore } from 'firebase/firestore';
const db = getFirestore();


const screenWidth = Dimensions.get("window").width;

// const BASE_URL = 'http://192.168.1.13:8080'; // Local or deployed



export default function AstroLoveScreen({ route }) {
  const [data, setData] = useState(null);

  const [connections, setConnections] = useState([]);
  const [partner, setPartner] = useState(null);
  const [someoneNew, setSomeoneNew] = useState(null);
  const [crush, setCrush] = useState(null);
  const [selectingFor, setSelectingFor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 🔁 Load saved AstroCircle connections from AsyncStorage
  useEffect(() => {
    const loadAstroCircle = async () => {
      try {
        const raw = await AsyncStorage.getItem('@astro_circle');
        if (raw) {
          const saved = JSON.parse(raw);
          setConnections(saved);
          console.log('✅ Loaded AstroCircle from AsyncStorage:', saved);
        } else {
          console.warn('⚠️ No AstroCircle found in storage');
        }
      } catch (e) {
        console.warn('❌ Failed to load AstroCircle from storage:', e);
      }
    };
    loadAstroCircle();
  }, []);

  useEffect(() => {
    setData({
      vibe: "Magnetic",
      compatibilityScore: 84,
      partnerName: "Neha",
      romanticWindow: "May 30 – June 4",
      karmicInsight: "You attract deep, fated love stories but must learn emotional independence.",
      rituals: ["Venus Friday Puja", "Wear rose quartz", "Donate white sweets"],
      upcomingEvents: [
        { date: "May 31", label: "High Emotional Sync 🔥" },
        { date: "June 2", label: "Ideal Day for Confession 💌" },
      ]
    });
  }, []);

const fetchRomanticCompatibility = async (partner) => {
  try {
    const idToken = await auth.currentUser.getIdToken();
    const raw = await AsyncStorage.getItem('@daily_energy');
    const stored = raw ? JSON.parse(raw) : {};
    const chart = stored.user_Chart || {};

    const my_name = stored?.name || 'User';
    const my_tob = chart?.tob?.slice?.(11, 16) || '--:--';
    const their_tob = partner?.tob?.slice?.(11, 16) || '--:--';
    const todayStr = new Date().toDateString();

    if (!partner?.dob || !partner?.tob || !partner?.pob) {
      alert("⚠️ Partner's birth details are incomplete. Please update DOB, TOB, and POB.");
      return;
    }

    const prompt = `You are a Vedic astrologer. Today’s date is ${todayStr}. Based on the birth charts and planetary alignments of the two individuals, provide deep romantic and karmic insight.

Return **only a valid JSON object** (no markdown, no explanation) with these fields:

{
  "loveBond": "Short label for the karmic connection (e.g. 'Twin Flames', 'Soul Contracts')",
  "romanticChemistry": 0–100,
  "communicationScore": 0–100,
  "trustScore": 0–100,
  "karmicInsight": "5–10 line spiritual insight or karmic theme in the relationship",
  "romanticWindow": "e.g. June 21 – June 25 (must be a future date window after ${todayStr})",
  "rituals": ["String", "String"],
  "bondPhase": "One-line summary of current bond energy (e.g. 'Healing & Release')",
  "snapshot": "One-line planetary summary (e.g. 'Venus in Gemini, Moon in Leo')",
  "timeline": [
    { "date": "Now", "event": "Current Venus transit influencing trust" },
    { "date": "June 2025", "event": "Emotional clarity improves" },
    { "date": "August 2025", "event": "Venus–Moon Harmony brings intimacy" }
  ]
}`;

    const res = await fetch(`${BASE_URL}/api/ask-ai`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: prompt,
        user_id: auth.currentUser.uid,
        my_dob: chart.dob,
        my_tob,
        my_pob: chart.pob,
        my_name,
        their_dob: partner.dob,
        their_tob,
        their_pob: partner.pob,
        their_name: partner.name,
        context: { topic: 'astro-love' }
      })
    });

    const json = await res.json();
    const cleaned = json.reply?.replace(/```json|```/gi, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn('❌ JSON parsing error:', e.message);
      return;
    }

    const timeline = (parsed.timeline || []).map(e => ({
      date: e.date,
      label: e.label || e.event || 'No description'
    }));

    setData({
      partnerName: partner.name,
      bondType: parsed.loveBond || '—',
      compatibilityScore: parseInt(parsed.romanticChemistry) || 0,
      communicationScore: parseInt(parsed.communicationScore) || 0,
      trustScore: parseInt(parsed.trustScore) || 0,
      karmicInsight: parsed.karmicInsight || '—',
      romanticWindow: parsed.romanticWindow || '—',
      rituals: parsed.rituals || [],
      bondPhase: parsed.bondPhase || '',
      snapshot: parsed.snapshot || '',
      upcomingEvents: timeline
    });

  } catch (e) {
    console.warn('❌ Failed to load romantic compatibility:', e);
    alert("⚠️ Compatibility fetch failed. Please try again.");
  }
};

  

  const openSelector = (role) => {
    setSelectingFor(role);
    setModalVisible(true);
  };

  // const selectPerson = (person) => {
  //   if (selectingFor === 'partner') setPartner(person);
  //   if (selectingFor === 'someoneNew') setSomeoneNew(person);
  //   if (selectingFor === 'crush') setCrush(person);
  //   setModalVisible(false);
  //   fetchRomanticCompatibility(person);
  // };

  const selectPerson = async (person) => {
    try {
      // Fetch full user profile from Firestore
      const docRef = doc(db, 'users', person.uid);
      const docSnap = await getDoc(docRef);
  
      if (!docSnap.exists()) {
        alert("⚠️ Could not load full birth details for this person.");
        return;
      }
  
      const profile = docSnap.data();
  
      // Combine existing person data with Firestore profile
      const fullPerson = {
        ...person,
        dob: profile.dob,
        tob: profile.tob,
        pob: profile.pob
      };
  
      // Set to correct state
      if (selectingFor === 'partner') setPartner(fullPerson);
      if (selectingFor === 'someoneNew') setSomeoneNew(fullPerson);
      if (selectingFor === 'crush') setCrush(fullPerson);
  
      // Close modal
      setModalVisible(false);
  
      // Fetch romantic compatibility
      fetchRomanticCompatibility(fullPerson);
  
    } catch (e) {
      console.warn("❌ Failed to fetch person details:", e);
      alert("⚠️ Error loading partner data.");
    }
  };

  // if (!data) return null;

  if (!data && !partner) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#888' }}>💗 Select someone from your AstroCircle to explore love compatibility.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>💖 Today’s Love Vibe: <Text style={styles.highlight}>{data.vibe}</Text></Text>
      <LottieView source={require('../assets/animations/love-vibe.json')} autoPlay loop style={styles.lottie} />

      {partner && data && (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>With {data.partnerName}</Text>
        <Text style={styles.cardScore}>Compatibility: {data.compatibilityScore ?? '--'}%</Text>
        <Text style={styles.cardText}>{data.bondType}</Text>
        <TouchableOpacity style={styles.aiButton} onPress={fetchRomanticCompatibility}>
          <Text style={styles.aiButtonText}>💬 Ask AI about this bond</Text>
        </TouchableOpacity>
      </View>
    )}


      {/* <View style={styles.card}>
      <Text style={styles.cardTitle}>With {data.partnerName || 'Partner' }</Text>
      <Text style={styles.cardScore}>Compatibility: {data.compatibilityScore ?? '--'}%</Text>
      <Text style={styles.cardText}>{data.bondType}</Text>
        <TouchableOpacity style={styles.aiButton}>
          <Text style={styles.aiButtonText}>💬 Ask AI about this bond</Text>
        </TouchableOpacity>
      </View> */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Relationship Compatibility</Text>

        <TouchableOpacity style={styles.scanOption} onPress={() => openSelector('partner')}>
          <Text style={styles.scanOptionText}>💑 Scan My Current Partner</Text>
        </TouchableOpacity>
        {partner && (
      <View style={styles.compatibilityBox}>
      <Text style={styles.cardText}>Name: <Text style={styles.highlight}>{data.partnerName}</Text></Text>
      <Text style={styles.cardText}>Love: {data.compatibilityScore || '--'}% 💓</Text>
      <Text style={styles.cardText}>💬 Communication: {data.communicationScore || '--'}%</Text>
      <Text style={styles.cardText}>🤝 Trust: {data.trustScore || '--'}%</Text>
      <Text style={styles.cardText}>🧘 Karmic Insight: {data.karmicInsight}</Text>
      </View>
  
        )}

        <TouchableOpacity style={styles.scanOption} onPress={() => openSelector('someoneNew')}>
          <Text style={styles.scanOptionText}>💘 Check with Someone New</Text>
        </TouchableOpacity>
        {someoneNew && (
          <View style={styles.compatibilityBox}>
            <Text style={styles.cardText}>Someone New: <Text style={styles.highlight}>{someoneNew.name}</Text></Text>
            <TouchableOpacity onPress={() => setSomeoneNew(null)}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.scanOption} onPress={() => openSelector('crush')}>
          <Text style={styles.scanOptionText}>📚 Add Crush / Ex</Text>
        </TouchableOpacity>
        {crush && (
          <View style={styles.compatibilityBox}>
            <Text style={styles.cardText}>Crush / Ex: <Text style={styles.highlight}>{crush.name}</Text></Text>
            <TouchableOpacity onPress={() => setCrush(null)}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

  
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Romantic Window</Text>
        {data?.romanticWindow && (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Romantic Window</Text>
        <Text style={styles.cardText}>Next peak period: <Text style={styles.highlight}>{data.romanticWindow}</Text></Text>
    {data.upcomingEvents.map((e, idx) => (
      <Text key={idx} style={styles.cardText}>📅 {e.date}: {e.label}</Text>
    ))}
  </View>
)}

        {data.upcomingEvents.map((e, idx) => (
          <Text key={idx} style={styles.cardText}>📅 {e.date}: {e.label}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Karmic Insight</Text>
        <Text style={styles.cardText}>{data.karmicInsight}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rituals for Love Boost</Text>
        {data.rituals.map((ritual, idx) => (
          <Text key={idx} style={styles.cardText}>🌿 {ritual}</Text>
        ))}
      </View>

      <TouchableOpacity style={styles.askAI}>
        <Text style={styles.askAIText}>💗 Confused in love? Ask AstroAI →</Text>
      </TouchableOpacity>

      <View style={[styles.card, { marginTop: 24 }]}>
        <Text style={styles.cardTitle}>🔗 Bond Timeline</Text>
        {data.bondPhase && (
  <Text style={styles.cardText}>
    💞 Current Bond Phase: <Text style={styles.highlight}>{data.bondPhase}</Text>
  </Text>
)}
        <Text style={styles.cardText}>🌌 Planetary Snapshot: Venus in Pisces, Moon in Cancer</Text>

        <View style={styles.timelineItem}>
          <Text style={styles.timelineDate}>Now</Text>
          <Text style={styles.timelineEvent}>💫 Current Dasha: Venus → Ketu</Text>
        </View>

        <View style={styles.timelineItem}>
          <Text style={styles.timelineDate}>June 2025</Text>
          <Text style={styles.timelineEvent}>⚠️ Emotional Disconnect Phase (Moon afflicted)</Text>
        </View>

        <View style={styles.timelineItem}>
          <Text style={styles.timelineDate}>Oct 2025</Text>
          <Text style={styles.timelineEvent}>💖 Strong Reunion Energy (Venus–Moon harmony)</Text>
        </View>

        <TouchableOpacity style={styles.aiButton}>
          <Text style={styles.aiButtonText}>📜 Ask AI for bond future</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Choose from your AstroCircle</Text>
            <FlatList
              data={connections}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.connectionCard} onPress={() => selectPerson(item)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.avatarPlaceholder}>
                      {item.photo ? (
                        <Image source={{ uri: item.photo }} style={styles.avatar} />
                      ) : (
                        <Text style={{ fontSize: 20 }}>👤</Text>
                      )}
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.connectionName}>{item.name}</Text>
                      <Text style={styles.connectionRelation}>{item.relation}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ marginTop: 20 }}>⚠️ No saved AstroCircle connections found.</Text>}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>❌ Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  highlight: {
    color: '#e91e63',
  },
  lottie: {
    width: screenWidth - 60,
    height: 160,
    alignSelf: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fbe9e7',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  cardScore: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d81b60',
    marginVertical: 8,
  },
  aiButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#e91e63',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  aiButtonText: {
    color: '#e91e63',
    fontWeight: 'bold',
  },
  askAI: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8bbd0',
    borderRadius: 12,
    alignItems: 'center',
  },
  askAIText: {
    color: '#880e4f',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scanOption: {
    padding: 10,
    marginTop: 8,
    backgroundColor: '#fff',
    borderColor: '#ec407a',
    borderWidth: 1,
    borderRadius: 10,
  },
  scanOptionText: {
    color: '#d81b60',
    fontWeight: '600',
    fontSize: 15,
  },
  compatibilityBox: {
    backgroundColor: '#fce4ec',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  timelineItem: {
    marginTop: 10,
    paddingVertical: 6,
    borderBottomColor: '#f8bbd0',
    borderBottomWidth: 1,
  },
  timelineDate: {
    fontWeight: 'bold',
    color: '#c2185b',
  },
  timelineEvent: {
    fontSize: 14,
    lineHeight: 20,
  },
  changeLink: {
    color: '#007AFF',
    fontSize: 14,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  connectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderColor: '#f8bbd0',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  connectionRelation: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#e91e63',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
  
});