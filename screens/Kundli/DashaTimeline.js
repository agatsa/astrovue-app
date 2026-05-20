import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function DashaTimeline() {
  const [chart, setChart] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashaData = async () => {
      try {
        const stored = await AsyncStorage.getItem('@daily_energy');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log("parsed",parsed);
         
          setChart(parsed.user_Chart);
          setSummary(parsed.gpt_summary || '');
        }
      } catch (err) {
        console.error('❌ AsyncStorage Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashaData();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return 'Invalid';
    return d.toISOString().slice(0, 10);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loaderText}>Fetching your cosmic data...</Text>
      </View>
    );
  }

  if (!chart) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No Dasha data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.Text entering={FadeIn.duration(500)} style={styles.title}>
        <Icon name="clock-outline" size={24} color="#FF6F61" /> Your Dasha Timeline
      </Animated.Text>

      {/* Dasha Blocks */}
      {[
        {
          label: 'Mahadasha',
          name: chart.mahadasha,
          start: chart.mahadasha_start,
          end: chart.mahadasha_end,
        },
        {
          label: 'Antardasha',
          name: chart.antardasha,
          start: chart.antardasha_start,
          end: chart.antardasha_end,
        },
        {
          label: 'Pratyantar',
          name: chart.pratyantar,
          start: chart.pratyantar_start,
          end: chart.pratyantar_end,
        },
        {
          label: 'Sookshma',
          name: chart.sookshma,
          start: chart.sookshma_start,
          end: chart.sookshma_end,
        },
      ].map((dashaItem, index) => (
        <Animated.View
          entering={FadeInDown.delay(index * 200)}
          key={index}
          style={styles.card}
        >
          <Text style={styles.sectionTitle}>{dashaItem.label}: {dashaItem.name}</Text>
          <Text style={styles.dates}>
            <Icon name="calendar" size={16} color="#4A90E2" />{' '}
            {formatDate(dashaItem.start)} → {formatDate(dashaItem.end)}
          </Text>
        </Animated.View>
      ))}

      {/* Other Astro Info */}
      <Animated.View entering={FadeInDown.delay(900)} style={styles.card}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        <Text style={styles.meta}>Ascendant Sign: {chart.ascendant_sign}</Text>
        <Text style={styles.meta}>Moon Sign: {chart.moon_sign}</Text>
        <Text style={styles.meta}>Nakshatra: {chart.nakshatra}</Text>
        <Text style={styles.meta}>Pada: {chart.pada}</Text>
        <Text style={styles.meta}>Sun Longitude: {chart.sun_longitude.toFixed(2)}</Text>
      </Animated.View>

      {/* GPT Summary */}
      {summary ? (
        <Animated.View entering={FadeInDown.delay(1000)} style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>✨ Daily Energy Summary</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#F8F1E9',
    alignItems: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 25,
    textAlign: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6F61',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 6,
  },
  dates: {
    fontSize: 14,
    color: '#718096',
  },
  meta: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#FFFBEA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#ECC94B',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  summaryText: {
    fontSize: 15,
    color: '#4A4A4A',
    lineHeight: 22,
    marginTop: 8,
  },
});