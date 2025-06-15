
import React from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions } from '@react-navigation/native';


export default function Step7ConfirmScreen({ navigation, route }) {
  const {
    name,
    dob,
    tob,
    pob,
    email,
    photo,
  } = route.params;

  const formatDate = (d) => {
    try {
      return new Date(d).toDateString();
    } catch {
      return '';
    }
  };

  const formatTime = (t) => {
    try {
      const date = new Date(t);
      return date.toTimeString().slice(0, 5);
    } catch {
      return '';
    }
  };

  const onConfirm = async () => {
    await AsyncStorage.setItem('userProfile', JSON.stringify(route.params));
  
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Home' }],  // This refers to the tab name
      })
    );
  };
  

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

            {photo && (
              <Image source={{ uri: photo }} style={styles.image} />
            )}

            <TouchableOpacity style={styles.button} onPress={onConfirm}>
              <LinearGradient colors={['#7a4fe2', '#aa77ff']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Confirm & Start</Text>
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
