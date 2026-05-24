import { BASE_URL } from "../../config/constants";
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';



export default function Step7ConfirmScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const {
    name,
    dob,
    tob,
    pob,
    email,
    phoneNumber, // this already has +91
    photo,
    countryCode,
  } = route.params;


  // const formatDate = (d) => {
  //   try {
  //     return new Date(d).toDateString();
  //   } catch {
  //     return '';
  //   }
  // };

  // const formatTime = (t) => {
  //   try {
  //     const date = new Date(t);
  //     return date.toTimeString().slice(0, 5);
  //   } catch {
  //     return '';
  //   }
  // };

  const formatDate = (d) => {
    try {
      const date = new Date(d);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;  // e.g., "1997-12-18"
    } catch {
      return '';
    }
  };

  const formatTime = (t) => {
    try {
      const date = new Date(t);
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${hh}:${min}`;  // e.g., "18:15"
    } catch {
      return '';
    }
  };




  const onConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const userPayload = {
        name,
        email,
        phone: phoneNumber,
        dob: formatDate(dob),
        tob: formatTime(tob),
        pob,
        photo,
        social_handles: {
          instagram: '',
          facebook: '',
          twitter: '',
        },
      };

      console.log('📤 Payload to send:', userPayload);

      const createRes = await fetch(`${BASE_URL}/api/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPayload),
      });

      const responseText = await createRes.text();
      let responseData = {};
      try {
        responseData = JSON.parse(responseText);
      } catch {
        console.warn('Invalid JSON from server:', responseText);
      }

      if (!createRes.ok) {
        Alert.alert('Error', responseData.message || 'User creation failed');
        return;
      }

      // Save profile — App.js polls AsyncStorage every 2s and switches to main automatically
      await AsyncStorage.setItem('userProfile', JSON.stringify({
        ...userPayload,
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('❌ Confirm error:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };



  // const onConfirm = async () => {
  //   try {
  //     // const { getAuth } = require('firebase/auth');
  //     // const auth = getAuth();
  //     // const user = auth.currentUser;

  //     // if (!user) {
  //     //   throw new Error('User not signed in');
  //     // }

  //     // const idToken = await user.getIdToken();

  //     // ✅ Call create-user API
  //     const createRes = await fetch('http://192.168.1.26:8080/api/create-user', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         name,
  //         email,
  //         phone: `+${countryCode}${phoneNumber}`,
  //         dob,
  //         tob,
  //         pob,
  //         photo,
  //         social_handles: {}, // optional for now
  //       }),
  //     });

  //     const createData = await createRes.json();
  //     console.log('📩 /create-user response:', createData);

  //     if (!createRes.ok) {
  //       console.warn('⚠️ Backend error on create-user:', createData);
  //     }

  //     // ✅ Save locally
  //     await AsyncStorage.setItem(
  //       'userProfile',
  //       JSON.stringify({
  //         name,
  //         dob,
  //         tob,
  //         pob,
  //         email,
  //         phone: `+${countryCode}${phoneNumber}`,
  //         photo,
  //         countryCode,
  //         updatedAt: new Date().toISOString(),
  //       })
  //     );

  //     // ✅ Go to Home
  //     navigation.dispatch(
  //       CommonActions.reset({
  //         index: 0,
  //         routes: [{ name: 'Home' }],
  //       })
  //     );

  //   } catch (error) {
  //     console.error('❌ Confirm error:', error);
  //     Alert.alert('Error', 'Could not complete registration');
  //   }
  // };




  return (
    <LinearGradient colors={['#f8f6ff', '#efeafd']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inner}
        >
          <ScrollView contentContainerStyle={styles.card}>
            <Text style={styles.title}>✅ Confirm Your Details</Text>

            <Text style={styles.label}>Name: <Text style={styles.value}>{name}</Text></Text>
            <Text style={styles.label}>DOB: <Text style={styles.value}>{formatDate(dob)}</Text></Text>
            <Text style={styles.label}>TOB: <Text style={styles.value}>{formatTime(tob)}</Text></Text>
            <Text style={styles.label}>POB: <Text style={styles.value}>{pob}</Text></Text>
            <Text style={styles.label}>Email: <Text style={styles.value}>{email}</Text></Text>
            <Text style={styles.label}>Phone: <Text style={styles.value}>{`+${countryCode} ${phoneNumber}`}</Text></Text>


            {photo && (
              <Image source={{ uri: photo }} style={styles.image} />
            )}

            <TouchableOpacity style={styles.button} onPress={onConfirm} disabled={loading}>
              <LinearGradient colors={['#7a4fe2', '#aa77ff']} style={styles.buttonGradient}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Confirm & Start</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    padding: 28,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4b3e8a',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#444',
    marginVertical: 6,
  },
  value: {
    fontWeight: '600',
    color: '#000',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop: 20,
    alignSelf: 'center',
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 30,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
