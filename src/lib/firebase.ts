import { initializeApp } from 'firebase/app';
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
export const db = getFirestore(app);
export const analytics = getAnalytics(app);