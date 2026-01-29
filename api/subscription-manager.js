/**
 * Subscription & Access Control Manager
 * Handles user subscriptions, premium access, and subscription validation
 * NO BYPASSES - All access must be verified through this system
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const SUBSCRIPTIONS_FILE = path.join(__dirname, '../data/subscriptions.json');
const ACCESS_LOG_FILE = path.join(__dirname, '../logs/access.log');

// Ensure data files exist
function ensureFilesExist() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(ACCESS_LOG_FILE)) {
    fs.writeFileSync(ACCESS_LOG_FILE, '');
  }
}

function readFile(filepath) {
  try {
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filepath}:`, err.message);
    return [];
  }
}

function writeFile(filepath, data) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${filepath}:`, err.message);
    return false;
  }
}

function logAccess(userId, action, resource, status, ip) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] User: ${userId} | Action: ${action} | Resource: ${resource} | Status: ${status} | IP: ${ip}\n`;
  try {
    fs.appendFileSync(ACCESS_LOG_FILE, logEntry);
  } catch (err) {
    console.error('Error logging access:', err.message);
  }
}

/**
 * Create a new user
 * @param {object} userData - { email, name, phone, location, taxId }
 * @returns {object} - Created user with ID
 */
function createUser(userData) {
  ensureFilesExist();
  const users = readFile(USERS_FILE);
  
  // Check if user already exists
  if (users.some(u => u.email === userData.email)) {
    return { error: 'User with this email already exists' };
  }
  
  const user = {
    id: crypto.randomBytes(8).toString('hex'),
    email: userData.email,
    name: userData.name || '',
    phone: userData.phone || '',
    location: userData.location || '',
    taxId: userData.taxId || '',
    isPremium: false,
    subscriptionId: null,
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  
  users.push(user);
  writeFile(USERS_FILE, users);
  
  return user;
}

/**
 * Get user by ID
 */
function getUser(userId) {
  ensureFilesExist();
  const users = readFile(USERS_FILE);
  return users.find(u => u.id === userId);
}

/**
 * Get user by email
 */
function getUserByEmail(email) {
  ensureFilesExist();
  const users = readFile(USERS_FILE);
  return users.find(u => u.email === email);
}

/**
 * Create a subscription for a user (ADMIN ONLY)
 * @param {object} subData - { userId, amount, paymentMethod, reason, validFrom, validUntil }
 * @returns {object} - Created subscription or error
 */
function createSubscription(subData) {
  ensureFilesExist();
  const users = readFile(USERS_FILE);
  const subscriptions = readFile(SUBSCRIPTIONS_FILE);
  
  // Validate user exists
  const user = users.find(u => u.id === subData.userId);
  if (!user) {
    return { error: 'User not found' };
  }
  
  // Cannot have multiple active subscriptions
  const activeSubExists = subscriptions.some(s => 
    s.userId === subData.userId && 
    new Date(s.validUntil) > new Date() &&
    s.status === 'active'
  );
  
  if (activeSubExists) {
    return { error: 'User already has an active subscription' };
  }
  
  const subscription = {
    id: crypto.randomBytes(8).toString('hex'),
    userId: subData.userId,
    amount: subData.amount || 0,
    paymentMethod: subData.paymentMethod || 'manual',
    paymentReference: subData.paymentReference || '',
    status: 'active',
    validFrom: new Date(subData.validFrom || new Date()).toISOString(),
    validUntil: new Date(subData.validUntil || new Date(Date.now() + 30*24*60*60*1000)).toISOString(),
    reason: subData.reason || 'Premium access granted',
    grantedBy: subData.grantedBy || 'admin',
    grantedAt: new Date().toISOString(),
    notes: subData.notes || ''
  };
  
  subscriptions.push(subscription);
  
  // Update user
  user.isPremium = true;
  user.subscriptionId = subscription.id;
  writeFile(USERS_FILE, users);
  writeFile(SUBSCRIPTIONS_FILE, subscriptions);
  
  return subscription;
}

/**
 * Revoke a subscription (ADMIN ONLY)
 * @param {string} subscriptionId
 * @param {string} reason
 * @returns {boolean}
 */
function revokeSubscription(subscriptionId, reason) {
  ensureFilesExist();
  const users = readFile(USERS_FILE);
  const subscriptions = readFile(SUBSCRIPTIONS_FILE);
  
  const sub = subscriptions.find(s => s.id === subscriptionId);
  if (!sub) {
    return { error: 'Subscription not found' };
  }
  
  sub.status = 'revoked';
  sub.revokedAt = new Date().toISOString();
  sub.revokeReason = reason || 'No reason provided';
  
  // Update user
  const user = users.find(u => u.id === sub.userId);
  if (user) {
    user.isPremium = false;
    user.subscriptionId = null;
  }
  
  writeFile(USERS_FILE, users);
  writeFile(SUBSCRIPTIONS_FILE, subscriptions);
  
  return { success: true, message: 'Subscription revoked' };
}

/**
 * Check if user has valid premium access
 * CRITICAL: This is the authoritative check - NO BYPASSES
 * @param {string} userId
 * @returns {boolean}
 */
function isPremiumUser(userId) {
  ensureFilesExist();
  const users = readFile(USERS_FILE);
  const subscriptions = readFile(SUBSCRIPTIONS_FILE);
  
  const user = users.find(u => u.id === userId);
  if (!user || !user.subscriptionId) {
    return false;
  }
  
  const subscription = subscriptions.find(s => s.id === user.subscriptionId);
  if (!subscription) {
    return false;
  }
  
  // Check subscription is active and not expired
  if (subscription.status !== 'active') {
    return false;
  }
  
  const now = new Date();
  const validFrom = new Date(subscription.validFrom);
  const validUntil = new Date(subscription.validUntil);
  
  return now >= validFrom && now <= validUntil;
}

/**
 * Get user's subscription details
 */
function getUserSubscription(userId) {
  ensureFilesExist();
  const subscriptions = readFile(SUBSCRIPTIONS_FILE);
  return subscriptions.find(s => s.userId === userId && s.status === 'active');
}

/**
 * List all subscriptions (ADMIN ONLY)
 */
function getAllSubscriptions(filters = {}) {
  ensureFilesExist();
  const subscriptions = readFile(SUBSCRIPTIONS_FILE);
  let result = subscriptions;
  
  if (filters.status) {
    result = result.filter(s => s.status === filters.status);
  }
  if (filters.userId) {
    result = result.filter(s => s.userId === filters.userId);
  }
  
  return result;
}

/**
 * Extend subscription (ADMIN ONLY)
 */
function extendSubscription(subscriptionId, days) {
  ensureFilesExist();
  const subscriptions = readFile(SUBSCRIPTIONS_FILE);
  
  const sub = subscriptions.find(s => s.id === subscriptionId);
  if (!sub || sub.status !== 'active') {
    return { error: 'Subscription not found or not active' };
  }
  
  const newUntil = new Date(sub.validUntil);
  newUntil.setDate(newUntil.getDate() + days);
  
  sub.validUntil = newUntil.toISOString();
  sub.lastExtended = new Date().toISOString();
  
  writeFile(SUBSCRIPTIONS_FILE, subscriptions);
  
  return { success: true, newUntil: sub.validUntil };
}

/**
 * List all users (ADMIN ONLY)
 */
function getAllUsers(filters = {}) {
  ensureFilesExist();
  const users = readFile(USERS_FILE);
  let result = users;
  
  if (filters.isPremium !== undefined) {
    result = result.filter(u => u.isPremium === filters.isPremium);
  }
  
  return result.map(u => ({
    ...u,
    subscriptionDetails: getUserSubscription(u.id)
  }));
}

/**
 * Update user (ADMIN ONLY)
 */
function updateUser(userId, updateData) {
  ensureFilesExist();
  const users = readFile(USERS_FILE);
  
  const user = users.find(u => u.id === userId);
  if (!user) {
    return { error: 'User not found' };
  }
  
  // Only allow updating non-critical fields
  const allowedFields = ['name', 'phone', 'location', 'taxId'];
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });
  
  user.updatedAt = new Date().toISOString();
  writeFile(USERS_FILE, users);
  
  return user;
}

/**
 * Delete user (ADMIN ONLY) - SOFT DELETE
 */
function deleteUser(userId, reason) {
  ensureFilesExist();
  const users = readFile(USERS_FILE);
  
  const user = users.find(u => u.id === userId);
  if (!user) {
    return { error: 'User not found' };
  }
  
  user.deleted = true;
  user.deletedAt = new Date().toISOString();
  user.deleteReason = reason || 'No reason provided';
  
  writeFile(USERS_FILE, users);
  
  return { success: true };
}

module.exports = {
  createUser,
  getUser,
  getUserByEmail,
  createSubscription,
  revokeSubscription,
  isPremiumUser,
  getUserSubscription,
  getAllSubscriptions,
  extendSubscription,
  getAllUsers,
  updateUser,
  deleteUser,
  logAccess,
  ensureFilesExist
};
