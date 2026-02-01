/**
 * SmartInvest Admin Real-Time Analytics API
 * Provides real-time metrics, activity feeds, and performance monitoring
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Data paths
const USERS_PATH = path.join(__dirname, '../data/users.json');
const TRANSACTIONS_PATH = path.join(__dirname, '../data/transactions.json');
const ANALYTICS_PATH = path.join(__dirname, '../data/analytics.json');
const SESSIONS_PATH = path.join(__dirname, '../data/admin-sessions.json');
const AUDIT_LOG_PATH = path.join(__dirname, '../data/admin-audit-log.json');

/**
 * Helper: Read JSON file safely
 */
function readJSON(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

/**
 * Helper: Verify admin session
 */
function verifyAdminSession(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  
  const sessions = readJSON(SESSIONS_PATH, { sessions: [] });
  const session = sessions.sessions.find(s => s.token === token);
  
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  
  return session;
}

/**
 * Middleware: Require admin authentication
 */
function requireAdmin(req, res, next) {
  const session = verifyAdminSession(req);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  req.adminSession = session;
  next();
}

/**
 * GET /api/admin/real-time-analytics
 * Get real-time analytics data
 */
router.get('/real-time-analytics', requireAdmin, (req, res) => {
  try {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;
    
    // Load data
    const users = readJSON(USERS_PATH, { users: [] });
    const transactions = readJSON(TRANSACTIONS_PATH, { transactions: [] });
    const analytics = readJSON(ANALYTICS_PATH, { visits: [], signups: [], logins: [] });
    const auditLog = readJSON(AUDIT_LOG_PATH, { events: [] });
    
    // Calculate active users (logged in within last hour)
    const activeUsers = analytics.logins?.filter(login => {
      return new Date(login.timestamp).getTime() > oneHourAgo;
    }).length || 0;
    
    // Calculate total revenue
    const totalRevenue = transactions.transactions?.reduce((sum, t) => {
      if (t.status === 'completed' || t.status === 'approved') {
        return sum + (parseFloat(t.amount) || 0);
      }
      return sum;
    }, 0) || 0;
    
    // Calculate conversion rate (signups to purchases ratio)
    const recentSignups = analytics.signups?.filter(s => 
      new Date(s.timestamp).getTime() > oneDayAgo
    ).length || 0;
    
    const recentPurchases = transactions.transactions?.filter(t => 
      new Date(t.timestamp).getTime() > oneDayAgo && 
      (t.status === 'completed' || t.status === 'approved')
    ).length || 0;
    
    const conversionRate = recentSignups > 0 ? (recentPurchases / recentSignups) * 100 : 0;
    
    // Calculate average session time (dummy calculation - would need session tracking)
    const avgSessionTime = 245; // 4 minutes 5 seconds (placeholder)
    
    // Get recent activity
    const recentActivity = auditLog.events?.slice(-20).reverse().map(event => ({
      type: event.action,
      description: getActivityDescription(event),
      timestamp: event.timestamp,
      user: event.email
    })) || [];
    
    res.json({
      success: true,
      metrics: {
        activeUsers,
        totalRevenue,
        conversionRate,
        avgSessionTime,
        totalUsers: users.users?.length || 0,
        totalTransactions: transactions.transactions?.length || 0,
        pendingTransactions: transactions.transactions?.filter(t => t.status === 'pending').length || 0
      },
      recentActivity,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Real-time analytics error:', err);
    res.json({ success: false, error: 'Failed to load analytics' });
  }
});

/**
 * GET /api/admin/dashboard-overview
 * Get comprehensive dashboard overview
 */
router.get('/dashboard-overview', requireAdmin, (req, res) => {
  try {
    const users = readJSON(USERS_PATH, { users: [] });
    const transactions = readJSON(TRANSACTIONS_PATH, { transactions: [] });
    const analytics = readJSON(ANALYTICS_PATH, { visits: [], signups: [], logins: [] });
    
    // Calculate metrics
    const totalUsers = users.users?.length || 0;
    const totalRevenue = transactions.transactions?.reduce((sum, t) => {
      if (t.status === 'completed' || t.status === 'approved') {
        return sum + (parseFloat(t.amount) || 0);
      }
      return sum;
    }, 0) || 0;
    
    const activeSubscriptions = users.users?.filter(u => u.isPremium).length || 0;
    const pendingIssues = transactions.transactions?.filter(t => t.status === 'pending').length || 0;
    
    // Generate chart data
    const chartData = generateChartData(analytics, transactions);
    
    res.json({
      success: true,
      overview: {
        totalUsers,
        totalRevenue,
        activeSubscriptions,
        pendingIssues,
        chartData
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.json({ success: false, error: 'Failed to load dashboard' });
  }
});

/**
 * GET /api/admin/performance-metrics
 * Get detailed performance metrics
 */
router.get('/performance-metrics', requireAdmin, (req, res) => {
  try {
    const timeRange = req.query.range || '24h'; // 24h, 7d, 30d
    const metrics = calculatePerformanceMetrics(timeRange);
    
    res.json({
      success: true,
      metrics,
      timeRange,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Performance metrics error:', err);
    res.json({ success: false, error: 'Failed to load performance metrics' });
  }
});

/**
 * GET /api/admin/security-alerts
 * Get security alerts and suspicious activities
 */
router.get('/security-alerts', requireAdmin, (req, res) => {
  try {
    const auditLog = readJSON(AUDIT_LOG_PATH, { events: [] });
    
    // Detect suspicious patterns
    const alerts = detectSecurityIssues(auditLog.events || []);
    
    res.json({
      success: true,
      alerts,
      severity: alerts.length > 0 ? 'medium' : 'low',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Security alerts error:', err);
    res.json({ success: false, error: 'Failed to load security alerts' });
  }
});

/**
 * POST /api/admin/bulk-operation
 * Perform bulk operations on users/transactions
 */
router.post('/bulk-operation', requireAdmin, (req, res) => {
  try {
    const { operation, itemIds, data } = req.body;
    
    if (!operation || !itemIds || !Array.isArray(itemIds)) {
      return res.json({ success: false, error: 'Invalid parameters' });
    }
    
    let result;
    switch (operation) {
      case 'delete-users':
        result = bulkDeleteUsers(itemIds);
        break;
      case 'approve-transactions':
        result = bulkApproveTransactions(itemIds);
        break;
      case 'grant-premium':
        result = bulkGrantPremium(itemIds);
        break;
      default:
        return res.json({ success: false, error: 'Unknown operation' });
    }
    
    res.json({
      success: true,
      result,
      operation,
      affectedItems: itemIds.length
    });
  } catch (err) {
    console.error('Bulk operation error:', err);
    res.json({ success: false, error: 'Bulk operation failed' });
  }
});

/**
 * Helper: Get activity description
 */
function getActivityDescription(event) {
  const descriptions = {
    'admin-login': `Admin ${event.email} logged in`,
    'admin-logout': `Admin ${event.email} logged out`,
    'user-created': `New user registered: ${event.details?.email || 'Unknown'}`,
    'payment-received': `Payment received: KES ${event.details?.amount || 0}`,
    'content-updated': `Content updated by ${event.email}`
  };
  return descriptions[event.action] || event.action;
}

/**
 * Helper: Generate chart data
 */
function generateChartData(analytics, transactions) {
  const last7Days = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const signups = analytics.signups?.filter(s => 
      s.timestamp?.startsWith(dateStr)
    ).length || 0;
    
    const revenue = transactions.transactions?.filter(t => 
      t.timestamp?.startsWith(dateStr) && 
      (t.status === 'completed' || t.status === 'approved')
    ).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;
    
    last7Days.push({
      date: dateStr,
      signups,
      revenue
    });
  }
  
  return {
    last7Days,
    labels: last7Days.map(d => d.date),
    signupsData: last7Days.map(d => d.signups),
    revenueData: last7Days.map(d => d.revenue)
  };
}

/**
 * Helper: Calculate performance metrics
 */
function calculatePerformanceMetrics(timeRange) {
  // Placeholder implementation
  return {
    pageLoadTime: 1.2,
    apiResponseTime: 0.3,
    errorRate: 0.02,
    uptime: 99.9
  };
}

/**
 * Helper: Detect security issues
 */
function detectSecurityIssues(events) {
  const alerts = [];
  const recentEvents = events.slice(-100);
  
  // Check for multiple failed login attempts
  const failedLogins = recentEvents.filter(e => 
    e.action === 'admin-login' && !e.success
  );
  
  if (failedLogins.length > 5) {
    alerts.push({
      type: 'multiple-failed-logins',
      severity: 'high',
      message: `${failedLogins.length} failed login attempts detected`,
      timestamp: new Date().toISOString()
    });
  }
  
  return alerts;
}

/**
 * Helper: Bulk delete users
 */
function bulkDeleteUsers(userIds) {
  // Implementation would delete specified users
  return { deleted: userIds.length };
}

/**
 * Helper: Bulk approve transactions
 */
function bulkApproveTransactions(transactionIds) {
  // Implementation would approve specified transactions
  return { approved: transactionIds.length };
}

/**
 * Helper: Bulk grant premium
 */
function bulkGrantPremium(userIds) {
  // Implementation would grant premium to specified users
  return { granted: userIds.length };
}

module.exports = router;
