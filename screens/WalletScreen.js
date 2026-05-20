import React, { useState, useCallback } from 'react';
import { DharmaCoin } from '../utils/dharmaCoinManager';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import {
    getFirestore, getDoc, doc, updateDoc, increment,
    collection, addDoc, serverTimestamp,
    getDocs, query, orderBy, limit
  } from 'firebase/firestore';
  


export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [earned, setEarned] = useState(0);
  const [spent, setSpent] = useState(0);
  const navigation = useNavigation();


  useFocusEffect(
    useCallback(() => {
      const fetchWallet = async () => {
        const coins = await DharmaCoin.getBalance();
        const summary = await DharmaCoin.getSummary(); // optional
  
        setBalance(coins);
        setEarned(summary.earned || 0);
        setSpent(summary.spent || 0);
      };
  
      fetchWallet();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
        <Text style={styles.backText}>← Back to Settings</Text>
        </TouchableOpacity>
        <Text style={styles.header}>🪙 Dharma Wallet</Text>

        {/* Wallet Card */}
        <View style={styles.card}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>{balance} Coins</Text>

          <View style={styles.row}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Earned</Text>
              <Text style={[styles.statValue, { color: 'green' }]}>+{earned}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Spent</Text>
              <Text style={[styles.statValue, { color: 'red' }]}>-{spent}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('DharmaRecharge')}
        >
          <Text style={styles.buttonText}>Recharge Coins</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate('TransactionHistory')}
        >
          <Text style={styles.buttonTextSecondary}>View Transaction History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => alert('Coming soon: Earn Dharma Coins guide')}
        >
          <Text style={styles.buttonTextSecondary}>How to Earn Coins?</Text>
        </TouchableOpacity>
    

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fffdf6',
  },
  container: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff7db',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#d4a200',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#888',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#ffcc00',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonTextSecondary: {
    fontSize: 15,
    color: '#555',
  },
  backLink: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    color: '#007aff',
  },  
});
