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

export default function Step2DobScreen({ navigation, route }) {
  const [dob, setDob] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleBack = () => navigation.goBack();

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  const handleNext = () => {
    const yyyy = dob.getFullYear();
    const mm = String(dob.getMonth() + 1).padStart(2, '0');
    const dd = String(dob.getDate()).padStart(2, '0');
  
    const formattedDob = `${yyyy}-${mm}-${dd}T00:00`; // No timezone shift
  
    navigation.navigate('Step3Tob', {
      name: route.params.name,
      dob: formattedDob,
    });
  };
  

  return (
    <LinearGradient colors={['#f8f6ff', '#efeafd']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.inner}>
          <View style={styles.card}>
            <Text style={styles.title}>📅 Select Your Date of Birth</Text>
            <Text style={styles.subtext}>This helps us calculate your Moon Sign</Text>

            <TouchableOpacity style={styles.inputBox} onPress={() => setShowPicker(true)}>
             <Text style={styles.inputText}>{dob ? new Date(dob).toDateString() : ''}</Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <LinearGradient
                colors={['#7a4fe2', '#aa77ff']}
                style={styles.buttonGradient}
              >
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
