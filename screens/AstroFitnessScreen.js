import { BASE_URL } from "../config/constants";
import React, { useRef, useState } from 'react';

import { View, Text, ScrollView, StyleSheet, Image, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { ProgressChart } from 'react-native-chart-kit';
import InteractiveBodyZones from './InteractiveBodyZones';

const screenWidth = Dimensions.get("window").width;



export default function AstroFitnessScreen() {

  const [selectedZone, setSelectedZone] = useState(null);


  const planetData = [
    { key: 'Mars', icon: '🔥', title: 'Mars in Scorpio', detail: 'Boosts stamina and drive.' },
    { key: 'Saturn', icon: '🪐', title: 'Saturn in 8th House', detail: 'Protect joints and slow down.' },
    { key: 'Moon', icon: '🌙', title: 'Moon in Cancer', detail: 'Soothing for the mind and breath.' },
  ];

  const zones = {
    head: {
      label: 'Head',
      planet: 'Sun + Rahu',
      risk: 'Eye strain & stress sensitivity',
      remedy: 'Chant “Om Suryaya Namah” + wear cool colors',
    },
    chest: {
      label: 'Chest',
      planet: 'Moon',
      risk: 'Emotional fluctuations or breath tightness',
      remedy: 'Do deep breathing + “Om Chandraya Namah”',
    },
    abdomen: {
      label: 'Abdomen',
      planet: 'Jupiter + Ketu',
      risk: 'Digestion or liver imbalance',
      remedy: 'Chant “Om Ketave Namah” + drink warm water',
    },
    arms: {
      label: 'Arms',
      planet: 'Mars + Mercury',
      risk: 'Nervous energy, hand fatigue',
      remedy: 'Stretch + “Om Mangalaya Namah”',
    },
    legs: {
      label: 'Legs',
      planet: 'Saturn',
      risk: 'Knee joint stiffness',
      remedy: 'Apply warm sesame oil + “Om Shanicharaya Namah”',
    },
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
    <View style={{ marginBottom: 40, position: 'relative' }}>
    
    {/* Energy Chart Card */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📊 Your Energy Today</Text>
      <ProgressChart
        data={{ labels: ["Mars", "Moon", "Saturn"], data: [0.8, 0.6, 0.4] }}
        width={screenWidth - 50}
        height={160}
        strokeWidth={12}
        radius={32}
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          color: (opacity = 1) => `rgba(127, 90, 240, ${opacity})`,
          labelColor: () => "#333",
        }}
        style={{ marginVertical: 8 }}
      />
      <Text style={styles.centerText}>
        Mars is dominant today — time for active rituals!
      </Text>
    </View>

    {/* Floating Lottie Over Chart */}
    <LottieView
      source={require('../assets/yoga-sunrise.json')}
      autoPlay
      loop
      style={{
        position: 'absolute',
        top: -20,
        right: 10,
        width: 100,
        height: 100,
        zIndex: 10,
      }}
    />
  </View>

      {/* Horizontal Scroll - Planet Carousel */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌌 Planetary Influence</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={planetData}
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <View style={styles.planetCard}>
              <Text style={styles.planetTitle}>{item.icon} {item.title}</Text>
              <Text style={styles.planetDetail}>{item.detail}</Text>
            </View>
          )}
        />
      </View>

      {/* Body Heatmap (placeholder image) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧍‍♀️ Body Zone Focus</Text>

        {/* Human Image with Touchable Overlays */}
        <View style={{ position: 'relative', alignItems: 'center' }}>
          <Image
            source={require('../assets/body-silhouette-gradient.png')}
            style={{ width: 220, height: 400, resizeMode: 'contain' }}
          />

          {/* Tappable Zones */}
          {/* Head */}
          <TouchableOpacity onPress={() => setSelectedZone('head')} style={styles.zoneOverlay(70, 35, 40, 40)} />
          {/* Chest */}
          <TouchableOpacity onPress={() => setSelectedZone('chest')} style={styles.zoneOverlay(60, 90, 60, 40)} />
          {/* Abdomen */}
          <TouchableOpacity onPress={() => setSelectedZone('abdomen')} style={styles.zoneOverlay(60, 140, 60, 40)} />
          {/* Arms */}
          <TouchableOpacity onPress={() => setSelectedZone('arms')} style={styles.zoneOverlay(20, 90, 30, 100)} />
          <TouchableOpacity onPress={() => setSelectedZone('arms')} style={styles.zoneOverlay(170, 90, 30, 100)} />
          {/* Legs */}
          <TouchableOpacity onPress={() => setSelectedZone('legs')} style={styles.zoneOverlay(75, 200, 30, 120)} />
          <TouchableOpacity onPress={() => setSelectedZone('legs')} style={styles.zoneOverlay(115, 200, 30, 120)} />
        </View>

        {/* Selected Zone Insight */}
        {selectedZone && (
          <View style={styles.insightBox}>
            <Text style={styles.insightTitle}>{zones[selectedZone].label}</Text>
            <Text style={styles.planet}>🪐 Influenced by: {zones[selectedZone].planet}</Text>
            <Text style={styles.risk}>⚠️ Risk: {zones[selectedZone].risk}</Text>
            <Text style={styles.remedy}>🌿 Remedy: {zones[selectedZone].remedy}</Text>
          </View>
        )}
      </View>



      {/* Ritual Challenge Tracker */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔥 7-Day AstroChallenge</Text>
        {/* <Image source={require('../assets/challenge-progress.png')} style={{ height: 40, width: '100%', marginBottom: 10 }} /> */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Mark Day 3 Complete (+10 Coins)</Text>
        </TouchableOpacity>
      </View>

      {/* Unlock Ritual World */}
      <View style={styles.cardLock}>
        <Text style={styles.cardTitle}>🌍 Unlock: Agni Flow 🔥</Text>
        <Text style={styles.lockedText}>Mars ritual pack to boost fire & confidence. 5-day guided flow.</Text>
        <TouchableOpacity style={styles.lockButton}>
          <Text style={styles.lockButtonText}>Unlock (Premium)</Text>
        </TouchableOpacity>
      </View>

      {/* AstroAI Insight */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🤖 AstroAI Guru Says:</Text>
        <Text style={styles.aiBox}>
          “Avoid intense cardio in late evening. Moon is transitioning into Scorpio — favor grounding breathwork after sunset.”
        </Text>
      </View>

      {/* Log Today’s Body Mood */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📓 Log Your Body Mood</Text>
        <TouchableOpacity style={styles.buttonOutline}>
          <Text style={styles.buttonOutlineText}>Log Now</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFBF7',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLock: {
    backgroundColor: '#fef4f4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ffb3b3',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  centerText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#555',
  },
  planetCard: {
    backgroundColor: '#f3f1fd',
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    width: 200,
  },
  planetTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  planetDetail: {
    fontSize: 13,
    marginTop: 4,
  },
  bodyImage: {
    width: '100%',
    height: 160,
    resizeMode: 'contain',
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#7F5AF0',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonOutline: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#7F5AF0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#7F5AF0',
    fontWeight: '600',
  },
  lockButton: {
    backgroundColor: '#f55',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  lockButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  lockedText: {
    color: '#b33',
    fontSize: 13,
    marginBottom: 8,
  },
  aiBox: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#333',
    padding: 12,
    backgroundColor: '#f4f4ff',
    borderRadius: 8,
    marginTop: 6,
  },

  // ✅ NEW STYLES FOR ZONES & INSIGHTS
  zoneOverlay: (left, top, width, height) => ({
    position: 'absolute',
    left,
    top,
    width,
    height,
    backgroundColor: 'transparent',
  }),
  insightBox: {
    marginTop: 16,
    backgroundColor: '#f4f4ff',
    padding: 12,
    borderRadius: 10,
    width: '100%',
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  planet: {
    fontSize: 14,
    marginBottom: 4,
  },
  risk: {
    fontSize: 13,
    color: '#aa0000',
    marginBottom: 3,
  },
  remedy: {
    fontSize: 13,
    color: '#008800',
  },
});

