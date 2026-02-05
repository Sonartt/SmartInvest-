/**
 * Shared Admin Utilities
 * Common functions and constants used across admin and executive dashboards
 * Consolidates duplicate code patterns to avoid repetition
 */

// ==========================================
// ADMIN AUTH & TOKEN MANAGEMENT
// ==========================================

class AdminAuthUtils {
  static getToken() {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
  }

  static setToken(token, persistent = false) {
    if (persistent) {
      localStorage.setItem('adminToken', token);
      localStorage.removeItem('sessionToken');
    } else {
      sessionStorage.setItem('adminToken', token);
    }
  }

  static clearToken() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminEmail');
  }

  static async verifyToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const res = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  }

  static getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
}

// ==========================================
// ROLE MANAGEMENT UTILITIES
// ==========================================

class RoleManagementUtils {
  static roleUsers = {
    'ceos-admin': [
      { email: 'delijah5415@gmail.com', name: 'CEO Admin', dept: 'Executive', active: true }
    ],
    'admin': [],
    'executive': [],
    'bom': [],
    'investor': [],
    'prominent': []
  };

  static initRoles() {
    const saved = localStorage.getItem('adminRoleUsers');
    if (saved) {
      Object.assign(this.roleUsers, JSON.parse(saved));
    }
  }

  static addUserToRole(email, name, role, dept = '', active = true) {
    if (!this.roleUsers[role]) return { success: false, error: 'Invalid role' };

    const isDuplicate = this.roleUsers[role].some(u => u.email.toLowerCase() === email.toLowerCase());
    if (isDuplicate) return { success: false, error: 'User already in this role' };

    this.roleUsers[role].push({ email, name, dept, active });
    this.saveRoles();
    return { success: true };
  }

  static removeUserFromRole(role, email) {
    this.roleUsers[role] = this.roleUsers[role].filter(u => u.email !== email);
    this.saveRoles();
  }

  static saveRoles() {
    localStorage.setItem('adminRoleUsers', JSON.stringify(this.roleUsers));
  }

  static getRoleUsers(role) {
    return this.roleUsers[role] || [];
  }

  static getAllUsers() {
    const all = [];
    Object.keys(this.roleUsers).forEach(role => {
      this.roleUsers[role].forEach(user => {
        all.push({ ...user, role });
      });
    });
    return all;
  }

  static getRoleCounts() {
    const counts = {};
    Object.keys(this.roleUsers).forEach(role => {
      counts[role] = this.roleUsers[role].length;
    });
    return counts;
  }
}

// ==========================================
// TAB NAVIGATION UTILITIES
// ==========================================

class TabNavigationUtils {
  static switchTab(tabName, tabsSelector = '.tab-content', navSelector = '.nav-tab') {
    // Hide all tabs
    document.querySelectorAll(tabsSelector).forEach(tab => tab.classList.remove('active'));

    // Remove active from all nav items
    document.querySelectorAll(navSelector).forEach(nav => nav.classList.remove('active'));

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
      selectedTab.classList.add('active');
      if (window.location.hash !== `#${tabName}`) {
        history.replaceState(null, '', `#${tabName}`);
      }
    }

    // Find and mark active nav
    const navTabs = document.querySelectorAll(navSelector);
    [...navTabs].forEach(nav => {
      if (nav.getAttribute('onclick')?.includes(`'${tabName}'`)) {
        nav.classList.add('active');
      }
    });
  }

  static activateTabFromHash(tabsSelector = '.tab-content', navSelector = '.nav-tab') {
    const tabName = window.location.hash.replace('#', '');
    if (tabName) {
      this.switchTab(tabName, tabsSelector, navSelector);
    }
  }

  static setupHashListener(tabsSelector = '.tab-content', navSelector = '.nav-tab') {
    window.addEventListener('hashchange', () => {
      this.activateTabFromHash(tabsSelector, navSelector);
    });
    window.addEventListener('load', () => {
      this.activateTabFromHash(tabsSelector, navSelector);
    });
  }
}

// ==========================================
// API UTILITIES
// ==========================================

class AdminApiUtils {
  static async fetchWithAuth(url, options = {}) {
    const headers = AdminAuthUtils.getAuthHeaders();
    return fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
  }

  static async getUsers() {
    const res = await this.fetchWithAuth('/api/admin/users');
    return res.json();
  }

  static async getStats() {
    const res = await this.fetchWithAuth('/api/admin/stats');
    return res.json();
  }

  static async getAnalytics() {
    const res = await this.fetchWithAuth('/api/admin/analytics');
    return res.json();
  }

  static async getTransactions() {
    const res = await this.fetchWithAuth('/api/admin/transactions');
    return res.json();
  }

  static async getMessages() {
    const res = await this.fetchWithAuth('/api/admin/messages');
    return res.json();
  }

  static async getTransfers() {
    const res = await this.fetchWithAuth('/api/admin/transfers');
    return res.json();
  }

  static async getAccessViolations() {
    const res = await this.fetchWithAuth('/api/admin/access-violations');
    return res.json();
  }

  static async logout() {
    const token = AdminAuthUtils.getToken();
    if (token) {
      await fetch('/api/auth/admin-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      }).catch(() => {});
    }
    AdminAuthUtils.clearToken();
  }
}

// ==========================================
// UI UPDATE UTILITIES
// ==========================================

class AdminUIUtils {
  static updateStats(stats = {}) {
    Object.keys(stats).forEach(key => {
      const el = document.getElementById(`stat${key.charAt(0).toUpperCase() + key.slice(1)}`);
      if (el) el.textContent = stats[key] || 0;
    });
  }

  static showNotificationBadge(badgeId, count) {
    const badge = document.getElementById(badgeId);
    if (badge) {
      badge.style.display = count ? 'inline-block' : 'none';
      badge.textContent = count;
    }
  }

  static showStatus(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerHTML = `<span class="${isError ? 'text-red-600' : 'text-green-600'} font-medium">${message}</span>`;
    }
  }

  static clearStatus(elementId, delay = 3000) {
    if (delay > 0) {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) el.innerHTML = '';
      }, delay);
    }
  }
}

// ==========================================
// INITIALIZATION
// ==========================================

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
  RoleManagementUtils.initRoles();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AdminAuthUtils,
    RoleManagementUtils,
    TabNavigationUtils,
    AdminApiUtils,
    AdminUIUtils
  };
}
