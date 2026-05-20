import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function Step1NameScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const { phoneNumber, countryCode } = route.params || {};





  const handleNext = () => {
    if (name.trim()) {
      navigation.navigate('Step2Dob', {
        ...route.params,
        name,
      });
    } else {
      alert('Please enter your name');
    }
  };

  return (
    <LinearGradient
      colors={['#f8f6ff', '#efeafd']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inner}
        >
          <View style={styles.card}>
            <Text style={styles.title}>✨ Welcome to AstroVue</Text>
            <Text style={styles.subtitle}>Let's begin with your name</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <LinearGradient
                colors={['#7a4fe2', '#aa77ff']}
                style={styles.buttonGradient}
                start={[0, 0]}
                end={[1, 1]}
              >
                <Text style={styles.buttonText}>Next →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    fontSize: 16,
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
