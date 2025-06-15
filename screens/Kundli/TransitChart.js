// import { BASE_URL } from "../config/constants";
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

const mockTransits = [
  { planet: 'Sun', sign: 'Taurus', degree: 14.3, nakshatra: 'Rohini', house_from_moon: 4 },
  { planet: 'Moon', sign: 'Leo', degree: 2.1, nakshatra: 'Magha', house_from_moon: 7 },
  { planet: 'Mercury', sign: 'Aries', degree: 29.8, nakshatra: 'Bharani', house_from_moon: 3 },
  { planet: 'Venus', sign: 'Gemini', degree: 10.5, nakshatra: 'Mrigashira', house_from_moon: 5 },
  { planet: 'Mars', sign: 'Pisces', degree: 21.7, nakshatra: 'Revati', house_from_moon: 2 },
  { planet: 'Jupiter', sign: 'Taurus', degree: 7.2, nakshatra: 'Krittika', house_from_moon: 4 },
  { planet: 'Saturn', sign: 'Aquarius', degree: 19.9, nakshatra: 'Shatabhisha', house_from_moon: 1 },
  { planet: 'Rahu', sign: 'Pisces', degree: 5.6, nakshatra: 'Uttara Bhadrapada', house_from_moon: 2 },
  { planet: 'Ketu', sign: 'Virgo', degree: 5.6, nakshatra: 'Hasta', house_from_moon: 8 }
];

export default function TransitChart() {
  const [transits, setTransits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API loading
    setTimeout(() => {
      setTransits(mockTransits);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>\u2728 Today's Planetary Transits</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#ff9900" style={{ marginTop: 40 }} />
      ) : (
        transits.map((t, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.planet}>{t.planet}</Text>
            <Text style={styles.info}>Sign: <Text style={styles.highlight}>{t.sign}</Text></Text>
            <Text style={styles.info}>Degree: <Text style={styles.highlight}>{t.degree.toFixed(2)}\u00b0</Text></Text>
            <Text style={styles.info}>Nakshatra: <Text style={styles.highlight}>{t.nakshatra}</Text></Text>
            <Text style={styles.info}>House from Moon: <Text style={styles.highlight}>{t.house_from_moon}</Text></Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fefbf6',
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20
  },
  card: {
    width: '95%',
    backgroundColor: '#fff8e7',
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  planet: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d9822b',
    marginBottom: 8
  },
  info: {
    fontSize: 14,
    color: '#444',
    marginBottom: 3
  },
  highlight: {
    color: '#000',
    fontWeight: '600'
  }
});