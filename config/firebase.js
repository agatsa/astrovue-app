import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';



import { getStorage } from 'firebase/storage'; // 


const firebaseConfig = {
  apiKey: "AIzaSyAMmJ_yrKmEBFIBFZNdMe6H_lsLkqX80hI",
  authDomain: "kundli-auth-test.firebaseapp.com",
  projectId: "kundli-auth-test",
  storageBucket: "kundli-auth-test.appspot.com",
  messagingSenderId: "731436072433",
  appId: "1:731436072433:web:531dee80d3bd73e74f9850",
  measurementId: "G-1LFTWN88XQ"
};

// Prevent re-initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };



const storage = getStorage(app);

export { storage };
