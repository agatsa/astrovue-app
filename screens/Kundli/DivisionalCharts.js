import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BASE_URL } from '../../config/constants'; // Adjust the import path as needed

const screenWidth = Dimensions.get('window').width;
const chartSize = screenWidth - 90;
const half = chartSize / 2;
const scaleFactor = chartSize / 300;

const signNames = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

const signNumHouseCenters = [
  { x: 0.49, y: 0.40 },  // 11
  { x: 0.73, y: 0.16 },  // 10
  { x: 0.81, y: 0.22 },  // 9
  { x: 0.58, y: 0.47 },  // 8
  { x: 0.81, y: 0.72 },  // 7
  { x: 0.74, y: 0.79 },  // 6
  { x: 0.49, y: 0.54 },  // 5
  { x: 0.24, y: 0.78 },  // 4
  { x: 0.19, y: 0.72 },  // 3
  { x: 0.42, y: 0.47 },  // 2
  { x: 0.19, y: 0.22 },  // 1
  { x: 0.22, y: 0.16 },  // 12
];

const planetHouseCenters = [
  { x: 0.49, y: 0.15 },//done
  { x: 0.77, y: 0.10 },
  { x: 0.86, y: 0.16 },
  { x: 0.71, y: 0.42 },
  { x: 0.89, y: 0.67 },
  { x: 0.71, y: 0.85 },
  { x: 0.45, y: 0.69 },
  { x: 0.22, y: 0.82 },
  { x: 0.06, y: 0.65 },
  { x: 0.22, y: 0.48 },
  { x: 0.05, y: 0.16 },
  { x: 0.20, y: 0.08 },
];

const divisionalCharts = [
  { key: 'D1', name: 'D1 - Lagna Chart', description: 'Represents overall personality and life path.' },
  { key: 'D2', name: 'D2 - Hora Chart', description: 'Indicates wealth, prosperity, and financial matters.' },
  { key: 'D3', name: 'D3 - Drekkana Chart', description: 'Reflects siblings, courage, and communication skills.' },
  { key: 'D4', name: 'D4 - Chaturthamsha Chart', description: 'Shows fortunes, assets, and property matters.' },
  { key: 'D5', name: 'D5 - Panchamamsha Chart', description: 'Represents power, fame, and authority.' },
  { key: 'D6', name: 'D6 - Shashthamsha Chart', description: 'Analyzes health, enemies, and obstacles.' },
  { key: 'D7', name: 'D7 - Saptamsha Chart', description: 'Deals with children, creativity, and lineage.' },
  { key: 'D8', name: 'D8 - Ashtamsha Chart', description: 'Relates to longevity, transformations, and sudden events.' },
  { key: 'D9', name: 'D9 - Navamsha Chart', description: 'Highlights marriage, dharma, and spiritual development.' },
  { key: 'D10', name: 'D10 - Dashamsha Chart', description: 'Focuses on career, profession, and public life.' },
  { key: 'D11', name: 'D11 - Rudramsha Chart', description: 'Examines gains, ambitions, and sources of income.' },
  { key: 'D12', name: 'D12 - Dwadashamsha Chart', description: 'Shows parental influence and heredity.' },
  { key: 'D13', name: 'D13 - Shodashamsha Chart', description: 'Indicates comforts, vehicles, and luxury.' },
  { key: 'D14', name: 'D14 - Chaturvimshamsha Chart', description: 'Represents learning, knowledge, and intuition.' },
  { key: 'D15', name: 'D15 - Akshavedamsha Chart', description: 'Reveals spiritual tendencies and divine grace.' },
  { key: 'D16', name: 'D16 - Shodashamsha Chart', description: 'Deals with conveyances, pleasures, and comforts.' },
];

