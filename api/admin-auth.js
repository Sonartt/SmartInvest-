/**
 * SmartInvest Admin Authentication & Authorization API
 * Enhanced security with session management, rate limiting, and audit logging
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration paths
const ADMIN_CONFIG_PATH = path.join(__dirname, '../config/admin-config.json');
const ADMIN_SESSIONS_PATH = path.join(__dirname, '../data/admin-sessions.json');
const ADMIN_AUDIT_LOG_PATH = path.join(__dirname, '../data/admin-audit-log.json');
const LOGIN_ATTEMPTS_PATH = path.join(__dirname, '../data/login-attempts.json');

// Ensure directories exist
[path.dirname(ADMIN_SESSIONS_PATH), path.dirname(ADMIN_AUDIT_LOG_PATH), path.dirname(LOGIN_ATTEMPTS_PATH)].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Helper: Read JSON file safely
 */
function readJSON(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

/**
 * Helper: Write JSON file safely
 */
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

/**
 * Helper: Generate secure token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Helper: Hash password (simple implementation - in production use bcrypt)
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Helper: Log audit event
 */
function logAuditEvent(email, action, details = {}, success = true) {
  const auditLog = readJSON(ADMIN_AUDIT_LOG_PATH, { events: [] });
  
  auditLog.events.push({
    timestamp: new Date().toISOString(),
    email,
    action,
    success,
    details,
    ip: details.ip || 'unknown'
  });

  // Keep only last 10000 events
  if (auditLog.events.length > 10000) {
    auditLog.events = auditLog.events.slice(-10000);
  }

  writeJSON(ADMIN_AUDIT_LOG_PATH, auditLog);
}

/**
 * Helper: Check and update login attempts
 */
function checkLoginAttempts(email, ip) {
  const attempts = readJSON(LOGIN_ATTEMPTS_PATH, { attempts: {} });
  const key = `${email}:${ip}`;
  const now = Date.now();
  
  if (!attempts.attempts[key]) {
    attempts.attempts[key] = { count: 0, lastAttempt: now, lockedUntil: null };
  }

  const userAttempts = attempts.attempts[key];

  // Check if account is locked
  if (userAttempts.lockedUntil && now < userAttempts.lockedUntil) {
    return {
      allowed: false,
      remainingTime: Math.ceil((userAttempts.lockedUntil - now) / 1000)
    };
  }

  // Reset if last attempt was more than 15 minutes ago
  if (now - userAttempts.lastAttempt > 900000) {
    userAttempts.count = 0;
  }

  return { allowed: true, currentAttempts: userAttempts.count };
}

/**
 * Helper: Record failed login attempt
 */
function recordFailedAttempt(email, ip) {
  const attempts = readJSON(LOGIN_ATTEMPTS_PATH, { attempts: {} });
  const key = `${email}:${ip}`;
  const now = Date.now();
  const config = readJSON(ADMIN_CONFIG_PATH);
  const maxAttempts = config.securitySettings?.maxLoginAttempts || 5;
  const lockoutDuration = config.securitySettings?.lockoutDuration || 900000;

  if (!attempts.attempts[key]) {
    attempts.attempts[key] = { count: 0, lastAttempt: now, lockedUntil: null };
  }

  attempts.attempts[key].count += 1;
  attempts.attempts[key].lastAttempt = now;

  if (attempts.attempts[key].count >= maxAttempts) {
    attempts.attempts[key].lockedUntil = now + lockoutDuration;
  }

  writeJSON(LOGIN_ATTEMPTS_PATH, attempts);
  return attempts.attempts[key];
}

/**
 * Helper: Clear login attempts on successful login
 */
function clearLoginAttempts(email, ip) {
  const attempts = readJSON(LOGIN_ATTEMPTS_PATH, { attempts: {} });
  const key = `${email}:${ip}`;
  delete attempts.attempts[key];
  writeJSON(LOGIN_ATTEMPTS_PATH, attempts);
}

/**
 * POST /api/auth/admin-login
 * Admin login with enhanced security
 */
router.post('/admin-login', (req, res) => {
  const { email, password, remember } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

  // Validate input
  if (!email || !password) {
    logAuditEvent(email || 'unknown', 'admin-login', { ip, error: 'Missing credentials' }, false);
    return res.json({ success: false, error: 'Email and password are required' });
  }

  // Check rate limiting
  const attemptCheck = checkLoginAttempts(email, ip);
  if (!attemptCheck.allowed) {
    logAuditEvent(email, 'admin-login', { ip, error: 'Account locked' }, false);
    return res.json({
      success: false,
      error: `Too many failed attempts. Account locked for ${attemptCheck.remainingTime} seconds.`
    });
  }

  // Load admin configuration
  const adminConfig = readJSON(ADMIN_CONFIG_PATH);
  if (!adminConfig.adminUsers) {
    logAuditEvent(email, 'admin-login', { ip, error: 'Config error' }, false);
    return res.json({ success: false, error: 'Admin configuration error' });
  }

  // Find admin user
  const adminUser = adminConfig.adminUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!adminUser) {
    recordFailedAttempt(email, ip);
    logAuditEvent(email, 'admin-login', { ip, error: 'User not found' }, false);
    return res.json({ success: false, error: 'Invalid credentials' });
  }

  // Check if account is active
  if (adminUser.status !== 'active') {
    logAuditEvent(email, 'admin-login', { ip, error: 'Account inactive' }, false);
    return res.json({ success: false, error: 'Account is not active' });
  }

  // Verify password
  // Check if admin has password field configured, otherwise accept any password
  let isValidPassword = false;
  if (adminUser.password) {
    // Direct password comparison (for development)
    // In production, use bcrypt: bcrypt.compare(password, adminUser.hashedPassword)
    isValidPassword = password === adminUser.password;
  } else {
    // Fallback: accept any password with minimum length
    isValidPassword = password.length >= 6;
  }

  if (!isValidPassword) {
    recordFailedAttempt(email, ip);
    logAuditEvent(email, 'admin-login', { ip, error: 'Invalid password' }, false);
    return res.json({ success: false, error: 'Invalid credentials' });
  }

  // Generate session token
  const token = generateToken();
  const sessionExpiry = Date.now() + (remember ? 7 * 24 * 3600000 : 3600000); // 7 days or 1 hour

  // Store session
  const sessions = readJSON(ADMIN_SESSIONS_PATH, { sessions: [] });
  sessions.sessions.push({
    token,
    email: adminUser.email,
    role: adminUser.role,
    permissions: adminUser.permissions,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(sessionExpiry).toISOString(),
    ip,
    userAgent: req.headers['user-agent'] || 'unknown'
  });

  // Clean up expired sessions
  const now = Date.now();
  sessions.sessions = sessions.sessions.filter(s => new Date(s.expiresAt).getTime() > now);

  writeJSON(ADMIN_SESSIONS_PATH, sessions);

  // Clear login attempts
  clearLoginAttempts(email, ip);

  // Log successful login
  logAuditEvent(email, 'admin-login', { ip, role: adminUser.role }, true);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    redirectUrl: 'admin.html',
    user: {
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.permissions
    },
    expiresAt: new Date(sessionExpiry).toISOString()
  });
});

