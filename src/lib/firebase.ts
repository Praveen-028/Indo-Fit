import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCPIA_HblS430of2d9aUY2KKu7_LRE6R7o",
  authDomain: "indo-fit.firebaseapp.com",
  projectId: "indo-fit",
  storageBucket: "indo-fit.firebasestorage.app",
  messagingSenderId: "304603073061",
  appId: "1:304603073061:web:876fac8b0ed93d9c848dcc",
  measurementId: "G-XCLBWQJ9GD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Specific UID for automatic authentication
const FIXED_UID = 'DnW0nD2lBJVo3RPzDWE4x0njCy23';

// Auto-authenticate function
const autoAuthenticate = async () => {
  try {
    console.log(`Auto-authenticating for UID: ${FIXED_UID}`);
    
    // Sign in anonymously to get write access
    // The UID will be different, but we'll have authenticated access
    const result = await signInAnonymously(auth);
    console.log('Authenticated successfully:', result.user.uid);
    console.log('Target UID for data operations:', FIXED_UID);
    
    return result.user;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Initialize authentication when the module loads
autoAuthenticate().catch(console.error);

// Export the fixed UID for use in data operations
export const FIXED_USER_UID = FIXED_UID;