import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use the current hostname as authDomain in production to avoid third-party cookie
// blocking on the Firebase popup. On localhost, use the default Firebase authDomain.
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: isLocalhost
    ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
    : window.location.hostname,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error.code, error.message);

    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for sign-in. The site admin needs to add it to Firebase authorized domains.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Please try again.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
};
