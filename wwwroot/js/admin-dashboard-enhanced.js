/**
 * SmartInvest Enhanced Admin Dashboard - Real-Time Analytics & Monitoring
 * Advanced features: Live updates, performance metrics, security monitoring
 */

// Real-time analytics refresh interval (30 seconds)
const ANALYTICS_REFRESH_INTERVAL = 30000;
let analyticsInterval = null;
let sessionToken = null;

/**
 * Initialize Admin Dashboard
 */
document.addEventListener('DOMContentLoaded', function() {
  // Check admin authentication
  checkAdminAuth();
  
  // Initialize real-time updates
  initializeRealTimeUpdates();
  
  // Load initial dashboard data
  loadDashboardOverview();
  
  // Setup event listeners
  setupEventListeners();
});

/**
 * Check Admin Authentication
 */
function checkAdminAuth() {
  try {
    sessionToken = localStorage.getItem('si_admin_token');
    const adminEmail = localStorage.getItem('si_admin_email');
    
    if (!sessionToken || !adminEmail) {
      window.location.href = '/index.html#signin';
      return;
    }
    
    // Verify session with backend
    fetch('/api/auth/admin-verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ token: sessionToken })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        console.error('Session verification failed');
        localStorage.removeItem('si_admin_token');
        localStorage.removeItem('si_admin_email');
        window.location.href = '/index.html#signin';
      } else {
        // Display admin info
        displayAdminInfo(data.user);
      }
    })
    .catch(err => {
      console.error('Auth verification error:', err);
    });
  } catch (err) {
    console.error('Auth check error:', err);
    window.location.href = '/index.html#signin';
  }
}

/**
 * Display Admin Info
 */
