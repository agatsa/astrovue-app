import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ScrollView, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');
const chartSize = width * 0.9;

const divisionalCharts = [
  { name: 'D1 - Lagna Chart', image: require('../../assets/birth-chart-template.jpg'), description: 'Represents overall personality and life path.' },
  { name: 'D9 - Navamsa', image: require('../../assets/birth-chart-template.jpg'), description: 'Indicates marriage, dharma, spiritual strength.' },
  { name: 'D10 - Dashamsa', image: require('../../assets/birth-chart-template.jpg'), description: 'Career and profession chart.' },
  { name: 'D7 - Saptamsa', image: require('../../assets/birth-chart-template.jpg'), description: 'Relates to children and progeny.' },
  { name: 'D12 - Dvadasamsa', image: require('../../assets/birth-chart-template.jpg'), description: 'Represents parents and lineage.' },
];

export default function DivisionalCharts() {
  const [selected, setSelected] = useState(divisionalCharts[0]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>\u2728 Divisional Charts</Text>

      <Image source={selected.image} style={styles.chart} resizeMode="contain" />
      <Text style={styles.chartName}>{selected.name}</Text>
      <Text style={styles.chartDesc}>{selected.description}</Text>

      <Text style={styles.sectionTitle}>Switch Chart</Text>
      <View style={styles.selectorContainer}>
        {divisionalCharts.map((chart, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.selector, selected.name === chart.name && styles.activeSelector]}
            onPress={() => setSelected(chart)}
          >
            <Text style={styles.selectorText}>{chart.name.replace('D', '')}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fefbf6'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  chart: {
    width: chartSize,
    height: chartSize,
    marginBottom: 15
  },
  chartName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d9822b',
    marginBottom: 6
  },
  chartDesc: {
    fontSize: 13,
    color: '#555',
    marginBottom: 20,
    paddingHorizontal: 25,
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#444'
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  selector: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  activeSelector: {
    backgroundColor: '#ffefd2',
    borderColor: '#d9822b'
  },
  selectorText: {
    fontSize: 13,
    color: '#333'
  }
});
