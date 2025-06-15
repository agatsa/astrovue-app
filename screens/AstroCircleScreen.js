import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, TextInput, ActivityIndicator, Alert
} from 'react-native';
import {
  getFirestore, collection, query, orderBy, where,
  startAt, endAt, limit, doc, setDoc, getDocs, getDoc, serverTimestamp
} from 'firebase/firestore';
import { auth } from '../config/firebase';
import PendingRequestsScreen from './PendingRequestsScreen';
import { deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';



const db = getFirestore();

export default function AstroCircleScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [sending, setSending] = useState({});
  const [sentRequests, setSentRequests] = useState({});
  const [showRequests, setShowRequests] = useState(false);

  const [acceptedPeople, setAcceptedPeople] = useState([]);


  const people = [
    {
      id: 1,
      name: 'Neha',
      relation: 'Spouse',
      moon: 'Taurus',
      energy: '🔵 Calm',
      image: require('../assets/family3.png')
    },
    {
      id: 2,
      name: 'Aryaman',
      relation: 'Son',
      moon: 'Leo',
      energy: '🟡 Active',
      image: require('../assets/avatar2.png')
    }
  ];

  const handleSearch = (text) => {
    setSearch(text);
    if (typingTimeout) clearTimeout(typingTimeout);

    if (text.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      fetchSearchResults(text.toLowerCase());
    }, 300);
    setTypingTimeout(timeout);
  };

  const fetchSearchResults = async (text) => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        orderBy('search_name'),
        startAt(text),
        endAt(text + '\uf8ff'),
        limit(5)
      );

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSearchResults(results);
    } catch (error) {
      console.log('❌ Firestore search error:', error);
    } finally {
      setLoading(false);
    }
  };

