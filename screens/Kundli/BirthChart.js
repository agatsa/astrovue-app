import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, ActivityIndicator, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { BASE_URL } from "../config/constants";
import { BASE_URL } from '../../config/constants'; // Adjust the import path as needed
const screenWidth = Dimensions.get('window').width;
const imageSize = screenWidth - 50;

const signNames = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

const BirthChart = () => {
  const [kundaliBase64, setKundaliBase64] = useState('');
  const [planetRawData, setPlanetRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChartData = async () => {
    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      // Retrieve and confirm saved value (optional)
      const userlatlongStr = await AsyncStorage.getItem('@latlong');
      const userlatlong = JSON.parse(userlatlongStr || '{}');
      console.log('📦 Retrieved from AsyncStorage IN BIRTH CHART:', userlatlong);

      const latitude = userlatlong.lat ||0; // Default to 0 if not set
      const longitude = userlatlong.lon || 0; // Default to 0 if not
      




      const profile = JSON.parse(profileStr || '{}');
      const dob = new Date(profile.dob);
      const tob = profile.tob || ''; // e.g., "23:45"
      const birth_time = tob.split(':').map(Number); // converts ["23", "45"] → [23, 45]
      console.log("TOB:", tob);
      
      const birth_date = [dob.getFullYear(), dob.getMonth() + 1, dob.getDate()];
      const tz_offset = 5.5;
      console.log("Profile data:", profile);
      

      const payload = {
        birth_date,
        birth_time,
        latitude,
        longitude,
        tz_offset,
        user_name: profile.name || 'User',
      };
      console.log("payload:", payload);
      

      const res = await fetch(`${BASE_URL}/calculate_chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error('Failed to fetch chart');

      setKundaliBase64(data.kundali_image_base64);

      const rawDataArray = [];
      const chart = data.chart;

      for (let key in chart) {
        const { current_sign, normDegree, name } = chart[key];
        if (name === 'Ascendant') continue;
        rawDataArray.push({ name, current_sign, normDegree });
      }

      setPlanetRawData(rawDataArray);
    } catch (err) {
      console.error('❌ Error fetching chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#8B5A2B" />
          <Text style={styles.loadingText}>Loading Kundli Chart...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Kundali Image */}
      <View style={styles.chartCard}>
        {kundaliBase64 ? (
          <Image
            source={{ uri: `data:image/png;base64,${kundaliBase64}` }}
            style={{ width: imageSize, height: imageSize, borderRadius: 12 }}
            resizeMode="contain"
          />
        ) : (
          <Text>❌ Failed to load Kundli image</Text>
        )}
      </View>

      {/* Planetary Table */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📊</Text>
          <Text style={styles.cardTitle}>Planetary Data</Text>
        </View>
        <View style={styles.cardContent}>
          {planetRawData.map((planet, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{planet.name}</Text>
              <Text style={styles.tableCell}>{signNames[planet.current_sign]}</Text>
              <Text style={styles.tableCell}>{planet.normDegree.toFixed(2)}°</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F7F3E9', minHeight: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 16, alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#8B5A2B', fontWeight: '500' },
  chartCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, alignItems: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FDF6E3',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6D2',
  },
  cardIcon: { fontSize: 20, marginRight: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#8B5A2B', flex: 1 },
  cardContent: { padding: 20 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  tableCell: { fontSize: 14, color: '#5D4E37', flex: 1, textAlign: 'center' },
});

export default BirthChart;