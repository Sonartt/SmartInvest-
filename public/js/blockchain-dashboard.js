/**
 * Blockchain Investment Dashboard Handler
 * Manages premium access, data loading, and interactive features
 */

const BLOCKCHAIN_TIMEOUT_MS = 15000;

/**
 * Fetch with timeout wrapper for blockchain dashboard
 */
async function blockchainFetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BLOCKCHAIN_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Safe JSON parsing with fallback
 */
async function blockchainSafeJson(response) {
  try {
    const text = await response.text();
    if (!text) return { parsed: null, text: '' };
    try {
      return { parsed: JSON.parse(text), text };
    } catch {
      return { parsed: null, text };
    }
  } catch (e) {
    return { parsed: null, text: '' };
  }
}

/**
 * Check if user has premium access
 */
async function checkPremiumAccess() {
  const userEmail = localStorage.getItem('si_user_email');
  const isPremium = localStorage.getItem('si_user_premium') === 'true';
  
  // If user is not logged in or not premium, show guard
  if (!userEmail || !isPremium) {
    showPremiumGuard();
    return false;
  }
  
  return true;
}

/**
 * Show premium access guard overlay
 */
function showPremiumGuard() {
  const guard = document.getElementById('premiumGuard');
  if (guard) {
    guard.classList.add('active');
  }
}

/**
 * Hide premium access guard overlay
 */
function hidePremiumGuard() {
  const guard = document.getElementById('premiumGuard');
  if (guard) {
    guard.classList.remove('active');
  }
}

/**
 * Initialize blockchain dashboard
 */
async function initializeBlockchainDashboard() {
  try {
    // Check premium access
    const hasPremium = await checkPremiumAccess();
    if (!hasPremium) {
      return;
    }
    
    hidePremiumGuard();
    
    // Load all data in parallel
    await Promise.all([
      loadMarketData(),
      loadDerivativesData(),
      loadPropertiesData(),
      loadIntangibleAssetsData(),
      loadFinancialMethodologies(),
      loadForumData()
    ]);
    
    // Set up auto-refresh
    setInterval(async () => {
      await Promise.all([
        loadMarketData(),
        loadDerivativesData(),
        loadPropertiesData(),
        loadFinancialMethodologies()
      ]);
    }, 60000); // Refresh every minute
    
    console.log('Blockchain dashboard initialized successfully with complex financial systems');
  } catch (error) {
    console.error('Failed to initialize blockchain dashboard:', error);
  }
}

/**
 * Load market data for NSE and crypto
 */
async function loadMarketData() {
  try {
    const res = await blockchainFetchWithTimeout('/api/blockchain/market-data');
    const { parsed, text } = await blockchainSafeJson(res);
    
    if (!res.ok) {
      console.error('Failed to load market data:', parsed?.error || text);
      return;
    }
    
    const data = parsed || { success: false };
    
    if (data.success && data.data) {
      updateMarketDisplay(data.data);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Market data request timed out');
    } else {
      console.error('Error loading market data:', error);
    }
  }
}

/**
 * Load financial derivatives data
 */
async function loadDerivativesData() {
  try {
    const userEmail = localStorage.getItem('si_user_email');
    const res = await blockchainFetchWithTimeout('/api/blockchain/derivatives', {
      headers: { 'x-user-email': userEmail || '' }
    });
    const { parsed, text } = await blockchainSafeJson(res);
    
    if (!res.ok) {
      console.error('Failed to load derivatives data:', parsed?.error || text);
      return;
    }
    
    const data = parsed || { success: false };
    if (data.success) {
      console.log('Derivatives data loaded:', data.data);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Derivatives data request timed out');
    } else {
      console.error('Error loading derivatives data:', error);
    }
  }
}

/**
 * Load properties and real assets data
 */
async function loadPropertiesData() {
  try {
    const userEmail = localStorage.getItem('si_user_email');
    const res = await blockchainFetchWithTimeout('/api/blockchain/properties', {
      headers: { 'x-user-email': userEmail || '' }
    });
    const { parsed, text } = await blockchainSafeJson(res);
    
    if (!res.ok) {
      console.error('Failed to load properties data:', parsed?.error || text);
      return;
    }
    
    const data = parsed || { success: false };
    if (data.success) {
      console.log('Properties data loaded');
    }
  } catch (error) {
    console.error('Error loading properties data:', error);
  }
}

/**
 * Calculate maintenance costs for an asset
 */
async function calculateMaintenanceCosts(assetValue, assetType, maintenanceRate = null) {
  try {
    const userEmail = localStorage.getItem('si_user_email');
    const payload = {
      assetValue: parseFloat(assetValue),
      assetType: assetType,
      maintenanceRate: maintenanceRate
    };
    
    const res = await blockchainFetchWithTimeout('/api/blockchain/maintenance-costs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userEmail || ''
      },
      body: JSON.stringify(payload)
    });
    
    const { parsed, text } = await blockchainSafeJson(res);
    
    if (!res.ok) {
      console.error('Failed to calculate maintenance costs:', parsed?.error || text);
      return null;
    }
    
    const data = parsed || { success: false };
    if (data.success) {
      console.log('Maintenance costs calculated:', data.calculation);
      return data.calculation;
    }
  } catch (error) {
    console.error('Error calculating maintenance costs:', error);
  }
  return null;
}

/**
 * Load intangible assets information
 */
