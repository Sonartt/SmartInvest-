'use strict';

const dashboardHubState = {
  catalog: [],
  library: [],
  activity: [],
  adminBootstrapped: false,
  currentRole: 'user'
};

const LIBRARY_KEY = 'si_library';
const ACTIVITY_KEY = 'si_activity';
const PREMIUM_KEY = 'si_is_premium';
const LAST_LOGIN_KEY = 'si_last_login';

function safeGet(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (e) {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

function hydrateDashboardState() {
  dashboardHubState.library = readStoredArray(LIBRARY_KEY);
  dashboardHubState.activity = readStoredArray(ACTIVITY_KEY);
}

function readStoredArray(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function persistLibrary() {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(dashboardHubState.library));
  } catch (e) {}
}

function persistActivity() {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(dashboardHubState.activity));
  } catch (e) {}
}

function updateUserBadge() {
  const email = safeGet('si_user_email');
  const badge = document.getElementById('userBadge');
  if (email && badge) {
    badge.textContent = `Logged in: ${email}`;
    badge.classList.remove('hidden');
  }
}

let loading = false;

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

function storeLoginMetadata(email, isPremiumFlag) {
  if (email) {
    safeSet('si_user_email', email.toLowerCase());
  }
  safeSet(PREMIUM_KEY, isPremiumFlag ? 'true' : 'false');
  const now = new Date().toISOString();
  safeSet(LAST_LOGIN_KEY, now);
  renderUserDashboardStats();
  updateUserBadge();
}

function logUserActivity(action, detail) {
  if (!action && !detail) return;
  const entry = { action, detail, at: new Date().toISOString() };
  dashboardHubState.activity = [entry, ...dashboardHubState.activity].slice(0, 8);
  persistActivity();
  renderUserActivity();
}

function renderUserActivity() {
  const container = document.getElementById('userActivityFeed');
  if (!container) return;
  if (!dashboardHubState.activity.length) {
    container.innerHTML = '<div class="text-slate-500">No activity logged yet.</div>';
    return;
  }
  container.innerHTML = dashboardHubState.activity.map(item => `
    <div class="border border-slate-100 rounded-lg p-3">
      <div class="text-xs uppercase text-slate-400">${item.action || 'Update'}</div>
      <div class="text-sm text-slate-700">${item.detail || ''}</div>
      <div class="text-xs text-slate-500 mt-1">${formatDateForHumans(item.at)}</div>
    </div>
  `).join('');
}

function resetUserActivity() {
  dashboardHubState.activity = [];
  persistActivity();
  renderUserActivity();
}

function renderUserDashboardStats() {
  const emailEl = document.getElementById('userDashboardEmail');
  const premiumStatusEl = document.getElementById('userPremiumStatus');
  const premiumBadgeEl = document.getElementById('userPremiumBadge');
  const premiumMessageEl = document.getElementById('userPremiumMessage');
  const libraryCountEl = document.getElementById('userLibraryStat');
  const lastActiveEl = document.getElementById('userLastActive');

  const email = safeGet('si_user_email', 'Not signed in yet');
  const isPremium = safeGet(PREMIUM_KEY) === 'true';
  const lastLogin = safeGet(LAST_LOGIN_KEY);
  const libraryCount = dashboardHubState.library.length;

  if (emailEl) emailEl.textContent = email;
  if (premiumStatusEl) premiumStatusEl.textContent = isPremium ? 'Premium' : 'Free tier';
  if (premiumBadgeEl) {
    premiumBadgeEl.textContent = isPremium ? 'Active' : 'Inactive';
    premiumBadgeEl.className = isPremium
      ? 'px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700'
      : 'px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600';
  }
  if (premiumMessageEl) {
    premiumMessageEl.textContent = isPremium
      ? 'Thank you for supporting SmartInvest — VIP webinars are unlocked.'
      : 'Upgrade to unlock VIP webinars and advanced tooling.';
  }
  if (libraryCountEl) libraryCountEl.textContent = libraryCount;
  if (lastActiveEl) lastActiveEl.textContent = lastLogin ? formatDateForHumans(lastLogin) : '—';
}

function recordLibraryEntry(fileId, options = {}) {
  if (!fileId) return;
  const match = dashboardHubState.catalog.find(f => f.id === fileId);
  const entry = {
    id: fileId,
    title: options.title || match?.title || 'Premium Asset',
    price: options.price ?? match?.price ?? 0,
    method: options.method || 'mpesa',
    purchasedAt: new Date().toISOString()
  };
  dashboardHubState.library = [entry, ...dashboardHubState.library].slice(0, 6);
  persistLibrary();
  renderUserLibrary();
}

