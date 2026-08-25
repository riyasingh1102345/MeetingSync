import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxM03U-7RSiJfEoopXHGEJb7roDLWzTDc",
  authDomain: "meeting-review-1102.firebaseapp.com",
  projectId: "meeting-review-1102",
  storageBucket: "meeting-review-1102.firebasestorage.app",
  messagingSenderId: "508683465120",
  appId: "1:508683465120:web:baa8e937be5cc583bc74c5",
  measurementId: "G-2X1LYH3XP0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