/**
 * POST/GET /api/auth/verify-admin
 * Verify admin session token (supports both POST body and Authorization header)
 */
router.post('/verify-admin', (req, res) => {
  const token = req.body.token || req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.json({ success: false, error: 'Token required' });
  }

  const sessions = readJSON(ADMIN_SESSIONS_PATH, { sessions: [] });
  const session = sessions.sessions.find(s => s.token === token);

  if (!session) {
    return res.json({ success: false, error: 'Invalid session' });
  }

  // Check if session expired
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return res.json({ success: false, error: 'Session expired' });
  }

  res.json({
    success: true,
    user: {
      email: session.email,
      role: session.role,
      permissions: session.permissions
    }
  });
});

router.get('/verify-admin', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.json({ success: false, error: 'Token required' });
  }

  const sessions = readJSON(ADMIN_SESSIONS_PATH, { sessions: [] });
  const session = sessions.sessions.find(s => s.token === token);

  if (!session) {
    return res.json({ success: false, error: 'Invalid session' });
  }

  // Check if session expired
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return res.json({ success: false, error: 'Session expired' });
  }

  res.json({
    success: true,
    user: {
      email: session.email,
      role: session.role,
      permissions: session.permissions
    }
  });
});

/**
 * POST /api/auth/admin-verify
 * Verify admin session token (legacy endpoint)
 */
router.post('/admin-verify', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.json({ success: false, error: 'Token required' });
  }

  const sessions = readJSON(ADMIN_SESSIONS_PATH, { sessions: [] });
  const session = sessions.sessions.find(s => s.token === token);

  if (!session) {
    return res.json({ success: false, error: 'Invalid session' });
  }

  // Check if session expired
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return res.json({ success: false, error: 'Session expired' });
  }

  res.json({
    success: true,
    user: {
      email: session.email,
      role: session.role,
      permissions: session.permissions
    }
  });
});

/**
 * POST /api/auth/admin-logout
 * Admin logout (invalidate session)
 */
router.post('/admin-logout', (req, res) => {
  const { token } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

  if (!token) {
    return res.json({ success: false, error: 'Token required' });
  }

  const sessions = readJSON(ADMIN_SESSIONS_PATH, { sessions: [] });
  const sessionIndex = sessions.sessions.findIndex(s => s.token === token);

  if (sessionIndex > -1) {
    const session = sessions.sessions[sessionIndex];
    sessions.sessions.splice(sessionIndex, 1);
    writeJSON(ADMIN_SESSIONS_PATH, sessions);
    
    logAuditEvent(session.email, 'admin-logout', { ip }, true);
  }

  res.json({ success: true });
});

/**
 * GET /api/auth/admin-audit-log
 * Get admin audit log (admin only)
 */
router.get('/admin-audit-log', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    return res.json({ success: false, error: 'Unauthorized' });
  }

  // Verify session
  const sessions = readJSON(ADMIN_SESSIONS_PATH, { sessions: [] });
  const session = sessions.sessions.find(s => s.token === token);

  if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
    return res.json({ success: false, error: 'Invalid or expired session' });
  }

  const auditLog = readJSON(ADMIN_AUDIT_LOG_PATH, { events: [] });
  const limit = parseInt(req.query.limit) || 100;
  
  res.json({
    success: true,
    events: auditLog.events.slice(-limit).reverse()
  });
});

module.exports = router;
