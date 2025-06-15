import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Image, TouchableOpacity,
  Alert, ScrollView, Button, Platform, KeyboardAvoidingView
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { getAuth } from 'firebase/auth';
const auth = getAuth();          // make sure Firebase is already initialised

import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import * as ImageManipulator from 'expo-image-manipulator';

import { signInAnonymously } from 'firebase/auth';



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

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // 1. Firebase Auth user
        const fbUser = auth.currentUser;
        console.log('🧾 Firebase User:', fbUser);
  
        // 2. Load profile
        const profileStr = await AsyncStorage.getItem('userProfile');
        const profile = JSON.parse(profileStr || '{}');
  
        const nameVal = profile?.name || fbUser?.displayName || 'Unknown';
        const photoVal = profile?.photo || fbUser?.photoURL || '';
        const dobVal = profile?.dob ? new Date(profile?.dob).toISOString().split('T')[0] : '';
        const tobVal = typeof profile?.tob === 'string' && profile.tob.includes(':') ? profile.tob : '00:00';

        console.log('✅ Loaded tobVal:', tobVal);
        
        const tobFormatted = tob instanceof Date
  ? tob.toTimeString().slice(0, 5)
  : typeof tob === 'string' && tob.includes(':')
    ? tob
    : '00:00';

    console.log('✅ Loaded tobFormatted:', tobFormatted);


        const pobVal = profile?.pob || '';
  
        setName(nameVal);
        setImage(photoVal);
        setDob(dobVal);
        setTob(tobVal);
        setPob(pobVal);
  
        if (profile?.lat) setLat(profile.lat);
        if (profile?.lon) setLon(profile.lon);
  
        console.log('✅ Loaded from userProfile:', profile);
  
        // 3. Save user profile to Firestore
        if (fbUser?.uid) {
          const db = getFirestore();
          const userRef = doc(db, 'users', fbUser.uid);
          await setDoc(userRef, {
            name: nameVal,
            photo: photoVal,
            dob: dobVal,
            pob: pobVal,
            search_name: nameVal.toLowerCase(),
            createdAt: new Date().toISOString()
          }, { merge: true });
          console.log('📝 User profile saved to Firestore');
        }
      } catch (err) {
        console.error('❌ Failed to load profile:', err);
      }
    };
  
    loadUserProfile();
  }, []);


//   const handleChangeProfileImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       quality: 1,
//     });

//     if (!result.canceled) {
//       const uri = result.assets[0].uri;
//       const { downloadUrl } = await uploadProfileImage(uri, 'profile.png');

//       // 🔁 Update AsyncStorage
//       const profileStr = await AsyncStorage.getItem('userProfile');
//       const profile = JSON.parse(profileStr || '{}');
//       const updated = { ...profile, photo: downloadUrl };
//       await AsyncStorage.setItem('userProfile', JSON.stringify(updated));

//       setProfilePhotoUrl(downloadUrl);
//       console.log('✅ New profile image uploaded and applied.');
//     }
//   };
  
