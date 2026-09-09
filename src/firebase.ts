import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyCh2oxRNlaLUzfWNgyRpQg5fzBSbYEowdA",
  authDomain: "mrsbstock.firebaseapp.com",
  projectId: "mrsbstock",
  storageBucket: "mrsbstock.firebasestorage.app",
  messagingSenderId: "572591163450",
  appId: "1:572591163450:web:00c5ec1bedef87679b4d03"
};

let appInstance;
try {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (err) {
  console.warn("Firebase initializeApp warning:", err);
  appInstance = getApps()[0];
}

export const app = appInstance;
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
