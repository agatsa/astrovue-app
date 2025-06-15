import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView } from 'react-native';

export default function Step6ProfilePhotoScreen({ navigation, route }) {
  const [photo, setPhoto] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission is required to access media library');
      return;
    }

    

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [1, 1],
      quality: 0.7,
    });

    console.log("📷 Picked image URI:", result.assets?.[0]?.uri || result.uri);


    if (!result.cancelled) {
      setPhoto(result.assets?.[0]?.uri || result.uri);
    }
  };

  const handleNext = () => {
    navigation.navigate('Step7Confirm', {
      ...route.params,
      photo, // optional, can be null
     
    });
  };

  const handleBack = () => navigation.goBack();

  return (
    <LinearGradient colors={['#f8f6ff', '#efeafd']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inner}
        >
          <View style={styles.card}>
            <Text style={styles.title}>🖼️ Add a profile photo</Text>
            <Text style={styles.subtext}>Optional but adds a personal touch!</Text>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} />
              ) : (
                <Text style={styles.pickText}>📷 Tap to choose</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <LinearGradient colors={['#7a4fe2', '#aa77ff']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Next →</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
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
  imagePicker: {
    backgroundColor: '#f7f4ff',
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  pickText: {
    color: '#777',
    fontSize: 16,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
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
