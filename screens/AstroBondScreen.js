import { BASE_URL } from "../config/constants";
import React, { useEffect, useState } from 'react';


import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';

import { populateAstroBondFromDailyEnergy } from './populateAstroBondFromDailyEnergy';

//  const BASE_URL = 'https://kundli-auth-api1-731436072433.asia-south1.run.app';

//const BASE_URL = 'http://192.168.1.13:8080';




function parseBondReply(replyText) {
  const sections = {
    bondType: '',
    bondStrength: '',
    planetSummary: '',
    dashaInfo: '',
    chakraImpact: '',
    transitNote: '',
    karmicInsight: '',
    remedy: '',
    timelineText: ''
  };

  const pattern = /(\d+)\.\s+(.*?):\s*([\s\S]*?)(?=\n\d+\.\s+|$)/g;
  let match;
  while ((match = pattern.exec(replyText)) !== null) {
    const [, , label, content] = match;
    const trimmed = label.trim().toLowerCase();
    if (trimmed.includes('bond type')) sections.bondType = content.trim();
    else if (trimmed.includes('bond strength')) sections.bondStrength = content.trim();
    else if (trimmed.includes('planetary influence')) sections.planetSummary = content.trim();
    else if (trimmed.includes('dasha overlay')) sections.dashaInfo = content.trim();
    else if (trimmed.includes('chakra')) sections.chakraImpact = content.trim();
    else if (trimmed.includes('transit')) sections.transitNote = content.trim();
    else if (trimmed.includes('insight')) sections.karmicInsight = content.trim();
    else if (trimmed.includes('remedy')) sections.remedy = content.trim();
    else if (trimmed.includes('timeline')) sections.timelineText = content.trim();
  }

  return sections;
}

function parseKarmicGPTReply(text) {
  const fields = {
    bondType: '',
    bondStrength: '',
    planetSummary: '',
    dashaInfo: '',
    chakraImpact: '',
    transitNote: '',
    karmicInsight: '',
    remedy: '',
    timelineText: ''
  };

  const pattern = /(\d+)\.\s+(.*?)\:\s*([\s\S]*?)(?=\n\d+\.\s|$)/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const [, num, label, content] = match;
    const lower = label.toLowerCase();

    if (lower.includes('bond type')) fields.bondType = content.trim();
    else if (lower.includes('bond strength')) fields.bondStrength = content.replace('%', '').trim();
    else if (lower.includes('planetary influence')) fields.planetSummary = content.trim();
    else if (lower.includes('dasha')) fields.dashaInfo = content.trim();
    else if (lower.includes('chakra')) fields.chakraImpact = content.trim();
    else if (lower.includes('transit')) fields.transitNote = content.trim();
    else if (lower.includes('insight')) fields.karmicInsight = content.trim();
    else if (lower.includes('remedy')) fields.remedy = content.trim();
    else if (lower.includes('timeline')) fields.timelineText = content.trim();
  }

  return fields;
}



