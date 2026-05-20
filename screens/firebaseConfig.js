import { BASE_URL } from "../config/constants";
// firebaseConfig.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAkRRynJyf1fVTxHUXU-LaH7DLkTc4kbqM",
    authDomain: "kundli-auth-test.firebaseapp.com",
    projectId: "kundli-auth-test",
    storageBucket: "kundli-auth-test.firebasestorage.app",
    messagingSenderId: "731436072433",
    appId: "1:731436072433:android:01715dafb3ceeea44f9850"
  };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
