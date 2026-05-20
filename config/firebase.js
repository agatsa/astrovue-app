import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';



import { getStorage } from 'firebase/storage'; // 


const firebaseConfig = {
  apiKey: "AIzaSyAkRRynJyf1fVTxHUXU-LaH7DLkTc4kbqM",
  authDomain: "kundli-auth-test.firebaseapp.com",
  projectId: "kundli-auth-test",
  storageBucket: "kundli-auth-test.firebasestorage.app",
  messagingSenderId: "731436072433",
  appId: "1:731436072433:android:01715dafb3ceeea44f9850"
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
