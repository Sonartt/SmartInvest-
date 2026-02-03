require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const contentAPI = require('./api/content-management');
const subManager = require('./api/subscription-manager');
const shareLinkService = require('./services/share-link-service');
const { blockIP, unblockIP, getClientIP, isIPBlocked, logSecurityEvent, securityHeaders } = require('./middleware/security');

const app = express();
app.use(cors());
app.use(securityHeaders);
// SECURITY FIX #4: Add request size limits to prevent DOS
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Rate limiters
const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 25, standardHeaders: true, legacyHeaders: false });
const paymentLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false });
const downloadLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

// Basic auth for admin routes if ADMIN_USER is set
// SECURITY FIX #1: Enforce admin authentication always
function adminAuth(req, res, next) {
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  
  // SECURITY: If admin credentials not configured, BLOCK access (don't bypass)
  if (!adminUser || !adminPass) {
    console.error('[SECURITY] Admin access attempt without credentials configured!');
    return res.status(500).json({ 
      error: 'Admin authentication not configured. Please set ADMIN_USER and ADMIN_PASS environment variables.' 
    });
  }
  
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).end('Unauthorized');
  }
  const creds = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8');
  const [user, pass] = creds.split(':');
  if (user === adminUser && pass === adminPass) {
    // Log successful admin authentication (only outside production to avoid exposing auth events in general logs)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH] Admin login successful from IP: ${req.ip}`);
    }
    return next();
  }
  
  // Log failed authentication attempt
  console.warn(`[SECURITY] Failed admin login attempt from IP: ${req.ip}`);
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).end('Unauthorized');
}

function isAdminRequest(req) {
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  if (!adminUser || !adminPass) return false;
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) return false;
  const creds = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8');
  const [user, pass] = creds.split(':');
  return user === adminUser && pass === adminPass;
}

const PORT = process.env.PORT || 3000;

const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS) || 15000;

async function fetchWithTimeout(url, options = {}, timeoutMs = UPSTREAM_TIMEOUT_MS) {
  if (typeof AbortController === 'undefined') {
    return fetch(url, options);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readResponsePayload(res) {
  const text = await res.text();
  if (!text) return { parsed: null, text: '' };
  try {
    return { parsed: JSON.parse(text), text };
  } catch (e) {
    return { parsed: null, text };
  }
}

// Helper: get OAuth token for M-Pesa (Daraja)
async function getMpesaAuth() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error('MPESA keys not configured');
  const basic = Buffer.from(`${key}:${secret}`).toString('base64');
  const url = process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const res = await fetchWithTimeout(url, { headers: { Authorization: `Basic ${basic}` } });
  const { parsed, text } = await readResponsePayload(res);
  if (!res.ok) {
    const reason = parsed?.error_description || parsed?.error || text || 'Failed to get M-Pesa token';
    throw new Error(`Failed to get M-Pesa token (${res.status}): ${reason}`);
  }
  return parsed?.access_token;
}

// MPESA STK Push (simplified for Daraja sandbox)
app.post('/api/pay/mpesa', paymentLimiter, async (req, res) => {
  try {
    // Default to 1000 KES if amount not provided
    const { phone, accountReference } = req.body || {};
    const amount = Number(req.body && req.body.amount) || 1000;
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const token = await getMpesaAuth();
    // Prefer explicit MPESA_NUMBER; fall back to older env keys where present
    // Use explicit MPESA_NUMBER if provided; otherwise use the provided gateway number 0114383762 as fallback
    const shortcode = process.env.MPESA_NUMBER || process.env.MPESA_SHORTCODE || process.env.MPESA_PAYBILL || '0114383762';
    const passkey = process.env.MPESA_PASSKEY || '';

    const endpoint = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    // Build body: if passkey is configured include Timestamp and Password, otherwise omit them
    const body = {
      BusinessShortCode: shortcode,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://example.com/mpesa/callback',
      AccountReference: accountReference || process.env.MPESA_ACCOUNT_REF || 'SmartInvest',
      TransactionDesc: 'Payment'
    };
    if (passkey) {
      const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0,14);
      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
      body.Password = password;
      body.Timestamp = timestamp;
    } else {
      console.warn('MPESA_PASSKEY not configured — sending STK request without Password/Timestamp (may be rejected by provider)');
    }

    // Log outgoing request (mask sensitive fields)
    logMpesa({ stage: 'request', endpoint, body: maskMpesaBody(body) });

    const mpRes = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // Read raw response for logging and parsing
    const { parsed, text } = await readResponsePayload(mpRes);
    logMpesa({ stage: 'response', status: mpRes.status, raw: parsed ? undefined : text, parsed: parsed || undefined });

    if (!mpRes.ok) {
      return res.status(502).json({
        success: false,
        error: parsed?.errorMessage || parsed?.error || 'M-Pesa request failed',
        status: mpRes.status,
        data: parsed || text
      });
    }

    return res.json({ success: true, data: parsed || text });
  } catch (err) {
    console.error('mpesa error', err.message);
    if (err && err.name === 'AbortError') {
      return res.status(504).json({ error: 'M-Pesa request timed out' });
    }
    return res.status(500).json({ error: err.message });
  }
});

// PayPal create order (sandbox by default)
async function getPaypalToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error('PayPal credentials not set');
  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
  const url = process.env.PAYPAL_ENV === 'production'
    ? 'https://api-m.paypal.com/v1/oauth2/token'
    : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const { parsed, text } = await readResponsePayload(res);
  if (!res.ok) {
    const reason = parsed?.error_description || parsed?.error || text || 'Failed to get PayPal token';
    throw new Error(`Failed to get PayPal token (${res.status}): ${reason}`);
  }
  return parsed?.access_token;
}

app.post('/api/pay/paypal/create-order', paymentLimiter, async (req, res) => {
  try {
    const token = await getPaypalToken();
    const url = process.env.PAYPAL_ENV === 'production'
      ? 'https://api-m.paypal.com/v2/checkout/orders'
      : 'https://api-m.sandbox.paypal.com/v2/checkout/orders';
    // Convert 1000 KES to USD (use env EXCHANGE_RATE_KES_USD if provided)
    const rate = Number(process.env.EXCHANGE_RATE_KES_USD) || 0.0065;
    const kesAmount = 1000; // fixed as requested
    const usdAmount = Number((kesAmount * rate).toFixed(2));
    const purchase = {
      intent: 'CAPTURE',
      purchase_units: [ {
        amount: { currency_code: 'USD', value: String(usdAmount) },
        custom_id: req.body.fileId || undefined,
        reference_id: req.body.fileId || undefined
      } ],
      application_context: {
        return_url: process.env.PAYPAL_RETURN_URL || 'https://example.com/paypal/return',
        cancel_url: process.env.PAYPAL_CANCEL_URL || 'https://example.com/paypal/cancel'
      }
    };
    const r = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(purchase)
    });
    const { parsed, text } = await readResponsePayload(r);
    const data = parsed || { raw: text };
    if (!r.ok) {
      return res.status(502).json({
        success: false,
        error: data?.message || data?.name || 'PayPal order creation failed',
        status: r.status,
        data
      });
    }
    const approve = (data.links || []).find(l => l.rel === 'approve')?.href;
    return res.json({ success: true, data, approveUrl: approve });
  } catch (err) {
    console.error('paypal error', err.message);
    if (err && err.name === 'AbortError') {
      return res.status(504).json({ error: 'PayPal request timed out' });
    }
    return res.status(500).json({ error: err.message });
  }
});

// Simple JSON file user store (demo). In production use a real DB.
const USERS_FILE = './data/users.json';
const WALLET_TRANSFERS_FILE = './data/wallet-transfers.json';
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const EmailService = require('./services/email-service');

// Initialize email service with Gmail credentials
const emailService = new EmailService();
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailService.initialize({
    email: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true'
  }).then(() => {
    console.log('✅ Email service initialized');
  }).catch(err => {
    console.error('❌ Email service initialization error:', err.message);
  });
} else {
  console.warn('⚠️ Email service not initialized: SMTP_USER/SMTP_PASS not set');
}

// Logging helpers for MPESA debug (enabled when MPESA_DEBUG=true)
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (e) { /* ignore */ }
const MPESA_LOG = path.join(LOG_DIR, 'mpesa.log');
function maskMpesaBody(b) {
  try {
    const copy = Object.assign({}, b);
    if (copy && copy.Password) copy.Password = '[REDACTED]';
    return copy;
  } catch (e) { return b; }
}
function logMpesa(entry) {
  if (String(process.env.MPESA_DEBUG).toLowerCase() !== 'true') return;
  try {
    const out = { ts: new Date().toISOString(), ...entry };
    fs.appendFileSync(MPESA_LOG, JSON.stringify(out) + '\n');
  } catch (e) { console.error('mpesa log write error', e && e.message); }
}

// Setup mail transporter if SMTP config provided
let mailer = null;
if (process.env.SMTP_HOST) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

async function sendNotificationMail(opts={}){
  if (!mailer) return;
  const to = opts.to || process.env.NOTIFY_EMAIL;
  if (!to) return;
  try {
    const info = await mailer.sendMail({
      from: process.env.SMTP_FROM || `no-reply@${process.env.KCB_ACCOUNT_NAME||'smartinvest'}.example`,
      to,
      subject: opts.subject || 'SmartInvest Notification',
      text: opts.text || '',
      html: opts.html
    });
    // If using Ethereal, log preview URL
    try {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log('Ethereal preview URL:', preview);
    } catch (e) {
      // ignore
    }
    return info;
  } catch (e) {
    console.error('mail error', e.message);
  }
}