function renderUserLibrary() {
  const list = document.getElementById('userLibraryList');
  const badge = document.getElementById('userLibraryCount');
  const stat = document.getElementById('userLibraryStat');
  if (!list) return;

  const items = dashboardHubState.library;
  if (badge) badge.textContent = `${items.length} ${items.length === 1 ? 'file' : 'files'}`;
  if (stat) stat.textContent = items.length;

  if (!items.length) {
    const suggestions = dashboardHubState.catalog.slice(0, 3).map(item => `
      <div class="border border-slate-100 rounded-lg p-3">
        <div class="font-semibold text-slate-900">${escapeHtml(item.title || 'Premium File')}</div>
        <div class="text-xs text-slate-500">${escapeHtml(item.description || 'Access available after purchase')}</div>
      </div>
    `).join('');
    list.innerHTML = suggestions || '<div class="text-slate-500">No purchases yet. Explore the catalog to get started.</div>';
    return;
  }

  list.innerHTML = items.map(item => `
    <div class="border border-slate-100 rounded-lg p-3">
      <div class="flex items-center justify-between">
        <div class="font-semibold text-slate-900">${escapeHtml(item.title)}</div>
        <span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">${escapeHtml((item.method || 'mpesa').toUpperCase())}</span>
      </div>
      <div class="text-xs text-slate-500">${formatDateForHumans(item.purchasedAt)} • ${item.price ? '$' + item.price : 'Included'}</div>
    </div>
  `).join('');
}

function formatDateForHumans(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch (e) {
    return value;
  }
}

function initDashboardHub() {
  document.querySelectorAll('[data-dashboard-role]').forEach(btn => {
    btn.addEventListener('click', () => activateDashboardRole(btn.dataset.dashboardRole));
  });
  const syncButton = document.getElementById('userSyncButton');
  if (syncButton) {
    syncButton.addEventListener('click', () => {
      renderUserDashboardStats();
      renderUserLibrary();
      renderUserActivity();
    });
  }
}

function activateDashboardRole(role) {
  if (!role) return;
  dashboardHubState.currentRole = role;
  document.querySelectorAll('[data-dashboard-role]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.dashboardRole === role);
  });
  document.querySelectorAll('[data-dashboard-panel]').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.dashboardPanel === role);
  });
  if (role === 'admin') {
    ensureAdminPanelBootstrapped();
  }
}

function ensureAdminPanelBootstrapped() {
  if (dashboardHubState.adminBootstrapped) return;
  dashboardHubState.adminBootstrapped = true;
  refreshDashboard();
}

function detectInitialDashboardRole() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('dashboard');
  const role = requested === 'admin' ? 'admin' : 'user';
  activateDashboardRole(role);
  if (role === 'admin') {
    scrollToSection('dashboard-hub');
  }
}

async function handleMpesaPay() {
  if (loading) return;
  const btn = document.getElementById('mpesaBtn');
  const msgDiv = document.getElementById('paymentMessage');
  if (!btn || !msgDiv) return;
  loading = true;
  btn.disabled = true;
  btn.textContent = 'Processing...';
  msgDiv.textContent = '';

  try {
    const phone = btn.dataset.phone || '254114383762';
    const res = await fetch('/api/pay/mpesa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000, phone })
    });
    const data = await res.json();
    const success = Boolean(data && data.success);
    msgDiv.textContent = success ? 'M-Pesa STK Push sent. Complete payment on your phone.' : 'M-Pesa payment failed.';
    msgDiv.className = success ? 'mt-4 text-sm text-green-300' : 'mt-4 text-sm text-red-300';
    if (success) {
      recordLibraryEntry('premium-pass', { title: 'Premium Access', price: 1000, method: 'mpesa' });
      logUserActivity('Payment', 'Started premium M-Pesa STK push');
    } else {
      logUserActivity('Payment', 'M-Pesa attempt failed');
    }
  } catch (error) {
    msgDiv.textContent = 'Network error. Please try again.';
    msgDiv.className = 'mt-4 text-sm text-red-300';
    logUserActivity('Payment', 'M-Pesa network error');
  } finally {
    loading = false;
    btn.disabled = false;
    btn.textContent = 'Pay with M-Pesa';
  }
}

