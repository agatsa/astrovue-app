import { BASE_URL } from "../config/constants";
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

export default function AstroNavScreen() {
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [astroContext, setAstroContext] = useState(null);
  const [alignmentSummary, setAlignmentSummary] = useState("Fetching alignment...");
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [heading, setHeading] = useState("...");
  const [angle, setAngle] = useState(null);
  const [zoneQuality, setZoneQuality] = useState("neutral");
  const [retryFlag, setRetryFlag] = useState(false);

  const GOOGLE_API_KEY = "AIzaSyBkVOJM6k6vQkGownJ2m1OcnQG0hZB4VQ4";

  useEffect(() => {
    let lastUpdate = Date.now();
    const fetchData = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
        fetchLocationName(loc.coords);
        fetchAstroContext(loc.coords);
      } catch (err) {
        Alert.alert('Error', 'Could not fetch location.');
      }
    };

    fetchData();

    const subscription = Magnetometer.addListener((data) => {
      if (Date.now() - lastUpdate >= 30000) {
        let rawAngle = Math.atan2(data.y, data.x) * (180 / Math.PI);
        rawAngle = rawAngle >= 0 ? rawAngle : rawAngle + 360;
        const adjustedAngle = (rawAngle - 120 + 360) % 360;
        setAngle(adjustedAngle);

        let dir = "North";
        if (adjustedAngle >= 22.5 && adjustedAngle < 67.5) dir = "Northeast";
        else if (adjustedAngle >= 67.5 && adjustedAngle < 112.5) dir = "East";
        else if (adjustedAngle >= 112.5 && adjustedAngle < 157.5) dir = "Southeast";
        else if (adjustedAngle >= 157.5 && adjustedAngle < 202.5) dir = "South";
        else if (adjustedAngle >= 202.5 && adjustedAngle < 247.5) dir = "Southwest";
        else if (adjustedAngle >= 247.5 && adjustedAngle < 292.5) dir = "West";
        else if (adjustedAngle >= 292.5 && adjustedAngle < 337.5) dir = "Northwest";

        setHeading(dir);
        lastUpdate = Date.now();
      }
    });

    return () => subscription.remove();
  }, [retryFlag]);

  const fetchLocationName = async ({ latitude, longitude }) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
      );
      const json = await res.json();
      const name = json.results?.[0]?.formatted_address || "";
      setLocationName(name);
    } catch (err) {
      console.log("Location name fetch error:", err);
    }
  };

  const fetchAstroContext = async ({ latitude, longitude }) => {
    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      const profile = JSON.parse(profileStr || '{}');
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : null;
      const response = await fetch(`${BASE_URL}/api/location-energy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          lat: latitude,
          lon: longitude,
          dob: profile?.dob?.split('T')[0] || '',
          tob: profile?.tob || '00:00',
          pob: profile?.pob || '',
          name: profile?.name || 'User',
          date: new Date().toISOString().split("T")[0],
          time: new Date().toTimeString().split(" ")[0].slice(0, 5)
        })
      });

      if (!response.ok) throw new Error("Bad astro API response");
      const data = await response.json();
      console.log("AstroContext API response:", data);

      if (!data || !data.zone || !data.alignment || !data.scores) {
        Alert.alert("Missing Data", "Could not retrieve full astro context. Please try again later.");
        return;
      }

      setAstroContext(data);

      const zone = data.zone || "";
      if (zone.includes("Red")) setZoneQuality("alert");
      else if (zone.includes("Yellow")) setZoneQuality("neutral");
      else if (zone.includes("Green")) setZoneQuality("good");
      else setZoneQuality("neutral");

      await fetchGPTAlignment(data);
    } catch (err) {
      console.log("❌ Astro context fetch error:", err);
      Alert.alert('Error', 'Unable to fetch astro context.');
    }
  };

  const fetchGPTAlignment = async (data) => {
    try {
      const prompt = `You're a Vedic astrologer and vastu expert. A person is currently at this location:
Location: ${locationName || "Unknown"}
Direction: ${heading} (${angle?.toFixed(1)}°)
Alignment: ${data.alignment}, Zone: ${data.zone}
Moon Sign: ${data.moon_sign}, Ascendant: ${data.ascendant}
Planet Scores: ${JSON.stringify(data.scores, null, 2)}

Write 3–4 lines describing how this place and direction may affect their energy, mood, or inner alignment. End with 1-line advice and a question like: “Is this a space where your mind feels sharp?”`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer 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` // trimmed
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a Vedic astrologer and vastu expert." },
            { role: "user", content: prompt }
          ],
          max_tokens: 180
        })
      });

      const json = await res.json();
      const reply = json.choices?.[0]?.message?.content || "No alignment advice available.";
      setAlignmentSummary(reply);
    } catch (err) {
      setAlignmentSummary("⚠️ Error generating alignment.");
    }
  };

  const askAI = async () => {
    if (!question.trim()) return;
    setLoadingAI(true);
    try {
      const fullContext = `
  You are a Vedic astrologer and vastu consultant.
  User is currently at: ${locationName}.
  Direction facing: ${heading} (${angle?.toFixed(1)}°).
  Zone: ${astroContext?.zone}, Alignment: ${astroContext?.alignment}.
  Ascendant: ${astroContext?.ascendant}, Moon Sign: ${astroContext?.moon_sign}.
  Mahadasha: ${astroContext?.mahadasha}, Antardasha: ${astroContext?.antardasha}.
  Today's GPT Summary: ${astroContext?.gpt_summary || 'N/A'}
  
  Now respond to the user's input:
  "${question}"
  Use the full astro context above to give a relevant, thoughtful answer in 3–4 lines.
  `;
  
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer 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` // trimmed
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a Vedic astrologer and vastu guide focused on location-based energy." },
            { role: "user", content: fullContext }
          ],
          max_tokens: 200
        })
      });
  
      const json = await res.json();
      setAiAnswer(json.choices?.[0]?.message?.content || "No reply.");
    } catch (err) {
      setAiAnswer("⚠️ Error fetching AI response.");
    } finally {
      setLoadingAI(false);
    }
  };
  
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.cardLocation}>
          <Text style={styles.title}>Current Location</Text>
          <Text style={styles.sub}>{locationName || "Fetching..."}</Text>
          <Text style={styles.sub}>Direction: {heading} ({angle ? angle.toFixed(1) + '°' : '...'})</Text>
          {location && (
            <MapView
              style={styles.map}
              region={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={location} />
            </MapView>
          )}
        </View>

        <View style={[styles.cardWhite, zoneQuality === 'alert' ? styles.alert : zoneQuality === 'good' ? styles.good : styles.neutral]}>
          <Text style={styles.title}>Energy Alignment</Text>
          <Text style={styles.sub}>{alignmentSummary}</Text>
          <TouchableOpacity onPress={() => setRetryFlag(prev => !prev)}>
            <Text style={{ marginTop: 10, color: '#7B61FF' }}>Retry</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.questionTitle}>Ask the AI anything about your astrological space</Text>
        <View style={styles.questionBox}>
          <TextInput
            style={styles.input}
            placeholder="Enter question"
            value={question}
            onChangeText={setQuestion}
          />
          <TouchableOpacity style={styles.sendButton} onPress={askAI}>
            <Text style={styles.sendButtonText}>{loadingAI ? '...' : '➤'}</Text>
          </TouchableOpacity>
        </View>

        {aiAnswer && (
          <View style={styles.cardWhite}>
            <Text style={styles.title}>🧠 AI Response</Text>
            <Text style={styles.sub}>{aiAnswer}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F2', padding: 16 },
  cardLocation: { backgroundColor: '#EADFFF', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardWhite: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16 },
  map: { width: '100%', height: 150, marginTop: 12, borderRadius: 12 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  sub: { fontSize: 14, color: '#444', lineHeight: 20 },
  good: { borderWidth: 1, borderColor: '#6FCF97' },
  neutral: { borderWidth: 1, borderColor: '#F2C94C' },
  alert: { borderWidth: 1, borderColor: '#EB5757' },
  questionTitle: { fontWeight: 'bold', fontSize: 14, marginTop: 16, marginBottom: 4, color: '#000' },
  questionBox: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', paddingHorizontal: 10, height: 44 },
  input: { flex: 1, fontSize: 14 },
  sendButton: { paddingHorizontal: 8 },
  sendButtonText: { fontSize: 18, color: '#7B61FF' }
});
