// screens/PhoneLoginScreen.js
import { BASE_URL } from "../config/constants";
import React, { useState } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const COUNTRY_CODES = [
  { code: 'IN', name: 'India', dial: '91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dial: '1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧' },
  { code: 'AE', name: 'UAE', dial: '971', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', dial: '65', flag: '🇸🇬' },
  { code: 'AU', name: 'Australia', dial: '61', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦' },
  { code: 'NZ', name: 'New Zealand', dial: '64', flag: '🇳🇿' },
  { code: 'ZA', name: 'South Africa', dial: '27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dial: '234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dial: '254', flag: '🇰🇪' },
  { code: 'PK', name: 'Pakistan', dial: '92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dial: '880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', dial: '94', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', dial: '977', flag: '🇳🇵' },
];

export default function PhoneLoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showPicker, setShowPicker] = useState(false);

  const validatePhone = () => {
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length < 7) {
      setError('Please enter a valid mobile number');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhone()) return;
    const phoneNumber = phone.replace(/\D/g, '');
    const countryCode = selectedCountry.dial;

    try {
      const res = await fetch(`${BASE_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, countryCode }),
      });

      const data = await res.json();
      if (res.ok && data.success !== false) {
        navigation.navigate('OtpVerifyScreen', { phoneNumber, countryCode });
      } else {
        Alert.alert('OTP Failed', data.message || 'Something went wrong');
      }
    } catch (err) {
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
            <Text style={styles.subtitle}>We'll send you a 6-digit OTP</Text>

            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setShowPicker(true)}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryDial}>+{selectedCountry.dial}</Text>
                <Text style={styles.dropdownArrow}>▾</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.phoneInput}
                placeholder="Phone number"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={text => {
                  setPhone(text);
                  if (error) setError('');
                }}
                maxLength={15}
              />
            </View>

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

      <Modal visible={showPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Country</Text>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    item.code === selectedCountry.code && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.pickerFlag}>{item.flag}</Text>
                  <Text style={styles.pickerName}>{item.name}</Text>
                  <Text style={styles.pickerCode}>+{item.dial}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
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
  title: { fontSize: 28, fontWeight: 'bold', color: '#4b3e8a', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 25 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f5ff',
    borderRadius: 14,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    height: 56,
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    height: '100%',
    gap: 4,
  },
  countryFlag: { fontSize: 20 },
  countryDial: { fontSize: 15, color: '#333', fontWeight: '600' },
  dropdownArrow: { fontSize: 11, color: '#888', marginLeft: 2 },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingHorizontal: 12,
    height: '100%',
  },
  errorText: { color: '#d9534f', fontSize: 14, marginBottom: 16, marginLeft: 4 },
  button: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
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
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingTop: 16,
    paddingBottom: 32,
  },
  pickerTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 12, color: '#333' },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  pickerItemSelected: { backgroundColor: '#f3f0ff' },
  pickerFlag: { fontSize: 24 },
  pickerName: { flex: 1, fontSize: 16, color: '#333' },
  pickerCode: { fontSize: 15, color: '#7a4fe2', fontWeight: '600' },
});
