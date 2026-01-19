require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static(__dirname));

// Basic auth for admin routes if ADMIN_USER is set
function adminAuth(req, res, next) {
  const adminUser = process.env.ADMIN_USER;
  if (!adminUser) return next(); // no auth configured
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).end('Unauthorized');
  }
  const creds = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8');
  const [user, pass] = creds.split(':');
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) return next();
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).end('Unauthorized');
}

const PORT = process.env.PORT || 3000;

// Helper: get OAuth token for M-Pesa (Daraja)
async function getMpesaAuth() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error('MPESA keys not configured');
  const basic = Buffer.from(`${key}:${secret}`).toString('base64');
  const url = process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const res = await fetch(url, { headers: { Authorization: `Basic ${basic}` } });
  if (!res.ok) throw new Error('Failed to get M-Pesa token');
  const data = await res.json();
  return data.access_token;
}

// MPESA STK Push (simplified for Daraja sandbox)
app.post('/api/pay/mpesa', async (req, res) => {
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

    const mpRes = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // Read raw response for logging and parsing
    const raw = await mpRes.text();
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { /* not JSON */ }
    logMpesa({ stage: 'response', status: mpRes.status, raw: parsed ? undefined : raw, parsed: parsed || undefined });

    return res.json({ success: true, data: parsed || raw });
  } catch (err) {
    console.error('mpesa error', err.message);
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
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) throw new Error('Failed to get PayPal token');
  const d = await res.json();
  return d.access_token;
}

