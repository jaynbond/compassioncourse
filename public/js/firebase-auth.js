// Firebase Authentication Service - Full implementation

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authCallbacks = [];
    this.initialized = false;
    this.init();
  }

  async init() {
    // Wait for Firebase to be loaded
    if (typeof firebase === 'undefined') {
      setTimeout(() => this.init(), 100);
      return;
    }

    if (window.auth) {
      this.initialized = true;
      
      // Set up auth state listener
      window.auth.onAuthStateChanged((user) => {
        this.currentUser = user;
        this.authCallbacks.forEach(callback => callback(user));
        
        if (user) {
          console.log('✅ User signed in:', user.email);
        } else {
          console.log('❌ User signed out');
        }
      });
      
      console.log('🔐 AuthService initialized');
    } else {
      setTimeout(() => this.init(), 100);
    }
  }

  async signIn(email, password) {
    try {
      if (!this.initialized || !window.auth) {
        throw new Error('Authentication service not ready');
      }

      const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      console.log('✅ Sign in successful:', userCredential.user.email);
      
      return { 
        success: true, 
        user: userCredential.user,
        uid: userCredential.user.uid 
      };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { 
        success: false, 
        error: this.formatFirebaseError(error.code),
        code: error.code 
      };
    }
  }

  async signUp(email, password, displayName = '') {
    try {
      if (!this.initialized || !window.auth) {
        throw new Error('Authentication service not ready');
      }

      const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
      
      // Update display name if provided
      if (displayName) {
        await userCredential.user.updateProfile({
          displayName: displayName
        });
      }

      // Create user document in Firestore
      if (window.db) {
        await window.db.collection('users').doc(userCredential.user.uid).set({
          email: email,
          displayName: displayName,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          role: 'member', // Default role
          active: true
        });
      }

      console.log('✅ Sign up successful:', userCredential.user.email);
      
      return { 
        success: true, 
        user: userCredential.user,
        uid: userCredential.user.uid 
      };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { 
        success: false, 
        error: this.formatFirebaseError(error.code),
        code: error.code 
      };
    }
  }

  async signOut() {
    try {
      if (!this.initialized || !window.auth) {
        throw new Error('Authentication service not ready');
      }

      await window.auth.signOut();
      console.log('✅ Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email) {
    try {
      if (!this.initialized || !window.auth) {
        throw new Error('Authentication service not ready');
      }

      await window.auth.sendPasswordResetEmail(email);
      console.log('✅ Password reset email sent to:', email);
      return { success: true };
    } catch (error) {
      console.error('❌ Password reset error:', error);
      return { 
        success: false, 
        error: this.formatFirebaseError(error.code),
        code: error.code 
      };
    }
  }

  async updateProfile(data) {
    try {
      if (!this.currentUser) {
        throw new Error('No user signed in');
      }

      await this.currentUser.updateProfile(data);
      
      // Update Firestore document if available
      if (window.db) {
        await window.db.collection('users').doc(this.currentUser.uid).update({
          ...data,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      console.log('✅ Profile updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserProfile(uid = null) {
    try {
      const userId = uid || (this.currentUser ? this.currentUser.uid : null);
      if (!userId) {
        throw new Error('No user ID provided');
      }

      if (!window.db) {
        throw new Error('Database not available');
      }

      const doc = await window.db.collection('users').doc(userId).get();
      if (doc.exists) {
        return { success: true, data: doc.data() };
      } else {
        return { success: false, error: 'User profile not found' };
      }
    } catch (error) {
      console.error('❌ Get user profile error:', error);
      return { success: false, error: error.message };
    }
  }

  onAuthStateChanged(callback) {
    this.authCallbacks.push(callback);
    
    // If already initialized and has current user state, call immediately
    if (this.initialized) {
      callback(this.currentUser);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isSignedIn() {
    return !!this.currentUser;
  }

  formatFirebaseError(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
      'auth/requires-recent-login': 'Please sign in again to complete this action.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/network-request-failed': 'Network error. Please check your connection.'
    };

    return errorMessages[errorCode] || 'An authentication error occurred. Please try again.';
  }
}

// Create singleton instance
const authService = new AuthService();
window.authService = authService;