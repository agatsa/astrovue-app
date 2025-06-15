import { BASE_URL } from "../config/constants";
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, SafeAreaView, Dimensions
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

import { getAuth } from 'firebase/auth';

// const BASE_URL = 'http://192.168.1.13:8080'; 
import AstroBondScreen from './AstroBondScreen';

//const BASE_URL = 'https://kundli-auth-api1-731436072433.asia-south1.run.app';

const { width } = Dimensions.get('window');

export default function SocialScreen() {
  const [clusters, setClusters] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    const fetchSocialWall = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
  
        const token = await user.getIdToken();
        const uid = user.uid;

  
        const res = await fetch(`${BASE_URL}/api/social-wall`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: uid }),
        });
  
        const data = await res.json();
        if (res.ok) {
          setClusters(data);         // ✅ Real clusters from backend
        } else {
          console.error('❌ Social Wall API error:', data.error);
        }
      } catch (err) {
        console.error('❌ Failed to fetch social wall:', err);
      }
    };
  
    fetchSocialWall();
  }, []);

  const renderCluster = (title, users, lottieFile, gradientColor) => (
    <View style={styles.clusterContainer}>
      <View style={styles.clusterHeader}>
        <LottieView source={lottieFile} autoPlay loop style={styles.lottie} />
        <Text style={styles.clusterTitle}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {users.map((person, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.card, { backgroundColor: gradientColor }]}
            onPress={() => navigation.navigate('AstroBond', { personId: person.uid })}
          >
            <Image source={{ uri: person.photo }} style={styles.avatar} />
            <Text style={styles.name}>{person.name}</Text>
            <Text style={styles.caption}>{person.caption}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>✨ Your AstroCircle Today</Text>

        {renderCluster("Guides Today", clusters.guides || [], require('../assets/guide.json'), '#fcefee')}
        {renderCluster("Financially Lucky", clusters.finance || [], require('../assets/money.json'), '#fff9e6')}
        {renderCluster("Hangout Vibe", clusters.hangout || [], require('../assets/fun.json'), '#e6fff6')}
        {renderCluster("Needs Support", clusters.support || [], require('../assets/help.json'), '#fff1f1')}
        {renderCluster("Health Watch", clusters.health || [], require('../assets/health.json'), '#eaf3ff')}
        {renderCluster("Zen Today", clusters.zen || [], require('../assets/zen.json'), '#f0f5ec')}
      </ScrollView>
    </SafeAreaView>
  );
}

// function mockUsers(type, caption) {
//   return Array.from({ length: 5 }).map((_, i) => ({
//     uid: `${type}-${i}`,
//     name: `${type} ${i + 1}`,
//     photo: 'https://i.pravatar.cc/150?img=' + (i + 10),
//     caption: caption
//   }));
// }

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9'
  },
  container: {
    paddingBottom: 50,
    paddingHorizontal: 10
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
    color: '#333'
  },
  clusterContainer: {
    marginBottom: 30
  },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 10
  },
  clusterTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#444'
  },
  lottie: {
    width: 40,
    height: 40
  },
  card: {
    width: width * 0.36,
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10
  },
  name: {
    fontWeight: '700',
    fontSize: 14,
    color: '#222'
  },
  caption: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4
  }
});