export default function AstroBondScreen({ route, navigation }) {
  const { personId } = route.params || {};
  const [person, setPerson] = useState(null);
  const [bondStrength, setBondStrength] = useState("");
  const [planetSummary, setPlanetSummary] = useState("");
  const [dashaInfo, setDashaInfo] = useState("");
  const [bondType, setBondType] = useState("");
  const [chakraImpact, setChakraImpact] = useState("");
  const [transitNote, setTransitNote] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [remedy, setRemedy] = useState("");
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [myDailyEnergy, setMyDailyEnergy] = useState(null);
  const [karmicInsight, setKarmicInsight] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [teaser, setTeaser] = useState('');
  const [ctaText, setCtaText] = useState('Unlock the unseen thread – 13 Dharma Coins');
  const [personalityUnlocked, setPersonalityUnlocked] = useState(false);
  const [personalitySnapshot, setPersonalitySnapshot] = useState('');
  const [emotionalTriggers, setEmotionalTriggers] = useState('');
  const [approachAdvice, setApproachAdvice] = useState('');
  const [personalityLoading, setPersonalityLoading] = useState(false);
  


  const loadDailyEnergy = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@daily_energy');
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue);
        console.log('🔮 Loaded myDailyEnergy in AstroBond:', parsed);
        return parsed;
      } else {
        console.log('⚠️ No dailyEnergy found in AsyncStorage (AstroBond)');
        return null;
      }
    } catch (e) {
      console.error('❌ Error loading dailyEnergy in AstroBond:', e);
      return null;
    }
  };

  useEffect(() => {
    if (!personId) return;


    const loadBondEnergy = async () => {
      const myEnergy = await loadDailyEnergy();
      setMyDailyEnergy(myEnergy);
      if (!myEnergy) {
        console.warn("⚠️ myDailyEnergy is null, aborting bond analysis.");
        return;
      }

      try {
        const token = await getAuth().currentUser.getIdToken();

        const myUid = getAuth().currentUser?.uid;

        console.log('🔮 Loaded myUid in AstroBond:', myUid);
    
        const myDOB = myEnergy?.user_Chart?.dob;
        const myTOB = myEnergy?.user_Chart?.tob;
        const myPOB = myEnergy?.user_Chart?.pob;
        const myName = myEnergy?.user_Chart?.name || "You";

        if (!myDOB || !myTOB || !myPOB) {
          console.warn("⚠️ Missing myDOB/myTOB/myPOB, aborting.");
          return;
        }

        const profileRes = await fetch(`${BASE_URL}/api/get-connected-user-profile`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ target_uid: personId })
        });

        const profileData = await profileRes.json();
        console.log("✅ Connected Profile:", profileData);

        if (!profileData?.dob || !profileData?.tob || !profileData?.pob) {
          console.warn("⚠️ Missing DOB/TOB/POB for connected user");
          return;
        }

        const chartRes = await fetch(`${BASE_URL}/api/get-user-chart-direct`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uid: personId,
            name: profileData.name,
            dob: profileData.dob,
            tob: profileData.tob,
            pob: profileData.pob
          })
        });

        const chartData = await chartRes.json();
        console.log("🔮 Connected User Chart:", chartData);
        console.log("🧮 Their Dasha:", chartData.mahadasha, ">", chartData.antardasha);

        // const contextPayload = {
        //   myDasha: `${myEnergy.mahadasha} > ${myEnergy.antardasha}`,
        //   theirDasha: `${chartData.mahadasha} > ${chartData.antardasha}`,
        //   myMoon: myEnergy.moon_sign,
        //   theirMoon: chartData.moon_sign
        // };

       
        // const gptResponse = await fetch(`${BASE_URL}/api/ask-ai`, {
        //   method: 'POST',
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({
        //     user_id: personId,  // ✅ Required!
        //     question: "Generate a planetary insight, chakra impact, and remedy for a bond based on this context",
        //     dob: myDOB,    // ✅ Required (for chart)
        //     tob: myTOB,
        //     pob: myPOB,
        //     name: myName,
        //     context: contextPayload
        //   })
        // });
        


        // const gptData = await gptResponse.json();
        // console.log("🧿 gptResponse GPT Reply:", gptData);

       // const token1 = await firebase.auth().currentUser.getIdToken(true);

       const payload = {
        user_id: myUid,
        target_uid: personId,
        my_dob: myDOB,
        my_tob: myTOB,
        my_pob: myPOB,
        my_name: myName,
        their_dob: profileData.dob,
        their_tob: profileData.tob,
        their_pob: profileData.pob,
        their_name: profileData.name,
        date: new Date().toISOString().slice(0, 10),
        question: "Generate a full karmic bond report with bond type, dasha overlay, chakra impact, remedy, and insight.",
        context: {
          topic: "astro-bond"
        }
      };
      
      
      console.log("📤 ask-ai payload", payload);
      

        const karmicResponse = await fetch(`${BASE_URL}/api/ask-ai`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,  // ✅ MUST include this
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        const karmicData = await karmicResponse.json();
        console.log("🧿 karmicInsight Full Response:", karmicData);
        
        if (karmicData.error) {
          console.error("Karmic Insight Error:", karmicData.error);
          setKarmicInsight(`Error: ${karmicData.error}`);
        } else {
          const parsed = parseKarmicGPTReply(karmicData.reply || '');

          setBondType(parsed.bondType);
          setBondStrength(parseFloat(parsed.bondStrength) || 75);
          setPlanetSummary(parsed.planetSummary);
          setDashaInfo(parsed.dashaInfo);
          setChakraImpact(parsed.chakraImpact);
          setTransitNote(parsed.transitNote);
          setKarmicInsight(parsed.karmicInsight);
          setRemedy(parsed.remedy);
          
          // timeline parsing
          if (parsed.timelineText) {
            const timelineArray = parsed.timelineText
              .split(/[\n•🔸]+/)
              .map(line => line.trim())
              .filter(Boolean)
              .map(line => {
                const [phase, ...rest] = line.split(/[:→-]+/);
                return {
                  phase: phase?.trim() || "Phase",
                  period: rest.join("–").trim() || "Unspecified"
                };
              });
          
            setTimeline(timelineArray);
          }
          
        }
        
        console.log("🧿 karmicInsight GPT Reply:", karmicData.reply);

        

        // 

        // 🔮 Fetch Teaser CTA from AI
        const teaserPrompt = {
          user_id: myUid,
          question: "Generate a short karmic teaser and emotional CTA for a bond.",
          my_name: myName,
          my_dasha: myEnergy.mahadasha,
          my_moon: myEnergy.moon_sign,
          their_name: profileData.name,
          their_dasha: chartData.mahadasha,
          their_moon: chartData.moon_sign,
          context: { topic: "astro-bond" }
        };

        try {
          const teaserRes = await fetch(`${BASE_URL}/api/ask-ai`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(teaserPrompt)
          });
          const teaserJson = await teaserRes.json();
          setTeaser(teaserJson?.teaser || 'You share a deep karmic thread.');
          setCtaText(teaserJson?.cta || 'Unlock this karmic bond – 13 Dharma Coins');
        } catch (err) {
          console.warn("❌ Failed to fetch teaser CTA:", err);
        }

        // 
        // const {
        //   dashaInfo,
        //   planetSummary,
        //   chakraImpact,
        //   transitNote,
        //   timeline,
        //   remedy,
        //   moonSign,
        //   karmicInsight 
        // } = populateAstroBondFromDailyEnergy(myEnergy, {
        //   dasha: `${chartData.mahadasha} > ${chartData.antardasha}`,
        //   moonSign: chartData.moon_sign,
        //   otherChart: chartData  // ✅ make sure this is passed for better accuracy
        // });

        // setKarmicInsight(karmicInsight);

        setPerson({
          id: personId,
          name: profileData.name || "Partner",
          relation: "Connected",
          moonSign: chartData.moon_sign,
          dob: profileData.dob,
          tob: profileData.tob,
          pob: profileData.pob,
          dasha: `${chartData.mahadasha} > ${chartData.antardasha}`
        });
        
        // const fallbackParsed = populateAstroBondFromDailyEnergy(myEnergy, {
        //   dasha: `${chartData.mahadasha} > ${chartData.antardasha}`,
        //   moonSign: chartData.moon_sign,
        //   otherChart: chartData
        // });

        // const parsedSections = parseBondReply(karmicData.reply || '');
        
        // setBondType(karmicData.bondType || fallbackParsed.bondType || "");
        // setPlanetSummary(karmicData.planetSummary || fallbackParsed.planetSummary || "");
        // setChakraImpact(karmicData.chakraImpact || fallbackParsed.chakraImpact || "");
        // setDashaInfo(karmicData.dashaInfo || fallbackParsed.dashaInfo || "");
        // setTransitNote(karmicData.transitNote || fallbackParsed.transitNote || "");
        // setRemedy(karmicData.remedy || fallbackParsed.remedy || "");
        // setTimeline(karmicData.timeline || fallbackParsed.timeline || []);
        // setKarmicInsight(karmicData.karmicInsight || karmicData.reply || fallbackParsed.karmicInsight || "");
        // setBondStrength(parseFloat(karmicData.bondStrength) || 75);  // safe default
        


      } catch (err) {
        console.error("❌ Failed to load bond data:", err);
      }
    };

    loadBondEnergy();

      if (personId) {
        const checkPersonalityUnlock = async () => {
          const cacheKey = `@personalityInsights_${personId}`;
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            const data = JSON.parse(cached);
            setPersonalitySnapshot(data.snapshot);
            setEmotionalTriggers(data.triggers);
            setApproachAdvice(data.advice);
            setPersonalityUnlocked(true);
          }
        };
        checkPersonalityUnlock();
      }

  }, [personId]);

  const handleUnlockWithCoins = async () => {
    const coinStr = await AsyncStorage.getItem('@wallet_dharma_coins');
    let coins = parseInt(coinStr || '0');
    if (coins < 13) {
      alert('⚠️ Not enough Dharma Coins. Please recharge.');
      return;
    }
  
    coins -= 13;
    await AsyncStorage.setItem('@wallet_dharma_coins', coins.toString());
    setUnlocked(true);
    // 
    const checkPersonalityUnlock = async () => {
      const key = `@unlocked_psychology_${personId}`;
      const value = await AsyncStorage.getItem(key);
      if (value === 'true') setPersonalityUnlocked(true);
    };
    checkPersonalityUnlock();
    
    // 
    await loadBondEnergy();
  };

  const fetchPersonalityInsights = async () => {
    setPersonalityLoading(true);
  
    const cacheKey = `@personalityInsights_${personId}`;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setPersonalitySnapshot(data.snapshot);
        setEmotionalTriggers(data.triggers);
        setApproachAdvice(data.advice);
        setPersonalityUnlocked(true);
        return;
      }
  
      // 👇 Replace with actual GPT API call or your backend
      const prompt = `
  You are an AI expert in Vedic astrology and relationship psychology.
  Based on the birth chart and karmic bond between the user and ${person?.name || 'this person'}, generate:
  
  1. A short "Personality Snapshot" (1 sentence).
  2. Their common "Emotional Triggers".
  3. The "Best Way to Approach" them emotionally.
  
  Keep it concise, casual, yet insightful.
  `;
  
      const res = await fetch(`${BASE_URL}/api/ask-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getIdToken()}` // if using Firebase Auth
        },
        body: JSON.stringify({
          context: { topic: 'astro-bond' },
          user_id: auth.currentUser?.uid,
          target_uid: personId,
          question: prompt,
        }),
      });
  
      const json = await res.json();
      if (json && json.personality) {
        const data = {
          snapshot: json.personality.personalitySnapshot,
          triggers: json.personality.emotionalTriggers,
          advice: json.personality.approachAdvice
        };
        // Save in state
        setPersonalitySnapshot(data.snapshot);
        setEmotionalTriggers(data.triggers);
        setApproachAdvice(data.advice);
        setPersonalityUnlocked(true);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      } else {
        console.warn('⚠️ Unexpected GPT format:', json);
      }
    } catch (e) {
      console.error('❌ Failed to fetch personality insights:', e);
    } finally {
      setPersonalityLoading(false);
    }
  };
  
  
  const handlePersonalityUnlock = async () => {
    const coinStr = await AsyncStorage.getItem('@wallet_dharma_coins');
    let coins = parseInt(coinStr || '0');
    if (coins < 9) {
      alert('⚠️ Not enough Dharma Coins. Please recharge.');
      return;
    }
    coins -= 9;
    await AsyncStorage.setItem('@wallet_dharma_coins', coins.toString());
    await AsyncStorage.setItem(`@unlocked_psychology_${personId}`, 'true');
    setPersonalityUnlocked(true);
  };
  

  // const handleAskAI = async () => {
  //   if (!question.trim()) return;
  //   setLoadingAI(true);
  //   try {
  //     const response = await fetch(`${BASE_URL}/api/ask-ai`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         question,
  //         context: {
  //           bond: person?.name || 'Unknown',
  //           moon: person?.moonSign || '',
  //           userDasha: myDailyEnergy ? `${myDailyEnergy.mahadasha} > ${myDailyEnergy.antardasha}` : 'Unknown',
  //           otherDasha: person?.dasha || 'Unknown',
  //           bondType
  //         }
  //       })
  //     });
  //     const data = await response.json();
  //     setAiResponse(data.reply || 'No response received.');
  //   } catch (err) {
  //     setAiResponse('Error connecting to AI.');
  //   } finally {
  //     setLoadingAI(false);
  //   }
  // };

  

  if (!person) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    <ScrollView style={styles.container}>
      {/* <Text style={styles.title}>🔮 AstroBond with {person.name}</Text>
      <Text style={styles.relation}>{person.relation} • Moon: {person.moonSign}</Text> */}

       <Text style={styles.title}>🔮 AstroBond with {person.name}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Bond Type</Text>
        <Text style={styles.value}>{bondType}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Bond Strength</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${bondStrength}%` }]} />
        </View>
        <Text style={styles.percent}>{Math.round(bondStrength)}%</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Planetary Influence</Text>
        <Text style={styles.text}>{planetSummary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Dasha Overlay</Text>
        <Text style={styles.text}>{dashaInfo}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Chakra Influence</Text>
        <Text style={styles.text}>{chakraImpact}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Transit Sensitivity</Text>
        <Text style={styles.text}>{transitNote}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Karmic Insight</Text>
        <Text style={styles.gpt}>{karmicInsight}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Bond Timeline</Text>
        {timeline.map((item, idx) => (
          <Text key={idx} style={styles.timeline}>
            🔸 {item.phase} → {item.period}
          </Text>
        ))}
      </View>

    

      <Text style={styles.freeSectionHeader}>Personality Snapshot</Text>
      <View style={{ ...styles.blurredBox, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.blurredText}>What they are made of...</Text>
        <Text style={{ color: '#ccc' }}>🔒</Text>
      </View>


      <Text style={styles.freeSectionHeader}>Emotional Triggers</Text>
      <View style={styles.blurredBox}>
        <Text style={styles.blurredText}>How they react to rejection, silence, praise…</Text>
      </View>

      <Text style={styles.freeSectionHeader}>Best Way to Approach</Text>
      <View style={styles.blurredBox}>
        <Text style={styles.blurredText}>Tips on building trust, initiating conversations…</Text>
      </View>



      {!unlocked && !personalityUnlocked && (
        <View style={styles.lockedBlock}>
          <TouchableOpacity style={styles.unlockButton} onPress={handlePersonalityUnlock}>
            <Text style={styles.unlockButtonText}>Unlock Emotional Insight – 9 Dharma Coins</Text>
          </TouchableOpacity>
        </View>
      )}

      {personalityUnlocked && (
        <View style={styles.unlockedSection}>
          <Text style={styles.sectionTitle}>🎭 Personality Snapshot</Text>
          <Text>{psychology?.personalitySnapshot}</Text>

          <Text style={styles.sectionTitle}>🚦 Emotional Triggers</Text>
          <Text>{psychology?.emotionalTriggers}</Text>

          <Text style={styles.sectionTitle}>🎯 Best Way to Approach</Text>
          <Text>{psychology?.approachAdvice}</Text>

          <Text style={styles.sectionTitle}>💡 Love Language</Text>
          <Text>{psychology?.loveLanguage}</Text>

          <Text style={styles.sectionTitle}>⚔️ Conflict Pattern</Text>
          <Text>{psychology?.conflictPattern}</Text>

          <Text style={styles.sectionTitle}>🧠 Subconscious Karma</Text>
          <Text>{psychology?.subconsciousKarma}</Text>

          <Text style={styles.sectionTitle}>🧘 Compatibility Ritual</Text>
          <Text>{psychology?.compatibilityRitual}</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back to Circle</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  relation: { color: '#666', marginBottom: 12 },
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  value: { fontSize: 15 },
  text: { fontSize: 15, color: '#333' },
  percent: { textAlign: 'right', fontSize: 16, fontWeight: '600', marginTop: 4 },
  progressBar: {
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5e60ce',
  },
  gpt: { fontStyle: 'italic', fontSize: 15, lineHeight: 22, marginTop: 8 },
  timeline: { fontSize: 14, marginTop: 4 },
  input: {
    borderColor: '#ccc', borderWidth: 1, padding: 10,
    borderRadius: 10, marginTop: 10
  },
  askButton: {
    marginTop: 10, backgroundColor: '#5e60ce', padding: 12, borderRadius: 10,
    alignItems: 'center'
  },
  askText: { color: '#fff', fontWeight: 'bold' },
  backButton: {
    marginTop: 20, backgroundColor: '#f0f0f0', padding: 12,
    borderRadius: 10, alignItems: 'center'
  },
  backText: { color: '#5e60ce', fontWeight: 'bold' },
  unlockBtn: {
    backgroundColor: '#fce4ec',
    padding: 12,
    borderRadius: 10,
    marginVertical: 12
  },
  unlockText: {
    textAlign: 'center',
    color: '#d81b60',
    fontWeight: 'bold'
  },
  lockedBlock: {
    marginVertical: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  unlockButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
  },
  unlockButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  blurredText: {
    color: '#aaa',
    fontStyle: 'italic',
  },
  blurredBox: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  blurredText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#999'
  },
  freeSectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 6,
    color: '#000'
  },
  sectionText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 12
  }
  

});