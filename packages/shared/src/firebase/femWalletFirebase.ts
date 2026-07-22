// FEM WALLET — Firebase Web SDK initialisation
// Config values come from env vars so they can be set in Replit Secrets.
// projectId / storageBucket / messagingSenderId are non-secret; only apiKey
// and appId should go into Replit Secrets (FIREBASE_WEB_API_KEY / FIREBASE_WEB_APP_ID).

import { initializeApp, getApps } from 'firebase/app';
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
    (typeof process !== 'undefined' && process.env.FIREBASE_WEB_APP_ID) || '',
};

// Guard against double-initialisation (hot-reload / React Strict Mode)
const femFirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const femFirestore = getFirestore(femFirebaseApp);
export default femFirebaseApp;
