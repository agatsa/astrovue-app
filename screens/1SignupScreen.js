import { BASE_URL } from "../config/constants";
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, firebaseApp } from '../config/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri, CommonActions } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session'; // ✅ FIXED
import { signInAnonymously } from 'firebase/auth'; // ✅ Add this near top

WebBrowser.maybeCompleteAuthSession();

const db = getFirestore(firebaseApp);

export default function SignupScreen({ navigation, setUser }) {
  const scrollRef = useRef();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [pob, setPob] = useState('');
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [gender, setGender] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [placeSelected, setPlaceSelected] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '744251350742-um3dg2e16p8hg0fs4l0ke7dcmlfepbqo.apps.googleusercontent.com',
    iosClientId: '744251350742-um3dg2e16p8hg0fs4l0ke7dcmlfepbqo.apps.googleusercontent.com',
    androidClientId: '744251350742-um3dg2e16p8hg0fs4l0ke7dcmlfepbqo.apps.googleusercontent.com',
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true })
  });

  useEffect(() => {
    const authenticate = async () => {
      if (response?.type === 'success') {
        try {
          const { id_token } = response.params;
          const credential = GoogleAuthProvider.credential(id_token);
          const userCredential = await signInWithCredential(auth, credential);
  
          // 🔄 Force-refresh token
          await userCredential.user.getIdToken(true);
  
          // 🧠 Register and store UID
          await registerUser(userCredential.user.uid);
          await AsyncStorage.setItem('user_id', userCredential.user.uid);
          setUser(true); // 🚀 Login success
        } catch (err) {
          console.error('❌ Google Login Error:', err);
          Alert.alert('Login Error', err.message);
        }
      }
    };
    authenticate();
  }, [response]);
  

  const fetchLocationDetails = async (placeName) => {
    setPob(placeName);
    setLat(null);
    setLon(null);
    setPlaceSelected(false);
    setPlaceSuggestions([]);
    if (placeName.length < 3) return;
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(placeName)}&apiKey=e9f6e35190004f1084145df8814cecf9`
      );
      const data = await res.json();
      if (data.features) {
        setPlaceSuggestions(data.features);
      }
    } catch (e) {
      console.log('GeoAPI error:', e);
    }
  };

  const handlePlaceSelect = (item) => {
    setPob(item.properties.formatted);
    setLat(item.properties.lat);
    setLon(item.properties.lon);
    setPlaceSelected(true);
    setPlaceSuggestions([]);
  };

  const validateFields = () => {
    if (!name || !dob || !tob || !pob || !gender || !phone) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert('Validation Error', 'Please fill all required fields.');
      return false;
    }
    return true;
  };

  const registerUser = async (uid) => {
    const userData = {
      user_id: uid,
      name,
      dob,
      tob,
      pob,
      lat,
      lon,
      gender,
      instagram,
      twitter,
      created_at: new Date().toISOString(),
    };

    try {
      console.log('Saving user:', userData);
      await setDoc(doc(db, 'users', uid), userData, { merge: true });
      await AsyncStorage.setItem('user_id', uid);
      await AsyncStorage.setItem('userProfile', JSON.stringify(userData));

    // ✅ Let App.js detect this and show Tabs
    setUser(true);
      } catch (error) {
        console.error("Signup error:", error);
      }
    };

    const handleContinue = async () => {
      if (!validateFields()) return;
    
      try {
        // 👤 Sign in anonymously
        const userCredential = await signInAnonymously(auth);
        const uid = userCredential.user.uid;
    
        // 🔄 Force-refresh token
        await userCredential.user.getIdToken(true);
    
        // 📦 Register user in Firestore and AsyncStorage
        await registerUser(uid);
        await AsyncStorage.setItem('user_id', uid);
        setUser(true); // ✅ App.js will now navigate to Tabs
    
      } catch (error) {
        console.error("❌ Anonymous signup error:", error);
        Alert.alert("Signup Error", error.message);
      }
    };

  const googleLogin = () => {
    promptAsync();
  };

  const formatTime12Hr = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <ScrollView ref={scrollRef} style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>🔮 AstroVue Signup</Text>

      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />

      <TouchableOpacity style={styles.input} onPress={() => setDatePickerVisibility(true)}>
        <View style={styles.rowBetween}>
          <Text style={{ color: dob ? '#000' : '#888' }}>{dob || 'Select Date of Birth'}</Text>
          <Ionicons name="calendar" size={20} color="#888" />
        </View>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        display="default"
        onConfirm={(date) => {
          setDatePickerVisibility(false);
          setDob(date.toISOString().split('T')[0]);
        }}
        onCancel={() => setDatePickerVisibility(false)}
      />

      <TouchableOpacity style={styles.input} onPress={() => setTimePickerVisibility(true)}>
        <View style={styles.rowBetween}>
          <Text style={{ color: tob ? '#000' : '#888' }}>{tob || 'Select Time of Birth'}</Text>
          <Ionicons name="time" size={20} color="#888" />
        </View>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        display="default"
        onConfirm={(time) => {
          setTimePickerVisibility(false);
          setTob(formatTime12Hr(time));
        }}
        onCancel={() => setTimePickerVisibility(false)}
      />

      <TextInput
        style={styles.input}
        placeholder="Place of Birth"
        value={pob}
        onChangeText={fetchLocationDetails}
      />

      {placeSelected && lat && lon && (
        <Text style={styles.coordinates}>✅ {lat.toFixed(4)}, {lon.toFixed(4)}</Text>
      )}

      {placeSuggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {placeSuggestions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => handlePlaceSelect(item)}
            >
              <Text>{item.properties.formatted}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TextInput style={styles.input} placeholder="Gender (Male/Female/Other)" value={gender} onChangeText={setGender} />
      <TextInput style={styles.input} placeholder="Instagram Handle (optional)" value={instagram} onChangeText={setInstagram} />
      <TextInput style={styles.input} placeholder="Twitter Handle (optional)" value={twitter} onChangeText={setTwitter} />
      <TextInput style={styles.input} placeholder="📱 Phone Number (+91...)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Button title="Continue" onPress={handleContinue} />
      <Text style={styles.or}>──────── or ────────</Text>
      <Button title="Continue with Google" onPress={googleLogin} color="#4285F4" /> 
      <Button
        title="🔐 Log Firebase ID Token"
        color="#6a1b9a"
        onPress={async () => {
          try {
            const user = auth.currentUser;
            if (!user) {
              Alert.alert("Not logged in", "Please login first using Google or phone.");
              return;
            }
            const token = await user.getIdToken(true);
            console.log("🔑 Firebase ID Token:\n", token);
            Alert.alert("Token logged to console", "Copy it from the terminal for curl.");
          } catch (err) {
            console.error("Token error:", err);
            Alert.alert("Error", err.message);
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fffaf0',
    flex: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  or: {
    textAlign: 'center',
    marginVertical: 12,
    color: '#888',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordinates: {
    marginBottom: 10,
    fontSize: 12,
    color: 'green',
  },
  suggestionBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    maxHeight: 150,
    marginBottom: 10,
  },
  suggestionItem: {
    padding: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});
