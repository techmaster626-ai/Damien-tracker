/**
 * Cloud Sync Engine for Water Polo Stats Tracker (Firebase Firestore)
 * Features:
 * - Real-time live match broadcasting via Firestore onSnapshot
 * - Cloud match saving, loading, and deletion
 * - Live Room Code / Spectator link generator
 * - LocalStorage + Firestore dual persistence
 */

import { firebaseService } from './firebase-config.js';
import { state } from './state.js';

export class CloudSyncEngine {
  constructor() {
    this.liveUnsubscribe = null;
    this.isLiveHosting = false;
    this.currentRoomId = null;
    this.statusListeners = new Set();
  }

  onStatusChange(fn) {
    this.statusListeners.add(fn);
  }

  notifyStatus(status) {
    this.statusListeners.forEach(fn => fn(status));
  }

  // 1. Save Active Match to Cloud Firestore
  async saveMatchToCloud() {
    if (!state.match) return { success: false, error: 'No active match' };

    await firebaseService.init();
    if (!firebaseService.db) {
      // Fallback: Save to cloud simulation storage if network blocked
      this.saveToLocalCloudStore(state.match);
      return { success: true, isLocalFallback: true, id: state.match.id };
    }

    try {
      const { doc, setDoc, serverTimestamp } = firebaseService.modules;
      const matchDocRef = doc(firebaseService.db, 'matches', state.match.id);
      
      const payload = {
        ...state.match,
        uid: firebaseService.currentUser?.uid || 'anonymous_user',
        updatedAt: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
        lastSavedBy: 'WaterPoloStatsTracker'
      };

      await setDoc(matchDocRef, payload, { merge: true });
      this.saveToLocalCloudStore(state.match);
      return { success: true, id: state.match.id };
    } catch (err) {
      console.warn('Firestore cloud save fallback:', err);
      this.saveToLocalCloudStore(state.match);
      return { success: true, isLocalFallback: true, id: state.match.id };
    }
  }

  // 2. Fetch List of Saved Cloud Matches
  async listCloudMatches() {
    await firebaseService.init();
    const localStore = this.getLocalCloudStore();

    if (!firebaseService.db) {
      return Object.values(localStore);
    }

    try {
      const { collection, getDocs, query, orderBy, limit } = firebaseService.modules;
      const matchesRef = collection(firebaseService.db, 'matches');
      const q = query(matchesRef, limit(25));
      const snapshot = await getDocs(q);

      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Merge with local storage
      Object.values(localStore).forEach(m => {
        if (!list.find(item => item.id === m.id)) {
          list.push(m);
        }
      });

      return list;
    } catch (err) {
      return Object.values(localStore);
    }
  }

  // 3. Load Match by ID from Cloud
  async loadMatchFromCloud(matchId) {
    await firebaseService.init();

    if (firebaseService.db) {
      try {
        const { doc, getDoc } = firebaseService.modules;
        const matchRef = doc(firebaseService.db, 'matches', matchId);
        const snap = await getDoc(matchRef);
        if (snap.exists()) {
          const matchData = snap.data();
          state.loadCustomMatch(matchData);
          return { success: true, match: matchData };
        }
      } catch (err) {
        console.warn('Load cloud error, trying local fallback:', err);
      }
    }

    // Try local cloud store fallback
    const localStore = this.getLocalCloudStore();
    if (localStore[matchId]) {
      state.loadCustomMatch(localStore[matchId]);
      return { success: true, match: localStore[matchId] };
    }

    return { success: false, error: 'Match not found in cloud' };
  }

  // 4. Real-time Live Match Broadcasting (Host Mode)
  async startLiveBroadcast() {
    if (!state.match) return;
    this.isLiveHosting = true;
    this.currentRoomId = state.match.id;

    // Push immediate update
    await this.saveMatchToCloud();

    // Auto push on state events
    const unsub = state.subscribe(async (eventType) => {
      if (this.isLiveHosting && ['event_logged', 'event_undone', 'event_deleted', 'clock_set', 'quarter_advanced'].includes(eventType)) {
        await this.saveMatchToCloud();
      }
    });

    this.notifyStatus({ isLive: true, roomId: this.currentRoomId });
    return this.currentRoomId;
  }

  stopLiveBroadcast() {
    this.isLiveHosting = false;
    this.currentRoomId = null;
    this.notifyStatus({ isLive: false });
  }

  // 5. Connect to Live Room (Spectator / Stream Scorebug Listener)
  async connectToLiveRoom(roomId, onUpdate) {
    await firebaseService.init();
    if (this.liveUnsubscribe) {
      this.liveUnsubscribe();
    }

    if (!firebaseService.db) {
      return false;
    }

    try {
      const { doc, onSnapshot } = firebaseService.modules;
      const matchRef = doc(firebaseService.db, 'matches', roomId);
      
      this.liveUnsubscribe = onSnapshot(matchRef, (docSnap) => {
        if (docSnap.exists()) {
          const matchData = docSnap.data();
          if (onUpdate) onUpdate(matchData);
        }
      });
      return true;
    } catch (err) {
      console.warn('Live room connection error:', err);
      return false;
    }
  }

  // Fallback Local Storage Simulation for Cloud Store
  getLocalCloudStore() {
    const data = localStorage.getItem('wps_cloud_store');
    return data ? JSON.parse(data) : {};
  }

  saveToLocalCloudStore(match) {
    const store = this.getLocalCloudStore();
    store[match.id] = {
      ...match,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('wps_cloud_store', JSON.stringify(store));
  }

  deleteFromCloud(matchId) {
    const store = this.getLocalCloudStore();
    delete store[matchId];
    localStorage.setItem('wps_cloud_store', JSON.stringify(store));
  }
}

export const cloudSync = new CloudSyncEngine();