app.post('/api/pay/paypal/create-order', async (req, res) => {
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
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(purchase)
    });
    const data = await r.json();
    const approve = (data.links||[]).find(l=>l.rel==='approve')?.href;
    return res.json({ success: true, data, approveUrl: approve });
  } catch (err) {
    console.error('paypal error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Simple JSON file user store (demo). In production use a real DB.
const USERS_FILE = './data/users.json';
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

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

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, acceptTerms } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    if (!acceptTerms) return res.status(400).json({ error: 'terms must be accepted' });

    const users = readUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ error: 'email already registered' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const user = { 
      email: email.toLowerCase(), 
      passwordHash: hash, 
      createdAt: new Date().toISOString(),
      isPremium: false,
      activityLogs: [{ timestamp: new Date().toISOString(), action: 'account_created', ip: req.ip }]
    };
    users.push(user);
    writeUsers(users);
    
    // Send welcome email with terms and conditions
    const subject = 'Welcome to SmartInvest Africa — Terms & Conditions';
    const html = `
      <h2>Welcome to SmartInvest Africa!</h2>
      <p>Thank you for creating an account. We're excited to help you on your investment journey.</p>
      
      <h3>Getting Started:</h3>
      <ol>
        <li>Explore our free resources and tools</li>
        <li>Upgrade to Premium for full access to courses and advanced features</li>
        <li>Join our community and connect with fellow investors</li>
      </ol>

      <h3>Terms & Conditions:</h3>
      <p>By using SmartInvest Africa, you agree to:</p>
      <ul>
        <li>Provide accurate and truthful information</li>
        <li>Use our services in compliance with all applicable laws</li>
        <li>Respect intellectual property rights</li>
        <li>Not engage in fraudulent or harmful activities</li>
      </ul>

      <h3>Privacy & Data Protection:</h3>
      <p>Your data is protected under GDPR and local data protection laws. We never sell your information.</p>

      <h3>Legal Disclaimer:</h3>
      <p>SmartInvest Africa provides educational content only. We do not provide financial advice. 
      All investment decisions are your own responsibility. Investments carry risk.</p>

      <p>Full terms: <a href="${process.env.BASE_URL || 'https://smartinvest.africa'}/terms.html">View Complete Terms</a></p>
      
      <p>Questions? Contact: ${process.env.SUPPORT_EMAIL || 'support@smartinvest.africa'}</p>
    `;
    sendNotificationMail({ to: email, subject, html });
    
    return res.json({ success: true, message: 'signup successful' });
  } catch (err) {
    console.error('signup error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    
    // Log activity
    logUserActivity(email, 'login', req.ip);
    
    // Return user status including premium
    return res.json({ 
      success: true, 
      message: 'login successful',
      isPremium: user.isPremium || false,
      premiumExpiresAt: user.premiumExpiresAt || null
    });
  } catch (err) {
    console.error('login error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Password reset request
app.post('/api/auth/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If account exists, reset email sent' });
    }
    
    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    writeUsers(users);
    
    // Send reset email with activity logs
    sendPasswordResetEmail(email, token);
    logUserActivity(email, 'password_reset_requested', req.ip);
    
    return res.json({ success: true, message: 'If account exists, reset email sent' });
  } catch (err) {
    console.error('reset password request error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Password reset confirm
app.post('/api/auth/reset-password-confirm', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword required' });
    
    const users = readUsers();
    const user = users.find(u => u.resetToken === token && u.resetTokenExpiry > Date.now());
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });
    
    // Update password
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    delete user.resetToken;
    delete user.resetTokenExpiry;
    writeUsers(users);
    
    logUserActivity(user.email, 'password_reset_completed', req.ip);
    sendNotificationMail({ to: user.email, subject: 'Password Changed', text: 'Your SmartInvest password was successfully changed.' });
    
    return res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('reset password confirm error', err.message);
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
      const resultCode = stk && stk.ResultCode !== undefined ? stk.ResultCode : null;
      
      // Auto-grant premium on successful payment
      if (resultCode === 0) {
        const phone = Array.isArray(items) ? (items.find(i=>i.Name==='PhoneNumber' || i.name==='PhoneNumber') || items.find(i=>i.Name==='phone')) : null;
        if (phone && phone.Value) {
          const phoneNum = String(phone.Value);
          const email = phoneNum + '@mpesa.local';
          // Ensure user exists
          const users = readUsers();
          let user = users.find(u => u.email === email);
          if (!user) {
            user = {
              email,
              passwordHash: bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10),
              createdAt: new Date().toISOString(),
              createdVia: 'mpesa_payment',
              phone: phoneNum
            };
            users.push(user);
            writeUsers(users);
          }
          grantPremium(email, 30, 'mpesa_payment', 'system');
        }
      }
      
      if (acctVal) {
        const files = readFilesMeta();
        const match = files.find(f => f.id === acctVal);
        if (match) {
          const phone = Array.isArray(items) ? (items.find(i=>i.Name==='PhoneNumber') || items.find(i=>i.Name==='phone' ) ) : null;
          const emailLike = phone && phone.Value ? String(phone.Value)+'@mpesa.local' : '';
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
      const eventType = payload.event_type || '';
      const payerEmail = resource?.payer?.email_address || resource?.payer?.email || payload?.payer_email || '';
      
      // Auto-grant premium on successful payment
      if ((eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') && payerEmail) {
        const users = readUsers();
        let user = users.find(u => u.email.toLowerCase() === payerEmail.toLowerCase());
        if (!user) {
          user = {
            email: payerEmail.toLowerCase(),
            passwordHash: bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10),
            createdAt: new Date().toISOString(),
            createdVia: 'paypal_payment'
          };
          users.push(user);
          writeUsers(users);
        }
        grantPremium(payerEmail, 30, 'paypal_payment', 'system');
      }
      
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
      if (fileId) grantPurchase(fileId, payerEmail, 'paypal', { raw: payload });
    } catch (e) { console.error('paypal grant detection error', e.message); }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('paypal webhook error', err.message);
    return res.status(500).end();
  }
});

