// Firebase Authentication Service
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase-config.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authCallbacks = [];
    this.init();
  }

  init() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authCallbacks.forEach(callback => callback(user));
    });
  }

  // Register callback for auth state changes
  onAuthStateChanged(callback) {
    this.authCallbacks.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login
      await this.updateUserData(user.uid, {
        lastLogin: serverTimestamp()
      });
      
      return {
        success: true,
        user: await this.getUserData(user.uid)
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Create new user account
  async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile
      await updateProfile(user, {
        displayName: displayName
      });
      
      // Create user document in Firestore
      await this.createUserDocument(user.uid, {
        email: user.email,
        displayName: displayName,
        role: 'user', // Default role
        isActive: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      
      return {
        success: true,
        user: await this.getUserData(user.uid)
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to sign out'
      };
    }
  }

  // Send password reset email
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Create user document in Firestore
  async createUserDocument(uid, userData) {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, userData);
  }

  // Update user data
  async updateUserData(uid, data) {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, data, { merge: true });
  }

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return {
          uid,
          ...userSnap.data()
        };
      } else {
        // Create basic user document if it doesn't exist
        const userData = {
          email: auth.currentUser?.email,
          displayName: auth.currentUser?.displayName,
          role: 'user',
          isActive: true,
          createdAt: serverTimestamp()
        };
        await this.createUserDocument(uid, userData);
        return { uid, ...userData };
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Check if current user is admin
  async isAdmin() {
    if (!this.currentUser) return false;
    
    const userData = await this.getUserData(this.currentUser.uid);
    return userData && ['admin', 'super-admin'].includes(userData.role);
  }

  // Get current user with role data
  async getCurrentUserData() {
    if (!this.currentUser) return null;
    return await this.getUserData(this.currentUser.uid);
  }

  // Convert Firebase error codes to user-friendly messages
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/invalid-credential': 'Invalid email or password.'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;
