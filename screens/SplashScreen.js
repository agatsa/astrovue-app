import { BASE_URL } from "../config/constants";
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase'; // ✅ Import from centralized firebase

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');
        const currentUser = auth.currentUser;

        if (currentUser && userId) {
          navigation.replace('Home');
        } else {
          navigation.replace('Signup');
        }
      } catch (error) {
        console.error('Login check failed:', error);
        navigation.replace('Signup');
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>🔮 Loading AstroVue...</Text>
      <ActivityIndicator size="large" color="#6c47ff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginBottom: 20,
    fontSize: 18,
    color: '#333',
  },
});
