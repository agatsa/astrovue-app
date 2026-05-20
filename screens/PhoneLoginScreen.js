// screens/PhoneLoginScreen.js
import { BASE_URL } from "../config/constants";
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PhoneInput from 'react-native-phone-number-input';
import * as Localization from 'expo-localization';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function PhoneLoginScreen({ navigation }) {
  const phoneInput = useRef(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const defaultCode = Localization.region || 'IN';

  const validatePhone = () => {
    const rawNumber = phoneInput.current?.getNumberAfterPossiblyEliminatingZero();
    const phoneNumber = rawNumber?.number?.replace(/\D/g, '') || '';
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid mobile number');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhone()) return;

    const rawNumber = phoneInput.current?.getNumberAfterPossiblyEliminatingZero();
    const phoneNumber = rawNumber?.number?.replace(/\D/g, '') || '';
    const countryCode = rawNumber?.countryCallingCode || '91';

    try {
      const res = await fetch(`${BASE_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, countryCode }),
      });

      const data = await res.json();
      console.log('✅ OTP send response:', data);

      if (res.ok && data.success !== false) {
        navigation.navigate('OtpVerifyScreen', { phoneNumber, countryCode });
      } else {
        Alert.alert('OTP Failed', data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error('❌ OTP Send Error:', err);
      Alert.alert('Error', err.message || 'OTP send failed');
    }
  };

  return (
    <LinearGradient colors={['#f3f0ff', '#e5dbff']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inner}
        >
          <Animatable.View animation="fadeInUp" duration={800} style={styles.card}>
            <Text style={styles.title}>📱 Verify Phone Number</Text>
            <Text style={styles.subtitle}>We’ll send you a 6-digit OTP</Text>

            <PhoneInput
              ref={phoneInput}
              defaultCode={defaultCode}
              layout="first"
              textInputProps={{
                placeholder: 'Enter phone number',
                placeholderTextColor: '#aaa',
              }}
              containerStyle={styles.phoneContainer}
              textContainerStyle={styles.phoneTextContainer}
              textInputStyle={styles.textInput}
              codeTextStyle={styles.codeText}
              onChangeText={text => {
                setPhone(text);
                if (error) validatePhone();
              }}
              onChangeFormattedText={setFormattedValue}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
              <LinearGradient
                colors={['#7a4fe2', '#aa77ff']}
                style={styles.buttonGradient}
                start={[0, 0]}
                end={[1, 1]}
              >
                <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.buttonText}>
                  Send OTP →
                </Animatable.Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4b3e8a',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  phoneContainer: {
    backgroundColor: '#f8f5ff',
    borderRadius: 14,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    height: 56,
    paddingHorizontal: 10,
  },
  phoneTextContainer: {
    backgroundColor: '#f8f5ff',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    paddingVertical: 0,
  },
  textInput: {
    color: '#000',
    fontSize: 16,
    paddingVertical: 12,
  },
  codeText: {
    color: '#000',
    fontSize: 16,
  },
  errorText: {
    color: '#d9534f',
    fontSize: 14,
    marginBottom: 16,
    marginLeft: 4,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#7a4fe2',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
