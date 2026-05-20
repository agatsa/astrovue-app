import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function DharmaRechargeScreen() {
  const navigation = useNavigation();

  const handleRecharge = (amount, coins) => {
    Alert.alert(
      'Recharge',
      `You selected ₹${amount} → ${coins} Dharma Coins.\n\n(Integrate Razorpay here)`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Link */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backText}>← Back to Settings</Text>
        </TouchableOpacity>

        <Text style={styles.header}>🛍️ Recharge Dharma Coins</Text>
        <Text style={styles.subtext}>Choose a recharge pack to top up your coin wallet.</Text>

        {/* Recharge Options */}
        <TouchableOpacity style={styles.pack} onPress={() => handleRecharge(49, 50)}>
          <Text style={styles.packText}>₹49 → 50 Coins</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pack} onPress={() => handleRecharge(99, 110)}>
          <Text style={styles.packText}>₹99 → 110 Coins</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pack} onPress={() => handleRecharge(199, 250)}>
          <Text style={styles.packText}>₹199 → 250 Coins</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pack} onPress={() => handleRecharge(399, 550)}>
          <Text style={styles.packText}>₹399 → 550 Coins</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pack} onPress={() => handleRecharge(799, 1200)}>
          <Text style={styles.packText}>₹799 → 1200 Coins</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pack} onPress={() => handleRecharge(1499, 2500)}>
          <Text style={styles.packText}>₹1499 → 2500 Coins</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fffef6',
  },
  container: {
    padding: 20,
  },
  backLink: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    color: '#007aff',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
  pack: {
    backgroundColor: '#ffecb3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  packText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#b8860b',
  },
});
