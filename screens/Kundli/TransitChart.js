import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/constants';

const { width } = Dimensions.get('window');

const positiveMessages = [
  "Cosmic energies are aligning beautifully for you today! ✨",
  "The universe is conspiring to bring you abundance and joy! 🌟",
  "Today brings celestial blessings and divine guidance! 🙏",
  "Your planetary alignment radiates positive transformation! 💫"
];

// Planet colors and emojis mapping
const planetConfig = {
  'Sun': { color: '#FF6B35', emoji: '☀️' },
  'Moon': { color: '#C7CEEA', emoji: '🌙' },
  'Mercury': { color: '#4ECDC4', emoji: '☿️' },
  'Venus': { color: '#FFB6C1', emoji: '♀️' },
  'Mars': { color: '#FF4757', emoji: '♂️' },
  'Jupiter': { color: '#FFA726', emoji: '♃' },
  'Saturn': { color: '#7986CB', emoji: '♄' },
  'Rahu': { color: '#6C5CE7', emoji: '☊' },
  'Ketu': { color: '#A29BFE', emoji: '☋' }
};

// Sign number to sign name mapping
const signNames = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces'
};

// Nakshatra number to nakshatra name mapping
const nakshatraNames = {
  1: 'Ashwini', 2: 'Bharani', 3: 'Krittika', 4: 'Rohini', 5: 'Mrigashirsha',
  6: 'Ardra', 7: 'Punarvasu', 8: 'Pushya', 9: 'Ashlesha', 10: 'Magha',
  11: 'Purva Phalguni', 12: 'Uttara Phalguni', 13: 'Hasta', 14: 'Chitra',
  15: 'Swati', 16: 'Vishakha', 17: 'Anuradha', 18: 'Jyeshtha', 19: 'Mula',
  20: 'Purva Ashadha', 21: 'Uttara Ashadha', 22: 'Shravana', 23: 'Dhanishta',
  24: 'Shatabhisha', 25: 'Purva Bhadrapada', 26: 'Uttara Bhadrapada', 27: 'Revati'
};