// Manual KCB Bank Transfer (simple flow)
app.post('/api/pay/kcb/manual', (req, res) => {
  try {
    const { name, email, amount, reference } = req.body;
    if (!name || !email || !amount) return res.status(400).json({ error: 'name, email and amount required' });

    const tx = {
      provider: 'kcb_manual',
      timestamp: new Date().toISOString(),
      name,
      email,
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

// Consolidated payments ledger for admins
app.get('/api/admin/payments', adminAuth, (req, res) => {
  const files = readFilesMeta();
  const payments = readTransactions().map(tx => summarizeTransaction(tx, files));
  const purchases = readPurchases();
  return res.json({ success: true, payments, purchases });
});
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

    // Auto-grant premium to user
    const email = arr[idx].email;
    if (email) {
      const users = readUsers();
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        user = {
          email: email.toLowerCase(),
          passwordHash: bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10),
          createdAt: new Date().toISOString(),
          createdVia: 'kcb_payment'
        };
        users.push(user);
        writeUsers(users);
      }
      grantPremium(email, 30, 'kcb_manual_payment', process.env.ADMIN_USER || 'admin');
    }

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

// Admin: list all users with full details including premium status
app.get('/api/admin/users', adminAuth, (req, res) => {
  try {
    const users = readUsers();
    const sanitized = users.map(u => ({
      email: u.email,
      createdAt: u.createdAt,
      createdVia: u.createdVia,
      isPremium: u.isPremium || false,
      premiumExpiresAt: u.premiumExpiresAt,
      premiumGrantedAt: u.premiumGrantedAt,
      premiumReason: u.premiumReason,
      premiumGrantedBy: u.premiumGrantedBy,
      phone: u.phone,
      activityLogs: (u.activityLogs || []).slice(-10)
    }));
    return res.json({ success: true, users: sanitized });
  } catch (e) {
    console.error('admin users list error', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// Admin: manually grant premium to a user
app.post('/api/admin/grant-premium', adminAuth, (req, res) => {
  try {
    const { email, days, reason } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const daysNum = Number(days) || 30;
    const grantedBy = process.env.ADMIN_USER || 'admin';
    const user = grantPremium(email, daysNum, reason || 'manual_admin_grant', grantedBy);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ success: true, user: { email: user.email, isPremium: user.isPremium, premiumExpiresAt: user.premiumExpiresAt } });
  } catch (e) {
    console.error('grant premium error', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// Admin: revoke premium from a user
app.post('/api/admin/revoke-premium', adminAuth, (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isPremium = false;
    user.premiumRevokedAt = new Date().toISOString();
    delete user.premiumExpiresAt;
    writeUsers(users);
    sendNotificationMail({ to: email, subject: 'Premium Access Revoked', text: 'Your premium access has been revoked by an administrator.' });
    return res.json({ success: true });
  } catch (e) {
    console.error('revoke premium error', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// Admin: dashboard stats
app.get('/api/admin/dashboard-stats', adminAuth, (req, res) => {
  try {
    const users = readUsers();
    const files = readFilesMeta();
    const messages = readMessages();
    const purchases = readPurchases();
    const premiumUsers = users.filter(u => u.isPremium && (!u.premiumExpiresAt || new Date(u.premiumExpiresAt) > new Date()));
    return res.json({
      success: true,
      totalUsers: users.length,
      premiumUsers: premiumUsers.length,
      filesCount: files.length,
      pendingMessages: messages.filter(m => !m.replies || m.replies.length === 0).length,
      totalPurchases: purchases.length
    });
  } catch (e) {
    console.error('dashboard stats error', e.message);
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
    const id = crypto.randomUUID();
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${id}-${safe}`);
  }
});
const upload = multer({ storage });

function readFilesMeta(){
  try { return JSON.parse(fs.readFileSync(FILES_JSON, 'utf8') || '[]'); } catch(e){ return []; }
}
function writeFilesMeta(arr){ fs.writeFileSync(FILES_JSON, JSON.stringify(arr, null, 2)); }

// Public: list files available for purchase/download — now restricted to purchasers.
app.get('/api/files', requirePaidUser, (req, res) => {
  try {
    const files = readFilesMeta();
    const purchases = readPurchases().filter(p => p.email && String(p.email).toLowerCase() === req.purchaserEmail);
    const ownedIds = purchases.map(p => p.fileId);
    const owned = files.filter(f => ownedIds.includes(f.id));
    return res.json({ success: true, files: owned });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Admin: upload a file with metadata (title, price, description)
app.post('/api/admin/upload', adminAuth, upload.single('file'), (req, res) => {
  try {
    const { title, price, description } = req.body;
    if (!req.file) return res.status(400).json({ error: 'file is required (multipart form-data field name: file)' });
    const meta = readFilesMeta();
    const id = crypto.randomUUID();
    const item = {
      id,
      title: title || req.file.originalname,
      description: description || '',
      price: Number(price || 0),
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    };
    meta.push(item);
    writeFilesMeta(meta);
    return res.json({ success: true, file: item });
  } catch (e) { console.error('upload error', e.message); return res.status(500).json({ error: e.message }); }
});

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

// NOTE: The demo `/api/purchase` endpoint was removed. Integrate real payment providers and
// grant purchases via provider webhooks or admin grants. This improves security by avoiding
// client-side simulated purchases.

// Download a file if a valid token exists for that file
app.get('/download/:id', (req, res) => {
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

// Read saved transactions from disk (mpesa, paypal, kcb_manual, etc.)
function readTransactions() {
  try {
    const file = './transactions.json';
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8') || '[]';
    return JSON.parse(raw);
  } catch (e) {
    console.error('readTransactions error', e.message);
    return [];
  }
}

// Summarize a raw transaction into a compact, admin-friendly shape
function summarizeTransaction(tx, files = []) {
  const base = {
    provider: tx.provider || 'unknown',
    createdAt: tx.timestamp || tx.time || new Date().toISOString(),
    status: tx.status || 'pending',
    amount: tx.amount || null,
    currency: tx.currency || null,
    email: tx.email || null,
    phone: tx.phone || null,
    reference: tx.reference || null,
    receipt: tx.receipt || null,
    note: tx.note || null
  };

  const cleanLower = (s) => (s ? String(s).toLowerCase() : '');

  // Provider-specific enrichment
  if ((tx.provider || '').toLowerCase() === 'mpesa') {
    const payload = tx.payload || {};
    const body = payload.Body || payload.body || payload;
    const stk = (body && (body.stkCallback || body.STKCallback)) || body || {};
    const items = (stk.CallbackMetadata && stk.CallbackMetadata.Item) || [];
    const findItem = (name) => items.find(i => cleanLower(i.Name) === name || cleanLower(i.name) === name);
    const amount = findItem('amount')?.Value || null;
    const phone = findItem('phonenumber')?.Value || findItem('msisdn')?.Value || null;
    const receipt = findItem('mpesareceiptnumber')?.Value || null;
    const account = findItem('accountreference')?.Value || findItem('account')?.Value || null;
    const resultCode = stk.ResultCode;
    const status = resultCode === 0 ? 'success' : (resultCode === 1032 ? 'timeout' : 'failed');

    base.amount = amount || base.amount;
    base.currency = 'KES';
    base.phone = phone || base.phone;
    base.email = base.email || (phone ? `${phone}@mpesa.local` : null);
    base.reference = account || base.reference;
    base.receipt = receipt || base.receipt;
    base.status = status || base.status;
    base.description = stk.ResultDesc || base.description;
  }

  if ((tx.provider || '').toLowerCase() === 'paypal') {
    const payload = tx.payload || {};
    const resource = payload.resource || payload.body || payload;
    const pu = (resource.purchase_units || resource.purchaseUnits || [])[0] || {};
    const amountObj = pu.amount || {};
    const amount = Number(amountObj.value || base.amount) || null;
    const currency = amountObj.currency_code || base.currency || 'USD';
    const reference = pu.custom_id || pu.reference_id || pu.invoice_id || base.reference;
    const email = resource?.payer?.email_address || base.email;
    const status = resource?.status || payload?.event_type || base.status;

    base.amount = amount;
    base.currency = currency;
    base.reference = reference;
    base.email = email;
    base.status = status;
  }

  if ((tx.provider || '').toLowerCase() === 'kcb_manual') {
    base.status = tx.status || base.status;
    base.amount = tx.amount || base.amount;
    base.currency = base.currency || 'KES';
    base.email = tx.email || base.email;
    base.reference = tx.reference || base.reference;
    base.account = tx.account || null;
  }

  // Map reference to a file name if possible
  if (base.reference) {
    const match = files.find(f => f.id === base.reference);
    if (match) base.fileTitle = match.title;
  }

  return base;
}

// Middleware: require that the requester is a purchaser. Checks for purchaser email
// in header `x-user-email`, query `email` or request body `email`. Returns 402
// if no purchase found for that email. This enforces that file listings are
// accessible only to paying users.
function requirePaidUser(req, res, next) {
  try {
    const email = (req.headers['x-user-email'] || req.query.email || (req.body && req.body.email));
    if (!email) return res.status(402).json({ error: 'Payment required: include purchaser email in x-user-email header or ?email=' });
    const e = String(email).toLowerCase();
    const purchases = readPurchases();
    const ok = Array.isArray(purchases) && purchases.find(p => p.email && String(p.email).toLowerCase() === e);
    if (!ok) return res.status(402).json({ error: 'No purchases found for this email' });
    req.purchaserEmail = e;
    return next();
  } catch (e) {
    console.error('requirePaidUser error', e && e.message);
    return res.status(500).json({ error: 'server error' });
  }
}

// Middleware: require premium access (admin bypass allowed)
function requirePremium(req, res, next) {
  try {
    // Admin bypass: check for admin auth
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Basic ')) {
      const creds = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8');
      const [user, pass] = creds.split(':');
      if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
        req.isAdmin = true;
        return next();
      }
    }
    
    // Check for user email and premium status
    const email = (req.headers['x-user-email'] || req.query.email || (req.body && req.body.email));
    if (!email) return res.status(402).json({ error: 'Premium access required: please sign in', premiumRequired: true });
    
    const e = String(email).toLowerCase();
    if (!hasPremium(e)) {
      return res.status(402).json({ 
        error: 'Premium subscription required', 
        premiumRequired: true,
        upgradeUrl: `${process.env.BASE_URL || ''}/premium`
      });
    }
    
    req.userEmail = e;
    return next();
  } catch (e) {
    console.error('requirePremium error', e && e.message);
    return res.status(500).json({ error: 'server error' });
  }
}

function readScenarios(){ try { return JSON.parse(fs.readFileSync(SCENARIOS_FILE, 'utf8')||'[]'); } catch(e){ return []; } }
function writeScenarios(d){ fs.writeFileSync(SCENARIOS_FILE, JSON.stringify(d, null, 2)); }

// Grant premium access to a user (by email) for specified days
function grantPremium(email, days = 30, reason = 'payment', grantedBy = 'system') {
  try {
    if (!email) return null;
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    user.isPremium = true;
    user.premiumExpiresAt = expiresAt;
    user.premiumGrantedAt = new Date().toISOString();
    user.premiumReason = reason;
    user.premiumGrantedBy = grantedBy;
    writeUsers(users);
    // Send premium welcome email with terms and content details
    sendPremiumWelcomeEmail(email);
    return user;
  } catch (e) {
    console.error('grantPremium error', e.message);
    return null;
  }
}

// Check if user has active premium
function hasPremium(email) {
  try {
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !user.isPremium) return false;
    if (user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
      user.isPremium = false;
      writeUsers(users);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Send welcome email with terms, laws, conditions, and premium content description
function sendPremiumWelcomeEmail(email) {
  const subject = 'Welcome to SmartInvest Premium — Terms & Content Access';
  const html = `
    <h2>Welcome to SmartInvest Premium!</h2>
    <p>Thank you for joining SmartInvest Africa Premium. Your account now has full access to exclusive content.</p>
    
    <h3>Premium Content Includes:</h3>
    <ul>
      <li><strong>Investment Academy:</strong> 50+ video lessons covering Investing 101, Trading Essentials, SME Funding, and Digital Assets</li>
      <li><strong>Advanced Tools:</strong> Portfolio tracker, risk profiler, AI-powered recommendations</li>
      <li><strong>VIP Community:</strong> Exclusive forum, weekly webinars, and direct mentor access</li>
      <li><strong>Premium Files:</strong> Downloadable resources, templates, and guides</li>
    </ul>

    <h3>Terms and Conditions:</h3>
    <p>By using SmartInvest Premium, you agree to:</p>
    <ul>
      <li>Use content for personal educational purposes only</li>
      <li>Not share, redistribute, or resell any premium content</li>
      <li>Respect intellectual property rights of all materials</li>
      <li>Comply with all applicable laws and regulations in your jurisdiction</li>
    </ul>

    <h3>Legal Framework:</h3>
    <p>SmartInvest Africa operates under:</p>
    <ul>
      <li>Data Protection: GDPR and local data protection laws</li>
      <li>Financial Services: Licensed under applicable African financial regulations</li>
      <li>Consumer Protection: Full compliance with consumer rights legislation</li>
      <li>Anti-Money Laundering (AML): KYC procedures as required by law</li>
    </ul>

    <h3>Disclaimer:</h3>
    <p>Investment education and tools are provided for informational purposes. SmartInvest Africa does not provide financial advice. 
    All investment decisions are your responsibility. Past performance does not guarantee future results.</p>

    <p>For full terms: <a href="${process.env.BASE_URL || 'https://smartinvest.africa'}/terms.html">View Terms & Conditions</a></p>
    
    <p>Questions? Contact us at ${process.env.SUPPORT_EMAIL || 'support@smartinvest.africa'}</p>
  `;
  const text = `Welcome to SmartInvest Premium! You now have access to: Investment Academy (50+ lessons), Advanced Tools, VIP Community, and Premium Files. By using our service you agree to our Terms & Conditions and applicable laws. Full terms at ${process.env.BASE_URL || 'https://smartinvest.africa'}/terms.html`;
  sendNotificationMail({ to: email, subject, html, text });
}

// Send password reset email with user activity logs
function sendPasswordResetEmail(email, resetToken) {
  try {
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return;
    
    const logs = user.activityLogs || [];
    const recentLogs = logs.slice(-10).reverse();
    const logHtml = recentLogs.map(l => `<li>${l.timestamp}: ${l.action} ${l.ip ? '(IP: ' + l.ip + ')' : ''}</li>`).join('');
    
    const subject = 'Password Reset Request — SmartInvest';
    const resetUrl = `${process.env.BASE_URL || 'https://smartinvest.africa'}/reset-password?token=${resetToken}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password for ${email}.</p>
      <p><a href="${resetUrl}" style="background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      
      <h3>Recent Account Activity:</h3>
      <ul>${logHtml || '<li>No recent activity</li>'}</ul>
      
      <p><small>If you didn't request this reset, please ignore this email and contact support immediately.</small></p>
    `;
    const text = `Password reset requested for ${email}. Reset link: ${resetUrl} (expires in 1 hour). Recent activity: ${recentLogs.map(l => l.timestamp + ': ' + l.action).join('; ')}`;
    sendNotificationMail({ to: email, subject, html, text });
  } catch (e) {
    console.error('sendPasswordResetEmail error', e.message);
  }
}

// Log user activity
function logUserActivity(email, action, ip = null) {
  try {
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return;
    user.activityLogs = user.activityLogs || [];
    user.activityLogs.push({ timestamp: new Date().toISOString(), action, ip });
    // Keep only last 100 logs
    if (user.activityLogs.length > 100) user.activityLogs = user.activityLogs.slice(-100);
    writeUsers(users);
  } catch (e) {
    console.error('logUserActivity error', e.message);
  }
}

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

// Scenarios endpoints: store/load/delete simple calculator scenarios (premium required)
app.get('/api/scenarios', requirePremium, (req, res) => {
  try {
    const list = readScenarios();
    return res.json({ success: true, scenarios: list });
  } catch (e) { console.error('scenarios list error', e.message); return res.status(500).json({ error: e.message }); }
});

app.get('/api/scenarios/:id', requirePremium, (req, res) => {
  try {
    const id = req.params.id;
    const list = readScenarios();
    const s = list.find(x=>x.id===id);
    if (!s) return res.status(404).json({ error: 'not found' });
    return res.json({ success: true, scenario: s });
  } catch (e) { console.error('get scenario error', e.message); return res.status(500).json({ error: e.message }); }
});

app.post('/api/scenarios', requirePremium, express.json(), (req, res) => {
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
    const files = readFilesMeta().filter(f => f.published).map(f => ({ id: f.id, title: f.title, price: f.price, description: f.description }));
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

// Public: post a message (name optional, email optional)
app.post('/api/messages', express.json(), (req, res) => {
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
});

// Public: list messages (visible to everyone)
app.get('/api/messages', (req, res) => {
  try {
    const msgs = readMessages();
    return res.json({ success: true, messages: msgs });
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
    const files = readFilesMeta(); const file = files.find(f=>f.id===id);
    if (!file) return res.status(404).json({ error: 'file not found' });
    const purchases = readPurchases();
    purchases.push({ id: uuidv4(), fileId: id, email: email.toLowerCase(), grantedBy: req.headers['x-admin']||'admin', at: new Date().toISOString() });
    writePurchases(purchases);
    sendNotificationMail({ to: email, subject: `Access granted to ${file.title}`, text: `You have been granted access to download ${file.title}.` });
    return res.json({ success: true });
  } catch(e){ console.error(e); return res.status(500).json({ error: e.message }); }
});

// Public: request download token (email must match a purchase)
app.post('/api/download/request', express.json(), (req, res) => {
  try {
    const { fileId, email } = req.body;
    if (!fileId || !email) return res.status(400).json({ error: 'fileId and email required' });
    const purchases = readPurchases();
    const ok = purchases.find(p => p.fileId === fileId && p.email === email.toLowerCase());
    if (!ok) return res.status(402).json({ error: 'purchase not found' });
    const tokens = readTokens();
    const token = uuidv4();
    const expireAt = Date.now() + (60*60*1000); // 1 hour
    tokens[token] = { fileId, email: email.toLowerCase(), expireAt };
    writeTokens(tokens);
    const url = `${req.protocol}://${req.get('host')}/download/${token}`;
    return res.json({ success: true, url, expiresAt: new Date(expireAt).toISOString() });
  } catch(e){ console.error(e); return res.status(500).json({ error: e.message }); }
});

// Serve download by token
app.get('/download/:token', (req, res) => {
  try {
    const token = req.params.token;
    const tokens = readTokens();
    const entry = tokens[token];
    if (!entry) return res.status(404).send('Invalid or expired token');
    if (Date.now() > entry.expireAt) { delete tokens[token]; writeTokens(tokens); return res.status(410).send('Token expired'); }
    const files = readFilesMeta(); const file = files.find(f=>f.id===entry.fileId);
    if (!file) return res.status(404).send('File not found');
    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File missing');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName.replace(/\"/g,'') }"`);
    return res.sendFile(filePath);
  } catch(e){ console.error('download error', e.message); return res.status(500).send('Server error'); }
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

// Serve tools folder (static files like the investment calculator)
app.use('/tools', express.static(path.join(__dirname, 'tools')));

// Premium Academy Content API (requires premium subscription)
app.get('/api/academy/courses', requirePremium, (req, res) => {
  const courses = [
    { id: 'investing-101', title: 'Investing 101', level: 'Beginner', lessons: 15, duration: '3 hours' },
    { id: 'trading-essentials', title: 'Trading Essentials', level: 'Intermediate', lessons: 20, duration: '5 hours' },
    { id: 'sme-funding', title: 'SME Funding Readiness', level: 'SME', lessons: 12, duration: '4 hours' },
    { id: 'digital-assets', title: 'Digital Assets & Crypto', level: 'Advanced', lessons: 18, duration: '6 hours' }
  ];
  return res.json({ success: true, courses });
});

app.get('/api/academy/courses/:id', requirePremium, (req, res) => {
  const courseContent = {
    'investing-101': { title: 'Investing 101', modules: ['Basics', 'Risk Management', 'Diversification'] },
    'trading-essentials': { title: 'Trading Essentials', modules: ['Market Analysis', 'Trading Psychology', 'Risk Control'] },
    'sme-funding': { title: 'SME Funding Readiness', modules: ['Pitching', 'Valuation', 'Investor Relations'] },
    'digital-assets': { title: 'Digital Assets & Crypto', modules: ['Custody', 'Security', 'Strategy'] }
  };
  const course = courseContent[req.params.id];
  if (!course) return res.status(404).json({ error: 'Course not found' });
  return res.json({ success: true, course });
});

// Premium Tools API
app.get('/api/tools/portfolio', requirePremium, (req, res) => {
  return res.json({ success: true, message: 'Portfolio tracker data', isPremium: true });
});

app.get('/api/tools/risk-profiler', requirePremium, (req, res) => {
  return res.json({ success: true, message: 'Risk profiler data', isPremium: true });
});

app.get('/api/tools/recommendations', requirePremium, (req, res) => {
  return res.json({ success: true, message: 'AI recommendations', isPremium: true });
});

app.listen(PORT, ()=>console.log(`Payment API listening on ${PORT}`));

// Serve download by token
app.get('/download/:token', (req, res) => {
  try {
    const token = req.params.token;
    const tokens = readTokens();
    const entry = tokens[token];
    if (!entry) return res.status(404).send('Invalid or expired token');
    if (Date.now() > entry.expireAt) { delete tokens[token]; writeTokens(tokens); return res.status(410).send('Token expired'); }
    const files = readFilesMeta(); const file = files.find(f=>f.id===entry.fileId);
    if (!file) return res.status(404).send('File not found');
    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File missing');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName.replace(/\"/g,'') }"`);
    return res.sendFile(filePath);
  } catch(e){ console.error('download error', e.message); return res.status(500).send('Server error'); }
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

// Serve tools folder (static files like the investment calculator)
app.use('/tools', express.static(path.join(__dirname, 'tools')));

// Add / replace snippets in server.js as instructed below

// 1) Near top of server.js (with the other requires) add:
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
// (Ensure bcrypt, fs, uuidv4 etc. remain where they are)

// 2) After you initialize Express / after app.use(bodyParser.json()); add:
app.use(cookieParser());

// 3) Add config constants (near other config/env usage)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '12h';

// 4) Add the helper verifyTokenFromReq (place near other helpers)
function verifyTokenFromReq(req) {
  const auth = (req.headers.authorization || '').toString();
  let token = null;
  if (auth && auth.startsWith('Bearer ')) token = auth.split(' ')[1];
  if (!token && req.cookies && req.cookies.si_token) token = req.cookies.si_token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// 5) Replace the existing adminAuth implementation with this one
function adminAuth(req, res, next) {
  const adminUserEnv = process.env.ADMIN_USER;
  const payload = verifyTokenFromReq(req);
  if (payload && payload.admin) {
    req.user = { email: payload.email, admin: true };
    return next();
  }

  // Fallback: Basic auth if ADMIN_USER configured
  const auth = (req.headers.authorization || '').toString();
  if (adminUserEnv && auth && auth.startsWith('Basic ')) {
    const creds = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8');
    const [user, pass] = creds.split(':');
    if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
      req.user = { email: user, admin: true };
      return next();
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).end('Unauthorized');
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

// 6) Replace/augment requirePaidUser to accept session cookie email
function requirePaidUser(req, res, next) {
  try {
    let email = (req.headers['x-user-email'] || req.query.email || (req.body && req.body.email));
    if (!email) {
      const payload = verifyTokenFromReq(req);
      if (payload && payload.email) email = payload.email;
    }
    if (!email) return res.status(402).json({ error: 'Payment required: include purchaser email in x-user-email header or ?email= or sign in' });
    const e = String(email).toLowerCase();
    const purchases = readPurchases();
    const ok = Array.isArray(purchases) && purchases.find(p => p.email && String(p.email).toLowerCase() === e);
    if (!ok) return res.status(402).json({ error: 'No purchases found for this email' });
    req.purchaserEmail = e;
    return next();
  } catch (e) {
    console.error('requirePaidUser error', e && e.message);
    return res.status(500).json({ error: 'server error' });
  }
}

// 7) Update /api/auth/login to set HttpOnly cookie (replace existing handler)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    // Determine admin flag: explicit user.admin OR ADMIN_USER env match
    const isAdmin = !!((process.env.ADMIN_USER && String(email).toLowerCase() === String(process.env.ADMIN_USER).toLowerCase()) || user.admin);

    const token = jwt.sign({ email: user.email, admin: !!isAdmin }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: (function() {
        const m = String(JWT_EXPIRES || '12h');
        if (/^\d+$/.test(m)) return Number(m) * 1000;
        const match = m.match(/^(\d+)h$/);
        if (match) return Number(match[1]) * 60 * 60 * 1000;
        return 1000 * 60 * 60 * 12;
      })()
    };
    res.cookie('si_token', token, cookieOptions);

    return res.json({ success: true, email: user.email, admin: !!isAdmin });
  } catch (err) {
    console.error('login error', err && err.message);
    return res.status(500).json({ error: err && err.message });
  }
});

// 8) Add logout endpoint to clear cookie
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('si_token', { path: '/' });
  return res.json({ success: true });
});

// 9) Add /api/auth/me to introspect token (header or cookie)
app.get('/api/auth/me', (req, res) => {
  const payload = verifyTokenFromReq(req);
  if (!payload) return res.status(401).json({ error: 'invalid or missing token' });
  return res.json({ success: true, email: payload.email, admin: !!payload.admin });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Save to messages file
    const messagesFile = path.join(__dirname, 'data', 'contact-messages.json');
    let messages = [];
    try {
      if (fs.existsSync(messagesFile)) {
        messages = JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
      }
    } catch (e) {
      messages = [];
    }
    
    const newMessage = {
      id: uuidv4(),
      name,
      email,
      message,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      status: 'new'
    };
    
    messages.push(newMessage);
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
    
    // Send notification to admin
    const adminEmail = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendNotificationMail({
        to: adminEmail,
        subject: `New Contact Message from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        `
      });
    }
    
    // Send confirmation to user
    sendNotificationMail({
      to: email,
      subject: 'We received your message - SmartInvest Africa',
      html: `
        <h2>Thank you for contacting us!</h2>
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p>Best regards,<br>SmartInvest Africa Team</p>
      `
    });
    
    return res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('Contact form error:', err.message);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// Feedback widget endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { feedback, timestamp } = req.body;
    if (!feedback) {
      return res.status(400).json({ error: 'Feedback is required' });
    }
    
    // Get user email if authenticated
    const payload = verifyTokenFromReq(req);
    const userEmail = payload ? payload.email : 'anonymous';
    
    // Save to feedback file
    const feedbackFile = path.join(__dirname, 'data', 'feedback.json');
    let feedbackList = [];
    try {
      if (fs.existsSync(feedbackFile)) {
        feedbackList = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
      }
    } catch (e) {
      feedbackList = [];
    }
    
    const newFeedback = {
      id: uuidv4(),
      feedback,
      userEmail,
      timestamp: timestamp || new Date().toISOString(),
      ip: req.ip
    };
    
    feedbackList.push(newFeedback);
    fs.writeFileSync(feedbackFile, JSON.stringify(feedbackList, null, 2));
    
    return res.json({ success: true, message: 'Feedback received' });
  } catch (err) {
    console.error('Feedback error:', err.message);
    return res.status(500).json({ error: 'Failed to save feedback' });
  }
});

app.listen(PORT, ()=>console.log(`Payment API listening on ${PORT}`));
