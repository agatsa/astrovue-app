import { BASE_URL } from "../config/constants";
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
  const nav = (screen) => navigation.navigate(screen);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Section: Daily Pulse */}
      <Text style={styles.section}>🌌 Today’s Celestial Pulse</Text>
      <TouchableOpacity style={styles.cardFull} onPress={() => nav('CelestialPulse')}>
        <Text style={styles.title}>🔭 Planetary Snapshot</Text>
        <Text style={styles.sub}>Moon in Aries, Venus combust. Ketu > Venus > Sun Dasha active.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cardFull} onPress={() => nav('HourlyRisk')}>
        <Text style={styles.title}>📉 Hourly Risk Meter</Text>
        <Text style={styles.sub}>Caution advised 1–3 PM due to Mars-Moon tension. Tap to view chart.</Text>
      </TouchableOpacity>

      {/* Section: AstroSocial */}
      <Text style={styles.section}>📱 AstroSocial</Text>
      <TouchableOpacity style={styles.cardFullHighlight} onPress={() => nav('AstroSocial')}>
        <Text style={styles.title}>You’ve been radiating Mars energy</Text>
        <Text style={styles.sub}>Your recent posts are bold, sharp, and ambitious. Shift to Venus tone for smoother relationships.</Text>
        <Text style={styles.subDim}>Top Sync: @meena_astro – 84% Karmic Resonance</Text>
      </TouchableOpacity>

      {/* Section: Self & Wellness */}
      <Text style={styles.section}>🧘‍♂️ Wellness & Self</Text>
      <TouchableOpacity style={styles.cardFull} onPress={() => nav('AstroEssence')}>
        <Text style={styles.title}>🧬 AstroEssence</Text>
        <Text style={styles.sub}>You’re Air–Earth dominant. Traits: Creative, Grounded, Overthinking.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cardFull} onPress={() => nav('AstroFitness')}>
        <Text style={styles.title}>💪 AstroFitness</Text>
        <Text style={styles.sub}>Saturn in 8th house – protect joints. Try oil massage + warm rituals today.</Text>
      </TouchableOpacity>

      {/* Section: Career & Finance */}
      <Text style={styles.section}>💼 Career & Money</Text>
      <TouchableOpacity style={styles.cardFull} onPress={() => nav('AstroCareer')}>
        <Text style={styles.title}>🧠 AstroCareer</Text>
        <Text style={styles.sub}>Good time for long-term planning. Career momentum is building until July.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cardFull} onPress={() => nav('AstroMoney')}>
        <Text style={styles.title}>💰 AstroMoney</Text>
        <Text style={styles.sub}>Your chart shows wealth gain via partnerships. Avoid solo risks.</Text>
      </TouchableOpacity>

      {/* Section: Relationships */}
      <Text style={styles.section}>💞 Relationships</Text>
      <TouchableOpacity style={styles.cardFull} onPress={() => nav('AstroBond')}>
        <Text style={styles.title}>💖 AstroBond</Text>
        <Text style={styles.sub}>Your karmic bond with R is strong this week. Venus trine Moon is supportive.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cardFull} onPress={() => nav('AstroCircle')}>
        <Text style={styles.title}>👨‍👩‍👧 AstroCircle</Text>
        <Text style={styles.sub}>Tap to view friends/family and see their energy today.</Text>
      </TouchableOpacity>

      {/* Section: Navigation */}
      <Text style={styles.section}>🧭 Navigation & Logs</Text>
      <TouchableOpacity style={styles.cardFull} onPress={() => nav('AstroNav')}>
        <Text style={styles.title}>🧭 AstroNav</Text>
        <Text style={styles.sub}>You are in a Yellow Zone. Face East today for harmony.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cardFull} onPress={() => nav('MyLogs')}>
        <Text style={styles.title}>📜 My Daily Logs</Text>
        <Text style={styles.sub}>View your past alignment records and energy scores.</Text>
      </TouchableOpacity>

      {/* Section: AI, Shop, Rewards */}
      <Text style={styles.section}>✨ Tools & Rewards</Text>
      <TouchableOpacity style={styles.cardFull} onPress={() => nav('AstroAlert')}>
        <Text style={styles.title}>🚨 AstroAlert</Text>
        <Text style={styles.sub}>No critical warnings. Ketu energy may cloud judgment post 5 PM.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cardFull} onPress={() => nav('AstroShop')}>
        <Text style={styles.title}>🛍️ AstroShop</Text>
        <Text style={styles.sub}>Recommended: “7-Horses Plate” for energy flow. Tap to view.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cardFull} onPress={() => nav('DharmaCoins')}>
        <Text style={styles.title}>💠 Dharma Coins</Text>
        <Text style={styles.sub}>You earned 25 coins today! Complete one ritual to unlock a bonus card.</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 120
  },
  section: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 12
  },
  cardFull: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#f4f4f4',
    marginBottom: 16
  },
  cardFullHighlight: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#e0f2ff',
    borderLeftWidth: 5,
    borderLeftColor: '#00b4d8',
    marginBottom: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6
  },
  sub: {
    fontSize: 14,
    color: '#444'
  },
  subDim: {
    fontSize: 13,
    color: '#888',
    marginTop: 4
  }
});
