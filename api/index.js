import { BASE_URL } from "../config/constants";
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
import { auth } from '../config/firebase'; // Adjust path if needed




// const BASE_URL = 'https://kundlisutra-astro-api-812108926556.asia-south1.run.app';

// const BASE_URL = 'https://kundlisutra-astro-api-b4y4wivg3a-el.a.run.app';



const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImJhYTY0ZWZjMTNlZjIzNmJlOTIxZjkyMmUzYTY3Y2M5OTQxNWRiOWIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzMjU1NTk0MDU1OS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjMyNTU1OTQwNTU5LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTE0OTczMTk0NDMxODYzMjQyNjQ0IiwiaGQiOiJrdW5kbGlzdXRyYS5jb20iLCJlbWFpbCI6InRlY2hAa3VuZGxpc3V0cmEuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJRWFBFY1U4dUhqQXoyajhXVk5zb3h3IiwiaWF0IjoxNzQ4NzY1OTcyLCJleHAiOjE3NDg3Njk1NzJ9.GPC5KnS1Fp07CFPLb8FjARLpsV-lLTAEl5g0LKi1vsml8ZisUtxDov2CPSb7T1DSZ2XF2g-bHc4wDqslaJeKpjwJ9Jm0ixJX0HRTfruRk04YGQCwCxUvMmjQvGaLRg3S5SPGvLbXQc3aaPo03xptboZXTAYtMR7MCe6OUR5MxTwJuWwSG30Rz-G3KcXVUeZM7PiG2VosxufRo_ZqfVvvokjda8U6W5XpjVTiA7j_KzgONC3UK5YMytRsCyzJA1Cvqgbo6PtgPceJDJsVLXRw2KELes8KbPv7Wx8mcSg5WThuOMMg2estcPV81AR71q89LnpkFBvfT4g8pBHZFBpbTg'; // your token

// Helper: Get saved userId from AsyncStorage
async function getUserId() {
  try {
    const id = await AsyncStorage.getItem('user_id');
    return id || 'guest';
  } catch (error) {
    console.error('❌ Failed to get user ID from AsyncStorage:', error);
    return 'guest';
  }
}

// Helper: Get Firebase Auth token header
async function getAuthHeader() {
    try {
      const currentUser = auth.currentUser; // ✅ FIXED: No ()
      console.log("📛 Current Firebase User:", auth.currentUser);

      if (!currentUser) throw new Error('No Firebase user logged in');
  
      const token = await currentUser.getIdToken();
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    } catch (err) {
      console.error('❌ Failed to get Firebase token:', err);
      return {
        'Content-Type': 'application/json'
      };
    }
  }
  

// Helper: Safe JSON parsing
async function parseJsonResponse(res, label) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`❌ Failed to parse ${label} response:`, text);
    return null;
  }
}

// API: /daily-energy



export const fetchDailyEnergy = async () => {
  try {
    const user = auth.currentUser;
    const token = user && (await user.getIdToken());

    console.log("📛 Firebase Token:", token);


    const res = await fetch(`${BASE_URL}/api/daily-energy`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      console.error('❌ API error 401: Unauthorized');
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('❌ Error in fetchDailyEnergy:', err);
    return null;
  }
};

  

// API: /karma-meter
export async function fetchKarmaMeter() {
  const userId = await getUserId();
  const headers = await getAuthHeader();

  const res = await fetch(`${API_BASE}/karma-meter`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId })
  });

  return parseJsonResponse(res, 'karma-meter');
}

// API: /location-energy
export async function fetchLocationEnergy(lat, lon) {
  const userId = await getUserId();
  const headers = await getAuthHeader();

  const res = await fetch(`${API_BASE}/location-energy`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ lat, lon, userId })
  });

  return parseJsonResponse(res, 'location-energy');
}

// API: /essence-profile
export async function fetchEssenceProfile() {
  const userId = await getUserId();
  const headers = await getAuthHeader();

  const res = await fetch(`${API_BASE}/essence-profile`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId })
  });

  return parseJsonResponse(res, 'essence-profile');
}
