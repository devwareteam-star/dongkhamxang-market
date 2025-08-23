// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyA7RhGzwzYYZVrOEVROWpJxFxXhSp1OAD8",
  authDomain: "dongkhamxang-market.firebaseapp.com",
  projectId: "dongkhamxang-market",
  storageBucket: "dongkhamxang-market.firebasestorage.app",
  messagingSenderId: "504692374765",
  appId: "1:504692374765:web:0a3cc8b1bd8cc0d49120e4",
  measurementId: "G-GJ6H0VXHCB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;