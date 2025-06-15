import { BASE_URL } from "../config/constants";
import React from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';

export default function ResetScreen({ navigation }) {
  const clearEverything = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      await AsyncStorage.clear();
      console.log('✅ AsyncStorage cleared');

      if (user) {
        const db = getFirestore();
        await deleteDoc(doc(db, 'users', user.uid));
        console.log('✅ Firestore user profile deleted');

        await signOut(auth); // 🔥 Sign the user out of Firebase
        console.log('✅ Firebase user signed out');
      }

      Alert.alert('Reset Complete', 'App has been reset. Please restart or go to Signup.');
      navigation.replace('Signup'); // 👈 optionally route to signup flow
    } catch (err) {
      console.error('❌ Reset error:', err);
      Alert.alert('Reset Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Reset Everything" onPress={clearEverything} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
