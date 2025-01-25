// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAycPH0e54OEuQKZHJlJVBzrl8PJwE5eEw",
  authDomain: "test-b1637.firebaseapp.com",
  projectId: "test-b1637",
  storageBucket: "test-b1637.appspot.com",
  messagingSenderId: "912702084020",
  appId: "1:912702084020:web:7c4470b95d458da35558e1",
  measurementId: "G-PWEJXF3Q4M"
};

// Initialize Firebase only if it hasn't been initialized yet
let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    console.log('Firebase already initialized');
  } else {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db, storage };