const fetchAcceptedConnections = async () => {
  const uid = auth.currentUser.uid;

  const q = query(
    collection(db, "astro_circle_requests"),
    where("status", "==", "accepted")
  );

  const snapshot = await getDocs(q);
  const dedupedMap = new Map();

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    // Include only if current user is sender or receiver
    if (data.sender_uid === uid || data.receiver_uid === uid) {
      const otherUid = data.sender_uid === uid ? data.receiver_uid : data.sender_uid;

      if (!dedupedMap.has(otherUid)) {
        const userRef = doc(db, "users", otherUid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        dedupedMap.set(otherUid, {
          uid: otherUid,
          name: userData.name || "Unknown",
          image: userData.photo ? { uri: userData.photo } : require("../assets/family3.png"),
          moon: userData.moon_sign || "🌙",
          energy: userData.energy || "✨",
          relation: userData.relation || "",
        });
      }
    }
  }

  // setAcceptedPeople(Array.from(dedupedMap.values()));

 const finalList = Array.from(dedupedMap.values()).map(p => ({
  ...p,
  image: p.photo ? { uri: p.photo } : require("../assets/family3.png"),
}));

// const finalList = [];

// const finalList = [
//   {
//     uid: 'test123',
//     name: 'Test User',
//     photo: null,
//     moon: 'Taurus',
//     energy: 'Balanced',
//     relation: 'Crush',
//     dob: '1995-08-15',       // ✅ dummy DOB (ISO string or YYYY-MM-DD)
//     tob: '14:30',            // ✅ dummy TOB (HH:mm format)
//     pob: 'Delhi, India',     // ✅ dummy POB (city, country)
//     image: require('../assets/family3.png')
//   },
//   {
//     uid: 'demo456',
//     name: 'Priya Sharma',
//     photo: null,
//     moon: 'Cancer',
//     energy: 'High',
//     relation: 'Partner',
//     dob: '1992-04-20',
//     tob: '09:15',
//     pob: 'Mumbai, India',
//     image: require('../assets/avatar2.png')
//   }
// ];


for (const docSnap of snapshot.docs) {
  const data = docSnap.data();

  if (data.sender_uid === uid || data.receiver_uid === uid) {
    const otherUid = data.sender_uid === uid ? data.receiver_uid : data.sender_uid;

    if (!dedupedMap.has(otherUid)) {
      const userRef = doc(db, "users", otherUid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      const cleanedTob = userData?.tob?.slice?.(11, 16) || '';
      const cleanedDob = userData?.dob?.slice?.(0, 10) || '';

      finalList.push({
        uid: otherUid,
        name: userData.name || "Unknown",
        photo: userData.photo || null,
        moon: userData.moon_sign || "🌙",
        energy: userData.energy || "✨",
        relation: userData.relation || "",
        dob: cleanedDob,
        tob: cleanedTob,
        pob: userData.pob || "Unknown",
        image: userData.photo ? { uri: userData.photo } : require("../assets/family3.png"),
      });
    }
  }
}


// const finalList = [
//   {
//     uid: 'test123',
//     name: 'Test User',
//     photo: null,
//     moon: 'Taurus',
//     energy: 'Balanced',
//     relation: 'Crush',
//     image: require('../assets/family3.png')
//   }
// ];

await AsyncStorage.setItem('@astro_circle', JSON.stringify(finalList));


setAcceptedPeople(finalList);

if (finalList.length > 0) {
  await AsyncStorage.setItem('@astro_circle', JSON.stringify(finalList));
  console.log('✅ Saved @astro_circle to AsyncStorage');
} else {
  console.warn('⚠️ finalList was empty — nothing saved to AsyncStorage');
}



};


  const removeConnection = async (otherUid) => {
    try {
      const uid = auth.currentUser.uid;
      const docId1 = `${uid}_${otherUid}`;
      const docId2 = `${otherUid}_${uid}`;
      
      const ref1 = doc(db, 'astro_circle_requests', docId1);
      const ref2 = doc(db, 'astro_circle_requests', docId2);
  
      await Promise.all([
        setDoc(ref1, {}, { merge: false }).catch(() => {}),
        setDoc(ref2, {}, { merge: false }).catch(() => {}),
      ]);
  
      Alert.alert("🗑️ Connection removed");
      fetchAcceptedConnections(); // 🔄 refresh the list
    } catch (err) {
      console.error("❌ Error removing connection:", err.message);
      Alert.alert("❌ Failed to remove connection");
    }
  };
  
  const confirmRemove = (uid) => {
    Alert.alert(
      "Remove Connection",
      "Are you sure you want to remove this person from your AstroCircle?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeConnection(uid)
        }
      ]
    );
  };
  


  const sendConnectionRequest = async (receiverId) => {
    const sender_uid = auth.currentUser.uid;
    const receiver_uid = receiverId;
  
    // 1. Create connection_key (same for both directions)
    const connection_key = [sender_uid, receiver_uid].sort().join("_");
  
    // 2. Check if request already exists
    const q = query(
      collection(db, 'astro_circle_requests'),
      where('connection_key', '==', connection_key)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      console.log("⚠️ Request already exists for this connection_key");
      return;
    }
  
    // 3. Create the request document
    const docId = `${sender_uid}_${receiver_uid}`;
    await setDoc(doc(db, 'astro_circle_requests', docId), {
      sender_uid,
      receiver_uid,
      status: 'pending',
      timestamp: new Date(),
      connection_key,
    });
  
    console.log("✅ Connection request sent:", docId);
    setSentRequests((prev) => ({ ...prev, [receiver_uid]: true }));
  };
  

  const fetchSentRequests = async () => {
    try {
      const senderUid = auth.currentUser.uid;
      const q = query(
        collection(db, 'astro_circle_requests'),
        where('sender_uid', '==', senderUid)
      );
      const snapshot = await getDocs(q);

      
      const sent = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        sent[data.receiver_uid] = true;
      });
      setSentRequests(sent);
    } catch (err) {
      console.error("❌ Failed to fetch sent requests:", err.message);
    }
  };

  useEffect(() => {
    fetchSentRequests();
    fetchAcceptedConnections();
  }, []);

  if (showRequests) {
    return <PendingRequestsScreen navigation={navigation} />;
  }
  

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>👥 AstroCircle</Text>
      <Text style={styles.subtitle}>Your karmic circle of key relationships</Text>

      <TextInput
        placeholder="Search by name to add..."
        value={search}
        onChangeText={handleSearch}
        style={styles.searchBar}
      />

      {loading && <ActivityIndicator size="small" color="#666" style={{ marginBottom: 10 }} />}

      {searchResults.length > 0 && (
        <View style={styles.searchResults}>
          <Text style={styles.sectionTitle}>🔍 Suggested Matches</Text>
          {searchResults.map(p => (
            <View key={p.id} style={styles.searchCard}>
              <Image source={p.photo ? { uri: p.photo } : require('../assets/family3.png')} style={styles.avatar} />
              <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.name || "No name"}</Text>

              </View>
              <TouchableOpacity
                style={[
                  styles.connectBtn,
                  (sending[p.id] || sentRequests[p.id]) && { backgroundColor: '#999' }
                ]}
                disabled={sending[p.id] || sentRequests[p.id]}
                onPress={() => sendConnectionRequest(p.id)}
              >
                <Text style={styles.connectText}>
                  {sentRequests[p.id]
                    ? '✅ Sent'
                    : sending[p.id]
                    ? '⏳ Sending...'
                    : '➕ Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={() => setShowRequests(true)}
        style={{ backgroundColor: '#fcefee', padding: 10, borderRadius: 10, marginBottom: 10 }}
      >
        <Text style={{ textAlign: 'center', fontWeight: 'bold', color: '#c43b3b' }}>🔔 View Pending Requests</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>🧑‍🤝‍🧑 Your Circle</Text>
      <View style={styles.grid}>
  {acceptedPeople.map(person => (
 <View key={person.uid} style={styles.instaCard}>
 <TouchableOpacity
   onPress={() => confirmRemove(person.uid)}
   style={styles.deleteIcon}
 >
   <Text style={{ color: '#b00020', fontSize: 16 }}>🗑️</Text>
 </TouchableOpacity>

 <Image source={{ uri: person.photo }} style={styles.instaAvatar} />
 <Text style={styles.instaName}>{person.name}</Text>

 {person.moon || person.energy ? (
   <Text style={styles.instaTag}>🌙 {person.moon || '—'} • {person.energy || '—'}</Text>
 ) : null}

 <View style={styles.instaButtons}>
   <TouchableOpacity
     style={styles.instaBtn}
     onPress={() => {
      console.log("🔗 Navigating to AstroBond with:", person.uid);
      navigation.navigate('AstroBond', { personId: person.uid });
     }}
   >
     <Text style={styles.instaBtnText}>🔮 Bond</Text>
   </TouchableOpacity>
   <TouchableOpacity
     style={styles.instaBtn}
     onPress={() => navigation.navigate('PersonProfile', { personId: person.uid })}
   >
     <Text style={styles.instaBtnText}>👤 Profile</Text>
   </TouchableOpacity>
 </View>
</View>

  ))}
</View>



    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold' },
  subtitle: { marginBottom: 20, color: '#666' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  searchBar: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10
  },
  searchResults: {
    backgroundColor: '#f7f7ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    paddingBottom: 8
  },
  connectBtn: {
    backgroundColor: '#8e72f8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  connectText: { color: '#fff', fontWeight: '600' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    width: '100%',
    backgroundColor: '#f7f5ff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2
  },
  relation: {
    color: '#555',
    fontSize: 14,
    marginBottom: 4
  },
  energy: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4
  },
  connectedAt: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  bondButton: {
    flex: 1,
    backgroundColor: '#e4e2ff',
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 8
  },
  bondText: {
    textAlign: 'center',
    color: '#5e60ce',
    fontWeight: '600'
  },
  removeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ffecec',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5
  },
  removeText: {
    color: '#d11a2a',
    fontWeight: 'bold',
    fontSize: 16
  },
  instaCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 16,
    borderColor: '#e6e6e6',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2
  },
  
  instaAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10
  },
  
  instaName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 4
  },
  
  instaTag: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12
  },
  
  instaButtons: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center'
  },
  
  instaBtn: {
    backgroundColor: '#f3f0ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4
  },
  
  instaBtnText: {
    fontSize: 13,
    color: '#5e60ce',
    fontWeight: '600'
  },  
  deleteIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 12
  },
  
  name: { fontWeight: 'bold', fontSize: 16 },
  relation: { color: '#666' },
  energy: { fontSize: 12, marginVertical: 4 },
  bondButton: { marginTop: 6 },
  bondText: { color: '#5e60ce', fontWeight: '600' }
});
