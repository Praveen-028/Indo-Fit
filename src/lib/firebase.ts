import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Specific UID for automatic authentication
const FIXED_UID = import.meta.env.VITE_FIXED_UID;

// Auto-authenticate function
const autoAuthenticate = async () => {
  try {
    console.log(`Auto-authenticating for UID: ${FIXED_UID}`);
    const result = await signInAnonymously(auth);
    console.log('Authenticated successfully:', result.user.uid);
    console.log('Target UID for data operations:', FIXED_UID);
    return result.user;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

autoAuthenticate().catch(console.error);

export const FIXED_USER_UID = FIXED_UID;
