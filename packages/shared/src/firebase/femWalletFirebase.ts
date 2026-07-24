// FEM WALLET — Firebase initialisation
// Project: fem-wallet-6a6e3
// All non-secret values are hardcoded; apiKey uses env var with fallback.

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:
    (typeof process !== 'undefined' && process.env.FIREBASE_WEB_API_KEY) ||
    'AIzaSyDSeASTXwK7aA0QzWAnEa0ss2jFQOYAIYE',
  authDomain: 'fem-wallet-6a6e3.firebaseapp.com',
  projectId: 'fem-wallet-6a6e3',
  storageBucket: 'fem-wallet-6a6e3.firebasestorage.app',
  messagingSenderId: '17251022104',
  appId:
    (typeof process !== 'undefined' && process.env.FIREBASE_WEB_APP_ID) ||
    '1:17251022104:web:fem-wallet',
};

// Guard against double-initialisation (hot-reload / React Strict Mode)
let femFirebaseApp: FirebaseApp;
if (getApps().length === 0) {
  femFirebaseApp = initializeApp(firebaseConfig);
} else {
  femFirebaseApp = getApps()[0];
}

export const femFirestore = getFirestore(femFirebaseApp);
export const femAuth = getAuth(femFirebaseApp);
export default femFirebaseApp;