export default function DivisionalCharts() {
  const [selected, setSelected] = useState(divisionalCharts[0]);
  const [divisionalData, setDivisionalData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const profileStr = await AsyncStorage.getItem('userProfile');
        const profile = JSON.parse(profileStr || '{}');

        const userlatlongStr = await AsyncStorage.getItem('@latlong');
        const userlatlong = JSON.parse(userlatlongStr || '{}');
        console.log('📦 Retrieved from AsyncStorage IN BIRTH CHART:', userlatlong);
  
        const latitude = userlatlong.lat ||0; // Default to 0 if not set
        const longitude = userlatlong.lon || 0; // Default to 0 if not

       
        
        
        

        console.log("Profile data:", profile);
        const dob = new Date(profile.dob);
        // const tob = new Date(profile.tob);
        const tob = profile.tob || ''; // e.g., "23:45"
        const birth_time = profile.tob.split(':').map(Number); // converts ["23", "45"] → [23, 45]
        console.log("TOB:", tob);
        console.log("birth_time:", birth_time);
        const hour = birth_time[0] || 0;
        const minute = birth_time[1] || 0;
        console.log("Hour:", hour, "Minute:", minute);
        

        const payload = {
          year: dob.getFullYear(),
          month: dob.getMonth() + 1,
          day: dob.getDate(),
          hour: hour,
          minute: minute,
          latitude: latitude,
          longitude: longitude,
          tz_offset: 5.5
        };
        console.log("divisional",payload);
       

        const res = await fetch(`${BASE_URL}/api/divisional-charts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!data.success) throw new Error('Failed to fetch chart');

        setDivisionalData(data.divisionalCharts);
      } catch (err) {
        console.error('❌ Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  const processChartData = (chartKey) => {
    const chart = divisionalData[chartKey];
    if (!chart) return [];

    const ascSign = chart["0"].current_sign;
    const houses = Array(12).fill(null).map((_, i) => {
      const sign = ((ascSign - i - 1 + 12) % 12) + 1;
      return { signNum: sign, signName: signNames[sign], planets: [] };
    });

    for (let key in chart) {
      const { current_sign, name } = chart[key];
      const houseIndex = (ascSign - current_sign + 12) % 12;
      houses[houseIndex].planets.push(name === 'Ascendant' ? 'Asc' : name);
    }

    return houses;
  };

  const getPlanetaryData = (chartKey) => {
    const chart = divisionalData[chartKey];
    return chart ? Object.values(chart).map(item => ({
      name: item.name,
      current_sign: item.current_sign,
      normDegree: item.normDegree,
    })) : [];
  };

  const houseData = processChartData(selected.key);
  const planetRawData = getPlanetaryData(selected.key);

  if (loading) {
    return <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading charts...</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.Text entering={FadeIn.duration(600)} style={styles.title}>
        <Icon name="star-circle" size={28} color="#FFD700" /> Divisional Charts
      </Animated.Text>

      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.selectorCard}>
        <Text style={styles.sectionTitle}>
          <Icon name="swap-horizontal" size={20} color="#FFD700" /> Switch Chart
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
          {divisionalCharts.map((chart, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.selector, selected.key === chart.key && styles.activeSelector]}
              onPress={() => setSelected(chart)}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectorText, selected.key === chart.key && styles.activeSelectorText]}>
                {chart.key}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400)} style={styles.chartCard}>
        <View style={styles.chartContainer}>
          <Svg height={chartSize} width={chartSize}>
            <Line x1="0" y1="0" x2={chartSize} y2="0" stroke="#FFD700" strokeWidth="2" />
            <Line x1={chartSize} y1="0" x2={chartSize} y2={chartSize} stroke="#FFD700" strokeWidth="2" />
            <Line x1={chartSize} y1={chartSize} x2="0" y2={chartSize} stroke="#FFD700" strokeWidth="2" />
            <Line x1="0" y1={chartSize} x2="0" y2="0" stroke="#FFD700" strokeWidth="2" />
            <Line x1="0" y1="0" x2={chartSize} y2={chartSize} stroke="#FFD700" strokeWidth="2" />
            <Line x1={chartSize} y1="0" x2="0" y2={chartSize} stroke="#FFD700" strokeWidth="2" />
            <Line x1={half} y1="0" x2="0" y2={half} stroke="#FFD700" strokeWidth="2" />
            <Line x1={half} y1="0" x2={chartSize} y2={half} stroke="#FFD700" strokeWidth="2" />
            <Line x1="0" y1={half} x2={half} y2={chartSize} stroke="#FFD700" strokeWidth="2" />
            <Line x1={chartSize} y1={half} x2={half} y2={chartSize} stroke="#FFD700" strokeWidth="2" />
          </Svg>

          {/* Overlay Elements */}
          {houseData.map((house, i) => (
            <React.Fragment key={i}>
              <View style={[styles.textOverlay, {
                top: signNumHouseCenters[i].y * chartSize,
                left: signNumHouseCenters[i].x * chartSize
              }]}>
                <Text style={[styles.signText, { fontSize: 10 * scaleFactor }]}>{house.signNum}</Text>
              </View>
              <View style={[styles.textOverlay, {
                top: planetHouseCenters[i].y * chartSize,
                left: planetHouseCenters[i].x * chartSize
              }]}>
                {house.planets.map((planet, j) => (
                  <Text key={j} style={[styles.planetText, { fontSize: 8 * scaleFactor, marginTop: j === 0 ? 0 : 4 }]}>
                    {planet}
                  </Text>
                ))}
              </View>
            </React.Fragment>
          ))}
        </View>
      </Animated.View>

      <Text style={styles.chartName}>{selected.name}</Text>
      <Text style={styles.chartDesc}>{selected.description}</Text>

      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.dataCard}>
        <Text style={styles.sectionTitle}>
          <Icon name="table" size={20} color="#FFD700" /> Planetary Data
        </Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Planet</Text>
            <Text style={styles.tableHeaderText}>Sign</Text>
            <Text style={styles.tableHeaderText}>Degree</Text>
          </View>
          {planetRawData.map((planet, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{planet.name}</Text>
              <Text style={styles.tableCell}>{signNames[planet.current_sign]}</Text>
              <Text style={styles.tableCell}>{planet.normDegree.toFixed(2)}°</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 20,
    textAlign: 'center'
  },
  selectorCard: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  selectorScroll: {
    paddingVertical: 10,
  },
  selector: {
    backgroundColor: '#333',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeSelector: {
    backgroundColor: '#FFD700',
  },
  selectorText: {
    color: '#FFF',
    fontSize: 14,
  },
  activeSelectorText: {
    color: '#000',
    fontWeight: 'bold',
  },
  chartCard: {
    marginHorizontal: 15,
    marginVertical: 20,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 10,
  },
  chartContainer: {
    position: 'relative',
    width: chartSize,
    height: chartSize,
  },
  textOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  signText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  planetText: {
    color: '#FFF',
  },
  chartName: {
    color: '#FFD700',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  chartDesc: {
    color: '#ccc',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dataCard: {
    marginHorizontal: 15,
    marginTop: 20,
    padding: 10,
    backgroundColor: '#111',
    borderRadius: 10,
  },
  sectionTitle: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 10,
  },
  tableContainer: {
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  tableHeaderText: {
    color: '#FFD700',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableCell: {
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
});