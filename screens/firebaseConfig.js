import { BASE_URL } from "../config/constants";
// firebaseConfig.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAQZEjFW2-WhfqD5NomAjoebS05YrpEtiU",
    authDomain: "astroapi-808e5.firebaseapp.com",
    projectId: "astroapi-808e5",
    storageBucket: "astroapi-808e5.firebasestorage.app",
    messagingSenderId: "744251350742",
    appId: "1:744251350742:web:4f06810435b8a11484f377",
    measurementId: "G-7FWCH4Z6XW"
  };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
