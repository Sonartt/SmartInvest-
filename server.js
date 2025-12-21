require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());

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
    const user = { email: email.toLowerCase(), passwordHash: hash, createdAt: new Date().toISOString() };
    users.push(user);
    writeUsers(users);
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
    // For demo: return a simple success message. In production return a session or JWT.
    return res.json({ success: true, message: 'login successful' });
  } catch (err) {
    console.error('login error', err.message);
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
app.get('/api/scenarios', (req, res) => {
  try {
    const list = readScenarios();
    return res.json({ success: true, scenarios: list });
  } catch (e) { console.error('scenarios list error', e.message); return res.status(500).json({ error: e.message }); }
});

app.get('/api/scenarios/:id', (req, res) => {
  try {
    const id = req.params.id;
    const list = readScenarios();
    const s = list.find(x=>x.id===id);
    if (!s) return res.status(404).json({ error: 'not found' });
    return res.json({ success: true, scenario: s });
  } catch (e) { console.error('get scenario error', e.message); return res.status(500).json({ error: e.message }); }
});

app.post('/api/scenarios', express.json(), (req, res) => {
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

app.listen(PORT, ()=>console.log(`Payment API listening on ${PORT}`));
