// import { BASE_URL } from "../config/constants";
import React, { useEffect, useState } from 'react';
import { View, ImageBackground, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');
const chartSize = width * 0.95;

// Static mock planet data
const planetData = {
  1: { sign: 'Aquarius', planets: ['Moon'] },
  2: { sign: 'Pisces', planets: ['Venus'] },
  3: { sign: 'Aries', planets: [] },
  4: { sign: 'Taurus', planets: [] },
  5: { sign: 'Gemini', planets: [] },
  6: { sign: 'Cancer', planets: [] },
  7: { sign: 'Leo', planets: ['true Node'] },
  8: { sign: 'Virgo', planets: ['Jupiter', 'Mars', 'Saturn'] },
  9: { sign: 'Libra', planets: [] },
  10: { sign: 'Scorpio', planets: [] },
  11: { sign: 'Sagittarius', planets: [] },
  12: { sign: 'Capricorn', planets: ['Asc', 'Mercury', 'Sun'] },
};

const positions = {
  1: { top: '62%', left: '45%' },
  2: { top: '74%', left: '60%' },
  3: { top: '83%', left: '72%' },
  4: { top: '60%', left: '75%' },
  5: { top: '45%', left: '60%' },
  6: { top: '30%', left: '50%' },
  7: { top: '18%', left: '46%' },
  8: { top: '30%', left: '30%' },
  9: { top: '45%', left: '18%' },
  10: { top: '60%', left: '20%' },
  11: { top: '74%', left: '20%' },
  12: { top: '83%', left: '46%' },
};

export default function BirthChartScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 400); // simulate loading
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>\u2728 Your Birth Chart</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#d9822b" style={{ marginTop: 40 }} />
      ) : (
        <ImageBackground
          source={require('../../assets/birth-chart-template.jpg')}
          style={styles.chart}
          resizeMode="contain"
        >
          {Object.entries(planetData).map(([house, { sign, planets }]) => {
            const pos = positions[house];
            return (
              <View key={house} style={[styles.planetBox, { top: pos.top, left: pos.left }]}>
                {sign && <Text style={styles.signText}>{sign}</Text>}
                {planets.map((p, i) => (
                  <Text key={i} style={styles.planetText}>{p}</Text>
                ))}
              </View>
            );
          })}
        </ImageBackground>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>\u2609 Planetary Positions</Text>
        {Object.entries(planetData).map(([house, { sign, planets }]) =>
          planets.map((planet, i) => (
            <Text key={`${house}-${i}`} style={styles.sectionText}>
              {planet} is in {sign} (House {house})
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>\u2302 House-wise Summary</Text>
        {Object.entries(planetData).map(([house, { planets }]) => (
          <Text key={house} style={styles.sectionText}>
            House {house}: {planets.length ? planets.join(', ') : 'Empty'}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>\u26A1 Yogas & Doshas</Text>
        <Text style={styles.sectionText}>✅ Budh Aditya Yoga (Sun + Mercury)</Text>
        <Text style={styles.sectionText}>⚠️ Mangal Dosha: Not detected</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>\uD83D\uDCC5 Interpretation</Text>
        <Text style={styles.sectionText}>
          Moon in Aquarius gives emotional intelligence and detachment. Strong Virgo presence with Jupiter and Mars indicates analytical skills and leadership in professional life. Sun and Mercury in Capricorn bring career focus and clear communication.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fefbf6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  chart: {
    width: chartSize,
    height: chartSize,
    position: 'relative',
    marginBottom: 20,
  },
  planetBox: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  signText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    borderRadius: 4,
    marginBottom: 2,
  },
  planetText: {
    fontSize: 10,
    color: '#000',
    textAlign: 'center',
  },
  card: {
    width: '92%',
    backgroundColor: '#fff8e7',
    borderRadius: 14,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#d9822b'
  },
  sectionText: {
    fontSize: 13,
    marginBottom: 4,
    color: '#444'
  },
});