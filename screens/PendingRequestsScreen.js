import { BASE_URL } from "../config/constants";
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Image
} from 'react-native';
import {
  getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc
} from 'firebase/firestore';
import { auth } from '../config/firebase';

const db = getFirestore();

export default function PendingRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingRequests = async () => {
    setLoading(true);
    const uid = auth.currentUser.uid;
    console.log("👀 Checking for pending requests for UID:", uid);



    const q = query(
      collection(db, 'astro_circle_requests'),
      where('receiver_uid', '==', uid),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);

    console.log("📦 Total found:", snapshot.docs.length);

    const enriched = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const senderRef = doc(db, 'users', data.sender_uid);
        const senderSnap = await getDoc(senderRef);
        const senderData = senderSnap.exists() ? senderSnap.data() : {};
        return {
          id: docSnap.id,
          ...data,
          senderName: senderData.name || data.sender_uid,
          senderPhoto: senderData.photo || null,
        };
      })
    );

    setRequests(enriched);
    setLoading(false);
  };

  const handleAction = async (request, action) => {
    try {
      const ref = doc(db, 'astro_circle_requests', request.id);
      await updateDoc(ref, { status: action });
      Alert.alert(
        action === 'accepted' ? '✅ Accepted' : '❌ Rejected',
        `You ${action} this request.`
      );
      fetchPendingRequests();
    } catch (err) {
      console.error(`❌ Failed to ${action} request:`, err.message);
      Alert.alert('Error', err.message);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginBottom: 10 }}
      >
        <Text style={{ color: '#5e60ce', fontWeight: 'bold' }}>⬅️ Back to AstroCircle</Text>
      </TouchableOpacity>

      <Text style={styles.header}>🔔 Pending Requests</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#888" />
      ) : requests.length === 0 ? (
        <Text style={styles.empty}>No pending requests right now.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.senderPhoto && (
                <Image source={{ uri: item.senderPhoto }} style={styles.avatar} />
              )}
              <Text style={styles.name}>{item.senderName}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#4caf50' }]}
                  onPress={() => handleAction(item, 'accepted')}
                >
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#f44336' }]}
                  onPress={() => handleAction(item, 'rejected')}
                >
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  card: {
    backgroundColor: '#f1f1f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  button: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  empty: { color: '#888', textAlign: 'center', marginTop: 50 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
});
