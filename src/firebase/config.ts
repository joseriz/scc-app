import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/utils/logger';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAIOv76XHOpCCskFQM9pIRGkYbgEMm9x4",
  authDomain: "academic-ratio-261512.firebaseapp.com",
  projectId: "academic-ratio-261512",
  storageBucket: "academic-ratio-261512.firebasestorage.app",
  messagingSenderId: "377945407536",
  appId: "1:377945407536:web:ea9f6474c2e9695ce86df5"
};

logger.info('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing',
  authDomain: firebaseConfig.authDomain ? 'Present' : 'Missing',
  projectId: firebaseConfig.projectId ? 'Present' : 'Missing',
  storageBucket: firebaseConfig.storageBucket ? 'Present' : 'Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'Present' : 'Missing',
  appId: firebaseConfig.appId ? 'Present' : 'Missing'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with proper persistence
let auth;
if (Capacitor.isNativePlatform()) {
  // For mobile platforms, use a more reliable persistence
  auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence]
  });
} else {
  // For web, use default persistence
  auth = getAuth(app);
}

export { auth }; 