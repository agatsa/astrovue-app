import { BASE_URL } from "../config/constants";
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

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
  back: {
    label: 'Back',
    planet: 'Mars + Saturn',
    risk: 'Lower back fatigue',
    remedy: 'Rest spine + gentle cobra pose',
  }
};

export default function InteractiveBodyZones() {
  const [selectedZone, setSelectedZone] = useState(null);

  return (
    <View>
      <Svg height="300" width="150" viewBox="0 0 100 200" style={{ alignSelf: 'center' }}>
        <Rect x="40" y="5" width="20" height="20" fill="#f4f4f4" onPress={() => setSelectedZone('head')} />
        <Rect x="35" y="30" width="30" height="30" fill="#eaeaff" onPress={() => setSelectedZone('chest')} />
        <Rect x="35" y="65" width="30" height="25" fill="#ffe4e1" onPress={() => setSelectedZone('abdomen')} />
        <Rect x="10" y="35" width="20" height="60" fill="#f5f5dc" onPress={() => setSelectedZone('arms')} />
        <Rect x="70" y="35" width="20" height="60" fill="#f5f5dc" onPress={() => setSelectedZone('arms')} />
        <Rect x="35" y="95" width="12" height="70" fill="#dceeff" onPress={() => setSelectedZone('legs')} />
        <Rect x="53" y="95" width="12" height="70" fill="#dceeff" onPress={() => setSelectedZone('legs')} />
        <Rect x="40" y="50" width="20" height="50" fill="transparent" onPress={() => setSelectedZone('back')} />
      </Svg>

      {selectedZone && (
        <View style={styles.insightBox}>
          <Text style={styles.insightTitle}>{zones[selectedZone].label}</Text>
          <Text style={styles.planet}>🪐 Influenced by: {zones[selectedZone].planet}</Text>
          <Text style={styles.risk}>⚠️ Risk: {zones[selectedZone].risk}</Text>
          <Text style={styles.remedy}>🌿 Remedy: {zones[selectedZone].remedy}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  insightBox: {
    marginTop: 16,
    backgroundColor: '#f9f7ff',
    padding: 12,
    borderRadius: 10,
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