async function handleBuyMpesa(fileId) {
  if (loading) return;
  const btn = document.getElementById('mpesaBtn');
  const msgDiv = document.getElementById('paymentMessage');
  if (!btn || !msgDiv) return;
  loading = true;
  btn.disabled = true;
  btn.textContent = 'Processing...';
  msgDiv.textContent = '';

  try {
    const phone = btn.dataset.phone || '254114383762';
    const res = await fetch('/api/pay/mpesa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000, phone, accountReference: fileId })
    });
    const data = await res.json();
    const success = Boolean(data && data.success);
    msgDiv.textContent = success ? 'M-Pesa STK Push sent. Complete payment on your phone.' : 'M-Pesa payment failed.';
    msgDiv.className = success ? 'mt-4 text-sm text-green-300' : 'mt-4 text-sm text-red-300';
    if (success) {
      const match = dashboardHubState.catalog.find(f => f.id === fileId);
      recordLibraryEntry(fileId || `mpesa-${Date.now()}`, { method: 'mpesa', title: match?.title });
      logUserActivity('Payment', `Triggered M-Pesa for ${match?.title || 'catalog item'}`);
    } else {
      logUserActivity('Payment', 'Catalog M-Pesa attempt failed');
    }
  } catch (error) {
    msgDiv.textContent = 'Network error. Please try again.';
    msgDiv.className = 'mt-4 text-sm text-red-300';
    logUserActivity('Payment', 'Catalog M-Pesa network error');
  } finally {
    loading = false;
    btn.disabled = false;
    btn.textContent = 'Pay with M-Pesa';
  }
}

async function handlePayPalPay() {
  if (loading) return;
  const btn = document.getElementById('paypalBtn');
  const msgDiv = document.getElementById('paymentMessage');
  if (!btn || !msgDiv) return;
  loading = true;
  btn.disabled = true;
  btn.textContent = 'Processing...';
  msgDiv.textContent = '';

  try {
    const res = await fetch('/api/pay/paypal/create-order', {
      method: 'POST'
    });
    const data = await res.json();
    if (data?.approveUrl) {
      logUserActivity('Payment', 'Redirecting to PayPal checkout');
      window.location.href = data.approveUrl;
    } else {
      msgDiv.textContent = 'PayPal order creation failed.';
      msgDiv.className = 'mt-4 text-sm text-red-300';
      logUserActivity('Payment', 'PayPal order creation failed');
    }
  } catch (error) {
    msgDiv.textContent = 'Network error. Please try again.';
    msgDiv.className = 'mt-4 text-sm text-red-300';
    logUserActivity('Payment', 'PayPal network error');
  } finally {
    loading = false;
    btn.disabled = false;
    btn.textContent = 'Pay with PayPal';
  }
}

async function handleBuyPaypal(fileId, amount) {
  if (loading) return;
  const btn = document.getElementById('paypalBtn');
  const msgDiv = document.getElementById('paymentMessage');
  if (!btn || !msgDiv) return;
  loading = true;
  btn.disabled = true;
  btn.textContent = 'Processing...';
  msgDiv.textContent = '';

  try {
    const res = await fetch('/api/pay/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount || 10, fileId })
    });
    const data = await res.json();
    if (data?.approveUrl) {
      const match = dashboardHubState.catalog.find(f => f.id === fileId);
      logUserActivity('Payment', `Redirecting to PayPal for ${match?.title || 'catalog item'}`);
      window.location.href = data.approveUrl;
    } else {
      msgDiv.textContent = 'PayPal order creation failed.';
      msgDiv.className = 'mt-4 text-sm text-red-300';
      logUserActivity('Payment', 'PayPal order creation failed');
    }
  } catch (error) {
    msgDiv.textContent = 'Network error. Please try again.';
    msgDiv.className = 'mt-4 text-sm text-red-300';
    logUserActivity('Payment', 'PayPal network error');
  } finally {
    loading = false;
    btn.disabled = false;
    btn.textContent = 'Pay with PayPal';
  }
}

function toggleBankForm(show) {
  const el = document.getElementById('bankForm');
  if (!el) return;
  el.style.display = show ? 'block' : 'none';
  const msgDiv = document.getElementById('paymentMessage');
  if (msgDiv) msgDiv.textContent = '';
}

