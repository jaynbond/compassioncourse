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

// Firebase will be loaded from CDN script tags

// Initialize Firebase (will be available after script loads)
let app, db, auth;

// Initialize Firebase when scripts are loaded
function initFirebase() {
    if (typeof firebase !== 'undefined') {
        app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        
        window.db = db;
        window.auth = auth;
        console.log('🔥 Firebase initialized successfully');
        return true;
    }
    return false;
}

// Try to initialize immediately or wait for scripts to load
if (!initFirebase()) {
    window.addEventListener('load', initFirebase);
}

// Connect to emulators in development (when available)
if (location.hostname === 'localhost') {
  window.addEventListener('load', () => {
    if (window.auth && window.db) {
      try {
        // Note: Emulator connection for v9 compat would be different
        console.log('🔥 Development mode - emulators can be configured here');
      } catch (error) {
        console.log('Emulators not available');
      }
    }
  });
}
