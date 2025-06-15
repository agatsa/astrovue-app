import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

export default function Step3TobScreen({ navigation, route }) {
  const [tob, setTob] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleBack = () => navigation.goBack();

  const handleTimeChange = (event, selectedTime) => {
    setShowPicker(false);
    if (selectedTime) {
      setTob(selectedTime);
    }
  };

  const handleNext = () => {
    navigation.navigate('Step4Pob', {
      ...route.params,
      tob: tob.toISOString(), // pass safely
    });
  };

  return (
    <LinearGradient colors={['#f8f6ff', '#efeafd']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.inner}>
          <View style={styles.card}>
            <Text style={styles.title}>⏰ Enter Time of Birth</Text>
            <Text style={styles.subtext}>This helps calculate your ascendant sign</Text>

            <TouchableOpacity style={styles.inputBox} onPress={() => setShowPicker(true)}>
              <Text style={styles.inputText}>{tob.toTimeString().slice(0, 5)}</Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={tob}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <LinearGradient colors={['#7a4fe2', '#aa77ff']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Next →</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 10,
  },
  subtext: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputBox: {
    backgroundColor: '#f7f4ff',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 30,
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
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
  backButton: {
    alignSelf: 'center',
    marginTop: 5,
  },
  backButtonText: {
    color: '#555',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
