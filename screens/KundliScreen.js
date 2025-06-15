import { BASE_URL } from "../config/constants";
import React, { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import BirthChart from './Kundli/BirthChart';
import TransitChart from './Kundli/TransitChart';
import DashaTimeline from './Kundli/DashaTimeline';
import DivisionalCharts from './Kundli/DivisionalCharts';
import AskKundliAI from './Kundli/AskKundliAI';

const initialLayout = { width: Dimensions.get('window').width };

export default function KundliScreen() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'birth', title: 'Birth Chart' },
    { key: 'transit', title: 'Transit' },
    { key: 'dasha', title: 'Dasha' },
    { key: 'divisional', title: 'Divisional' },
    { key: 'ask', title: 'Ask AI' },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'birth':
        return <BirthChart />;
      case 'transit':
        return <TransitChart />;
      case 'dasha':
        return <DashaTimeline />;
      case 'divisional':
        return <DivisionalCharts />;
      case 'ask':
        return <AskKundliAI />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={initialLayout}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              scrollEnabled
              indicatorStyle={{ backgroundColor: '#6200EE', height: 3 }}
              style={{ backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: '#ccc' }}
              labelStyle={{
                color: '#000000',
                fontWeight: 'bold',
                fontSize: 14,
                textTransform: 'none',
              }}
              activeColor="#000000"
              inactiveColor="#888888"
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}