const uploadProfileImage = async (uri, filename, onProgress) => {
    try {
      console.log('📸 Selected URI:', uri);
  
      // STEP 1: Anonymous sign-in (if not already signed in)
  
        const userCred = await signInAnonymously(
          auth
        );
        const idToken = await userCred.user.getIdToken();
        const uid = userCred.user.uid;
  
     
        
      
        console.log('🔐 Anonymous sign-in complete. UID:', uid);
  
     
        console.log('🔑 ID Token:', idToken); // Optional: use for secure API calls
      
  
      // STEP 2: Compress image
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.PNG,
        }
      );
      console.log('🗜️ Compressed URI:', compressed.uri);
  
      // STEP 3: Convert to blob
      const response = await fetch(compressed.uri);
      const blob = await response.blob();
      console.log('✅ Blob created, size:', blob.size);
  
      // STEP 4: Upload to Firebase Storage under avatars/{uid}/
      const storage = getStorage(undefined, "gs://kundli-auth-test.firebasestorage.app");
      const imageRef = ref(storage, `avatars/${uid}/profile.png`);
      await uploadBytes(imageRef, blob);
  
      // STEP 5: Get public download URL
      const downloadUrl = await getDownloadURL(imageRef);
      console.log('✅ Upload successful. URL:', downloadUrl);
  
      // const finalPhotoURL = downloadUrl;
  
      return { downloadUrl, uid };
    } catch (e) {
      console.error('❌ Upload failed:', e);
      throw e;
    }
  };
  
  const uploadImageToFirebase = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
  
      const uid = getAuth().currentUser?.uid;
      if (!uid) throw new Error('No UID found');
  
      const storage = getStorage();
      const fileRef = ref(storage, `profileImages/${uid}.jpg`);
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);
  
      setImage(downloadURL); // update image state
      return downloadURL;
    } catch (err) {
      console.error('❌ Upload failed:', err);
      return null;
    }
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
  
      const { downloadUrl } = await uploadProfileImage(photoUri, filename, (v) => console.log(v));
  
      if (downloadUrl) {
        setImage(downloadUrl); // ✅ Update state for preview
  
        // 🔁 Update in AsyncStorage too
        const profileStr = await AsyncStorage.getItem('userProfile');
        const profile = JSON.parse(profileStr || '{}');
        const updated = { ...profile, photo: downloadUrl };
        await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
        console.log('✅ Updated profile with new photo URL:', downloadUrl);
      }
    }
  };
  

  const handleDateConfirm = (date) => {
    const iso = date.toISOString();
    setDob(iso.split('T')[0]);
    setShowDatePicker(false);
  };

  const handleTimeConfirm = (selectedTime) => {
    const timeStr = selectedTime.toTimeString().slice(0, 5); // "HH:MM"
    setTob(timeStr);
    setShowTimePicker(false);
  };
  

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

  const saveProfile = async () => {
    if (!name || !dob || !tob || !pob || !image) {
      Alert.alert('⚠️ Please complete all fields');
      return;
    }
  
    try {
      const uid = getAuth().currentUser?.uid;
      if (!uid) throw new Error('No UID found');

     
      const profileData = {
        name,
        photo: image,
        dob: typeof dob === 'string' ? dob : (dob instanceof Date ? dob.toISOString().split('T')[0] : ''),
        pob,
        lat,
        lon,
        updatedAt: new Date().toISOString(),
      };
      
      
      console.log('✅ Saved to AsyncStorage:', profileData);
  
      // Save to AsyncStorage
      await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      console.log('✅ Saved to AsyncStorage:', profileData);

    //   if (tob === 'Inval' || !tob.includes(':')) {
    //     Alert.alert('❌ Invalid TOB', 'Please select a valid time of birth.');
    //     return;
    //   }
      
      const { tob, ...profileDataWithoutTOB } = profileData;
  
      // Save to Firestore
      const db = getFirestore();
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...profileDataWithoutTOB,
        search_name: name.toLowerCase(),
      }, { merge: true });
      console.log('✅ Saved to Firestore');
  
      Alert.alert('✅ Profile updated!');
    } catch (err) {
      console.error('❌ Save error:', err);
      Alert.alert('❌ Failed to save profile');
    }
  };
  
  

  return (
    <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
  >
    <>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Edit Profile</Text>

        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholder}><Text>Select Image</Text></View>
          )}
          <Text style={styles.editPhotoText}>Change Profile Photo</Text>
        </TouchableOpacity>
  

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />

        <Text style={styles.label}>Date of Birth</Text>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <TextInput
            style={styles.input}
            value={dob}
            editable={false}
            placeholder="Select DOB"
            pointerEvents="none"
          />
        </Pressable>

        <Text style={styles.label}>Time of Birth</Text>
        <Pressable onPress={() => setShowTimePicker(true)}>
          <TextInput
            style={styles.input}
            value={tob}
            editable={false}
            placeholder="Select TOB"
            pointerEvents="none"
          />
        </Pressable>

        <Text style={styles.label}>Place of Birth</Text>
        <TextInput
          style={styles.input}
          value={pob}
          onChangeText={fetchLocationDetails}
          placeholder="Start typing your place of birth"
        />

        {placeSuggestions.length > 0 && (
          <ScrollView style={styles.suggestions}>
            {placeSuggestions.map((item, index) => (
              <TouchableOpacity key={index} onPress={() => handlePlaceSelect(item)} style={styles.suggestionItem}>
                <Text>{item.properties.formatted}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {placeSelected && lat && lon && (
          <Text style={styles.coordinates}>📍 {lat.toFixed(4)}, {lon.toFixed(4)}</Text>
        )}

        <View style={{ marginTop: 24 }}>
          <Button title="💾 Save Profile" onPress={saveProfile} />
        </View>
      </ScrollView>

      {/* ✅ MODALS OUTSIDE ScrollView */}
      {showDatePicker && (
  <DateTimePicker
    value={dob ? new Date(dob) : new Date()}
    mode="date"
    display="default"
    onChange={(event, selectedDate) => {
      setShowDatePicker(false);
      if (selectedDate) {
        setDob(selectedDate.toISOString().split('T')[0]);
      }
    }}
  />
)}

{showTimePicker && (
  <DateTimePicker
    value={tob ? new Date(`2000-01-01T${tob}`) : new Date()}
    mode="time"
    display="spinner"
    is24Hour={true}
    onChange={(event, selectedTime) => {
      setShowTimePicker(false);
      if (selectedTime) {
        const hh = selectedTime.getHours().toString().padStart(2, '0');
        const mm = selectedTime.getMinutes().toString().padStart(2, '0');
        setTob(`${hh}:${mm}`);
      }
    }}
  />
)}

    </>
  </KeyboardAvoidingView>
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
  label: { fontWeight: '600', marginTop: 16, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    padding: 10, fontSize: 16
  },
  suggestions: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    maxHeight: 150,
    marginTop: 4,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  coordinates: {
    fontSize: 13,
    color: 'green',
    marginTop: 6,
    textAlign: 'center',
  },
});
