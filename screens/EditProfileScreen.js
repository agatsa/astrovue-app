import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Image, TouchableOpacity,
  Alert, ScrollView, Button, Platform, KeyboardAvoidingView, Pressable,
  StatusBar, SafeAreaView,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';

const GEOAPIFY_KEY = 'e9f6e35190004f1084145df8814cecf9';

const auth = getAuth();

export default function EditProfileScreen({ navigation }) {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [pob, setPob] = useState('');
  const [image, setImage] = useState(null);
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [placeSelected, setPlaceSelected] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [savedPhone, setSavedPhone] = useState('');
  const [bio, setBio] = useState('');
  const [services, setServices] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const fbUser = auth.currentUser;
        const profileStr = await AsyncStorage.getItem('userProfile');
        const profile = JSON.parse(profileStr || '{}');

        const nameVal = profile?.name || fbUser?.displayName || '';
        const photoVal = profile?.photo || fbUser?.photoURL || '';
        const dobVal = profile?.dob ? new Date(profile.dob).toISOString().split('T')[0] : '';
        const tobVal = typeof profile?.tob === 'string' && profile.tob.includes(':') ? profile.tob : '';

        setName(nameVal);
        setImage(photoVal);
        setDob(dobVal);
        setTob(tobVal);
        setPob(profile?.pob || '');
        setSavedPhone(profile?.phone || profile?.phoneNumber || '');
        setBio(profile?.bio || '');
        setServices(profile?.services || '');
        setWebsite(profile?.website || '');

        if (profile?.lat) setLat(profile.lat);
        if (profile?.lon) setLon(profile.lon);
        if (profile?.pob) setPlaceSelected(true);
      } catch (err) {
        console.error('❌ Failed to load profile:', err);
      }
    };

    loadUserProfile();
  }, []);

  const fetchLocationDetails = async (text) => {
    setPob(text);
    setLat(null);
    setLon(null);
    setPlaceSelected(false);
    setPlaceSuggestions([]);
    if (text.length < 3) return;

    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_KEY}`
      );
      const data = await res.json();
      if (data.features) setPlaceSuggestions(data.features);
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const photoUri = result.assets[0].uri;
      const filename = photoUri.split('/').pop();
      const { downloadUrl } = await uploadProfileImage(photoUri, filename);

      if (downloadUrl) {
        setImage(downloadUrl);
        const profileStr = await AsyncStorage.getItem('userProfile');
        const profile = JSON.parse(profileStr || '{}');
        await AsyncStorage.setItem('userProfile', JSON.stringify({ ...profile, photo: downloadUrl }));
      }
    }
  };

  const uploadProfileImage = async (uri, filename) => {
    try {
      const userCred = await signInAnonymously(auth);
      const uid = userCred.user.uid;
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.PNG }
      );
      const response = await fetch(compressed.uri);
      const blob = await response.blob();
      const storage = getStorage(undefined, 'gs://kundli-auth-test.firebasestorage.app');
      const imageRef = ref(storage, `avatars/${uid}/profile.png`);
      await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(imageRef);
      return { downloadUrl, uid };
    } catch (e) {
      console.error('❌ Upload failed:', e);
      return {};
    }
  };

  const handleTimeConfirm = (selectedTime) => {
    if (selectedTime) {
      const hh = selectedTime.getHours().toString().padStart(2, '0');
      const mm = selectedTime.getMinutes().toString().padStart(2, '0');
      setTob(`${hh}:${mm}`);
    }
    setShowTimePicker(false);
  };

  const saveProfile = async () => {
    if (!name || !dob || !tob || !pob) {
      Alert.alert('⚠️ Please complete all fields (Name, DOB, TOB, Place of Birth)');
      return;
    }
    if (!placeSelected || !lat || !lon) {
      Alert.alert('⚠️ Please select your place of birth from the suggestions list');
      return;
    }

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not signed in');

      const existingProfileStr = await AsyncStorage.getItem('userProfile');
      const existingProfile = JSON.parse(existingProfileStr || '{}');

      const profileData = {
        ...existingProfile,
        name,
        photo: image || existingProfile.photo || '',
        dob,
        tob,
        pob,
        lat,
        lon,
        bio,
        services,
        website,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));

      const db = getFirestore();
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...profileData,
        search_name: name.toLowerCase()
      }, { merge: true });

      Alert.alert('✅ Profile updated! Your dashboard will now load.');
      navigation.goBack();
    } catch (err) {
      console.error('❌ Save error:', err);
      Alert.alert('❌ Failed to save profile', err.message);
    }
  };

  const topPad = StatusBar.currentHeight || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with back button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: topPad + 10, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5', backgroundColor: '#fff' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 12 }}>
          <Text style={{ fontSize: 26, color: '#333', lineHeight: 30 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A2E' }}>Edit Profile</Text>
      </View>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {image
            ? <Image source={{ uri: image }} style={styles.avatar} />
            : <View style={styles.placeholder}><Text>Select Image</Text></View>}
          <Text style={styles.editPhotoText}>Change Profile Photo</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />

        <Text style={styles.label}>Date of Birth</Text>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <TextInput style={styles.input} value={dob} editable={false} placeholder="Tap to select DOB" />
        </Pressable>

        <Text style={styles.label}>Time of Birth</Text>
        <Pressable onPress={() => setShowTimePicker(true)}>
          <TextInput style={styles.input} value={tob} editable={false} placeholder="Tap to select TOB" />
        </Pressable>

        <Text style={styles.label}>Place of Birth</Text>
        <TextInput
          style={styles.input}
          value={pob}
          onChangeText={fetchLocationDetails}
          placeholder="Type your city (e.g. Kanpur, India)"
        />
        {placeSuggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {placeSuggestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handlePlaceSelect(item)}
              >
                <Text>{item.properties.formatted}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {placeSelected && lat && lon && (
          <Text style={styles.coordinates}>📍 {parseFloat(lat).toFixed(4)}, {parseFloat(lon).toFixed(4)}</Text>
        )}

        {/* ── Profile section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>✨ Your Public Profile</Text>
          <Text style={styles.sectionSub}>Visible to others on the social feed</Text>
        </View>

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell the community about yourself — your astrological journey, insights, or what you love about Jyotish..."
          placeholderTextColor="#ABABAB"
          multiline
          maxLength={200}
          numberOfLines={4}
        />
        <Text style={styles.charCount}>{bio.length}/200</Text>

        <Text style={styles.label}>Services You Offer (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={services}
          onChangeText={setServices}
          placeholder="e.g. Kundli reading, Muhurat timing, Vastu consultation, Compatibility matching..."
          placeholderTextColor="#ABABAB"
          multiline
          maxLength={300}
          numberOfLines={3}
        />

        <Text style={styles.label}>Website / Instagram (optional)</Text>
        <TextInput
          style={styles.input}
          value={website}
          onChangeText={setWebsite}
          placeholder="https://instagram.com/yourhandle"
          placeholderTextColor="#ABABAB"
          autoCapitalize="none"
          keyboardType="url"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
          <Text style={styles.saveBtnTxt}>Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={dob ? new Date(dob) : new Date()}
          mode="date"
          display="default"
          onChange={(e, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDob(selectedDate.toISOString().split('T')[0]);
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={tob ? new Date(`2000-01-01T${tob}`) : new Date()}
          mode="time"
          display="spinner"
          is24Hour={true}
          onChange={(e, selectedTime) => handleTimeConfirm(selectedTime)}
        />
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { fontSize: 22, fontWeight: 'bold', alignSelf: 'center', marginBottom: 20 },
  imagePicker: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  placeholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd',
    justifyContent: 'center', alignItems: 'center',
  },
  editPhotoText: { marginTop: 6, color: '#007aff' },
  label: { fontWeight: '600', marginTop: 16, marginBottom: 4, color: '#333', fontSize: 14 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#1A1A2E', backgroundColor: '#FAFAFA',
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#ABABAB', textAlign: 'right', marginTop: 2 },
  sectionHeader: { marginTop: 28, marginBottom: 8, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  sectionSub: { fontSize: 12, color: '#8E8E8E', marginTop: 2 },
  saveBtn: { backgroundColor: '#7C3AED', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28, marginBottom: 10 },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  suggestionBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    maxHeight: 180,
    marginTop: 4,
    marginBottom: 4,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  coordinates: {
    fontSize: 13,
    color: 'green',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
});
