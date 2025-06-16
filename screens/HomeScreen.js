import { BASE_URL } from "../config/constants";
// ✅ Final HomeScreen with dynamic Daily Energy API integration and preserved all existing features

import { launchImageLibrary } from 'expo-image-picker';

import { decode as atob } from 'base-64'; // you may need to install this
import { Alert, Platform } from 'react-native'; 

import React, { useRef,useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import InstagramIcon from '../assets/instagram.png';
import YouTubeIcon from '../assets/youtube.png';
import TwitterIcon from '../assets/twitter.png';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Add this
import { signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc , collection, query, orderBy, limit, getDocs, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, uploadString,getDownloadURL,uploadBytesResumable } from 'firebase/storage';
import { storage } from '../config/firebase'; 

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';


import { Button } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { initializeApp, getApps } from 'firebase/app';

import * as ImageManipulator from 'expo-image-manipulator';

import { Asset } from 'expo-asset';

import { app } from '../config/firebase';

import * as FileSystem from 'expo-file-system';


import { Animated } from 'react-native';

import testImage from './avatar1.png'; // or .jpg

import useDharmaCoins from './useDharmaCoins';

import { LinearGradient } from 'expo-linear-gradient';

const dummy = require('../assets/screens_avatar1.png');






//  const BASE_URL = 'https://kundli-auth-api1-731436072433.asia-south1.run.app';

//const BASE_URL = 'http://192.168.1.13:8080';

const db = getFirestore();



const result = {
  cancelled: false,
  assets: [],
};
// Extract insight and focus from GPT summary
const extractInsightAndFocus = (summary) => {
  if (!summary) return { insight: 'TBD', focus: 'TBD' };
  const sentences = summary.split('. ');
  return {
    insight: sentences[0] ? sentences[0].trim() + '.' : 'TBD',
    focus: sentences[1] ? sentences[1].trim() + '.' : 'TBD',
  };
};

// Save user chart to AsyncStorage
const storeUserChart = async (userChart) => {
  try {
    const jsonValue = JSON.stringify(userChart);
    await AsyncStorage.setItem('@user_chart', jsonValue);
    console.log('✅ User chart saved to AsyncStorage');

    // Immediately verify
    const storedValue = await AsyncStorage.getItem('@user_chart');
    if (storedValue !== null) {
      const parsedValue = JSON.parse(storedValue);
      console.log('🔍 Retrieved user chart (after saving):', parsedValue);
    } else {
      console.log('⚠️ No user chart found after saving');
    }
  } catch (e) {
    console.error('❌ Error storing or retrieving user chart:', e);
  }
};

// Fetch from API and store
const fetchUserData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log("❌ No authenticated user");
      return;
    }

    const idToken = await user.getIdToken(); // ✅ Actual Firebase token

    const res = await fetch(`${BASE_URL}/api/daily-energy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || 'Unknown',
        dob: formattedDob,
        tob: formattedTob,
        pob,
        photo: photo || '',
        social_handles: {},
      }),
    });

    const data = await res.json();
    console.log('🌐 API response:', data);

   

    const userChart = data.user_Chart || data.user_chart;
    if (userChart) {
      await storeUserChart(userChart);
    } else {
      console.log('⚠️ user_chart not found in response');
    }

  } catch (error) {
    console.error('❌ Error fetching user data:', error);
  }
};


// Retrieve chart anywhere
const getUserChart = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@user_chart');
    if (jsonValue != null) {
      const parsedValue = JSON.parse(jsonValue);
      console.log('📦 Retrieved user chart in another call:', parsedValue);
      return parsedValue;
    } else {
      console.log('⚠️ No user chart found in AsyncStorage');
      return null;
    }
  } catch (e) {
    console.error('❌ Error retrieving user chart:', e);
    return null;
  }
};


export default function HomeScreen({ navigation }) {
  const [dailyEnergy, setDailyEnergy] = useState(null);
  const [hourlyRisk, setHourlyRisk] = useState(null);
  const [error, setError] = useState(null);
  const { insight, focus } = extractInsightAndFocus(dailyEnergy?.gpt_summary);
  const [dailyLogs, setDailyLogs] = useState([]);

  const [streakInfo, setStreakInfo] = useState({ current: 0, max: 0 });

  const [animatedStreak, setAnimatedStreak] = useState(0);

  const nav = (screen) => navigation.navigate(screen);

  const [pendingRequests, setPendingRequests] = useState(2); // temporary mock

  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [userName, setUserName] = useState('');

  const [coinBalance, setCoinBalance] = useState(0);

  const { coins, updateCoins, changeCoinsBy } = useDharmaCoins();

  const [streakCount, setStreakCount] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [supportExpanded, setSupportExpanded] = useState(false);



 
  const zone = dailyEnergy?.zone || 'Neutral';

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const getCardHighlight = (cardName) => {
    if (zone === 'Red Zone') {
      return ['AstroAlert', 'CelestialPulse', 'AstroFitness', 'HourlyRisk', 'AstroBond', 'AstroLove'].includes(cardName);
    }
    if (zone === 'Yellow Zone') {
      return ['AstroEssence', 'CelestialPulse', 'AstroAlert', 'AstroMoney', 'AstroLove'].includes(cardName);
    }
    if (zone === 'Green Zone') {
      return ['AstroCareer', 'AstroConnect', 'AstroBond', 'AstroMoney'].includes(cardName);
    }
    return false;
  };
  
  
  useFocusEffect(
    useCallback(() => {
      const checkIfRefetchNeeded = async () => {
        const storedStr = await AsyncStorage.getItem('@daily_energy');
        const storedDate = await AsyncStorage.getItem('@daily_energy_date');
        const today = new Date().toISOString().split('T')[0];
  
        if (!storedStr || storedDate !== today) {
          console.log('📡 Refetching daily energy from API...');
          await fetchAndStoreDailyEnergy(); // ← this function calls the API and updates storage
          await AsyncStorage.setItem('@daily_energy_date', today);
        } else {
          console.log('📦 Using cached daily energy');
          setDailyEnergy(JSON.parse(storedStr));
        }
  
        // Re-sync profile photo + name just in case
        const profileStr = await AsyncStorage.getItem('userProfile');
        const profile = JSON.parse(profileStr || '{}');
        if (profile.photo) setProfilePhotoUrl(profile.photo);
        if (profile.name) setUserName(profile.name);
        const coinStr = await AsyncStorage.getItem('@wallet_dharma_coins');
        setCoinBalance(parseInt(coinStr || '0'));

      };
  
      checkIfRefetchNeeded();
  
      return () => {
        console.log('🏃‍♂️ HomeScreen unfocused');
      };
    }, [])
  );
  
  

  const calculateStreak = (dateList) => {
    const today = new Date();
    let streak = 0;
  
    const sorted = dateList
      .map((d) => new Date(d))
      .sort((a, b) => b - a); // latest to oldest
  
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date();
      expected.setDate(today.getDate() - i);
  
      const dateMatch =
        expected.getFullYear() === sorted[i].getFullYear() &&
        expected.getMonth() === sorted[i].getMonth() &&
        expected.getDate() === sorted[i].getDate();
  
      if (dateMatch) streak++;
      else break;
    }
  
    return streak;
  };

  // 

const simulateImagePick = async () => {
  try {

    const asset = Asset.fromModule(testImage);
    await asset.downloadAsync();
  
    const localUri = asset.localUri || asset.uri;
    const filename = localUri.split('/').pop();
    const cachePath = `${FileSystem.cacheDirectory}copy_${filename}`;  // ✅ different path

  
    await FileSystem.copyAsync({ from: localUri, to: cachePath }); // ✅ no same path

    console.log('localUri-',localUri);

    console.log('filename-',filename);

    console.log('cachePath-',cachePath);

  
    result.assets.push({
      uri: cachePath,
      fileName: `copy_${filename}`,
    });
    
  } catch (err) {
    console.error('❌ Failed to simulate image pick:', err);
    return null;
  }
};

// 



const getBlobFromUri = (uri) => {
  console.log('🔧 Converting URI to blob:', uri);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      console.log('✅ Blob loaded successfully');
      resolve(xhr.response);
    };
    xhr.onerror = (e) => {
      console.error('❌ Failed to convert URI to blob:', e);
      reject(new TypeError('Network request failed'));
    };

    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};




const uploadProfileImage = async (uri, filename, onProgress) => {
  try {
    console.log('📸 Selected URI:', uri);

    // STEP 1: Anonymous sign-in (if not already signed in)

      const userCred = await signInAnonymously(
        auth
      );
      const idToken = await userCred.user.getIdToken();
      const uid = userCred.user.uid;

   
      
    
      console.log('🔐 Anonymous sign-in complete. UID:', uid);

   
      console.log('🔑 ID Token:', idToken); // Optional: use for secure API calls
    

    // STEP 2: Compress image
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 512 } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.PNG,
      }
    );
    console.log('🗜️ Compressed URI:', compressed.uri);

    // STEP 3: Convert to blob
    const response = await fetch(compressed.uri);
    const blob = await response.blob();
    console.log('✅ Blob created, size:', blob.size);

    // STEP 4: Upload to Firebase Storage under avatars/{uid}/
    const storage = getStorage(undefined, "gs://kundli-auth-test.firebasestorage.app");
    const imageRef = ref(storage, `avatars/${uid}/profile.png`);
    await uploadBytes(imageRef, blob);

    // STEP 5: Get public download URL
    const downloadUrl = await getDownloadURL(imageRef);
    console.log('✅ Upload successful. URL:', downloadUrl);

    // const finalPhotoURL = downloadUrl;

    return { downloadUrl, uid };
  } catch (e) {
    console.error('❌ Upload failed:', e);
    throw e;
  }
};


  const updateStreakTracker = async (uid) => {
    //const db = getFirestore();
    const trackerRef = doc(db, 'users', uid, 'streakTracker', 'data');
    const today = new Date().toISOString().split('T')[0];
  
    const snapshot = await getDoc(trackerRef);
    const existing = snapshot.exists() ? snapshot.data() : null;
  
    let currentStreak = 1;
    let maxStreak = 1;
  
    if (existing) {
      const lastDate = existing.lastLoggedDate;
  
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expected = yesterday.toISOString().split('T')[0];
  
      if (lastDate === today) {
        // 🔁 Already logged today — use existing streak
        currentStreak = existing.currentStreak;
        maxStreak = existing.maxStreak || 1;
      } else if (lastDate === expected) {
        // ➕ Continue streak
        currentStreak = existing.currentStreak + 1;
        maxStreak = Math.max(existing.maxStreak || 1, currentStreak);
      } else {
        // 🔄 Break
        currentStreak = 1;
        maxStreak = Math.max(existing.maxStreak || 1, currentStreak);
      }
    }
  
    await setDoc(trackerRef, {
      lastLoggedDate: today,
      currentStreak,
      maxStreak,
    });
  
    console.log("✅ Streak updated:", currentStreak, maxStreak);
  };


    const getStreakTracker = async (uid) => {
    // const db = getFirestore();
    const ref = doc(db, 'users', uid, 'streakTracker', 'data');
    const snap = await getDoc(ref);
  
    if (snap.exists()) {
      return snap.data();
    } else {
      return {
        currentStreak: 0,
        maxStreak: 0,
        lastLoggedDate: null,
      };
    }
  };

  //
    useEffect(() => {
      const authenticateAndFetchDailyEnergy = async () => {
        try {
          console.log('🌅 Fetching new daily energy...');
      
          // 1. Sign in
          const userCred = await signInAnonymously(auth);
          const idToken = await userCred.user.getIdToken(); 
          const uid = userCred.user.uid;

          
      
          // 2. Load profile
          const profileStr = await AsyncStorage.getItem('userProfile');
          const profile = JSON.parse(profileStr || '{}');
          const name = profile?.name || 'Unknown';
          const photo = profile?.photo || '';
          // const dob = new Date(profile?.dob || '').toISOString().split('T')[0];
          const dob = profile?.dob?.split('T')[0] || '';

          const tob = new Date(profile?.tob || '').toTimeString().slice(0, 5);
          const pob = profile?.pob || '';
          const social_handles = profile?.social_handles || {};

            // 3. ✅ Save user profile to Firestore (this was missing)
       //    const db = getFirestore();
          const userRef = doc(db, 'users', uid);
          await setDoc(userRef, {
            name,
            photo,
            dob,
            tob,
            pob,
            search_name: name.toLowerCase(),
            createdAt: new Date().toISOString()
          }, { merge: true });
          console.log('📝 User profile saved to Firestore');
      
          // 3. Call daily energy API
          const res = await fetch(`${BASE_URL}/api/daily-energy`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, dob, tob, pob, photo, social_handles }),
          });
      
          const json = await res.json();
          console.log('✅ Daily Energy:', json);
      
          // 4. Save locally
          setDailyEnergy(json);
          await AsyncStorage.setItem('@daily_energy', JSON.stringify(json));
          await AsyncStorage.setItem('@daily_energy_date', new Date().toISOString().split('T')[0]);
      
          // 5. Save to Firestore dailyLogs
         // const db = getFirestore();
          const today = new Date().toISOString().split('T')[0];
          await setDoc(
            doc(db, "users", uid, "dailyLogs", today),
            {
              dailyEnergy: json,
              timestamp: new Date().toISOString()
            },
            { merge: true }
          );
      
          console.log("📝 Daily energy saved to Firestore for", today);
      
          // 6. Streak logic
          await updateStreakTracker(uid);
          const streakData = await getStreakTracker(uid);
          setStreakInfo({
            current: streakData.currentStreak,
            max: streakData.maxStreak,
          });
      
          // 7. Optional
          getUserChart();
      
        } catch (err) {
          console.error('❌ Error in fetchAndStoreDailyEnergy:', err);
          setError(err.message);
        }
      };
      
      authenticateAndFetchDailyEnergy();
    }, []);

    const handleChangeProfileImage = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
  
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const { downloadUrl } = await uploadProfileImage(uri, 'profile.png');
  
        // 🔁 Update AsyncStorage
        const profileStr = await AsyncStorage.getItem('userProfile');
        const profile = JSON.parse(profileStr || '{}');
        const updated = { ...profile, photo: downloadUrl };
        await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
  
        setProfilePhotoUrl(downloadUrl);
        console.log('✅ New profile image uploaded and applied.');
      }
    };
  
  
    useEffect(() => {
      let interval = null;
    
      if (streakInfo.current > 0) {
        setAnimatedStreak(0);
    
        interval = setInterval(() => {
          setAnimatedStreak((prev) => {
            if (prev < Math.min(streakInfo.current, 7)) {
              return prev + 1;
            } else {
              clearInterval(interval);
              return prev;
            }
          });
        }, 200);
      }
    
      return () => clearInterval(interval);
    }, [streakInfo.current]);
    
    const getDailyEnergyFromStorage = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@daily_energy');
        if (jsonValue != null) {
          const parsed = JSON.parse(jsonValue);
          console.log('📦 Loaded dailyEnergy from AsyncStorage:', parsed);
          setDailyEnergy(parsed);
        } else {
          console.log('⚠️ No dailyEnergy found in AsyncStorage');
        }
      } catch (e) {
        console.error('❌ Error reading dailyEnergy from AsyncStorage:', e);
      }
    };
    
    const getZoneStyle = (zone) => {
      if (zone === 'Red Zone') {
        return { color: 'red', fontWeight: 'bold' };
      } else if (zone === 'Green Zone') {
        return { color: 'green', fontWeight: 'bold' };
      } else if (zone === 'Neutral Zone') {
        return { color: '#DAA520', fontWeight: 'bold' }; // golden
      } else {
        return { color: 'gray' };
      }
    };
    


    const energyContext = dailyEnergy ? {
      zone: dailyEnergy?.zone || '🟡 Yellow Zone',
      moonSign: dailyEnergy?.moon_sign || 'Unknown',
      ascendant: dailyEnergy?.ascendant || 'Unknown',
      dasha: dailyEnergy?.user_Chart?.mahadasha && dailyEnergy?.user_Chart?.antardasha
        ? `${dailyEnergy.user_Chart.mahadasha} > ${dailyEnergy.user_Chart.antardasha}`
        : 'Unknown',
      weakPlanet: dailyEnergy?.weak_planet || 'None',
      focus: dailyEnergy?.focus || 'Spiritual Balance'
    } : {
      zone: '🟡 Yellow Zone',
      moonSign: 'Aries',
      ascendant: 'Cancer',
      dasha: 'Ketu > Venus > Sun',
      weakPlanet: 'Saturn',
      focus: 'Career'
    };

  const mockPosts = [
    {
      platform: 'Instagram',
      image: InstagramIcon,
      caption: 'Align your week with the Moon 🌙 #AstroTips',
      link: 'https://www.instagram.com/astrovue.official/'
    },
    {
      platform: 'YouTube',
      image: YouTubeIcon,
      caption: 'New Rituals for Mars Transit 🔥',
      link: 'https://www.youtube.com/@astrovue'
    },
    {
      platform: 'Twitter (X)',
      image: TwitterIcon,
      caption: 'Your Dasha is your destiny. Know it, own it. 🕉️',
      link: 'https://twitter.com/astrovueapp'
    }
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
    {profilePhotoUrl && (
     
      <LinearGradient
      colors={['#F0F8FF', '#EBF8FF']}// Azure Serenity gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.profileHeaderGradient, { marginBottom: 16 }]}
      >
        <View style={styles.profileRow}>
          <Image source={{ uri: profilePhotoUrl }} style={styles.avatar} />

          <View style={styles.nameAndEdit}>
            <Text style={styles.nameText}>Hi {userName || 'there'} 👋</Text>
            <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile}>
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.walletBox}
            onPress={() => navigation.navigate('DharmaRecharge')}
          >
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.walletIcon}>💰</Text>
                <Text style={styles.walletBalance}>{coinBalance}</Text>
              </View>
              <Text style={styles.walletLabel}>Dharma Coins</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
)}

<LinearGradient
  colors={['#FAF3E0', '#e0f6ff']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={[styles.sectionWrap, styles.energySection, { padding: 12, borderRadius: 16, marginBottom: 16 }]}
>
  <Text style={styles.header}>⚡ Energy Dashboard</Text>

  <View style={[
    styles.energyBox,
    getCardHighlight('EnergyDashboard') && styles.highlightCard
  ]}>

    {/* ZONE PILL + PROMPT */}
    <View style={styles.zonePillWrapper}>
      <Text style={[
        styles.zonePill,
        dailyEnergy?.zone === 'Red Zone' && styles.redPill,
        dailyEnergy?.zone === 'Green Zone' && styles.greenPill,
        dailyEnergy?.zone === 'Neutral Zone' && styles.yellowPill
      ]}>
        {dailyEnergy?.zone || 'Neutral Zone'}
      </Text>

  
    </View>

    {/* MOON + ASCENDANT */}
    <Text style={styles.energyLine}>
      🌙 <Text style={styles.energyLabel}>Moon:</Text> {dailyEnergy?.moon_sign || 'Unknown'} {' '}
      ↑ <Text style={styles.energyLabel}>Ascendant:</Text> {dailyEnergy?.ascendant || 'Unknown'}
    </Text>

    {/* DASHA HIGHLIGHT */}
    <Text style={styles.energyLine}>
      🕉️ <Text style={styles.energyLabel}>Dasha:</Text>
      <Text style={styles.dashaSegment}> {dailyEnergy?.user_Chart?.mahadasha || '?'}</Text> {'>'}
      <Text style={styles.dashaSegment}> {dailyEnergy?.user_Chart?.antardasha || '?'}</Text> {'>'}
      <Text style={styles.dashaSegment}> {dailyEnergy?.user_Chart?.pratyantar || '?'}</Text> {'>'}
      <Text style={styles.dashaSegment}> {dailyEnergy?.user_Chart?.sookshma || '?'}</Text> {'>'}
      <Text style={styles.dashaSegment}> {dailyEnergy?.user_Chart?.prana || '?'}</Text>
    </Text>

    {/* INSIGHT + FOCUS */}
    <Text style={styles.energyLine}>
      🔮 <Text style={styles.energyLabel}>Insight:</Text> <Text style={styles.energyItalic}>{insight}</Text>
    </Text>

    <Text style={styles.energyLine}>
      🧠 <Text style={styles.energyLabel}>Focus:</Text> <Text style={styles.energyItalic}>{focus}</Text>
    </Text>

  </View>
  </LinearGradient>



      {/* <View style={styles.featureCardWrapper}>
        <TouchableOpacity style={styles.featureCard} onPress={() => nav('AstroSocial')}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🌟 Your Karmic Pulse</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
          </View>
          <Text style={styles.cardSub}>Decode aura, see karmic feed, and express your thoughts.</Text>
          <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
            <TouchableOpacity onPress={() => nav('AuraScreen')}><Text style={styles.linkBtn}>View Aura</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => nav('AstroPost')}><Text style={styles.linkBtn}>Share Thought</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => nav('AstroSocial')}><Text style={styles.linkBtn}>View Feed</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View> */}
       
       <LinearGradient
  colors={['#dbd7f2', '#e0f6ff']}  // Lavender → Sky Blue
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={[styles.sectionWrap, { padding: 12, borderRadius: 16, marginBottom: 16 }]}
>
  <Text style={styles.section}>🌌 Today’s Celestial Pulse</Text>

  <Text style={styles.zoneHint}>
    💡 Your Zone Alaysis from Energy Dashboard: These insights reflect your current zone, moon sign & planetary influences.
  </Text>

  <View style={styles.gridRow}>
    {/* Card 1: Planetary Pulse */}
    <Animated.View
      style={[
        styles.gridCard,
        styles.defaultCardBorder,
        getCardHighlight('CelestialPulse') && zone === 'Red Zone' && styles.redZoneCard
      ]}
    >
      <TouchableOpacity onPress={() => navigation.navigate('CelestialPulse')}>
        <Text style={styles.cardTitle}>🔭 Your Planetary Pulse</Text>
        <Text style={styles.cardSub}>Tap to uncover what’s unfolding today for you.</Text>
      </TouchableOpacity>
    </Animated.View>

    {/* Card 2: Hourly Risk Meter */}
    <Animated.View
      style={[
        styles.gridCard,
        styles.defaultCardBorder,
        getCardHighlight('HourlyRisk') && zone === 'Red Zone' && styles.redZoneCard
      ]}
    >
      <TouchableOpacity onPress={() => navigation.navigate('HourlyRisk')}>
        <Text style={styles.cardTitle}>📉 Hourly Risk Meter</Text>
        <Text style={styles.cardSub}>Tap to view hourly mood swings and danger periods.</Text>
      </TouchableOpacity>
    </Animated.View>
  </View>
  </LinearGradient>
}

<LinearGradient
  colors={['#fff5f6', '#ffd6f3']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={[styles.sectionWrap, { borderRadius: 16, padding: 12 }]}
>
  <Text style={styles.section}>💞 Your Bonds & Circle</Text>

  <Text style={styles.zoneHint}>
    🤝 Track karmic connections with friends, family, and partners.
  </Text>

  <TouchableOpacity style={[styles.astroCircleCard, { backgroundColor: '#fff2f0' }]} onPress={() => navigation.navigate('AstroCircle')}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={styles.cardTitle}>👥 AstroCircle</Text>
      {pendingRequests > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingRequests}</Text>
        </View>
      )}
    </View>
    <Text style={styles.cardSub}>
      Your friend & family karmic dashboard. Tap to explore all bonds and syncs.
    </Text>
  </TouchableOpacity>

  <View style={styles.gridRow}>
    <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#fff0f2' }]} onPress={() => nav('AstroBond')}>
      <Text style={styles.cardTitle}>💖 AstroBond</Text>
      <Text style={styles.cardSub}>Check bond with someone</Text>
    </TouchableOpacity>

    <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#fff0f2' }]} onPress={() => nav('AstroLove')}>
      <Text style={styles.cardTitle}>💕 AstroLove</Text>
      <Text style={styles.cardSub}>Today’s vibe + compatibility + rituals</Text>
    </TouchableOpacity>
  </View>
</LinearGradient>


<LinearGradient
  colors={['#fffbe6', '#f0f9e8']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={[styles.sectionWrap, { borderRadius: 16, padding: 12 }]}
>
  <Text style={styles.section}>💼 Career & Wealth</Text>

  <Text style={styles.zoneHint}>
    📈 Unlock your karmic career path and tap into prosperity potential.
  </Text>

  <View style={styles.gridRow}>
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: '#fff9eb' }]}
      onPress={() => nav('AstroCareer')}
    >
      <Text style={styles.cardTitle}>🧠 AstroCareer</Text>
      <Text style={styles.cardSub}>Career traits + Dasha timeline</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: '#fff9eb' }]}
      onPress={() => nav('AstroMoney')}
    >
      <Text style={styles.cardTitle}>💰 AstroMoney</Text>
      <Text style={styles.cardSub}>Wealth Yogas + risk alerts</Text>
    </TouchableOpacity>
  </View>
</LinearGradient>


<LinearGradient
  colors={['#e0f7fa', '#e6fff5']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={[styles.sectionWrap, { borderRadius: 16, padding: 12 }]}
>
  <Text style={styles.section}>📊 My Energy Timeline</Text>

  <Text style={styles.zoneHint}>
    🔄 Track your energy streaks, peak days & flow patterns.
  </Text>

  <TouchableOpacity style={[styles.streakCard, { backgroundColor: '#ffffffcc' }]} onPress={() => nav('EnergyTimeline')}>
    <Text style={styles.cardTitleSmall}>🔥 Streak: {streakCount} days</Text>
    <Text style={styles.cardSubSmall}>🏆 Max: {maxStreak} days</Text>
  </TouchableOpacity>
</LinearGradient>


<LinearGradient
  colors={['#fff5f6', '#E6F4FF']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={[styles.sectionWrap, { borderRadius: 16, padding: 12, marginTop: 20 }]}
>
  <Text style={styles.section}>🌱 Life & Wellness Support</Text>
  <Text style={styles.zoneHint}>
    🛡️ Choose a path for gentle guidance & supportive insights.
  </Text>

  {/* Full-width Cards */}
  <TouchableOpacity
    style={[styles.fullCard, { backgroundColor: '#ffdfe0' }]}
    onPress={() => navigation.navigate('MarriageProblems')}
  >
    <Text style={styles.cardTitle}>💖 Partnership Harmony</Text>
    <Text style={styles.cardSub}>Supportive insights for marital wellness</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.fullCard, { backgroundColor: '#e8f5e9' }]}
    onPress={() => navigation.navigate('MoneyProblems')}
  >
    <Text style={styles.cardTitle}>💸 Financial Freedom</Text>
    <Text style={styles.cardSub}>Guidance for abundant money flow</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.fullCard, { backgroundColor: '#fff3e0' }]}
    onPress={() => navigation.navigate('RelationshipProblems')}
  >
    <Text style={styles.cardTitle}>❤️ Relationship Renewal</Text>
    <Text style={styles.cardSub}>Support for friendships & emotional bonds</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.fullCard, { backgroundColor: '#e3f2fd' }]}
    onPress={() => navigation.navigate('HealthProblems')}
  >
    <Text style={styles.cardTitle}>🌿 Holistic Health</Text>
    <Text style={styles.cardSub}>Well‑being insights for body & mind</Text>
  </TouchableOpacity>
</LinearGradient>





      <TouchableOpacity onPress={() => navigation.navigate('Reset')} style={{ marginTop: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center' }}>🧹 Developer Reset</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
          });

          console.log('🖼️ 2 result:', result);

          if (!result.canceled && result.assets.length > 0) {
            const photoUri = result.assets[0].uri;
            console.log('🖼️ 2 Picked test image:', photoUri);
            const filename = photoUri.split('/').pop();
            console.log('🖼️ filename test image:', filename);
            const uid = auth.currentUser?.uid;
            if (!uid) {
              alert('User not logged in');
              return;
            }
            const url = await uploadProfileImage(photoUri,filename,(v) =>console.log(v));
            console.log(url);
            alert(url ? '✅ Upload success!' : '❌ Upload failed.');
          }
        }}
        style={{ marginTop: 10 }}
      >
        <Text style={{ color: 'blue', textAlign: 'center' }}>🧪 Test Avatar Upload</Text>
      </TouchableOpacity>


      <View style={[styles.sectionWrap, { marginTop: 24 }]}>
        <Text style={styles.section}>📲 AstroVue Social Feed</Text>
        {mockPosts.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.socialCard}
            onPress={() => Linking.openURL(item.link)}
          >
            <Image source={item.image} style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 8 }} />
            <Text style={styles.cardTitle}>{item.platform}</Text>
            <Text style={styles.cardSub}>{item.caption}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  function renderSection(title, cards) {
    const rows = [];
  
    for (let i = 0; i < cards.length; i += 2) {
      rows.push(
        <View style={styles.gridRow} key={i}>
          {[cards[i], cards[i + 1]].filter(Boolean).map((card, idx) => {
            const highlight = getCardHighlight(card.screen); // 🔍 Zone-based logic
            const pulseAnim = useRef(new Animated.Value(1)).current;
  
            useEffect(() => {
              if (highlight && zone === 'Red Zone') {
                Animated.loop(
                  Animated.sequence([
                    Animated.timing(pulseAnim, {
                      toValue: 1.05,
                      duration: 600,
                      useNativeDriver: true
                    }),
                    Animated.timing(pulseAnim, {
                      toValue: 1,
                      duration: 600,
                      useNativeDriver: true
                    })
                  ])
                ).start();
              }
            }, [highlight]);
  
            const CardWrapper = highlight && zone === 'Red Zone' ? Animated.View : View;
  
            return (
              <CardWrapper
                key={idx}
                style={[
                  styles.gridCard,
                  styles.defaultCardBorder, // ✅ Default border on all cards
                  highlight && zone === 'Red Zone' && styles.redZoneCard,
                  highlight && zone === 'Red Zone' && { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <TouchableOpacity onPress={() => nav(card.screen)}>
                  <Text style={styles.cardTitle}>{card.icon} {card.title}</Text>
                  <Text style={styles.cardSub}>{card.sub}</Text>
                </TouchableOpacity>
              </CardWrapper>
            );
          })}
        </View>
      );
    }
  
    return (
      <View style={styles.sectionWrap}>
        <Text style={styles.section}>{title}</Text>
        {rows}
      </View>
    );
  }
  
}




const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 140,
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12
  },
  energyBox: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 20,
    backgroundColor: '#fff'
  },
  energyLine: {
    fontSize: 14,
    marginVertical: 2
  },
  bold: {
    fontWeight: '700'
  },
  sectionWrap: {
    marginBottom: 20
  },
  section: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  gridCard: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',  // Default subtle grey border
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  featureCardWrapper: {
    marginBottom: 24
  },
  featureCard: {
    backgroundColor: '#f0f8ff',
    borderLeftColor: '#6c5ce7',
    borderLeftWidth: 5,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4
  },
  fullWidthCard: {
    backgroundColor: '#ffeef4',
    borderLeftColor: '#e91e63',
    borderLeftWidth: 5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6
  },
  cardSub: {
    fontSize: 14,
    color: '#444'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badge: {
    backgroundColor: '#e53935',
    borderRadius: 12,
    minWidth: 24,
    paddingHorizontal: 6,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  linkBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c5ce7',
    paddingHorizontal: 10
  },
  socialCard: {
    backgroundColor: '#e0f7fa',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3
  },
  timelineCard: {
    backgroundColor: '#f9fbe7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4
  },
  timelineLine: {
    fontSize: 13,
    color: '#444',
    marginBottom: 2
  },
  streakCard: {
    backgroundColor: '#fff8e1',
    borderLeftColor: '#ff9800',
    borderLeftWidth: 5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3
  },
  streakLine: {
    fontSize: 24,
    letterSpacing: 4,
    marginTop: 6,
    
  },
  highlightCard: {
    borderColor: 'red',
    borderWidth: 2,
    backgroundColor: '#ffe6e6',
  },
  defaultCardBorder: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
  },
  
  redZoneCard: {
    borderColor: '#f44336',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  astroCircleCard: {
    backgroundColor: '#fceeff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#d81b60',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  badge: {
    backgroundColor: '#d81b60',
    borderRadius: 12,
    paddingHorizontal: 6,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 24,
    height: 24,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    fontSize: 14,
    backgroundColor: '#fff',
    padding: 2,
    borderRadius: 12,
  },
  editProfileBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 12,
    margin: 10,
  },
  editProfileText: {
    fontSize: 14,
    color: '#444',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: -10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  
  nameSection: {
    flex: 1,
    justifyContent: 'center',
  },
  
  nameText: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  
  editIcon: {
    fontSize: 14,
    marginRight: 4,
    color: '#888',
  },
  
  editText: {
    fontSize: 14,
    color: '#888',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
  },
  
  
  editBtn: {
    backgroundColor: '#eee',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  
  editBtnText: {
    fontSize: 14,
    color: '#333',
  },
  nameAndEdit: {
    flex: 1,
    justifyContent: 'center',
  },
  
  walletBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbe6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  
  walletIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  
  walletBalance: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6237a0',
  },
  
  editBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  
  editBtnText: {
    fontSize: 14,
    color: '#333',
  },
  energySection: {
    backgroundColor: '#f5eaff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  zonePillWrapper: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  zonePill: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    color: '#fff',
  },
  redPill: { backgroundColor: '#e53935' },
  greenPill: { backgroundColor: '#43a047' },
  yellowPill: { backgroundColor: '#fbc02d' },
  energyLabel: {
    fontWeight: '700',
    color: '#333',
  },
  energyItalic: {
    fontStyle: 'italic',
    color: '#444',
  },
  dashaSegment: {
    fontWeight: '700',
    color: '#6a1b9a',
  },
  zoneHint: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 2
  },
  zoneHint: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
    marginLeft: 2,
  },
  streakCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffffcc', // subtle translucence
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardTitleSmall: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  cardSubSmall: {
    fontSize: 14,
    color: '#555',
  },
  zoneHint: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
    marginLeft: 2,
  },
  gridCard: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fullCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  profileHeaderBorder: {
    borderWidth: 1,
    borderColor: '#FFE0E5',      // Soft bluish border behind gradient
    borderRadius: 12,
    marginBottom: 1,
  },
  profileHeaderGradient: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 11,            // Slightly less than border for inset look
  },
  

  
  
  
  

});
