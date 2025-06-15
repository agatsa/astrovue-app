import { BASE_URL } from "../config/constants";
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { API_TOKEN } from '../config/apiConfig';
import { LinearGradient } from 'expo-linear-gradient';


const screenWidth = Dimensions.get("window").width;

export default function AstroEssenceScreen({ route }) {
  const userId = route?.params?.userId || 'testuser';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAIResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

  useEffect(() => {
    const fetchEssence = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch("http://127.0.0.1:8080/api/essence-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_TOKEN}`,
          },
          body: JSON.stringify({ userId, date: today }),
        });
  
        const json = await res.json();
        console.log("Parsed JSON:", json);
  
        // ✅ Add these logs to check mahadasha presence
        console.log("✅ Natal Mahadasha:", JSON.stringify(json?.dasha_compare?.natal?.mahadasha));
        console.log("✅ Current Mahadasha:", JSON.stringify(json?.dasha_compare?.current?.mahadasha));
  
        setData(json);  // ✅ Use original json directly here
        setLoading(false);
      } catch (err) {
        console.error("Essence API error:", err);
        setLoading(false);
      }
    };
  
    if (userId) fetchEssence();
  }, [userId]);
  

  const handleAskAI = async () => {
    if (!question.trim()) return;
    try {
      setAiLoading(true);
      setAIResponse('');
      const res = await fetch("http://127.0.0.1:8080/api/ask-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer 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`,
        },
        body: JSON.stringify({
          userId,
          question,
          context: {
            moon: data.essence_snapshot.moon,
            sun: data.essence_snapshot.sun,
            ascendant: data.essence_snapshot.ascendant,
            traits: data.trait_scores,
            elements: data.element_scores,
            doshas: data.doshas,
            strengths: data.strengths,
          },
        }),
      });
      const json = await res.json();
      setAIResponse(json.reply || "I couldn't find a meaningful insight.");
    } catch (err) {
      console.error("Ask AI Error:", err);
      setAIResponse("An error occurred while fetching your essence response.");
    } finally {
      setAiLoading(false);
      setQuestion('');
    }
  };

  if (loading || !data) return <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />;

  const { essence_snapshot, trait_scores, element_scores, strengths, doshas, dasha_compare, remedies, karmic_teaser } = data;
  const isLowWater = element_scores?.Water < 30;
  const topTrait = trait_scores?.reduce((a, b) => (a.score > b.score ? a : b), {});

  return (
    <LinearGradient colors={['#f2f6ff', '#ffffff']} style={styles.gradient}>
     <ScrollView style={styles.container}>
        <View style={styles.section}>
            <Text style={styles.title}>🌟 Your Celestial Signature</Text>
            <Text style={styles.summary}>
            Moon in {essence_snapshot.moon}, Sun in {essence_snapshot.sun}, Ascendant in {essence_snapshot.ascendant}
            </Text>
            <Text style={styles.teaser}>
            "{essence_snapshot.summary}"
            </Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.title}>🧠 Personality Profile</Text>
            {trait_scores.map((trait, idx) => (
                <View key={idx} style={styles.traitRow}>
                <Text style={styles.traitLabel}>{trait.trait}</Text>
                <View style={styles.barOuter}>
                    <View style={[styles.barInner, { width: `${(trait.score / 10) * 100}%` }]} />
                </View>
                <Text style={styles.scoreText}>{trait.score}/10</Text>
                </View>
            ))}
            <Text style={styles.subtext}>🌟 Dominant Trait: {topTrait?.trait}</Text>
            </View>


        <View style={styles.section}>
            <Text style={styles.title}>🌿 Elemental Balance</Text>
            {Object.entries(element_scores).map(([element, value], idx) => (
            <View key={idx} style={styles.elementRow}>
                <Text style={styles.elementText}>{element}</Text>
                <View style={styles.barOuter}>
                <View style={[styles.barInner, { width: `${value}%` }]} />
                </View>
            </View>
            ))}
            {isLowWater && <Text style={styles.alert}>⚠️ Low Water: May cause emotional disconnect today</Text>}
        </View>

        <View style={styles.section}>
            <Text style={styles.title}>⚖️ Doshas & Strengths</Text>
            <View style={styles.row}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>💪 Strengths</Text>
                {strengths.map((s, idx) => <Text key={idx}>• {s}</Text>)}
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>⚠️ Doshas</Text>
                {doshas.map((d, idx) => <Text key={idx}>• {d}</Text>)}
            </View>
            </View>
        </View>

        {data?.dasha_compare?.natal?.mahadasha?.name &&
        data?.dasha_compare?.current?.mahadasha?.name ? (
        <View style={styles.section}>
            <Text style={styles.title}>🔁 You vs You Now</Text>

            <Text style={styles.subtext}>
            Natal Self: {data.dasha_compare.natal.mahadasha.name} → {data.dasha_compare.natal.antardasha?.name || "—"} → {data.dasha_compare.natal.pratyantardasha?.name || "—"} → {data.dasha_compare.natal.sookshma?.name || "—"}
            </Text>

            <Text style={styles.subtext}>
            Current Self: {data.dasha_compare.current.mahadasha.name} → {data.dasha_compare.current.antardasha?.name || "—"} → {data.dasha_compare.current.pratyantardasha?.name || "—"} → {data.dasha_compare.current.sookshma?.name || "—"}
            </Text>
        </View>
        ) : (
        <View style={styles.section}>
            <Text style={styles.title}>🔁 You vs You Now</Text>
            <Text style={styles.subtext}>Dasha comparison not available.</Text>
        </View>
        )}
        



        <View style={styles.section}>
            <Text style={styles.title}>📿 Remedies & Actions</Text>
            {remedies.map((r, idx) => <Text key={idx}>• {r}</Text>)}
        </View>

        <View style={styles.section}>
            <Text style={styles.title}>🤖 Ask About Your Essence</Text>
            <TextInput
            style={styles.input}
            placeholder="e.g., Why do I feel misunderstood?"
            value={question}
            onChangeText={setQuestion}
            />
            <TouchableOpacity style={styles.button} onPress={handleAskAI} disabled={aiLoading}>
            <Text style={styles.buttonText}>{aiLoading ? "Thinking..." : "Ask AI"}</Text>
            </TouchableOpacity>
            {aiResponse ? <Text style={styles.response}>{aiResponse}</Text> : null}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            {["Why do I feel low?", "How can I improve communication?", "What’s blocking my growth?"].map((q, idx) => (
                <TouchableOpacity key={idx} onPress={() => setQuestion(q)} style={{ backgroundColor: '#eee', padding: 8, borderRadius: 6, marginRight: 8, marginBottom: 6 }}>
                <Text style={{ fontSize: 13 }}>{q}</Text>
                </TouchableOpacity>
            ))}
            </View>
        </View>

        <View style={styles.lockedSection}>
            <Text style={styles.lockedTitle}>🔒 Karmic Trait Decoder</Text>
            <Text style={styles.lockedText}>{karmic_teaser}</Text>
            <TouchableOpacity style={styles.lockedButton}>
            <Text style={styles.buttonText}>Unlock Premium</Text>
            </TouchableOpacity>
        </View>  
     </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  section: { marginBottom: 28 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 6 },
  summary: { fontSize: 16 },
  teaser: { fontStyle: "italic", color: "#555", marginTop: 4 },
  traitText: { fontSize: 14, marginVertical: 2 },
  subtext: { fontSize: 14, color: '#444', marginTop: 4 },
  sliderNote: { fontStyle: 'italic', color: '#777' },
  elementRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  elementText: { width: 60 },
  barOuter: { height: 8, flex: 1, backgroundColor: "#ccc", borderRadius: 4 },
  barInner: { height: 8, backgroundColor: "#007AFF", borderRadius: 4 },
  alert: { color: "#aa0000", fontSize: 12, marginTop: 6 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  card: { flex: 0.48, backgroundColor: "#f9f9f9", padding: 10, borderRadius: 10 },
  cardTitle: { fontWeight: "bold", marginBottom: 4 },
  input: { borderColor: "#ccc", borderWidth: 1, borderRadius: 6, padding: 10, marginVertical: 10 },
  button: { backgroundColor: "#333", padding: 10, borderRadius: 6 },
  buttonText: { color: "#fff", textAlign: "center" },
  response: { marginTop: 10, fontStyle: "italic", color: "#333" },
  lockedSection: { backgroundColor: "#eee", padding: 16, borderRadius: 10, marginBottom: 30 },
  lockedTitle: { fontSize: 18, fontWeight: "bold" },
  lockedText: { fontSize: 14, marginTop: 6, marginBottom: 10 },
  lockedButton: { backgroundColor: "#6644cc", padding: 10, borderRadius: 6 },
  traitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  traitLabel: {
    width: 110,
    fontSize: 14,
    color: '#333',
  },
  scoreText: {
    width: 50,
    fontSize: 12,
    textAlign: 'right',
    color: '#666',
  },  
  gradient: {
    flex: 1,
  },
  container: {
    padding: 16,
    backgroundColor: 'transparent',
  },  
});
