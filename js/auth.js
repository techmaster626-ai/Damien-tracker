/**
 * Authentication and Role-Based Access Control (RBAC) for Damien Water Polo Stats Tracker
 * Roles:
 * - admin (Super User): Full unrestricted master control (Scoring, Rosters, Settings, Role Management)
 * - coach: Live scoring, sheet scoring, roster management, Google Sheets importing, exports
 * - player: Player Analytics dashboard, individual shot heatmaps, box scores (Read-only on scorekeeping)
 * - parent: Live spectator scoreboard, live stream overlay, box score, play-by-play (Read-only)
 */

import { firebaseService } from './firebase-config.js';

export const USER_ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  PLAYER: 'player',
  PARENT: 'parent'
};

export const ROLE_PERMISSIONS = {
  admin: {
    canScore: true,
    canEditRoster: true,
    canImportSheets: true,
    canResetData: true,
    canManageCloud: true,
    canManageRoles: true,
    canViewAnalytics: true,
    canExport: true
  },
  coach: {
    canScore: true,
    canEditRoster: true,
    canImportSheets: true,
    canResetData: false,
    canManageCloud: true,
    canManageRoles: false,
    canViewAnalytics: true,
    canExport: true
  },
  player: {
    canScore: false,
    canEditRoster: false,
    canImportSheets: false,
    canResetData: false,
    canManageCloud: false,
    canManageRoles: false,
    canViewAnalytics: true,
    canExport: true
  },
  parent: {
    canScore: false,
    canEditRoster: false,
    canImportSheets: false,
    canResetData: false,
    canManageCloud: false,
    canManageRoles: false,
    canViewAnalytics: true,
    canExport: true
  }
};

// Registered default users database (persisted locally and synced with Firebase)
export const DEFAULT_USERS = [
  {
    uid: 'admin_vicario_super',
    email: 'vicario.d83@gmail.com',
    password: 'waterpolo4life',
    name: 'Coach Vicario (Super Admin)',
    role: USER_ROLES.ADMIN,
    title: 'Damien Varsity Super User',
    avatar: '🛡️'
  },
  {
    uid: 'coach_assistant_damien',
    email: 'coach@damienhs.edu',
    password: 'spartanscoach',
    name: 'Assistant Coach',
    role: USER_ROLES.COACH,
    title: 'Varsity Water Polo Coach',
    avatar: '📋'
  },
  {
    uid: 'player_david_vicario',
    email: 'player@damienhs.edu',
    password: 'spartanplayer',
    name: 'David Vicario #12',
    role: USER_ROLES.PLAYER,
    title: 'Varsity Center (#12)',
    avatar: '🤽‍♂️'
  },
  {
    uid: 'parent_spartan_family',
    email: 'parent@damienhs.edu',
    password: 'spartanfamily',
    name: 'Spartan Parent / Spectator',
    role: USER_ROLES.PARENT,
    title: 'Damien Water Polo Parent',
    avatar: '👨‍👩‍👧'
  }
];

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = new Set();
    this.users = [];
    this.init();
  }

  init() {
    // Load users from localStorage or default
    const savedUsers = localStorage.getItem('wps_users_db');
    if (savedUsers) {
      try {
        this.users = JSON.parse(savedUsers);
      } catch (e) {
        this.users = [...DEFAULT_USERS];
      }
    } else {
      this.users = [...DEFAULT_USERS];
      this.saveUsers();
    }

    // Ensure Super User always exists with correct credentials
    const superUser = this.users.find(u => u.email.toLowerCase() === 'vicario.d83@gmail.com');
    if (!superUser) {
      this.users.unshift(DEFAULT_USERS[0]);
      this.saveUsers();
    } else {
      superUser.role = USER_ROLES.ADMIN;
      superUser.password = 'waterpolo4life';
      this.saveUsers();
    }

    // Auto-login last active session or default to Super User vicario.d83@gmail.com
    const activeSession = localStorage.getItem('wps_active_session');
    if (activeSession) {
      try {
        const parsed = JSON.parse(activeSession);
        const matched = this.users.find(u => u.email.toLowerCase() === parsed.email.toLowerCase());
        this.currentUser = matched || this.users[0];
      } catch (e) {
        this.currentUser = this.users[0];
      }
    } else {
      // Default to Super User
      this.currentUser = this.users[0];
    }
  }

  saveUsers() {
    localStorage.setItem('wps_users_db', JSON.stringify(this.users));
  }

  subscribe(listener) {
    this.authListeners.add(listener);
    return () => this.authListeners.delete(listener);
  }

  notify() {
    this.authListeners.forEach(fn => fn(this.currentUser));
  }

  // 1. Sign In with Email and Password
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, error: 'User not found. Please check your email or register.' };
    }

    if (user.password !== cleanPass) {
      return { success: false, error: 'Incorrect password. Try again.' };
    }

    this.currentUser = user;
    localStorage.setItem('wps_active_session', JSON.stringify({ email: user.email, role: user.role }));
    this.notify();
    return { success: true, user: this.currentUser };
  }

  // 2. Register New User
  async register(name, email, password, role = USER_ROLES.PARENT) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (this.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'A user with this email already exists.' };
    }

    const newUser = {
      uid: 'user_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: password.trim(),
      role: role || USER_ROLES.PARENT,
      title: `${role.toUpperCase()} Member`,
      avatar: role === USER_ROLES.ADMIN ? '🛡️' : role === USER_ROLES.COACH ? '📋' : role === USER_ROLES.PLAYER ? '🤽‍♂️' : '👨‍👩‍👧'
    };

    this.users.push(newUser);
    this.saveUsers();
    this.currentUser = newUser;
    localStorage.setItem('wps_active_session', JSON.stringify({ email: newUser.email, role: newUser.role }));
    this.notify();
    return { success: true, user: newUser };
  }

  // 3. Quick Demo Profile Switcher
  switchUser(userEmail) {
    const user = this.users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
    if (user) {
      this.currentUser = user;
      localStorage.setItem('wps_active_session', JSON.stringify({ email: user.email, role: user.role }));
      this.notify();
      return true;
    }
    return false;
  }

  // 4. Sign Out
  logout() {
    this.currentUser = null;
    localStorage.removeItem('wps_active_session');
    this.notify();
  }

  // 5. Permission Checker Helper
  can(permissionKey) {
    if (!this.currentUser) return false;
    const perms = ROLE_PERMISSIONS[this.currentUser.role] || ROLE_PERMISSIONS.parent;
    return !!perms[permissionKey];
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === USER_ROLES.ADMIN;
  }

  isCoach() {
    return this.currentUser && (this.currentUser.role === USER_ROLES.COACH || this.currentUser.role === USER_ROLES.ADMIN);
  }

  isPlayer() {
    return this.currentUser && this.currentUser.role === USER_ROLES.PLAYER;
  }

  isParent() {
    return this.currentUser && this.currentUser.role === USER_ROLES.PARENT;
  }
}

export const auth = new AuthService();