function displayAdminInfo(user) {
  const adminInfoEl = document.getElementById('adminInfo');
  if (adminInfoEl && user) {
    adminInfoEl.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
          ${user.email.charAt(0).toUpperCase()}
        </div>
        <div>
          <div class="font-semibold text-gray-800">${user.email}</div>
          <div class="text-xs text-gray-500">${user.role || 'Admin'} • Last login: ${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    `;
  }
}

/**
 * Initialize Real-Time Updates
 */
function initializeRealTimeUpdates() {
  // Start real-time analytics updates
  analyticsInterval = setInterval(() => {
    updateRealTimeMetrics();
  }, ANALYTICS_REFRESH_INTERVAL);
  
  // Initial load
  updateRealTimeMetrics();
}

/**
 * Update Real-Time Metrics
 */
async function updateRealTimeMetrics() {
  try {
    // Fetch latest analytics
    const response = await fetch('/api/admin/real-time-analytics', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      updateDashboardMetrics(data.metrics);
      updateActivityFeed(data.recentActivity);
    }
  } catch (err) {
    console.error('Error updating real-time metrics:', err);
  }
}

/**
 * Update Dashboard Metrics
 */
function updateDashboardMetrics(metrics) {
  if (!metrics) return;
  
  // Update stat cards with animation
  updateStatWithAnimation('statActiveUsers', metrics.activeUsers || 0);
  updateStatWithAnimation('statTotalRevenue', formatCurrency(metrics.totalRevenue || 0));
  updateStatWithAnimation('statConversionRate', `${(metrics.conversionRate || 0).toFixed(1)}%`);
  updateStatWithAnimation('statAvgSessionTime', formatDuration(metrics.avgSessionTime || 0));
  
  // Update charts if they exist
  if (window.updateAnalyticsCharts) {
    window.updateAnalyticsCharts(metrics);
  }
}

/**
 * Update Stat with Animation
 */
function updateStatWithAnimation(elementId, newValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const oldValue = element.textContent;
  if (oldValue !== newValue.toString()) {
    element.classList.add('stat-update-animation');
    element.textContent = newValue;
    setTimeout(() => {
      element.classList.remove('stat-update-animation');
    }, 500);
  }
}

/**
 * Update Activity Feed
 */
function updateActivityFeed(activities) {
  const feedEl = document.getElementById('activityFeed');
  if (!feedEl || !activities) return;
  
  const activityHTML = activities.slice(0, 10).map(activity => {
    const icon = getActivityIcon(activity.type);
    const timeAgo = getTimeAgo(activity.timestamp);
    
    return `
      <div class="activity-item flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
        <div class="activity-icon text-2xl">${icon}</div>
        <div class="flex-1">
          <div class="font-medium text-gray-800">${escapeHtml(activity.description)}</div>
          <div class="text-xs text-gray-500">${timeAgo}</div>
        </div>
      </div>
    `;
  }).join('');
  
  feedEl.innerHTML = activityHTML || '<div class="text-gray-500 text-center py-4">No recent activity</div>';
}

/**
 * Get Activity Icon
 */
function getActivityIcon(type) {
  const icons = {
    'user_signup': '👤',
    'purchase': '💳',
    'login': '🔐',
    'admin_action': '⚙️',
    'content_update': '📝',
    'payment_received': '✅',
    'error': '⚠️'
  };
  return icons[type] || '📌';
}

/**
 * Get Time Ago
 */
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Format Currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format Duration (seconds to readable format)
 */
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Load Dashboard Overview
 */
async function loadDashboardOverview() {
  try {
    const response = await fetch('/api/admin/dashboard-overview', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      renderDashboardOverview(data.overview);
    }
  } catch (err) {
    console.error('Error loading dashboard overview:', err);
  }
}

/**
 * Render Dashboard Overview
 */
function renderDashboardOverview(overview) {
  if (!overview) return;
  
  // Update summary cards
  document.getElementById('totalUsers').textContent = overview.totalUsers || 0;
  document.getElementById('totalRevenue').textContent = formatCurrency(overview.totalRevenue || 0);
  document.getElementById('activeSubscriptions').textContent = overview.activeSubscriptions || 0;
  document.getElementById('pendingIssues').textContent = overview.pendingIssues || 0;
  
  // Render charts
  if (overview.chartData && window.renderCharts) {
    window.renderCharts(overview.chartData);
  }
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('adminLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleAdminLogout);
  }
  
  // Export buttons
  const exportDataBtn = document.getElementById('exportAllData');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportAllData);
  }
  
  // Refresh button
  const refreshBtn = document.getElementById('refreshDashboard');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadDashboardOverview();
      updateRealTimeMetrics();
    });
  }
}

/**
 * Handle Admin Logout
 */
async function handleAdminLogout() {
  try {
    await fetch('/api/auth/admin-logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ token: sessionToken })
    });
    
    // Clear local storage
    localStorage.removeItem('si_admin_token');
    localStorage.removeItem('si_admin_email');
    localStorage.removeItem('si_admin_session');
    localStorage.removeItem('si_admin_remember');
    
    // Clear interval
    if (analyticsInterval) {
      clearInterval(analyticsInterval);
    }
    
    // Redirect to homepage
    window.location.href = '/index.html';
  } catch (err) {
    console.error('Logout error:', err);
    window.location.href = '/index.html';
  }
}

/**
 * Export All Data
 */
async function exportAllData() {
  try {
    const response = await fetch('/api/admin/export-all-data', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartinvest-export-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export error:', err);
    alert('Export failed. Please try again.');
  }
}

/**
 * Advanced Search Functionality
 */
function performAdvancedSearch(query, filters) {
  // Implement advanced search with filters
  console.log('Searching:', query, filters);
}

/**
 * Bulk Operations
 */
function performBulkOperation(operation, selectedItems) {
  // Implement bulk operations (delete, update, export)
  console.log('Bulk operation:', operation, selectedItems);
}

// Export functions for global access
window.adminDashboard = {
  updateRealTimeMetrics,
  loadDashboardOverview,
  performAdvancedSearch,
  performBulkOperation,
  formatCurrency,
  formatDuration
};
