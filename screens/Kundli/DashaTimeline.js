// import { BASE_URL } from "../config/constants";
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

const mockDasha = [
  {
    maha: 'Moon',
    start: '2020-01-01',
    end: '2030-01-01',
    antars: [
      { antar: 'Moon', start: '2020-01-01', end: '2021-02-01' },
      { antar: 'Mars', start: '2021-02-01', end: '2022-03-01' },
      { antar: 'Rahu', start: '2022-03-01', end: '2023-04-01' },
      { antar: 'Jupiter', start: '2023-04-01', end: '2024-06-01' },
      { antar: 'Saturn', start: '2024-06-01', end: '2025-07-01' },
    ]
  },
  {
    maha: 'Mars',
    start: '2030-01-01',
    end: '2037-01-01',
    antars: [
      { antar: 'Mars', start: '2030-01-01', end: '2031-02-01' },
      { antar: 'Rahu', start: '2031-02-01', end: '2032-03-01' },
    ]
  }
];

export default function DashaTimeline() {
  const [dashaData, setDashaData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setDashaData(mockDasha);
      setLoading(false);
    }, 400);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>\uD83D\uDD52 Your Dasha Timeline</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#d9822b" style={{ marginTop: 40 }} />
      ) : (
        dashaData.map((maha, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.sectionTitle}>Mahadasha: {maha.maha}</Text>
            <Text style={styles.dates}>{maha.start} to {maha.end}</Text>
            {maha.antars.map((antar, j) => (
              <View key={j} style={styles.antarBlock}>
                <Text style={styles.antarName}>{antar.antar} Antardasha</Text>
                <Text style={styles.antarDates}>{antar.start} → {antar.end}</Text>
              </View>
            ))}
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
    color: '#d9822b',
    marginBottom: 6
  },
  dates: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10
  },
  antarBlock: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee'
  },
  antarName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  antarDates: {
    fontSize: 12,
    color: '#666'
  }
});
