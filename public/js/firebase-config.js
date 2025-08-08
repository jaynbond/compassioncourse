// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRuvJj3HGzJ_pwyB6vvPdw2IbghQz342I",
  authDomain: "compassion-course-website.firebaseapp.com",
  projectId: "compassion-course-website",
  storageBucket: "compassion-course-website.firebasestorage.app",
  messagingSenderId: "622313914766",
  appId: "1:622313914766:web:3812fa34665fae0c0764df",
  measurementId: "G-2BBHCYYHJK"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connect to emulators in development
if (location.hostname === 'localhost') {
  // Only connect to emulators if not already connected
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔥 Connected to Firebase emulators');
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}

export default app;