export default function TransitChart() {
  const [transits, setTransits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [transitSummary, setTransitSummary] = useState('');
  const [inspirationalMessage] = useState(positiveMessages[Math.floor(Math.random() * positiveMessages.length)]);

  // // API configuration
  // const API_CONFIG = {
  //   baseUrl: 'http://192.168.255.123:8080',
  //   endpoint: '/calculate-transit',
  //   payload: {
  //     name: 'Saurabh',
  //     email: 'test@gmail.com',
  //     dob: '1997-12-18T06:28:00.000Z',  // Date of Birth (ISO format)
  //     tob: '2025-06-20T18:15:00.000Z',  // Time of Birth (current date/time in ISO)
  //     pob: 'Chandauli, UP, India',      // Place of Birth
  //     lat: 25.2592694,                  // Latitude
  //     lon: 83.2667942,                  // Longitude
  //     photo: null                       // Optional profile image URL (can be null)
  //   }
  // };

  useEffect(() => {
    fetchTransitData();
  }, []);

  const fetchTransitData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load real user profile from AsyncStorage
      const profileStr = await AsyncStorage.getItem('userProfile');
      const profile    = profileStr ? JSON.parse(profileStr) : {};

      if (!profile.dob || !profile.pob) {
        setError('Please complete your profile (date & place of birth) to view transits.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/calculate-transit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:  profile.name  || 'User',
          email: profile.email || '',
          dob:   profile.dob,
          tob:   profile.tob   || '12:00',
          pob:   profile.pob,
          lat:   profile.lat   || null,
          lon:   profile.lon   || null,
          photo: profile.photo || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        // Transform API data to match UI expectations
        const transformedTransits = transformApiData(data);
        setTransits(transformedTransits);
        setUserInfo(data.user_info);
        setTransitSummary(data.current_transits?.summary || '');
      } else {
        throw new Error('API returned error status');
      }
    } catch (err) {
      console.error('Error fetching transit data:', err);
      setError(err.message);
      Alert.alert('Error', 'Failed to fetch transit data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const transformApiData = (apiData) => {
    const transitPositions = apiData.current_transits?.transit_positions || {};
    const transitEffects = apiData.current_transits?.transit_effects || [];
    const birthChart = apiData.birth_chart?.planets || {};

    return Object.keys(transitPositions).map(planetName => {
      const transit = transitPositions[planetName];
      const effect = transitEffects.find(e => e.planet === planetName);
      const config = planetConfig[planetName] || { color: '#666666', emoji: '🪐' };

      // Calculate house from moon (using birth chart moon position)
      const moonSign = birthChart.Moon?.sign_number || 7; // Default to Libra if not found
      let houseFromMoon = transit.sign_number - moonSign + 1;
      if (houseFromMoon <= 0) houseFromMoon += 12;

      return {
        planet: planetName,
        sign: signNames[transit.sign_number] || 'Unknown',
        degree: parseFloat(transit.degree_in_sign.toFixed(1)),
        nakshatra: nakshatraNames[transit.nakshatra_number] || 'Unknown',
        house_from_moon: houseFromMoon,
        current_house: effect?.current_house || houseFromMoon,
        interpretation: effect?.interpretation || 'Cosmic influence affecting your life path',
        house_meaning: effect?.house_meaning || getHouseDescription(houseFromMoon),
        color: config.color,
        emoji: config.emoji,
        aspects: effect?.aspects || []
      };
    });
  };

  const getHouseDescription = (house) => {
    const descriptions = {
      1: "Self & Personality",
      2: "Wealth & Family",
      3: "Communication & Courage",
      4: "Home & Heart",
      5: "Creativity & Children",
      6: "Health & Service",
      7: "Partnerships & Love",
      8: "Transformation & Mysteries",
      9: "Wisdom & Fortune",
      10: "Career & Recognition",
      11: "Gains & Friends",
      12: "Spirituality & Liberation"
    };
    return descriptions[house] || "Cosmic Influence";
  };

  const LoadingComponent = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingCard}>
        <Text style={styles.loadingEmoji}>🌟</Text>
        <ActivityIndicator size="large" color="#FF6B35" style={{ marginVertical: 16 }} />
        <Text style={styles.loadingText}>Channeling celestial wisdom...</Text>
        <Text style={styles.loadingSubtext}>Calculating your cosmic insights</Text>
      </View>
    </View>
  );

  const ErrorComponent = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorCard}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>Unable to fetch cosmic data</Text>
        <Text style={styles.errorSubtext}>Please check your connection and try again</Text>
      </View>
    </View>
  );

  const TransitCard = ({ transit, index }) => (
    <View style={[styles.card, { transform: [{ scale: 1 }] }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.planetIcon, { backgroundColor: transit.color }]}>
          <Text style={styles.planetEmoji}>{transit.emoji}</Text>
        </View>
        <View style={styles.planetInfo}>
          <Text style={styles.planetName}>{transit.planet}</Text>
          <Text style={styles.planetSubtitle}>Cosmic Messenger</Text>
        </View>
        <View style={styles.degreeContainer}>
          <Text style={styles.degreeText}>{transit.degree}°</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>✨ Sign</Text>
            <Text style={styles.infoValue}>{transit.sign}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>⭐ Nakshatra</Text>
            <Text style={styles.infoValue}>{transit.nakshatra}</Text>
          </View>
        </View>

        <View style={styles.houseSection}>
          <Text style={styles.houseLabel}>🏠 {transit.house_meaning}</Text>
          <Text style={styles.houseDescription}>{transit.interpretation}</Text>
        </View>

        {transit.aspects && transit.aspects.length > 0 && (
          <View style={styles.aspectsSection}>
            <Text style={styles.aspectsLabel}>🔮 Key Aspects</Text>
            {transit.aspects.slice(0, 2).map((aspect, idx) => (
              <Text key={idx} style={styles.aspectText}>
                {aspect.aspect_type} with {aspect.natal_planet} (orb: {aspect.orb.toFixed(1)}°)
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.cardAccent, { backgroundColor: transit.color }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Today's Planetary Transits</Text>
        {/* <Text style={styles.subtitle}>
          {userInfo ? `${userInfo.name} • ${userInfo.place_of_birth}` : 'Planetary Transits & Divine Guidance'}
        </Text> */}
        {/* <View style={styles.inspirationContainer}>
          <Text style={styles.inspirationText}>{inspirationalMessage}</Text>
        </View> */}
        {/* {transitSummary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>{transitSummary}</Text>
          </View>
        )} */}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <LoadingComponent />
        ) : error ? (
          <ErrorComponent />
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{transits.length}</Text>
                <Text style={styles.statLabel}>Planets</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Houses</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>27</Text>
                <Text style={styles.statLabel}>Nakshatras</Text>
              </View>
            </View>

            {transits.map((transit, index) => (
              <TransitCard key={index} transit={transit} index={index} />
            ))}

            <View style={styles.footer}>
              <Text style={styles.footerText}>May the stars align in your favor 🌟</Text>
              <Text style={styles.footerSubtext}>
                {userInfo ? `Calculated for ${userInfo.name}` : 'Updated with love and cosmic precision'}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  inspirationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  inspirationText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  summaryText: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  planetIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planetEmoji: {
    fontSize: 24,
  },
  planetInfo: {
    flex: 1,
  },
  planetName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  planetSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  degreeContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  degreeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  houseSection: {
    backgroundColor: '#FEF3E2',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginBottom: 12,
  },
  houseLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  houseDescription: {
    fontSize: 13,
    color: '#78350F',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  aspectsSection: {
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  aspectsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A5568',
    marginBottom: 8,
  },
  aspectText: {
    fontSize: 12,
    color: '#2D3748',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  cardAccent: {
    height: 4,
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});