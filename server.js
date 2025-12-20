require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const cors = require('cors');

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
    const { amount, phone } = req.body;
    if (!amount || !phone) return res.status(400).json({ error: 'amount and phone required' });
    const token = await getMpesaAuth();

    // The following inputs are required by Daraja STK Push: shortcode, passkey, timestamp
    const shortcode = process.env.MPESA_SHORTCODE || process.env.MPESA_PAYBILL || '174379';
    const passkey = process.env.MPESA_PASSKEY || '';
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0,14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const endpoint = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const body = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://example.com/mpesa/callback',
      AccountReference: process.env.MPESA_ACCOUNT_REF || 'SmartInvest',
      TransactionDesc: 'Payment'
    };

    const mpRes = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await mpRes.json();
    return res.json({ success: true, data });
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
    const purchase = {
      intent: 'CAPTURE',
      purchase_units: [ { amount: { currency_code: 'USD', value: String(req.body.amount || '10') } } ],
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
    const tx = { provider: 'mpesa', timestamp: new Date().toISOString(), payload };
    const file = './transactions.json';
    const arr = require('fs').existsSync(file) ? JSON.parse(require('fs').readFileSync(file)) : [];
    arr.push(tx);
    require('fs').writeFileSync(file, JSON.stringify(arr, null, 2));
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

// Simple helper to expose MPesa token for debugging (DO NOT expose in production)
app.get('/api/pay/mpesa/token', async (req, res) => {
  try {
    const token = await getMpesaAuth();
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, ()=>console.log(`Payment API listening on ${PORT}`));
