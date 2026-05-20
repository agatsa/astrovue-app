import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Step4PobScreen({ navigation, route }) {
  const [pob, setPob] = useState('');
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [placeSelected, setPlaceSelected] = useState(false);
  const { name, dob, tob, phoneNumber, countryCode } = route.params || {};


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

  const handleNext = async () => {
    if (!pob.trim() || !lat || !lon) {
      alert('Please select a valid place from the list');
      return;
    }

    const latlongpayload = {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    };

    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('@latlong', JSON.stringify(latlongpayload));
      console.log('✅ Saved lat/lon to AsyncStorage:', latlongpayload);

      // Retrieve and confirm saved value (optional)
      const userlatlongStr = await AsyncStorage.getItem('@latlong');
      const userlatlong = JSON.parse(userlatlongStr || '{}');
      console.log('📦 Retrieved from AsyncStorage:', userlatlong);

      // Navigate to next step
      navigation.navigate('Step5Email', {
        ...route.params,
        pob,
        lat,
        lon,
      });
    } catch (error) {
      console.error('❌ Error saving lat/lon:', error);
      alert('Failed to save location. Please try again.');
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
            <Text style={styles.title}>🌍 Where were you born?</Text>
            <Text style={styles.subtext}>Enter your city or town of birth</Text>

            <TextInput
              style={styles.inputBox}
              placeholder="e.g. Kanpur, India"
              placeholderTextColor="#999"
              value={pob}
              onChangeText={fetchLocationDetails}
            />

            {placeSuggestions.length > 0 && (
              <ScrollView style={styles.suggestionBox}>
                {placeSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handlePlaceSelect(item)}
                  >
                    <Text>{item.properties.formatted}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {placeSelected && lat && lon && (
              <Text style={styles.coordinates}>📍 {lat.toFixed(4)}, {lon.toFixed(4)}</Text>
            )}

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <LinearGradient colors={['#7a4fe2', '#aa77ff']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Next →</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>← Go Back</Text>
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
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    marginBottom: 12,
  },
  coordinates: {
    fontSize: 13,
    color: 'green',
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestionBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    maxHeight: 160,
    marginBottom: 10,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 16,
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
  },
  backButtonText: {
    color: '#555',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