async function submitBankTransfer(event) {
  event.preventDefault();
  const name = document.getElementById('bankName').value;
  const email = document.getElementById('bankEmail').value;
  const amount = document.getElementById('bankAmount').value;
  const reference = document.getElementById('bankReference').value;
  const msgDiv = document.getElementById('bankInstructions');
  msgDiv.textContent = 'Recording transfer...';
  try {
    const res = await fetch('/api/pay/kcb/manual', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, amount, reference })
    });
    const data = await res.json();
    if (data.success && data.transaction) {
      const acc = data.transaction.account;
      msgDiv.innerHTML = `<div>Please pay <strong>KES ${data.transaction.amount}</strong> to:</div>
        <div class="mt-2"><strong>${acc.bank}</strong> — ${acc.accountName}</div>
        <div>${acc.accountNumber}</div>
        <div class="mt-2 text-sm text-gray-600">Use reference: <strong>${data.transaction.reference || data.transaction.timestamp}</strong></div>
        <div class="mt-2 text-sm text-gray-600">After sending funds, email a proof to <strong>${data.transaction.email}</strong> with the reference.</div>`;
      document.getElementById('bankForm').style.display = 'block';
      logUserActivity('Bank transfer', `Manual KCB transfer recorded for ${amount} KES`);
    } else {
      msgDiv.textContent = 'Failed to record transfer. Try again.';
      logUserActivity('Bank transfer', 'Failed to record manual transfer');
    }
  } catch (err) {
    msgDiv.textContent = 'Network error. Please try again.';
    logUserActivity('Bank transfer', 'Network error while recording transfer');
  }
}

function openBankForFile(fileId) {
  toggleBankForm(true);
  document.getElementById('bankReference').value = fileId;
}

function handleContactSubmit(event) {
  event.preventDefault();
  alert('Thank you for your message! We will get back to you soon.');
  event.target.reset();
}

function demoLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  if (!emailInput || !passwordInput) return;
  const email = emailInput.value;

  fetch('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: passwordInput.value })
  }).then(r => r.json()).then(data => {
    if (data.success) {
      alert('Sign in successful');
      const isPremium = Boolean(data.isPremium || data.user?.isPremium || data.profile?.isPremium);
      storeLoginMetadata(email, isPremium);
      logUserActivity('Login', `Signed in as ${email}`);
      renderUserLibrary();
    } else {
      alert('Sign in failed: ' + (data.error || ''));
    }
  }).catch(() => {
    alert('Network error');
  }).finally(() => {
    event.target.reset();
  });
}

async function handleSignup(event) {
  event.preventDefault();
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const acceptTerms = document.getElementById('acceptTerms').checked;
  try {
    const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, acceptTerms }) });
    const data = await res.json();
    if (data.success) {
      alert('Signup successful — you can now sign in.');
      storeLoginMetadata(email, false);
      logUserActivity('Signup', 'Created SmartInvest account');
      event.target.reset();
    } else {
      alert('Signup failed: ' + (data.error || ''));
    }
  } catch (err) {
    alert('Network error');
  }
}

async function fetchCatalog() {
  try {
    const res = await fetch('/api/catalog');
    const data = await res.json();
    const el = document.getElementById('catalog');
    if (!data.success || !Array.isArray(data.files)) {
      if (el) el.innerHTML = '<div class="col-span-3 text-center text-red-500">Failed to load catalog.</div>';
      return;
    }
    dashboardHubState.catalog = data.files;
    renderUserLibrary();
    if (!el) return;
    if (data.files.length === 0) {
      el.innerHTML = '<div class="col-span-3 text-center text-gray-500">No files available.</div>';
      return;
    }
    el.innerHTML = '';
    data.files.forEach(f => {
      const card = document.createElement('div');
      card.className = 'bg-white border border-gray-200 rounded-lg p-6 shadow-sm';
      card.innerHTML = `<h3 class="text-xl font-bold mb-2 text-purple-600">${escapeHtml(f.title)}</h3>
        <p class="text-gray-600 mb-3">${escapeHtml(f.description || '')}</p>
        <div class="mb-4 font-semibold">Price: ${escapeHtml(String(f.price || 0))} USD</div>
        <div class="flex gap-2">
          <button class="flex-1 bg-blue-500 text-white px-4 py-2 rounded" onclick="handleBuyPaypal('${f.id}', ${Number(f.price || 10)})">Buy with PayPal</button>
          <button class="bg-green-500 text-white px-4 py-2 rounded" onclick="handleBuyMpesa('${f.id}')">Pay M-Pesa</button>
          <button class="bg-gray-800 text-white px-4 py-2 rounded" onclick="openBankForFile('${f.id}')">Bank</button>
        </div>`;
      el.appendChild(card);
    });
  } catch (e) {
    const el = document.getElementById('catalog');
    if (el) el.innerHTML = '<div class="col-span-3 text-center text-red-500">Error loading catalog.</div>';
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"'`]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;","`":"&#96;"}[c]; });
}

async function requestDownloadToken(fileId) {
  const email = safeGet('si_user_email');
  const body = { fileId, email };
  const headers = { 'Content-Type': 'application/json' };
  if (email) headers['x-user-email'] = email;
  const res = await fetch('/api/download/request', { method: 'POST', headers, body: JSON.stringify(body) });
  return res.json();
}

aସ