async function loadIntangibleAssetsData() {
  try {
    const userEmail = localStorage.getItem('si_user_email');
    const res = await blockchainFetchWithTimeout('/api/blockchain/intangible-assets', {
      headers: { 'x-user-email': userEmail || '' }
    });
    const { parsed, text } = await blockchainSafeJson(res);
    
    if (!res.ok) {
      console.error('Failed to load intangible assets:', parsed?.error || text);
      return;
    }
    
    const data = parsed || { success: false };
    if (data.success) {
      console.log('Intangible assets data loaded');
    }
  } catch (error) {
    console.error('Error loading intangible assets:', error);
  }
}

/**
 * Load financial methodologies and frameworks
 */
async function loadFinancialMethodologies() {
  try {
    const userEmail = localStorage.getItem('si_user_email');
    const res = await blockchainFetchWithTimeout('/api/blockchain/financial-methodologies', {
      headers: { 'x-user-email': userEmail || '' }
    });
    const { parsed, text } = await blockchainSafeJson(res);
    
    if (!res.ok) {
      console.error('Failed to load methodologies:', parsed?.error || text);
      return;
    }
    
    const data = parsed || { success: false };
    if (data.success) {
      console.log('Financial methodologies loaded');
    }
  } catch (error) {
    console.error('Error loading methodologies:', error);
  }
}

/**
 * Load derivatives data
 */
async function loadDerivativesData() {
  try {
    const res = await blockchainFetchWithTimeout('/api/blockchain/derivatives');
    const { parsed, text } = await blockchainSafeJson(res);
    
    if (!res.ok) {
      console.error('Failed to load derivatives data:', parsed?.error || text);
      return;
    }
    
    const data = parsed || { success: false };
    if (data.success && data.strategies) {
      console.log('Derivatives strategies loaded:', data.strategies.length);
    }
  } catch (error) {
    console.error('Error loading derivatives data:', error);
  }
}

/**
 * Load intangible assets data
 */
async function loadIntangibleAssetsData() {
  try {
    const res = await blockchainFetchWithTimeout('/api/blockchain/intangible-assets');
    const { parsed, text } = await blockchainSafeJson(res);
    
    if (!res.ok) {
      console.error('Failed to load intangible assets:', parsed?.error || text);
      return;
    }
    
    const data = parsed || { success: false };
    if (data.success && data.assets) {
      console.log('Intangible assets loaded:', data.assets.length);
    }
  } catch (error) {
    console.error('Error loading intangible assets:', error);
  }
}

/**
 * Update market display with fresh data
 */
function updateMarketDisplay(data) {
  // Update NSE stats if available
  if (data.nseIndex) {
    const indexElement = document.querySelector('[data-stat="nse-index"]');
    if (indexElement) {
      indexElement.textContent = data.nseIndex;
    }
  }
  
  if (data.marketCap) {
    const capElement = document.querySelector('[data-stat="market-cap"]');
    if (capElement) {
      capElement.textContent = data.marketCap;
    }
  }
  
  // Update crypto prices if available
  if (data.cryptoPrices) {
    updateCryptoPrices(data.cryptoPrices);
  }
}

/**
 * Update cryptocurrency prices in the UI
 */
function updateCryptoPrices(prices) {
  const cryptoCards = document.querySelectorAll('.crypto-card');
  cryptoCards.forEach(card => {
    const name = card.querySelector('.crypto-name')?.textContent;
    const symbol = extractSymbol(name);
    
    if (prices[symbol]) {
      const priceInfo = card.querySelector('.crypto-info');
      const price = prices[symbol];
      if (priceInfo) {
        const currentPrice = priceInfo.innerHTML;
        priceInfo.innerHTML = `<strong>Price:</strong> ${price}<br>${currentPrice}`;
      }
    }
  });
}

/**
 * Extract symbol from crypto name
 */
function extractSymbol(cryptoName) {
  if (!cryptoName) return '';
  const match = cryptoName.match(/\(([^)]+)\)/);
  return match ? match[1] : '';
}

/**
 * Load forum data
 */
async function loadForumData() {
  try {
    const res = await blockchainFetchWithTimeout('/api/blockchain/forum-threads');
    const { parsed, text } = await blockchainSafeJson(res);
    
    if (!res.ok) {
      console.error('Failed to load forum data:', parsed?.error || text);
      return;
    }
    
    const data = parsed || { success: false };
    
    if (data.success && data.threads) {
      // Forum data loaded; in production, you'd display it dynamically
      console.log('Forum threads loaded:', data.threads.length);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Forum data request timed out');
    } else {
      console.error('Error loading forum data:', error);
    }
  }
}

/**
 * Logout user
 */
function logout() {
  try {
    localStorage.removeItem('si_user_email');
    localStorage.removeItem('si_user_premium');
    localStorage.removeItem('si_user_token');
    window.location.href = '/index.html';
  } catch (e) {
    console.error('Logout error:', e);
    window.location.href = '/index.html';
  }
}

/**
 * Track blockchain dashboard view for analytics
 */
async function trackDashboardView() {
  try {
    const userEmail = localStorage.getItem('si_user_email');
    if (userEmail) {
      await blockchainFetchWithTimeout('/api/analytics/blockchain-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
    }
  } catch (error) {
    // Silent fail for analytics
    console.log('Analytics tracking skipped');
  }
}

/**
 * Initialize on page load
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await trackDashboardView();
    await initializeBlockchainDashboard();
  });
} else {
  trackDashboardView().catch(console.log);
  initializeBlockchainDashboard().catch(console.error);
}
