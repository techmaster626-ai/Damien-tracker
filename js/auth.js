/**
 * Authentication and Admin Approval RBAC System for Damien Water Polo Stats Tracker
 * Features:
 * - Registration with Admin Approval workflow (New users start as 'pending')
 * - Login verification checking 'approved' status
 * - Super User Admin User Manager (Approve, Reject, Change Roles)
 * - Super User: vicario.d83@gmail.com / waterpolo4life (Pre-approved Master Admin)
 */

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

// Initial default user database with approval statuses
export const DEFAULT_USERS = [
  {
    uid: 'admin_vicario_super',
    email: 'vicario.d83@gmail.com',
    password: 'waterpolo4life',
    name: 'Coach Vicario (Super Admin)',
    role: USER_ROLES.ADMIN,
    status: 'approved',
    title: 'Damien Varsity Super User',
    avatar: '🛡️',
    registeredAt: '2024-01-01T00:00:00.000Z'
  },
  {
    uid: 'coach_assistant_damien',
    email: 'coach@damienhs.edu',
    password: 'spartanscoach',
    name: 'Assistant Coach',
    role: USER_ROLES.COACH,
    status: 'approved',
    title: 'Varsity Water Polo Coach',
    avatar: '📋',
    registeredAt: '2024-01-02T00:00:00.000Z'
  },
  {
    uid: 'player_david_vicario',
    email: 'player@damienhs.edu',
    password: 'spartanplayer',
    name: 'David Vicario #12',
    role: USER_ROLES.PLAYER,
    status: 'approved',
    title: 'Varsity Center (#12)',
    avatar: '🤽‍♂️',
    registeredAt: '2024-01-03T00:00:00.000Z'
  },
  {
    uid: 'parent_spartan_family',
    email: 'parent@damienhs.edu',
    password: 'spartanfamily',
    name: 'Spartan Parent / Spectator',
    role: USER_ROLES.PARENT,
    status: 'approved',
    title: 'Damien Water Polo Parent',
    avatar: '👨‍👩‍👧',
    registeredAt: '2024-01-04T00:00:00.000Z'
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

    // Ensure Super User always exists with correct credentials & approved status
    const superUser = this.users.find(u => u.email.toLowerCase() === 'vicario.d83@gmail.com');
    if (!superUser) {
      this.users.unshift(DEFAULT_USERS[0]);
      this.saveUsers();
    } else {
      superUser.role = USER_ROLES.ADMIN;
      superUser.password = 'waterpolo4life';
      superUser.status = 'approved';
      this.saveUsers();
    }

    // Auto-login last active session or default to Super User vicario.d83@gmail.com
    const activeSession = localStorage.getItem('wps_active_session');
    if (activeSession) {
      try {
        const parsed = JSON.parse(activeSession);
        const matched = this.users.find(u => u.email.toLowerCase() === parsed.email.toLowerCase() && u.status === 'approved');
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
      return { success: false, error: 'User account not found. Please sign up first.' };
    }

    if (user.password !== cleanPass) {
      return { success: false, error: 'Incorrect password. Try again.' };
    }

    // Check Admin Approval Status
    if (user.status === 'pending') {
      return {
        success: false,
        error: '⏳ Account Pending Admin Approval: An administrator must review and approve your registration before you can log in.',
        isPending: true
      };
    }

    if (user.status === 'rejected') {
      return {
        success: false,
        error: '❌ Account Request Denied: Your registration was not approved by an administrator.',
        isRejected: true
      };
    }

    this.currentUser = user;
    localStorage.setItem('wps_active_session', JSON.stringify({ email: user.email, role: user.role }));
    this.notify();
    return { success: true, user: this.currentUser };
  }

  // 2. Register New User (Starts as 'pending' requiring Admin Approval)
  async register(name, email, password, requestedRole = USER_ROLES.PARENT) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (this.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const newUser = {
      uid: 'user_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: password.trim(),
      role: requestedRole || USER_ROLES.PARENT,
      status: 'pending', // Starts as pending admin review
      title: `${requestedRole.toUpperCase()} (Pending)`,
      avatar: requestedRole === USER_ROLES.ADMIN ? '🛡️' : requestedRole === USER_ROLES.COACH ? '📋' : requestedRole === USER_ROLES.PLAYER ? '🤽‍♂️' : '👨‍👩‍👧',
      registeredAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveUsers();
    this.notify();

    return {
      success: true,
      user: newUser,
      message: '🎉 Sign-up submitted! Your account is pending administrator approval before you can sign in.'
    };
  }

  // 3. Admin User Approval Actions
  getPendingUsers() {
    return this.users.filter(u => u.status === 'pending');
  }

  getAllUsers() {
    return this.users;
  }

  approveUser(uid, assignedRole = null) {
    if (!this.isAdmin()) return { success: false, error: 'Unauthorized: Only Super Admin can approve users.' };
    const user = this.users.find(u => u.uid === uid);
    if (!user) return { success: false, error: 'User not found' };

    user.status = 'approved';
    if (assignedRole) {
      user.role = assignedRole;
      user.title = `${assignedRole.toUpperCase()} Member`;
      user.avatar = assignedRole === USER_ROLES.ADMIN ? '🛡️' : assignedRole === USER_ROLES.COACH ? '📋' : assignedRole === USER_ROLES.PLAYER ? '🤽‍♂️' : '👨‍👩‍👧';
    }

    this.saveUsers();
    this.notify();
    return { success: true, user };
  }

  rejectUser(uid) {
    if (!this.isAdmin()) return { success: false, error: 'Unauthorized' };
    const idx = this.users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      const removed = this.users.splice(idx, 1)[0];
      this.saveUsers();
      this.notify();
      return { success: true, user: removed };
    }
    return { success: false, error: 'User not found' };
  }

  updateUserRole(uid, newRole) {
    if (!this.isAdmin()) return { success: false, error: 'Unauthorized' };
    const user = this.users.find(u => u.uid === uid);
    if (user) {
      user.role = newRole;
      user.avatar = newRole === USER_ROLES.ADMIN ? '🛡️' : newRole === USER_ROLES.COACH ? '📋' : newRole === USER_ROLES.PLAYER ? '🤽‍♂️' : '👨‍👩‍👧';
      this.saveUsers();
      this.notify();
      return { success: true, user };
    }
    return { success: false, error: 'User not found' };
  }

  // 4. Quick Demo Profile Switcher
  switchUser(userEmail) {
    const user = this.users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
    if (user && user.status === 'approved') {
      this.currentUser = user;
      localStorage.setItem('wps_active_session', JSON.stringify({ email: user.email, role: user.role }));
      this.notify();
      return true;
    }
    return false;
  }

  // 5. Sign Out
  logout() {
    this.currentUser = null;
    localStorage.removeItem('wps_active_session');
    this.notify();
  }

  // Permission Helpers
  can(permissionKey) {
    if (!this.currentUser || this.currentUser.status !== 'approved') return false;
    const perms = ROLE_PERMISSIONS[this.currentUser.role] || ROLE_PERMISSIONS.parent;
    return !!perms[permissionKey];
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === USER_ROLES.ADMIN && this.currentUser.status === 'approved';
  }

  isCoach() {
    return this.currentUser && (this.currentUser.role === USER_ROLES.COACH || this.currentUser.role === USER_ROLES.ADMIN) && this.currentUser.status === 'approved';
  }

  isPlayer() {
    return this.currentUser && this.currentUser.role === USER_ROLES.PLAYER && this.currentUser.status === 'approved';
  }

  isParent() {
    return this.currentUser && this.currentUser.role === USER_ROLES.PARENT && this.currentUser.status === 'approved';
  }
}

export const auth = new AuthService();
