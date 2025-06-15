import { BASE_URL } from "../config/constants";
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AstroShopScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🧭 AstroShopScreen Full View Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF7F1',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
});
