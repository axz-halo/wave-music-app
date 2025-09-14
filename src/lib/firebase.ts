import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbnhagi1gYlKXoYsn2bqzDyy5lgeY3BMA",
  authDomain: "wave-playlist.firebaseapp.com",
  projectId: "wave-playlist",
  storageBucket: "wave-playlist.firebasestorage.app",
  messagingSenderId: "374337912411",
  appId: "1:374337912411:web:5ffa6894a22da29488497e",
  measurementId: "G-S1XM9CM8KF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