// If mailer isn't configured via SMTP and we're not in production, create an Ethereal test account
(async function initEthereal(){
  if (mailer) return; // already configured via SMTP
  if (process.env.NODE_ENV === 'production') return;
  try {
    const testAccount = await nodemailer.createTestAccount();
    mailer = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    console.log('Ethereal test account created for outgoing email:');
    console.log('  user:', testAccount.user);
    console.log('  pass:', testAccount.pass);
    console.log('Use the preview URLs logged when messages are sent to view emails.');
  } catch (e) {
    console.error('Failed to create Ethereal account:', e.message);
  }
})();

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function readWalletTransfers() {
  try {
    if (!fs.existsSync(WALLET_TRANSFERS_FILE)) {
      fs.writeFileSync(WALLET_TRANSFERS_FILE, JSON.stringify([], null, 2));
    }
    const raw = fs.readFileSync(WALLET_TRANSFERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeWalletTransfers(transfers) {
  fs.writeFileSync(WALLET_TRANSFERS_FILE, JSON.stringify(transfers, null, 2));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function normalizeEmail(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  const [local, domain] = raw.split('@');
  if (!domain) return raw;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const stripped = local.split('+')[0].replace(/\./g, '');
    return `${stripped}@gmail.com`;
  }
  return raw;
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits;
}

function isValidEmail(value) {
  const email = String(value || '').trim();
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(value) {
  const pwd = String(value || '');
  if (pwd.length < 10) return false;
  if (!/[A-Z]/.test(pwd)) return false;
  if (!/[a-z]/.test(pwd)) return false;
  if (!/\d/.test(pwd)) return false;
  if (!/[^A-Za-z0-9]/.test(pwd)) return false;
  return true;
}

function isValidPhone(value) {
  const digits = normalizePhone(value);
  return digits.length >= 10 && digits.length <= 15;
}

function isValidCountry(value) {
  const country = String(value || '').trim();
  return country.length >= 2 && country.length <= 64;
}

function isValidName(value) {
  const name = String(value || '').trim();
  return name.length >= 2 && name.length <= 80;
}

function isSafeText(value, maxLen = 200) {
  const text = String(value || '').trim();
  if (text.length > maxLen) return false;
  return !/[<>]/.test(text);
}

function findContactConflict(users, { email, mobileNumber, phone }, currentUserId = null) {
  const targetEmail = normalizeEmail(email);
  const targetPhone = normalizePhone(mobileNumber || phone);
  let emailMatch = null;
  let phoneMatch = null;

  if (targetEmail) {
    emailMatch = users.find(u => u.id !== currentUserId && normalizeEmail(u.email) === targetEmail);
  }

  if (targetPhone) {
    phoneMatch = users.find(u => u.id !== currentUserId && normalizePhone(u.mobileNumber || u.phone) === targetPhone);
  }

  if (emailMatch) {
    return { conflict: true, field: 'email', message: 'email already in use by another account' };
  }

  if (phoneMatch) {
    return { conflict: true, field: 'mobileNumber', message: 'mobile number already in use by another account' };
  }

  return { conflict: false };
}

function getWalletBalance(user) {
  const raw = user && (user.walletBalance ?? user.amount ?? 0);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function setWalletBalance(user, amount) {
  const normalized = Number(amount) || 0;
  user.walletBalance = normalized;
  user.amount = normalized;
}

app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { email, password, acceptTerms, mobileNumber, paymentMethod, taxInfo, country, fullName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid email format' });
    if (!acceptTerms) return res.status(400).json({ error: 'terms must be accepted' });

    const referralToken = req.body.referralToken || req.body.affiliateToken || req.body.ref || null;

    const users = readUsers();
    const conflict = findContactConflict(users, { email, mobileNumber });
    if (conflict.conflict) {
      return res.status(409).json({ error: conflict.message });
    }
    if (users.find(u => normalizeEmail(u.email) === normalizeEmail(email))) {
      return res.status(409).json({ error: 'email already registered' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const userId = uuidv4();
    
    // Capture IP address and user agent for security tracking
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress || 
                     'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    let referralLink = null;
    if (referralToken) {
      try {
        referralLink = await shareLinkService.getLink(referralToken);
      } catch (e) {
        referralLink = null;
      }
    }

    const user = { 
      id: userId,
      email: String(email || '').trim().toLowerCase(), 
      passwordHash: hash,
      fullName: fullName || '',
      mobileNumber: mobileNumber || '',
      country: country || '',
      paymentMethod: paymentMethod || '',
      taxInfo: {
        taxId: (taxInfo && taxInfo.taxId) || '',
        taxCountry: (taxInfo && taxInfo.taxCountry) || country || '',
        taxType: (taxInfo && taxInfo.taxType) || 'individual',
        vatNumber: (taxInfo && taxInfo.vatNumber) || '',
        businessRegistration: (taxInfo && taxInfo.businessRegistration) || '',
        verified: false
      },
      amount: 0,
      walletBalance: 0,
      isPremium: false,
      premiumGrantedAt: null,
      premiumGrantedBy: null,
      isAdmin: false,
      referralToken: referralLink ? referralLink.token : null,
      referralType: referralLink ? referralLink.type : null,
      referredBy: referralLink ? referralLink.userId : null,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      registrationIp: ipAddress,
      registrationUserAgent: userAgent,
      loginHistory: []
    };
    users.push(user);
    writeUsers(users);

    if (referralLink && (referralLink.type === 'affiliate' || referralLink.type === 'referral')) {
      try {
        await shareLinkService.recordConversion(referralLink.token, {
          newUserId: user.id,
          newUserEmail: user.email,
          referralType: referralLink.type,
          referrerUserId: referralLink.userId
        });
      } catch (e) {
        console.warn('referral conversion tracking failed:', e.message);
      }
    }
    
    // Send welcome email with terms and conditions
    console.log(`📧 Sending welcome email to ${email}...`);
    await emailService.sendWelcomeEmail(email, user);
    
    // Send terms and conditions email
    console.log(`📧 Sending terms & conditions email to ${email}...`);
    await emailService.sendTermsAndConditionsEmail(email, user);
    
    // Track signup in analytics
    try {
      await fetch('http://localhost:' + (process.env.PORT || 3000) + '/api/analytics/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });
    } catch (e) {
      console.log('analytics tracking skipped');
    }
    
    return res.json({ success: true, message: 'signup successful - welcome emails sent', userId });
  } catch (err) {
    console.error('signup error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid email format' });
    const users = readUsers();
    const normalizedEmail = normalizeEmail(email);
    const matches = users.filter(u => normalizeEmail(u.email) === normalizedEmail);
    if (matches.length > 1) {
      logSecurityEvent('contact-conflict', req.ip, { reason: 'duplicate_email', email: normalizedEmail });
      return res.status(409).json({ error: 'contact conflict detected, contact support' });
    }
    const user = matches[0];
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    
    // Capture login details
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress || 
                     'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const loginTime = new Date().toISOString();
    
    // Update last login timestamp and add to login history
    user.lastLoginAt = loginTime;
    user.lastLoginIp = ipAddress;
    
    // Initialize loginHistory if it doesn't exist
    if (!user.loginHistory) user.loginHistory = [];
    
    // Add current login to history (keep last 50 logins)
    user.loginHistory.push({
      timestamp: loginTime,
      ipAddress: ipAddress,
      userAgent: userAgent
    });
    
    // Keep only last 50 login records to prevent file bloat
    if (user.loginHistory.length > 50) {
      user.loginHistory = user.loginHistory.slice(-50);
    }
    
    writeUsers(users);
    
    // Track login in analytics
    try {
      await fetch('http://localhost:' + (process.env.PORT || 3000) + '/api/analytics/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });
    } catch (e) {
      console.log('analytics tracking skipped');
    }
    
    // For demo: return a simple success message. In production return a session or JWT.
    return res.json({ success: true, message: 'login successful', isPremium: user.isPremium || false, isAdmin: user.isAdmin || false });
  } catch (err) {
    console.error('login error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Get all registered users (with sensitive data visible only to admin)
app.get('/api/admin/users', adminAuth, (req, res) => {
  try {
    const users = readUsers();
    // Return user data without password hashes
    const safeUsers = users.map(u => {
      const { passwordHash, ...safeData } = u;
      return {
        ...safeData,
        subscriptionDetails: subManager.getUserSubscription ? subManager.getUserSubscription(u.id) : null
      };
    });
    return res.json({ success: true, users: safeUsers });
  } catch (err) {
    console.error('admin users list error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Grant premium access to a user
app.post('/api/admin/users/:userId/grant-premium', adminAuth, express.json(), async (req, res) => {
  try {
    const userId = req.params.userId;
    const { requirements } = req.body;
    
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'user not found' });
    }
    
    // Check if requirements are met (you can customize this logic)
    const requirementsMet = requirements && requirements.verified === true;
    
    if (!requirementsMet) {
      return res.status(400).json({ error: 'User has not met the required terms for premium access' });
    }
    
    // Grant premium access
    users[userIndex].isPremium = true;
    users[userIndex].premiumGrantedAt = new Date().toISOString();
    users[userIndex].premiumGrantedBy = process.env.ADMIN_USER || 'admin';
    
    writeUsers(users);
    
    // Send premium upgrade email
    console.log(`🎉 Sending premium upgrade email to ${users[userIndex].email}...`);
    await emailService.sendPremiumUpgradeEmail(users[userIndex].email, users[userIndex]);
    
    return res.json({ success: true, message: 'Premium access granted - notification email sent', user: { id: users[userIndex].id, email: users[userIndex].email, isPremium: true } });
  } catch (err) {
    console.error('grant premium error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Revoke premium access from a user
app.post('/api/admin/users/:userId/revoke-premium', adminAuth, express.json(), (req, res) => {
  try {
    const userId = req.params.userId;
    
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'user not found' });
    }
    
    users[userIndex].isPremium = false;
    users[userIndex].premiumRevokedAt = new Date().toISOString();
    users[userIndex].premiumRevokedBy = process.env.ADMIN_USER || 'admin';
    
    writeUsers(users);
    
    return res.json({ success: true, message: 'Premium access revoked' });
  } catch (err) {
    console.error('revoke premium error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Add another admin (with requirements check)
app.post('/api/admin/add-admin', adminAuth, express.json(), (req, res) => {
  try {
    const { userId, requirements } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'user not found' });
    }
    
    // Check if requirements are met for admin access
    const requirementsMet = requirements && requirements.verified === true && requirements.adminApproved === true;
    
    if (!requirementsMet) {
      return res.status(400).json({ error: 'User has not met the requirements to become an admin' });
    }
    
    // Grant admin access
    users[userIndex].isAdmin = true;
    users[userIndex].adminGrantedAt = new Date().toISOString();
    users[userIndex].adminGrantedBy = process.env.ADMIN_USER || 'admin';
    
    writeUsers(users);
    
    // Notify new admin
    sendNotificationMail({
      to: users[userIndex].email,
      subject: 'Admin Access Granted - SmartInvest Africa',
      text: `You have been granted administrator access to SmartInvest Africa.`,
      html: `<p>Congratulations!</p><p>You have been granted <strong>administrator access</strong> to SmartInvest Africa.</p><p>You can now access the admin dashboard and manage the platform.</p>`
    });
    
    return res.json({ success: true, message: 'Admin access granted', admin: { id: users[userIndex].id, email: users[userIndex].email, isAdmin: true } });
  } catch (err) {
    console.error('add admin error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Remove admin access
app.post('/api/admin/remove-admin', adminAuth, express.json(), (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'user not found' });
    }
    
    // Prevent removing the primary admin
    if (users[userIndex].email === process.env.ADMIN_USER) {
      return res.status(403).json({ error: 'Cannot remove primary admin access' });
    }
    
    users[userIndex].isAdmin = false;
    users[userIndex].adminRevokedAt = new Date().toISOString();
    users[userIndex].adminRevokedBy = process.env.ADMIN_USER || 'admin';
    
    writeUsers(users);
    
    return res.json({ success: true, message: 'Admin access removed' });
  } catch (err) {
    console.error('remove admin error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Webhook endpoints to receive provider callbacks (simple logging + ack)
app.post('/api/pay/mpesa/callback', (req, res) => {
  try {
    const payload = req.body;
    // If a callback secret is configured, require HMAC-SHA256 signature in header `x-mpesa-signature`
    const secret = process.env.MPESA_CALLBACK_SECRET;
    if (secret) {
      const sigHeader = (req.headers['x-mpesa-signature'] || req.headers['x-signature'] || '').toString();
      const computed = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
      if (!sigHeader || sigHeader !== computed) {
        console.warn('mpesa callback signature mismatch');
        return res.status(401).json({ error: 'invalid signature' });
      }
    }
    const tx = { provider: 'mpesa', timestamp: new Date().toISOString(), payload };
    const file = './transactions.json';
    const arr = require('fs').existsSync(file) ? JSON.parse(require('fs').readFileSync(file)) : [];
    arr.push(tx);
    require('fs').writeFileSync(file, JSON.stringify(arr, null, 2));
    // Strict mapping: only use AccountReference value to map to a file id (exact match)
    try {
      const body = payload.Body || payload.body || payload;
      const stk = (body && (body.stkCallback || body.STKCallback)) || body;
      const items = (stk && stk.CallbackMetadata && stk.CallbackMetadata.Item) || (body && body.CallbackMetadata && body.CallbackMetadata.Item) || [];
      const accItem = Array.isArray(items) ? items.find(i => (String(i.Name||i.name||'')).toLowerCase() === 'accountreference' || (String(i.Name||i.name||'')).toLowerCase() === 'account') : null;
      const acctVal = accItem && accItem.Value ? String(accItem.Value).trim() : null;
      if (acctVal) {
        const files = readFilesMeta();
        const match = files.find(f => f.id === acctVal);
        if (match) {
          const phone = Array.isArray(items) ? (items.find(i=>i.Name==='PhoneNumber') || items.find(i=>i.Name==='phone' ) ) : null;
          const emailLike = phone && phone.Value ? String(phone.Value)+'@mpesa.local' : '';
          const users = readUsers();
          if (emailLike) {
            const normalizedEmail = normalizeEmail(emailLike);
            const matches = users.filter(u => normalizeEmail(u.email) === normalizedEmail);
            if (matches.length > 1) {
              logSecurityEvent('payment-contact-conflict', req.ip, { provider: 'mpesa', email: normalizedEmail, reason: 'duplicate_email' });
            }
          }
          grantPurchase(match.id, emailLike, 'mpesa', { raw: payload });
        }
      }
    } catch (e) { console.error('mpesa grant detection error', e.message); }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('mpesa callback error', err.message);
    return res.status(500).end();
  }
});

app.post('/api/pay/paypal/webhook', (req, res) => {
  try {
    const payload = req.body;
    const tx = { provider: 'paypal', timestamp: new Date().toISOString(), payload };
    const file = './transactions.json';
    const arr = require('fs').existsSync(file) ? JSON.parse(require('fs').readFileSync(file)) : [];
    arr.push(tx);
    require('fs').writeFileSync(file, JSON.stringify(arr, null, 2));
    // Strict mapping: only honor explicit PayPal fields `custom_id`, `reference_id` or `invoice_id` matching a file id
    try {
      const resource = payload.resource || payload.body || payload;
      const files = readFilesMeta();
      let fileId = null;
      const pus = (resource.purchase_units || resource.purchaseUnits || []);
      for (const pu of pus) {
        const candidates = [pu.custom_id, pu.reference_id, pu.invoice_id].filter(Boolean).map(String);
        for (const c of candidates) {
          const match = files.find(f => f.id === c);
          if (match) { fileId = match.id; break; }
        }
        if (fileId) break;
      }
      const payerEmail = resource?.payer?.email_address || resource?.payer?.email || payload?.payer_email || '';
      if (payerEmail) {
        const users = readUsers();
        const normalizedEmail = normalizeEmail(payerEmail);
        const matches = users.filter(u => normalizeEmail(u.email) === normalizedEmail);
        if (matches.length > 1) {
          logSecurityEvent('payment-contact-conflict', req.ip, { provider: 'paypal', email: normalizedEmail, reason: 'duplicate_email' });
        }
        if (matches.length === 0) {
          logSecurityEvent('payment-unregistered-email', req.ip, { provider: 'paypal', email: normalizedEmail });
        }
      }
      if (fileId) grantPurchase(fileId, payerEmail, 'paypal', { raw: payload });
    } catch (e) { console.error('paypal grant detection error', e.message); }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('paypal webhook error', err.message);
    return res.status(500).end();
  }
});

// Manual KCB Bank Transfer (simple flow)
app.post('/api/pay/kcb/manual', paymentLimiter, (req, res) => {
  try {
    const { name, email, amount, reference } = req.body;
    if (!name || !email || !amount) return res.status(400).json({ error: 'name, email and amount required' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid email format' });

    const users = readUsers();
    const normalizedEmail = normalizeEmail(email);
    const emailMatches = users.filter(u => normalizeEmail(u.email) === normalizedEmail);
    if (emailMatches.length > 1) {
      logSecurityEvent('payment-contact-conflict', req.ip, { email: normalizedEmail, reason: 'duplicate_email' });
      return res.status(409).json({ error: 'contact conflict detected for email' });
    }
    if (emailMatches.length === 0) {
      logSecurityEvent('payment-unregistered-email', req.ip, { email: normalizedEmail, provider: 'kcb_manual' });
      return res.status(400).json({ error: 'email not registered' });
    }

    const tx = {
      provider: 'kcb_manual',
      timestamp: new Date().toISOString(),
      name,
      email: emailMatches[0].email,
      amount,
      reference: reference || '',
      status: 'pending',
      account: {
        bank: process.env.KCB_BANK_NAME || 'KCB Bank',
        accountName: process.env.KCB_ACCOUNT_NAME || 'SmartInvest Africa',
        accountNumber: process.env.KCB_ACCOUNT_NUMBER || '0000000000'
      }
    };

    const file = './transactions.json';
    const arr = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
    arr.push(tx);
    fs.writeFileSync(file, JSON.stringify(arr, null, 2));

    // send notification to admin (if configured)
    sendNotificationMail({
      subject: `New KCB manual transfer recorded — ${tx.amount} KES`,
      text: `A new manual bank transfer was recorded:\n\nName: ${tx.name}\nEmail: ${tx.email}\nAmount: ${tx.amount}\nReference: ${tx.reference || tx.timestamp}\n\nAccount: ${tx.account.bank} ${tx.account.accountName} ${tx.account.accountNumber}`,
      html: `<p>A new manual bank transfer was recorded:</p><ul><li>Name: ${tx.name}</li><li>Email: ${tx.email}</li><li>Amount: ${tx.amount}</li><li>Reference: ${tx.reference || tx.timestamp}</li></ul><p>Account: <strong>${tx.account.bank} — ${tx.account.accountName} — ${tx.account.accountNumber}</strong></p>`
    });

    // send confirmation to user
    sendNotificationMail({ to: tx.email, subject: 'SmartInvest — Bank transfer recorded', text: `Thank you. Please pay KES ${tx.amount} to ${tx.account.accountNumber} (Ref: ${tx.reference || tx.timestamp}).` });

    return res.json({ success: true, message: 'manual bank transfer recorded', transaction: tx });
  } catch (err) {
    console.error('kcb manual error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin endpoints
app.get('/api/admin/kcb-transfers', adminAuth, (req, res) => {
  try {
    const file = './transactions.json';
    const arr = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
    const only = arr.filter(t => t.provider === 'kcb_manual');
    return res.json({ success: true, transfers: only });
  } catch (e) {
    console.error('admin list error', e.message);
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/kcb/mark-paid', adminAuth, (req, res) => {
  try {
    const { timestamp, note } = req.body;
    if (!timestamp) return res.status(400).json({ error: 'timestamp required' });
    const file = './transactions.json';
    const arr = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
    const idx = arr.findIndex(t => t.provider === 'kcb_manual' && t.timestamp === timestamp);
    if (idx === -1) return res.status(404).json({ error: 'transfer not found' });
    arr[idx].status = 'paid';
    arr[idx].paidAt = new Date().toISOString();
    if (note) arr[idx].note = note;
    fs.writeFileSync(file, JSON.stringify(arr, null, 2));

    // notify user
    sendNotificationMail({ to: arr[idx].email, subject: 'SmartInvest — Transfer marked paid', text: `Your bank transfer of KES ${arr[idx].amount} has been marked as received. Thank you.` });

    // Strict mapping: only auto-grant when bank `reference` exactly equals a file id
    try {
      const ref = String(arr[idx].reference || '').trim();
      if (ref) {
        const files = readFilesMeta();
        const match = files.find(f => f.id === ref);
        if (match) grantPurchase(match.id, arr[idx].email, 'kcb_manual', { transactionTimestamp: arr[idx].timestamp });
      }
    } catch (e) { console.error('auto-grant on mark-paid error', e.message); }

    return res.json({ success: true, transfer: arr[idx] });
  } catch (e) {
    console.error('mark paid error', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// Serve admin.html protected by basic auth (if configured)
app.get('/admin.html', adminAuth, (req, res) => {
  const adminFile = path.join(__dirname, 'admin.html');
  if (fs.existsSync(adminFile)) return res.sendFile(adminFile);
  return res.status(404).send('admin.html not found');
});

// --- File marketplace: uploads, metadata, purchases, downloads ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const FILES_JSON = path.join(__dirname, 'data', 'files.json');
const SCENARIOS_FILE = path.join(__dirname, 'data', 'scenarios.json');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
if (!fs.existsSync(FILES_JSON)) fs.writeFileSync(FILES_JSON, JSON.stringify([], null, 2));
if (!fs.existsSync(SCENARIOS_FILE)) fs.writeFileSync(SCENARIOS_FILE, JSON.stringify([], null, 2));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const id = uuidv4();
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${id}-${safe}`);
  }
});
const upload = multer({ storage });

function readFilesMeta(){
  try { return JSON.parse(fs.readFileSync(FILES_JSON, 'utf8') || '[]'); } catch(e){ return []; }
}
function writeFilesMeta(arr){ fs.writeFileSync(FILES_JSON, JSON.stringify(arr, null, 2)); }

// Purchases file helpers
const PURCHASES_FILE = path.join(__dirname, 'data', 'purchases.json');
if (!fs.existsSync(PURCHASES_FILE)) fs.writeFileSync(PURCHASES_FILE, JSON.stringify([], null, 2));

function readPurchases(){
  try { return JSON.parse(fs.readFileSync(PURCHASES_FILE, 'utf8') || '[]'); } catch(e){ console.warn('Failed to read purchases:', e.message); return []; }
}
function writePurchases(arr){ fs.writeFileSync(PURCHASES_FILE, JSON.stringify(arr, null, 2)); }

// Tokens file helpers
const TOKENS_FILE = path.join(__dirname, 'data', 'tokens.json');
if (!fs.existsSync(TOKENS_FILE)) fs.writeFileSync(TOKENS_FILE, JSON.stringify({}, null, 2));

function readTokens(){
  try { return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8') || '{}'); } catch(e){ console.warn('Failed to read tokens:', e.message); return {}; }
}
function writeTokens(obj){ fs.writeFileSync(TOKENS_FILE, JSON.stringify(obj, null, 2)); }

// Access violations logging
const ACCESS_VIOLATIONS_FILE = path.join(__dirname, 'data', 'access-violations.json');
if (!fs.existsSync(ACCESS_VIOLATIONS_FILE)) {
  fs.writeFileSync(ACCESS_VIOLATIONS_FILE, JSON.stringify({ violations: [] }, null, 2));
}

function readAccessViolations(){
  try { return JSON.parse(fs.readFileSync(ACCESS_VIOLATIONS_FILE, 'utf8') || '{"violations":[]}'); }
  catch(e){ return { violations: [] }; }
}

function writeAccessViolations(data){
  fs.writeFileSync(ACCESS_VIOLATIONS_FILE, JSON.stringify(data, null, 2));
}

function logAccessViolation(req, details = {}){
  try {
    const MAX_WARNINGS = Number(process.env.ACCESS_VIOLATION_LIMIT) || 3;
    const WINDOW_MS = Number(process.env.ACCESS_VIOLATION_WINDOW_MS) || (24 * 60 * 60 * 1000);
    const BLOCK_DURATION_MS = Number(process.env.ACCESS_VIOLATION_BLOCK_MS) || (24 * 60 * 60 * 1000);
    const ip = getClientIP(req);
    const now = Date.now();
    const entry = {
      id: uuidv4(),
      at: new Date().toISOString(),
      ip,
      method: req.method,
      path: req.originalUrl,
      userAgent: req.headers['user-agent'] || '',
      email: details.email || '',
      fileId: details.fileId || '',
      reason: details.reason || 'access_denied',
      status: 'pending',
      warning: true
    };
    const store = readAccessViolations();
    store.violations = store.violations || [];
    store.violations.push(entry);

    const recent = store.violations.filter(v =>
      v.ip === ip &&
      v.reason === entry.reason &&
      (now - new Date(v.at).getTime()) <= WINDOW_MS
    );

    const remaining = Math.max(0, MAX_WARNINGS - recent.length);

    if (recent.length >= MAX_WARNINGS) {
      blockIP(ip, BLOCK_DURATION_MS, 'Repeated access violations');
      entry.status = 'blocked';
      entry.warning = false;
      entry.action = 'auto-block';
      entry.blockedUntil = new Date(now + BLOCK_DURATION_MS).toISOString();
    }

    if (store.violations.length > 5000) store.violations = store.violations.slice(-5000);
    writeAccessViolations(store);
    logSecurityEvent('access-violation', ip, { reason: entry.reason, path: entry.path, email: entry.email, fileId: entry.fileId });
    return { warning: entry.warning, blocked: entry.status === 'blocked', remaining };
  } catch (e) {
    console.error('logAccessViolation error', e.message);
  }
  return { warning: true, blocked: false, remaining: 0 };
}

// Admin: delete file metadata and file
app.delete('/api/admin/files/:id', adminAuth, (req, res) => {
  try {
    const id = req.params.id;
    const meta = readFilesMeta();
    const idx = meta.findIndex(f=>f.id===id);
    if (idx === -1) return res.status(404).json({ error: 'file not found' });
    const removed = meta.splice(idx,1)[0];
    writeFilesMeta(meta);
    const p = path.join(UPLOADS_DIR, removed.filename);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    return res.json({ success: true });
  } catch (e) { console.error('delete file error', e.message); return res.status(500).json({ error: e.message }); }
});
      if (!isStrongPassword(password)) return res.status(400).json({ error: 'password must be at least 10 characters and include upper, lower, number, and symbol' });

      if (fullName && !isValidName(fullName)) return res.status(400).json({ error: 'invalid full name' });
      if (mobileNumber && !isValidPhone(mobileNumber)) return res.status(400).json({ error: 'invalid mobile number' });
      if (country && !isValidCountry(country)) return res.status(400).json({ error: 'invalid country' });
      if (paymentMethod && !isSafeText(paymentMethod, 40)) return res.status(400).json({ error: 'invalid payment method' });
// NOTE: The demo `/api/purchase` endpoint was removed. Integrate real payment providers and
// grant purchases via provider webhooks or admin grants. This improves security by avoiding
// client-side simulated purchases.

// Download a file by id if a valid token exists for that file (legacy path)
app.get('/download/file/:id', (req, res) => {
  try {
    const id = req.params.id;
    const token = req.query.token || req.headers['x-download-token'];
    if (!token) return res.status(401).send('Missing token');
    const txFile = './transactions.json';
    const arr = fs.existsSync(txFile) ? JSON.parse(fs.readFileSync(txFile)) : [];
    const ok = arr.find(t=>t.provider==='file_purchase' && t.fileId===id && t.token===token && t.paidAt);
    if (!ok) return res.status(403).send('Invalid or expired token');
    const files = readFilesMeta();
    const file = files.find(f=>f.id===id);
    if (!file) return res.status(404).send('File not found');
    const p = path.join(UPLOADS_DIR, file.filename);
    if (!fs.existsSync(p)) return res.status(404).send('File missing on server');
    return res.download(p, file.originalName);
  } catch (e) { console.error('download error', e.message); return res.status(500).send('download failed'); }
});

// (uploads/data initialization handled earlier in file)

// Middleware: require that the requester is a purchaser. Checks for purchaser email
// in header `x-user-email`, query `email` or request body `email`. Returns 402
// if no purchase found for that email. This enforces that file listings are
// accessible only to paying users.
function requirePaidUser(req, res, next) {
  try {
    if (isIPBlocked(getClientIP(req))) {
      logSecurityEvent('blocked-request', getClientIP(req), { url: req.originalUrl, method: req.method });
      return res.status(403).json({ error: 'Access denied. IP blocked.' });
    }

    if (isAdminRequest(req)) {
      req.purchaserEmail = process.env.ADMIN_USER || 'admin';
      req.isStaff = true;
      return next();
    }
    const email = (req.headers['x-user-email'] || req.query.email || (req.body && req.body.email));
    if (!email) {
      const warn = logAccessViolation(req, { reason: 'missing_email', fileId: '', email: '' });
      return res.status(402).json({
        error: 'Payment required: include purchaser email in x-user-email header or ?email=',
        warning: warn.warning,
        remainingAttempts: warn.remaining
      });
    }
    const e = String(email).toLowerCase();
    const purchases = readPurchases();
    const ok = Array.isArray(purchases) && purchases.find(p => p.email && String(p.email).toLowerCase() === e);
    if (!ok) {
      const warn = logAccessViolation(req, { reason: 'purchase_not_found', email: e, fileId: '' });
      return res.status(402).json({
        error: 'No purchases found for this email',
        warning: warn.warning,
        remainingAttempts: warn.remaining
      });
    }
    req.purchaserEmail = e;
    return next();
  } catch (e) {
    console.error('requirePaidUser error', e && e.message);
    return res.status(500).json({ error: 'server error' });
  }
}

function readScenarios(){ try { return JSON.parse(fs.readFileSync(SCENARIOS_FILE, 'utf8')||'[]'); } catch(e){ return []; } }
function writeScenarios(d){ fs.writeFileSync(SCENARIOS_FILE, JSON.stringify(d, null, 2)); }

// Grant a purchase for a fileId and email (idempotent)
function grantPurchase(fileId, email, provider='manual', meta={}){
  try {
    if (!fileId) return null;
    const files = readFilesMeta(); if (!files.find(f=>f.id===fileId)) return null;
    if (!email) email = (meta.email || '').toLowerCase();
    const purchases = readPurchases();
    const exists = purchases.find(p => p.fileId === fileId && p.email && email && p.email.toLowerCase() === email.toLowerCase());
    if (exists) return exists;
    const entry = { id: uuidv4(), fileId, email: email? email.toLowerCase() : '', provider, at: new Date().toISOString(), meta };
    purchases.push(entry);
    writePurchases(purchases);
    // notify user if we have an email
    if (email) {
      const file = files.find(f=>f.id===fileId);
      sendNotificationMail({ to: email, subject: `Purchase confirmed — ${file?.title||'File'}`, text: `You now have access to download ${file?.title||fileId}.` });
    }
    return entry;
  } catch (e) { console.error('grantPurchase error', e.message); return null; }
}

// Multer setup (already defined earlier)

// Scenarios endpoints: store/load/delete simple calculator scenarios
// SECURITY FIX #2: Protect scenario endpoints from abuse
app.get('/api/scenarios', adminAuth, (req, res) => {
  try {
    const list = readScenarios();
    return res.json({ success: true, scenarios: list });
  } catch (e) { console.error('scenarios list error', e.message); return res.status(500).json({ error: e.message }); }
});

app.get('/api/scenarios/:id', adminAuth, (req, res) => {
  try {
    const id = req.params.id;
    const list = readScenarios();
    const s = list.find(x=>x.id===id);
    if (!s) return res.status(404).json({ error: 'not found' });
    return res.json({ success: true, scenario: s });
  } catch (e) { console.error('get scenario error', e.message); return res.status(500).json({ error: e.message }); }
});

app.post('/api/scenarios', adminAuth, express.json(), (req, res) => {
  try {
    const body = req.body || {};
    const name = body.name || ('scenario-' + Date.now());
    const id = uuidv4();
    const entry = { id, name, type: body.type || 'investment', settings: body.settings || {}, result: body.result || null, createdAt: new Date().toISOString() };
    const list = readScenarios();
    list.push(entry);
    writeScenarios(list);
    return res.json({ success: true, scenario: entry });
  } catch (e) { console.error('save scenario error', e.message); return res.status(500).json({ error: e.message }); }
});

// Deleting scenarios is admin-only to avoid accidental removals
app.delete('/api/scenarios/:id', adminAuth, (req, res) => {
  try {
    const id = req.params.id;
    const list = readScenarios();
    const idx = list.findIndex(x=>x.id===id);
    if (idx === -1) return res.status(404).json({ error: 'not found' });
    list.splice(idx,1);
    writeScenarios(list);
    return res.json({ success: true });
  } catch (e) { console.error('delete scenario error', e.message); return res.status(500).json({ error: e.message }); }
});

// Admin: upload file (pdfs, docs, images)
app.post('/api/admin/files/upload', adminAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const { title, description, price, published } = req.body;
    const files = readFilesMeta();
    const id = uuidv4();
    const entry = {
      id,
      title: title || req.file.originalname,
      description: description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mime: req.file.mimetype,
      price: Number(price) || 0,
      published: published === 'true' || false,
      createdAt: new Date().toISOString()
    };
    files.push(entry);
    writeFilesMeta(files);
    return res.json({ success: true, file: entry });
  } catch (e) { console.error('upload error', e.message); return res.status(500).json({ error: e.message }); }
});

// Admin: list files
app.get('/api/admin/files', adminAuth, (req, res) => {
  try { const files = readFilesMeta(); return res.json({ success: true, files }); } catch(e){ return res.status(500).json({ error: e.message }); }
});

// Public: list published files — restricted to purchasers. Returns published files
// that the purchaser has access to.
app.get('/api/files', requirePaidUser, (req, res) => {
  try {
    const files = readFilesMeta().filter(f => f.published);
    if (req.isStaff) {
      return res.json({ success: true, files });
    }
    const purchases = readPurchases().filter(p => p.email && String(p.email).toLowerCase() === req.purchaserEmail);
    const ownedIds = purchases.map(p => p.fileId);
    const owned = files.filter(f => ownedIds.includes(f.id));
    return res.json({ success: true, files: owned });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Public catalog: list published files (title, price, id) for browsing before purchase
app.get('/api/catalog', (req, res) => {
  try {
    const files = readFilesMeta()
      .filter(f => f.published)
      .map(f => ({
        id: f.id,
        title: f.title,
        price: f.price,
        description: f.description,
        size: f.size,
        pdfInfo: f.pdfInfo ? {
          title: f.pdfInfo.title,
          description: f.pdfInfo.description,
          pages: f.pdfInfo.pages
        } : null
      }));
    return res.json({ success: true, files });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Admin: update file metadata
app.post('/api/admin/files/:id', adminAuth, (req, res) => {
  try {
    const id = req.params.id;
    const files = readFilesMeta();
    const idx = files.findIndex(f=>f.id===id);
    if (idx===-1) return res.status(404).json({ error: 'file not found' });
    const allowed = ['title','description','price','published'];
    allowed.forEach(k=>{ if (k in req.body) files[idx][k] = (k==='price'? Number(req.body[k]) : (k==='published'? (req.body[k]===true || req.body[k]==='true') : req.body[k])); });
    writeFilesMeta(files);
    return res.json({ success: true, file: files[idx] });
  } catch(e){ console.error(e); return res.status(500).json({ error: e.message }); }
});

// Messages: public messaging where visitors can post and admin can reply
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));

function readMessages(){ try { return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')||'[]'); } catch(e){ return []; } }
function writeMessages(d){ fs.writeFileSync(MESSAGES_FILE, JSON.stringify(d, null, 2)); }

// SECURITY FIX #3: Add rate limiting to message endpoint
// Limit: 10 messages per 15 minutes per IP address
const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 messages per window
  message: 'Too many messages from this IP address. Please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Don't rate limit admin users
    return req.headers.authorization && req.headers.authorization.startsWith('Basic ');
  }
});

// Public: post a message (name optional, email optional)
// SECURITY FIX #3: Applied rate limiting to prevent spam
app.post('/api/messages', messageLimiter, express.json(), (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!message || !String(message).trim()) return res.status(400).json({ error: 'message required' });
    const msgs = readMessages();
    const id = uuidv4();
    const entry = { id, name: name || 'Visitor', email: email || '', message: String(message).trim(), replies: [], createdAt: new Date().toISOString() };
    msgs.push(entry);
    writeMessages(msgs);
    // notify admin of new message
    sendNotificationMail({ subject: 'New site message', text: `${entry.name} wrote: ${entry.message}`, html: `<p><strong>${entry.name}</strong>: ${entry.message}</p>` });
    return res.json({ success: true, message: entry });
  } catch (e) { console.error('post message error', e.message); return res.status(500).json({ error: e.message }); }
        if (!isValidPhone(phone)) return res.status(400).json({ error: 'invalid phone' });
        if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'invalid amount' });
        if (accountReference && !isSafeText(accountReference, 64)) return res.status(400).json({ error: 'invalid account reference' });
});

// User: list only their own messages (requires email)
app.get('/api/messages', (req, res) => {
  try {
    const userEmail = req.query.email || req.headers['x-user-email'];
    
    if (!userEmail) {
      return res.status(400).json({ error: 'email required to view messages' });
    }
    
    const msgs = readMessages();
    // Only return messages from this specific user
    const userMessages = msgs.filter(m => m.email && m.email.toLowerCase() === userEmail.toLowerCase());
    
    return res.json({ success: true, messages: userMessages });
  } catch (e) { console.error('list messages error', e.message); return res.status(500).json({ error: e.message }); }
});

// Admin: list messages (full view)
app.get('/api/admin/messages', adminAuth, (req, res) => {
  try {
    const msgs = readMessages();
    return res.json({ success: true, messages: msgs });
  } catch (e) { console.error('admin list messages error', e.message); return res.status(500).json({ error: e.message }); }
});

// Admin: reply to a message (only admin can reply)
app.post('/api/admin/messages/:id/reply', adminAuth, express.json(), (req, res) => {
  try {
    const id = req.params.id;
    const { reply } = req.body || {};
    if (!reply || !String(reply).trim()) return res.status(400).json({ error: 'reply text required' });
    const msgs = readMessages();
    const idx = msgs.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'message not found' });
    const r = { id: uuidv4(), by: process.env.ADMIN_USER || 'admin', message: String(reply).trim(), at: new Date().toISOString() };
    msgs[idx].replies = msgs[idx].replies || [];
    msgs[idx].replies.push(r);
    writeMessages(msgs);
    // notify original sender if email provided
    if (msgs[idx].email) {
      sendNotificationMail({ to: msgs[idx].email, subject: 'Reply to your message on SmartInvest', text: r.message, html: `<p>${r.message}</p>` });
    }
    return res.json({ success: true, reply: r });
  } catch (e) { console.error('reply message error', e.message); return res.status(500).json({ error: e.message }); }
});

// Admin: grant purchase to an email for a file (manual grant)
app.post('/api/admin/files/:id/grant', adminAuth, (req, res) => {
  try {
    const id = req.params.id; const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const users = readUsers();
    const normalizedEmail = normalizeEmail(email);
    const matches = users.filter(u => normalizeEmail(u.email) === normalizedEmail);
    if (matches.length > 1) return res.status(409).json({ error: 'contact conflict detected for email' });
    if (matches.length === 0) return res.status(400).json({ error: 'email not registered' });
    const files = readFilesMeta(); const file = files.find(f=>f.id===id);
    if (!file) return res.status(404).json({ error: 'file not found' });
    const purchases = readPurchases();
    purchases.push({ id: uuidv4(), fileId: id, email: matches[0].email.toLowerCase(), grantedBy: req.headers['x-admin']||'admin', at: new Date().toISOString() });
    writePurchases(purchases);
    sendNotificationMail({ to: email, subject: `Access granted to ${file.title}`, text: `You have been granted access to download ${file.title}.` });
    return res.json({ success: true });
  } catch(e){ console.error(e); return res.status(500).json({ error: e.message }); }
});

// Public: request download token (email must match a purchase)
app.post('/api/download/request', downloadLimiter, express.json(), (req, res) => {
  try {
    if (isIPBlocked(getClientIP(req))) {
      logSecurityEvent('blocked-request', getClientIP(req), { url: req.originalUrl, method: req.method });
      return res.status(403).json({ error: 'Access denied. IP blocked.' });
    }
    const { fileId, email } = req.body;
    if (!fileId) return res.status(400).json({ error: 'fileId required' });
    const files = readFilesMeta();
    const file = files.find(f => f.id === fileId && f.published);
    if (!file) return res.status(404).json({ error: 'file not found' });
    const staffRequest = isAdminRequest(req);
    const isFree = Number(file.price || 0) <= 0;
    if (!staffRequest && !isFree && !email) return res.status(400).json({ error: 'email required for paid downloads' });
    const normalizedEmail = email ? String(email).toLowerCase() : (process.env.ADMIN_USER || 'admin');

    if (!staffRequest && !isFree) {
      const purchases = readPurchases();
      const ok = purchases.find(p => p.fileId === fileId && p.email === normalizedEmail);
      if (!ok) {
        const warn = logAccessViolation(req, { reason: 'purchase_not_found', email: normalizedEmail, fileId });
        return res.status(402).json({
          error: 'purchase not found',
          warning: warn.warning,
          remainingAttempts: warn.remaining
        });
      }
    }
    const tokens = readTokens();
    const token = uuidv4();
    const expireAt = Date.now() + (60*60*1000); // 1 hour
    tokens[token] = { fileId, email: normalizedEmail, expireAt };
    writeTokens(tokens);
    const url = `${req.protocol}://${req.get('host')}/download/${token}`;
    return res.json({ success: true, url, expiresAt: new Date(expireAt).toISOString() });
  } catch(e){ console.error(e); return res.status(500).json({ error: e.message }); }
});

// Serve download by token
app.get('/download/:token', (req, res) => {
  try {
    if (isIPBlocked(getClientIP(req))) {
      logSecurityEvent('blocked-request', getClientIP(req), { url: req.originalUrl, method: req.method });
      return res.status(403).send('Access denied. IP blocked.');
    }
    const token = req.params.token;
    const tokens = readTokens();
    const entry = tokens[token];
    if (!entry) {
      logAccessViolation(req, { reason: 'invalid_token', email: '', fileId: '' });
      return res.status(404).send('Invalid or expired token');
    }
    if (Date.now() > entry.expireAt) {
      delete tokens[token];
      writeTokens(tokens);
      logAccessViolation(req, { reason: 'expired_token', email: entry.email || '', fileId: entry.fileId || '' });
      return res.status(410).send('Token expired');
    }
    const files = readFilesMeta(); const file = files.find(f=>f.id===entry.fileId);
    if (!file) return res.status(404).send('File not found');
    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File missing');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName.replace(/\"/g,'') }"`);
    return res.sendFile(filePath);
  } catch(e){ console.error('download error', e.message); return res.status(500).send('Server error'); }
});

// Admin: review access violations
app.get('/api/admin/access-violations', adminAuth, (req, res) => {
  try {
    const store = readAccessViolations();
    const violations = (store.violations || []).slice().sort((a, b) => new Date(b.at) - new Date(a.at));
    return res.json({ success: true, violations });
  } catch (e) {
    console.error('access violations list error', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// Admin: take action on access violations
app.post('/api/admin/access-violations/:id/action', adminAuth, express.json(), (req, res) => {
  try {
    const { id } = req.params;
    const { action, note, blockDuration } = req.body || {};
    const store = readAccessViolations();
    const violations = store.violations || [];
    const idx = violations.findIndex(v => v.id === id);
    if (idx === -1) return res.status(404).json({ error: 'violation not found' });

    const entry = violations[idx];
    const normalizedAction = String(action || '').toLowerCase();
    if (!['block', 'authorize', 'dismiss'].includes(normalizedAction)) {
      return res.status(400).json({ error: 'invalid action' });
    }

    if (normalizedAction === 'block') {
      const durationMs = Number(blockDuration) || (24 * 60 * 60 * 1000);
      if (entry.ip) blockIP(entry.ip, durationMs, 'Unauthorized access attempt');
      entry.status = 'blocked';
      entry.blockedUntil = new Date(Date.now() + durationMs).toISOString();
    }

    if (normalizedAction === 'authorize') {
      if (entry.ip) unblockIP(entry.ip, 'Admin authorized');
      entry.status = 'authorized';
    }

    if (normalizedAction === 'dismiss') {
      entry.status = 'dismissed';
    }

    entry.action = normalizedAction;
    entry.note = note || '';
    entry.actionAt = new Date().toISOString();
    entry.actionBy = process.env.ADMIN_USER || 'admin';

    violations[idx] = entry;
    store.violations = violations;
    writeAccessViolations(store);
    return res.json({ success: true, violation: entry });
  } catch (e) {
    console.error('access violation action error', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// CSV export of KCB manual transfers
app.get('/api/admin/kcb-export', adminAuth, (req, res) => {
  try {
    const file = './transactions.json';
    const arr = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
    const rows = arr.filter(t => t.provider === 'kcb_manual');
    const header = ['timestamp','name','email','amount','reference','status','paidAt','note'];
    const csv = [header.join(',')].concat(rows.map(r => {
      return [r.timestamp, r.name, r.email, r.amount, (r.reference||''), (r.status||''), (r.paidAt||''), (r.note||'')].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',');
    })).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="kcb-transfers.csv"');
    res.send(csv);
  } catch (e) {
    console.error('export error', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// Admin: Get comprehensive statistics
app.get('/api/admin/stats', adminAuth, (req, res) => {
  try {
    const users = readUsers();
    const purchases = readPurchases();
    const files = readFilesMeta();
    const transactionsFile = './transactions.json';
    const transactions = fs.existsSync(transactionsFile) ? JSON.parse(fs.readFileSync(transactionsFile)) : [];
    const messagesFile = './data/messages.json';
    const messages = fs.existsSync(messagesFile) ? JSON.parse(fs.readFileSync(messagesFile)) : [];
    const analyticsFile = './data/user-analytics.json';
    const analytics = fs.existsSync(analyticsFile) ? JSON.parse(fs.readFileSync(analyticsFile)) : {};

    const stats = {
      totalUsers: users.length,
      premiumUsers: users.filter(u => u.isPremium).length,
      adminUsers: users.filter(u => u.isAdmin).length,
      freeUsers: users.filter(u => !u.isPremium).length,
      totalFiles: files.length,
      publishedFiles: files.filter(f => f.published).length,
      draftFiles: files.filter(f => !f.published).length,
      totalPurchases: purchases.length,
      totalMessages: messages.length,
      unreadMessages: messages.filter(m => !m.replies || m.replies.length === 0).length,
      totalTransactions: transactions.length,
      pendingTransactions: transactions.filter(t => t.status === 'pending').length,
      completedTransactions: transactions.filter(t => t.status === 'paid' || t.status === 'completed').length,
      totalVisitors: (analytics.visitors || []).length,
      totalSignups: (analytics.signups || []).length,
      totalLogins: (analytics.logins || []).length,
      recentLogins: users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt) > new Date(Date.now() - 7*24*60*60*1000)).length,
      pendingVerifications: transactions.filter(t => t.provider === 'kcb_manual' && t.status === 'pending').length
    };

    return res.json({ success: true, stats });
  } catch (err) {
    console.error('stats error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Get analytics data
app.get('/api/admin/analytics', adminAuth, (req, res) => {
  try {
    const analyticsFile = './data/user-analytics.json';
    const analytics = fs.existsSync(analyticsFile) ? JSON.parse(fs.readFileSync(analyticsFile)) : { visitors: [], signups: [], logins: [] };
    
    return res.json({ success: true, analytics });
  } catch (err) {
    console.error('analytics error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Get all transactions
app.get('/api/admin/transactions', adminAuth, (req, res) => {
  try {
    const transactionsFile = './transactions.json';
    const transactions = fs.existsSync(transactionsFile) ? JSON.parse(fs.readFileSync(transactionsFile)) : [];
    
    return res.json({ success: true, transactions });
  } catch (err) {
    console.error('transactions error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Get all purchases
app.get('/api/admin/purchases', adminAuth, (req, res) => {
  try {
    const purchases = readPurchases();
    return res.json({ success: true, purchases });
  } catch (err) {
    console.error('purchases error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Export all users to CSV
app.get('/api/admin/users-export', adminAuth, (req, res) => {
  try {
    const users = readUsers();
    const header = ['id', 'email', 'fullName', 'mobileNumber', 'country', 'paymentMethod', 'amount', 'isPremium', 'isAdmin', 'createdAt', 'lastLoginAt'];
    const csv = [header.join(',')].concat(users.map(u => {
      return [
        u.id,
        u.email,
        u.fullName || '',
        u.mobileNumber || '',
        u.country || '',
        u.paymentMethod || '',
        u.amount || 0,
        u.isPremium ? 'Yes' : 'No',
        u.isAdmin ? 'Yes' : 'No',
        u.createdAt || '',
        u.lastLoginAt || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    })).join('\n');
    
          if (!isValidName(name)) return res.status(400).json({ error: 'invalid name' });
          if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'invalid amount' });
          if (reference && !isSafeText(reference, 80)) return res.status(400).json({ error: 'invalid reference' });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
    res.send(csv);
  } catch (e) {
    console.error('user export error', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// Admin: Delete user
app.delete('/api/admin/users/:userId', adminAuth, (req, res) => {
  try {
    const userId = req.params.userId;
    const { reason, hard } = req.body || {};
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'user not found' });
    }
    
    // Prevent deleting primary admin
    if (users[userIndex].email === process.env.ADMIN_USER) {
      return res.status(403).json({ error: 'Cannot delete primary admin account' });
    }
    
    if (hard === true) {
      const deletedUser = users.splice(userIndex, 1)[0];
      writeUsers(users);
      return res.json({ success: true, message: 'User deleted', user: { id: deletedUser.id, email: deletedUser.email } });
    }

    users[userIndex].deleted = true;
    users[userIndex].deletedAt = new Date().toISOString();
    users[userIndex].deleteReason = reason || 'No reason provided';
    writeUsers(users);

    if (subManager.deleteUser) {
      subManager.deleteUser(users[userIndex].id, reason);
    }

    return res.json({ success: true, message: 'User soft-deleted', user: { id: users[userIndex].id, email: users[userIndex].email } });
  } catch (err) {
    console.error('delete user error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Update user information
app.patch('/api/admin/users/:userId', adminAuth, express.json(), (req, res) => {
  try {
    const userId = req.params.userId;
    const updates = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'user not found' });
    }
    
    // Prevent modifying admin status of primary admin
    if (users[userIndex].email === process.env.ADMIN_USER && updates.isAdmin === false) {
      return res.status(403).json({ error: 'Cannot modify primary admin status' });
    }
    
    const conflict = findContactConflict(users, {
      email: updates.email || users[userIndex].email,
      mobileNumber: updates.mobileNumber || users[userIndex].mobileNumber
    }, users[userIndex].id);
    if (conflict.conflict) {
      return res.status(409).json({ error: conflict.message });
    }

    // Update allowed fields
    const allowedFields = ['fullName', 'mobileNumber', 'country', 'paymentMethod', 'amount', 'taxInfo'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        users[userIndex][field] = updates[field];
      }
    });
    
    users[userIndex].updatedAt = new Date().toISOString();
    users[userIndex].updatedBy = process.env.ADMIN_USER || 'admin';
    
    writeUsers(users);
    
    const { passwordHash, ...safeUser } = users[userIndex];
    return res.json({ success: true, message: 'User updated', user: safeUser });
  } catch (err) {
    console.error('update user error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Reconcile bank entries: accepts JSON { entries: [...] }
app.post('/api/admin/kcb/reconcile', adminAuth, (req, res) => {
  try {
    const incoming = Array.isArray(req.body) ? req.body : (req.body.entries || []);
    if (!incoming || !incoming.length) return res.status(400).json({ error: 'no entries provided' });
    const file = './transactions.json';
    const arr = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
    const pending = arr.filter(t => t.provider === 'kcb_manual' && t.status === 'pending');
    const results = { matched: [], unmatched: [] };
    incoming.forEach(entry => {
      const ref = (entry.reference || entry.ref || '').toString().trim();
      const amt = Number(entry.amount || entry.value || 0);
      let found = null;
      if (ref) found = pending.find(p => (p.reference||'').toString().trim() === ref && p.amount == amt);
      if (!found) {
        found = pending.find(p => Number(p.amount) === amt && (entry.email ? p.email === entry.email : true));
      }
      if (found) {
        const idx = arr.findIndex(x=>x.timestamp===found.timestamp && x.provider==='kcb_manual');
        arr[idx].status = 'paid';
        arr[idx].paidAt = new Date().toISOString();
        arr[idx].reconciledWith = entry;
        results.matched.push({ transaction: arr[idx], entry });
        // notify user
        sendNotificationMail({ to: arr[idx].email, subject: 'SmartInvest — Transfer reconciled', text: `Your bank transfer of KES ${arr[idx].amount} was matched and marked as received.` });
      } else {
        results.unmatched.push(entry);
      }
    });
    fs.writeFileSync(file, JSON.stringify(arr, null, 2));
    return res.json({ success: true, summary: { matched: results.matched.length, unmatched: results.unmatched.length }, results });
  } catch (e) {
    console.error('reconcile error', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// Note: debug endpoints like `/api/pay/mpesa/token` removed to avoid exposing sensitive tokens.

// ========== SUBSCRIPTION & ACCESS CONTROL ENDPOINTS ==========

// User Login/Registration - Create or retrieve user
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, userId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Try to find existing user
    let user = subManager.getUserByEmail(email);
    
    if (!user) {
      // Create new user
      user = subManager.createUser({
        email,
        name: email.split('@')[0],
        phone: '',
        location: '',
        taxId: ''
      });
      
      if (user.error) {
        return res.status(400).json(user);
      }
      
      console.log(`[AUTH] New user created: ${user.id} (${email})`);
    } else {
      // Update last login
      user.lastLogin = new Date().toISOString();
      subManager.updateUser(user.id, { updatedAt: new Date().toISOString() });
      console.log(`[AUTH] User logged in: ${user.id} (${email})`);
    }

    // Add subscription details
    const subscription = subManager.getUserSubscription(user.id);
    const userWithSub = {
      ...user,
      subscriptionDetails: subscription
    };

    subManager.logAccess(user.id, 'LOGIN', 'dashboard', 'success', req.ip);
    
    return res.json({ success: true, user: userWithSub });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    return res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

// Get user data
app.get('/api/users/:userId', (req, res) => {
  try {
    const user = subManager.getUser(req.params.userId);
    
    if (!user) {
      subManager.logAccess(req.params.userId, 'GET_USER', 'user-data', 'not-found', req.ip);
      return res.status(404).json({ error: 'User not found' });
    }

    const subscription = subManager.getUserSubscription(user.id);
    const userWithSub = {
      ...user,
      subscriptionDetails: subscription,
      isPremium: subManager.isPremiumUser(user.id)
    };

    subManager.logAccess(user.id, 'GET_USER', 'user-data', 'success', req.ip);
    
    return res.json({ success: true, user: userWithSub });
  } catch (err) {
    console.error('[USERS] Get user error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve user', message: err.message });
  }
});

// Check calculator access (CRITICAL: NO BYPASSES)
app.post('/api/calculators/:calcType/access', (req, res) => {
  try {
    const { userId } = req.body;
    const { calcType } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const user = subManager.getUser(userId);
    if (!user) {
      subManager.logAccess(userId, 'ACCESS_CHECK', calcType, 'user-not-found', req.ip);
      return res.status(401).json({ access: false, reason: 'User not found' });
    }

    // Free calculators: Investment, Amortization, Insurance
    const freeCalcs = ['investment', 'amortization', 'insurance'];
    if (freeCalcs.includes(calcType)) {
      subManager.logAccess(userId, 'ACCESS_GRANTED', calcType, 'free-calc', req.ip);
      return res.json({ access: true, type: 'free', reason: 'Free calculator' });
    }

    // Premium calculators: Bonds, Pension, Actuarial, Risk, Business, Audit
    const premiumCalcs = ['bonds', 'pension', 'actuarial', 'risk', 'business', 'audit'];
    if (premiumCalcs.includes(calcType)) {
      // AUTHORITATIVE CHECK: isPremiumUser does full validation
      const isPremium = subManager.isPremiumUser(userId);
      
      if (!isPremium) {
        subManager.logAccess(userId, 'ACCESS_DENIED', calcType, 'not-premium', req.ip);
        return res.status(403).json({ 
          access: false, 
          type: 'premium', 
          reason: 'Premium subscription required' 
        });
      }

      subManager.logAccess(userId, 'ACCESS_GRANTED', calcType, 'premium-calc', req.ip);
      return res.json({ access: true, type: 'premium', reason: 'Premium subscriber' });
    }

    subManager.logAccess(userId, 'ACCESS_DENIED', calcType, 'unknown-calc', req.ip);
    return res.status(400).json({ access: false, reason: 'Unknown calculator' });
  } catch (err) {
    console.error('[CALCULATORS] Access check error:', err.message);
    return res.status(500).json({ error: 'Access check failed', message: err.message });
  }
});

// ========== ADMIN SUBSCRIPTION MANAGEMENT ==========

// Create subscription for user (ADMIN ONLY)
app.post('/api/admin/subscriptions', adminAuth, (req, res) => {
  try {
    const { userId, amount, paymentMethod, paymentReference, validFrom, validUntil, reason, notes } = req.body;

    const subscription = subManager.createSubscription({
      userId,
      amount,
      paymentMethod,
      paymentReference,
      validFrom,
      validUntil,
      reason,
      notes,
      grantedBy: 'admin'
    });

    if (subscription.error) {
      return res.status(400).json(subscription);
    }

    console.log(`[ADMIN] Subscription created for user ${userId}`);
    subManager.logAccess(userId, 'SUBSCRIPTION_CREATED', 'admin', 'success', req.ip);

    return res.json({ success: true, subscription });
  } catch (err) {
    console.error('[ADMIN] Create subscription error:', err.message);
    return res.status(500).json({ error: 'Failed to create subscription', message: err.message });
  }
});

// Get all subscriptions (ADMIN ONLY)
app.get('/api/admin/subscriptions', adminAuth, (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.userId) filters.userId = req.query.userId;

    const subscriptions = subManager.getAllSubscriptions(filters);
    return res.json({ success: true, subscriptions });
  } catch (err) {
    console.error('[ADMIN] Get subscriptions error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve subscriptions' });
  }
});

// Extend subscription (ADMIN ONLY)
app.put('/api/admin/subscriptions/:subId/extend', adminAuth, (req, res) => {
  try {
    const { days } = req.body;
    if (!days || days < 0) {
      return res.status(400).json({ error: 'Valid days value required' });
    }

    const result = subManager.extendSubscription(req.params.subId, days);
    if (result.error) {
      return res.status(400).json(result);
    }

    console.log(`[ADMIN] Subscription ${req.params.subId} extended by ${days} days`);
    return res.json(result);
  } catch (err) {
    console.error('[ADMIN] Extend subscription error:', err.message);
    return res.status(500).json({ error: 'Failed to extend subscription' });
  }
});

// Revoke subscription (ADMIN ONLY)
app.post('/api/admin/subscriptions/:subId/revoke', adminAuth, (req, res) => {
  try {
    const { reason } = req.body;
    
    // Get subscription to find user
    const subscriptions = subManager.getAllSubscriptions();
    const sub = subscriptions.find(s => s.id === req.params.subId);
    
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const result = subManager.revokeSubscription(req.params.subId, reason);
    if (result.error) {
      return res.status(400).json(result);
    }

    console.log(`[ADMIN] Subscription ${req.params.subId} revoked. Reason: ${reason}`);
    subManager.logAccess(sub.userId, 'SUBSCRIPTION_REVOKED', 'admin', 'revoked', req.ip);

    return res.json(result);
  } catch (err) {
    console.error('[ADMIN] Revoke subscription error:', err.message);
    return res.status(500).json({ error: 'Failed to revoke subscription' });
  }
});


// Note: debug endpoints like `/api/pay/mpesa/token` removed to avoid exposing sensitive tokens.

// Serve specific HTML files (prevent exposing sensitive files like .env)
app.get('/', (req, res) => {
// ========== EMAIL MANAGEMENT ENDPOINTS ==========

// Admin: Send welcome email to a user
app.post('/api/admin/email/send-welcome', adminAuth, express.json(), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const users = readUsers();
    const user = users.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    const sent = await emailService.sendWelcomeEmail(user.email, user);
    return res.json({ success: sent, message: sent ? 'Welcome email sent' : 'Failed to send email' });
  } catch (err) {
    console.error('send welcome email error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Send terms and conditions to a user
app.post('/api/admin/email/send-terms', adminAuth, express.json(), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const users = readUsers();
    const user = users.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    const sent = await emailService.sendTermsAndConditionsEmail(user.email, user);
    return res.json({ success: sent, message: sent ? 'Terms & Conditions email sent' : 'Failed to send email' });
  } catch (err) {
    console.error('send terms email error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Send bulk welcome emails to all users or filtered users
app.post('/api/admin/email/bulk-send-welcome', adminAuth, express.json(), async (req, res) => {
  try {
    const { filter } = req.body; // optional: { isPremium: true }, { type: 'subscriber' }, etc.
    
    const users = readUsers();
    let targetUsers = users;

    // Apply filters if provided
    if (filter) {
      if (filter.isPremium === true) {
        targetUsers = users.filter(u => u.isPremium);
      } else if (filter.isPremium === false) {
        targetUsers = users.filter(u => !u.isPremium);
      }
      if (filter.type === 'registered') {
        targetUsers = users.filter(u => u.createdAt);
      }
    }

    console.log(`📧 Sending welcome emails to ${targetUsers.length} users...`);
    const result = await emailService.sendBulkWelcomeEmails(targetUsers);
    
    return res.json({ 
      success: true, 
      message: 'Bulk email send completed',
      results: result,
      totalTargeted: targetUsers.length
    });
  } catch (err) {
    console.error('bulk send welcome error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Send terms and conditions to all users
app.post('/api/admin/email/bulk-send-terms', adminAuth, express.json(), async (req, res) => {
  try {
    const { filter } = req.body;
    
    const users = readUsers();
    let targetUsers = users;

    if (filter) {
      if (filter.isPremium === true) {
        targetUsers = users.filter(u => u.isPremium);
      } else if (filter.isPremium === false) {
        targetUsers = users.filter(u => !u.isPremium);
      }
    }

    console.log(`⚖️  Sending Terms & Conditions emails to ${targetUsers.length} users...`);
    
    let successCount = 0;
    let failureCount = 0;

    for (const user of targetUsers) {
      const sent = await emailService.sendTermsAndConditionsEmail(user.email, user);
      if (sent) successCount++;
      else failureCount++;
      await new Promise(resolve => setTimeout(resolve, 500)); // Avoid rate limiting
    }
    
    return res.json({ 
      success: true, 
      message: 'Bulk Terms & Conditions send completed',
      results: { successCount, failureCount },
      totalTargeted: targetUsers.length
    });
  } catch (err) {
    console.error('bulk send terms error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Send subscription confirmation email
app.post('/api/admin/email/send-subscription-confirmation', adminAuth, express.json(), async (req, res) => {
  try {
    const { userId, subscriptionData } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const users = readUsers();
    const user = users.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    const sent = await emailService.sendSubscriptionConfirmationEmail(user.email, subscriptionData || {});
    return res.json({ success: sent, message: sent ? 'Subscription confirmation sent' : 'Failed to send email' });
  } catch (err) {
    console.error('send subscription email error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Get email service status
app.get('/api/admin/email/status', adminAuth, (req, res) => {
  try {
    const status = {
      initialized: emailService.initialized,
      transporter: emailService.transporter ? 'configured' : 'not configured',
      smtpUser: process.env.SMTP_USER ? 'set' : 'not set',
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      timestamp: new Date().toISOString()
    };
    return res.json(status);
  } catch (err) {
    console.error('email status error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ========== STATIC ROUTES ==========

app.get('/share/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'share.html'));
});

  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-expanded.html'));
});

app.get('/terms.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms.html'));
});

// Serve tools folder (static files like the investment calculator)
app.use('/tools', express.static(path.join(__dirname, 'tools')));

// ============================================================================
// INTEGRATE NEW CONTENT MANAGEMENT & ANALYTICS ENDPOINTS
// ============================================================================
contentAPI.courseEndpoints(app, adminAuth);
contentAPI.insightsEndpoints(app, adminAuth);
contentAPI.toolsEndpoints(app, adminAuth);
contentAPI.smeEndpoints(app, adminAuth);
contentAPI.communityEndpoints(app, adminAuth);
contentAPI.analyticsEndpoints(app, adminAuth);
contentAPI.publicEndpoints(app);

// ============================================================================
// INTEGRATE SHARE LINKS, PRODUCT FILES, AND USER SEARCH
// ============================================================================
const shareLinkAPI = require('./api/share-link-api');
const productFilesAPI = require('./api/product-files-api');
const userSearchAPI = require('./api/user-search-api');
const liveEmailAPI = require('./api/live-email-api');
const socialMediaAPI = require('./api/social-media-api');
const comprehensiveAPI = require('./api/comprehensive-api');

app.use('/api/share', shareLinkAPI);
app.use('/api/admin/product-files', adminAuth, productFilesAPI);
app.use('/api/admin/users', adminAuth, userSearchAPI);
app.use('/api/email', liveEmailAPI);
app.use('/api/social-media', socialMediaAPI);
app.put('/api/admin/social-media/:platform', adminAuth, socialMediaAPI);
app.post('/api/admin/social-media/update-all', adminAuth, socialMediaAPI);

// Smart Invest Intelligent Features API Routes
app.use('/api', comprehensiveAPI);
app.delete('/api/admin/social-media/:platform', adminAuth, socialMediaAPI);

// ============================================================================
// P2P PAYMENT SYSTEM & AFFILIATE PROGRAM
// ============================================================================
const p2pSystem = require('./api/p2p-payment-system');
const affiliateSystem = require('./api/affiliate-system');
const adsSystem = require('./api/ads-payment-system');

// P2P Payment Endpoints (LIVE)
app.post('/api/p2p/initiate', express.json(), async (req, res) => {
  try {
    const result = await p2pSystem.initiateP2PPayment(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/p2p/complete', express.json(), async (req, res) => {
  try {
    const { reference, mpesaReceipt } = req.body;
    const result = await p2pSystem.completeP2PTransaction(reference, mpesaReceipt);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/p2p/transactions/:phone', async (req, res) => {
  try {
    const transactions = await p2pSystem.getUserTransactions(req.params.phone, req.query.email);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/p2p/admin/transactions', adminAuth, async (req, res) => {
  try {
    const transactions = await p2pSystem.getAllTransactions(req.query);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/p2p/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await p2pSystem.getTransactionStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Affiliate Program Endpoints
app.post('/api/affiliate/register', express.json(), async (req, res) => {
  try {
    const result = await affiliateSystem.registerAffiliate(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/affiliate/dashboard/:code', async (req, res) => {
  try {
    const dashboard = await affiliateSystem.getAffiliateDashboard(req.params.code);
    res.json(dashboard);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/affiliate/commissions/:code', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const commissions = await affiliateSystem.getCommissionsHistory(req.params.code, limit);
    res.json(commissions);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/affiliate/withdraw', express.json(), async (req, res) => {
  try {
    const { affiliateCode, amount, method } = req.body;
    const result = await affiliateSystem.requestWithdrawal(affiliateCode, amount, method);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/affiliate/admin/process-withdrawal', adminAuth, express.json(), async (req, res) => {
  try {
    const { affiliateCode, withdrawalId, status } = req.body;
    const result = await affiliateSystem.processWithdrawal(affiliateCode, withdrawalId, status);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/affiliate/admin/all', adminAuth, async (req, res) => {
  try {
    const affiliates = await affiliateSystem.getAllAffiliates(req.query);
    res.json({ success: true, affiliates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/affiliate/upgrade-tier/:code', express.json(), async (req, res) => {
  try {
    const result = await affiliateSystem.upgradeAffiliateTier(req.params.code);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ============================================================================
// ADS PAYMENT SYSTEM (LIVE)
// ============================================================================

// Get ad packages and pricing
app.get('/api/ads/packages', async (req, res) => {
  try {
    const packagesInfo = {
      banner: {
        name: 'Banner Ad',
        positions: ['top', 'bottom', 'sidebar'],
        pricing: { day: 5, week: 30, month: 100, quarter: 250, year: 900 },
        dimensions: '728x90 or 300x250'
      },
      featured: {
        name: 'Featured Listing',
        positions: ['homepage', 'category'],
        pricing: { day: 10, week: 60, month: 200, quarter: 500, year: 1800 },
        features: ['Top placement', 'Highlighted border', 'Priority display']
      },
      popup: {
        name: 'Popup Ad',
        positions: ['entry', 'exit'],
        pricing: { day: 15, week: 90, month: 300, quarter: 750, year: 2500 },
        frequency: 'Once per session'
      },
      sponsored: {
        name: 'Sponsored Content',
        positions: ['blog', 'insights', 'tools'],
        pricing: { week: 100, month: 350, quarter: 900, year: 3000 },
        features: ['Full article', 'Author byline', 'Social sharing']
      },
      video: {
        name: 'Video Ad',
        positions: ['pre-roll', 'mid-roll'],
        pricing: { day: 20, week: 120, month: 400, quarter: 1000, year: 3500 },
        duration: 'Up to 30 seconds'
      }
    };
    res.json({ success: true, packages: packagesInfo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Calculate ad cost
app.post('/api/ads/calculate-cost', express.json(), async (req, res) => {
  try {
    const { packageType, duration, quantity } = req.body;
    const cost = await adsSystem.calculateAdCost(packageType, duration, quantity);
    res.json({ success: true, cost });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Initiate ad payment (LIVE)
app.post('/api/ads/initiate-payment', express.json(), async (req, res) => {
  try {
    const result = await adsSystem.initiateAdPayment(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Complete ad payment (LIVE)
app.post('/api/ads/complete-payment', express.json(), async (req, res) => {
  try {
    const { reference, mpesaReceipt } = req.body;
    const result = await adsSystem.completeAdPayment(reference, mpesaReceipt);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get active ads for display
app.get('/api/ads/active', async (req, res) => {
  try {
    const position = req.query.position;
    const ads = await adsSystem.getActiveAds(position);
    res.json({ success: true, ads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user's ads
app.get('/api/ads/my-ads', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || req.query.email;
    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }
    const ads = await adsSystem.getAdvertiserAds(userEmail);
    res.json({ success: true, ads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user's ad payments
app.get('/api/ads/my-payments', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || req.query.email;
    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }
    const allPayments = await adsSystem.getAllPayments();
    const userPayments = allPayments.filter(p => p.advertiser.email === userEmail);
    res.json({ success: true, payments: userPayments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Record ad impression
app.post('/api/ads/impression/:adId', async (req, res) => {
  try {
    await adsSystem.recordImpression(req.params.adId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Record ad click
app.post('/api/ads/click/:adId', async (req, res) => {
  try {
    await adsSystem.recordClick(req.params.adId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get advertiser's ads
app.get('/api/ads/advertiser/:email', async (req, res) => {
  try {
    const ads = await adsSystem.getAdvertiserAds(req.params.email);
    res.json({ success: true, ads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Approve ad
app.post('/api/ads/admin/approve/:adId', adminAuth, async (req, res) => {
  try {
    const result = await adsSystem.approveAd(req.params.adId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get all ad payments
app.get('/api/ads/admin/payments', adminAuth, async (req, res) => {
  try {
    const payments = await adsSystem.getAllPayments(req.query);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get ads statistics
app.get('/api/ads/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await adsSystem.getAdsStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export app for Vercel serverless
module.exports = app;

// Start server only if not in serverless environment
if (require.main === module) {
  app.listen(PORT, () => console.log(`Payment API listening on ${PORT}`));
}
