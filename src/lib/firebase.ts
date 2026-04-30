import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBx9HUL_tM3yxa-L4WWJlac746wg-F0HDY",
  authDomain: "stoicfin-ai.firebaseapp.com",
  projectId: "stoicfin-ai",
  storageBucket: "stoicfin-ai.firebasestorage.app",
  messagingSenderId: "951610026635",
  appId: "1:951610026635:web:d52ca04166c487ec0a028e",
  measurementId: "G-N04MWCFW2L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
