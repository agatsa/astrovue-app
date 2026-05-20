import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Dimensions, StyleSheet } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';

import BirthChart from './Kundli/BirthChart';
import TransitChart from './Kundli/TransitChart';
import DashaTimeline from './Kundli/DashaTimeline';
import DivisionalCharts from './Kundli/DivisionalCharts';
import AskKundliAI from './Kundli/AskKundliAI';

const initialLayout = { width: Dimensions.get('window').width };

export default function KundliScreen({ navigation }) {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'birth',      title: 'Birth Chart' },
    { key: 'transit',    title: 'Transit' },
    { key: 'dasha',      title: 'Dasha' },
    { key: 'divisional', title: 'Divisional' },
    { key: 'ask',        title: 'Ask AI' },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'birth':       return <BirthChart />;
      case 'transit':     return <TransitChart />;
      case 'dasha':       return <DashaTimeline />;
      case 'divisional':  return <DivisionalCharts />;
      case 'ask':         return <AskKundliAI />;
      default:            return null;
    }
  };

  const topPad = StatusBar.currentHeight || 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Kundli</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tab view */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            scrollEnabled
            indicatorStyle={{ backgroundColor: '#7C3AED', height: 3 }}
            style={{ backgroundColor: '#fff', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}
            labelStyle={{ fontWeight: '700', fontSize: 13, textTransform: 'none' }}
            activeColor="#7C3AED"
            inactiveColor="#8E8E8E"
            tabStyle={{ width: 'auto', paddingHorizontal: 16 }}
          />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  backBtn:     { width: 44, height: 36, justifyContent: 'center' },
  backArrow:   { fontSize: 30, color: '#1A1A2E', lineHeight: 34 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
});
