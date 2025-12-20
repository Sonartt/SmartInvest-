require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

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
const bcrypt = require('bcryptjs');

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

    return res.json({ success: true, message: 'manual bank transfer recorded', transaction: tx });
  } catch (err) {
    console.error('kcb manual error', err.message);
    return res.status(500).json({ error: err.message });
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
