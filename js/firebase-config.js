/**
 * Firebase Modular SDK Loader and Configuration
 * Loads Firebase v10 App, Firestore, and Auth directly in the browser via ES Modules.
 * Includes local persistence and configurable project credentials.
 */

// Default Firebase Project Config template (Can be overridden by user in settings modal)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDemoKeyWaterPoloStatsTracker12345",
  authDomain: "water-polo-stats-tracker.firebaseapp.com",
  projectId: "water-polo-stats-tracker",
  storageBucket: "water-polo-stats-tracker.appspot.com",
  messagingSenderId: "102938475610",
  appId: "1:102938475610:web:9a8b7c6d5e4f3a2b1c0d"
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.initError = null;
    this.modules = {};
  }

  getSavedConfig() {
    const saved = localStorage.getItem('wps_firebase_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  saveConfig(config) {
    localStorage.setItem('wps_firebase_config', JSON.stringify(config));
  }

  async init(customConfig = null) {
    const config = customConfig || this.getSavedConfig();

    try {
      // Dynamically import Firebase modular v10 from official Google CDN
      const { initializeApp, getApps, getApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      const { 
        getFirestore, 
        doc, 
        setDoc, 
        getDoc, 
        getDocs, 
        deleteDoc, 
        collection, 
        query, 
        where, 
        orderBy, 
        limit, 
        onSnapshot, 
        serverTimestamp 
      } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const { 
        getAuth, 
        signInAnonymously, 
        onAuthStateChanged 
      } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');

      this.modules = {
        initializeApp, getApps, getApp,
        getFirestore, doc, setDoc, getDoc, getDocs, deleteDoc, collection, query, where, orderBy, limit, onSnapshot, serverTimestamp,
        getAuth, signInAnonymously, onAuthStateChanged
      };

      const apps = getApps();
      this.app = apps.length > 0 ? getApp() : initializeApp(config);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);

      // Authenticate anonymously for seamless cloud sync
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        if (!user) {
          signInAnonymously(this.auth).catch(err => {
            console.warn('Anonymous sign-in note:', err.message);
          });
        }
      });

      this.isInitialized = true;
      this.initError = null;
      return true;
    } catch (err) {
      this.isInitialized = false;
      this.initError = err.message;
      console.warn('Firebase initialization note (offline mode fallback active):', err);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
