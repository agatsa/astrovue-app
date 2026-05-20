import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DharmaCoin from '../utils/dharmaCoinManager';

export default function TransactionHistoryScreen() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const data = await DharmaCoin.getTransactionHistory();
      setTransactions(data);
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.type}>{item.type === 'Earned' ? '🟢 Earned' : '🔴 Spent'}</Text>
      <Text style={styles.reason}>{item.reason}</Text>
      <Text style={[
        styles.amount,
        item.type === 'Earned' ? { color: 'green' } : { color: 'red' }
      ]}>
        {item.coins > 0 ? '+' : ''}{item.coins} coins
      </Text>
      <Text style={styles.timestamp}>{new Date(item.timestamp?.toDate?.() || item.timestamp).toLocaleString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>📜 Transaction History</Text>

        {loading ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : transactions.length === 0 ? (
          <Text style={styles.empty}>No transactions yet.</Text>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fffdf6',
  },
  container: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    marginBottom: 12,
    borderRadius: 10,
  },
  type: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  reason: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  loading: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  },
});
