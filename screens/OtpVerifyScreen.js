// screens/OtpVerifyScreen.js
import React, { useState } from 'react';
import { BASE_URL } from "../config/constants";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OtpVerifyScreen({ route, navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { confirmation } = route.params;

  const { countryCode = '', phoneNumber = '' } = route?.params || {};


  const handleVerifyOTP = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // ✅ 1. Verify OTP via backend (MSG91)
      const res = await fetch(`${BASE_URL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode, phoneNumber, otp: code }),
      });
  
      const data = await res.json();
      console.log('✅ OTP verify response:', data);

      // const verifyData = res.data?.data; // ✅ add this line to extract the 'data' safely

      // // Now you can use:
      // console.log('Verified at:', verifyData.verifiedAt);
  
      if (!res.ok || data.success === false) {
        Alert.alert('Verification Failed', data.message || 'Please try again');
        setLoading(false);
        return;
      }

      // ✅ 2. Save phone immediately so onAuthStateChanged doesn't redirect
      const fullPhone = `+${countryCode}${phoneNumber}`;
      await AsyncStorage.setItem('@user_phone', fullPhone);
      await AsyncStorage.setItem('@phoneNumber', phoneNumber);

      // ✅ 3. Get Firebase custom token from backend and sign in
      try {
        const tokenRes = await fetch(`${BASE_URL}/api/firebase-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ countryCode, phoneNumber }),
        });
        const tokenData = await tokenRes.json();
        console.log('🔑 Custom token response:', tokenData.success);

        if (tokenData.success && tokenData.token) {
          await signInWithCustomToken(auth, tokenData.token);
          console.log('Firebase signed in OK, uid:', auth.currentUser?.uid);
        }
      } catch (tokenErr) {
        console.warn('⚠️ Firebase custom token sign-in failed (non-fatal):', tokenErr);
      }

      // ✅ 4. Check if user already exists in backend
      const checkRes = await fetch(`${BASE_URL}/api/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
        }),
      });
  
      const checkData = await checkRes.json();
      console.log('👀 User existence check:', checkData);
  
      // ✅ 5. Route based on existence
      if (checkData.exists) {
        // Save userProfile → App.js interval detects it and switches to MainTabs
        await AsyncStorage.setItem('userProfile', JSON.stringify(checkData.user || {}));
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Step1Name', params: { phoneNumber, countryCode } }],
        });
      }
  
    } catch (error) {
      console.error('❌ OTP Verify Error:', error);
      Alert.alert('Error', 'Something went wrong while verifying OTP');
      setLoading(false);
    }
  };
  
  
  
  
  
  

  return (
    <LinearGradient colors={['#f8f6ff', '#efeafd']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inner}
        >
          <View style={styles.card}>
            <Text style={styles.title}>🔐 Enter OTP</Text>
            <Text style={styles.subtitle}>We’ve sent an OTP to your phone</Text>

            <TextInput
              style={styles.input}
              placeholder="6-digit code"
              placeholderTextColor="#aaa"
              value={code}
              onChangeText={setCode}
              keyboardType="numeric"
              maxLength={6}
            />

            <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleVerifyOTP} disabled={loading}>
              <LinearGradient
                colors={['#7a4fe2', '#aa77ff']}
                style={styles.buttonGradient}
                start={[0, 0]}
                end={[1, 1]}
              >
                <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify & Continue →'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    fontSize: 26,
    fontWeight: '700',
    color: '#4b3e8a',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f7f4ff',
    borderRadius: 14,
    padding: 16,
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 30,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
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
