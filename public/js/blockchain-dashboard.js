/**
 * Blockchain Investment Dashboard Handler
 * Manages premium access, data loading, advanced analytics, and interactive features
 * Enhanced with caching, real-time updates, and comprehensive financial metrics
 */

const BLOCKCHAIN_TIMEOUT_MS = 15000;
const CACHE_DURATION_MS = 300000; // 5 minutes
const MARKET_DATA_CACHE = 'blockchain_market_cache';
const PORTFOLIO_DATA_CACHE = 'blockchain_portfolio_cache';
const RISK_METRICS_CACHE = 'blockchain_risk_cache';

// Performance monitoring
const performanceMetrics = {
  apiCalls: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageResponseTime: 0
};

// WebSocket connection for real-time data
let wsConnection = null;
let wsReconnectAttempts = 0;
const MAX_WS_RECONNECT_ATTEMPTS = 5;

/**
 * Fetch with timeout wrapper for blockchain dashboard
 */
async function blockchainFetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BLOCKCHAIN_TIMEOUT_MS);
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    // Track performance
    performanceMetrics.apiCalls++;
    const responseTime = Date.now() - startTime;
    performanceMetrics.averageResponseTime = 
      (performanceMetrics.averageResponseTime + responseTime) / 2;
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Cache management utilities
 */
const cacheManager = {
  set: function(key, data, duration = CACHE_DURATION_MS) {
    try {
      const cacheEntry = {
        data: data,
        timestamp: Date.now(),
        expires: Date.now() + duration
      };
      localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  },
  
  get: function(key) {
    try {
      const cached = localStorage.getItem(key);
      i inf (!cached) {
        performanceMetrics.cacheMisses++;
        return null;
      }
      
      const entry = JSON.parse(cached);
      if (Date.now() > entry.expires) {
        localStorage.removeItem(key);
        performanceMetrics.cacheMisses++;
        return null;
      }
      
      performanceMetrics.cacheHits++;
      return entry.data;
    } catch (e) {
      console.warn('Cache read error:', e);
      return null;
    }
  },
  
  clear: function(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Cache clear error:', e);
    }
  },
  
  clearAll: function() {
    const keys = [MARKET_DATA_CACHE, PORTFOLIO_DATA_CACHE, RISK_METRICS_CACHE];
    keys.forEach(key => this.clear(key));
  }
};

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
    // Check cache first
    const cached = cacheManager.get(MARKET_DATA_CACHE);
    if (cached) {
      console.log('Market data loaded from cache');
      updateMarketDisplay(cached.data);
      return;
    }
    
    const res = await blockchainFetchWithTimeout('/api/blockchain/market-data');
    const { parsed, text } = await blockchainSafeJson(res);
    
    if (!res.ok) {
      console.error('Failed to load market data:', parsed?.error || text);
      return;
    }
    
    const data = parsed || { success: false };
    
    if (data.success && data.data) {
      // Cache the data
      cacheManager.set(MARKET_DATA_CACHE, data);
      updateMarketDisplay(data.data);
      console.log('Market data loaded and cached');
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
 * Advanced Analytics Functions
 */
const analytics = {
  /**
   * Calculate portfolio Value at Risk (VaR)
   * @param {Array} returns - Historical returns
   * @param {number} confidence - Confidence level (0.95, 0.99)
   * @returns {number} VaR value
   */
  calculateVaR: function(returns, confidence = 0.95) {
    if (!returns || returns.length === 0) return 0;
    const sorted = returns.slice().sort((a, b) => a - b);
    const index = Math.floor(sorted.length * (1 - confidence));
    return sorted[index];
  },
  
  /**
   * Calculate Sharpe Ratio
   * @param {number} returnValue - Portfolio return
   * @param {number} riskFreeRate - Risk-free rate (e.g., 0.02)
   * @param {number} volatility - Standard deviation of returns
   * @returns {number} Sharpe ratio
   */
  calculateSharpeRatio: function(returnValue, riskFreeRate = 0.02, volatility) {
    if (!volatility || volatility === 0) return 0;
    return (returnValue - riskFreeRate) / volatility;
  },
  
  /**
   * Calculate portfolio standard deviation (volatility)
   * @param {Array} returns - Historical returns
   * @returns {number} Standard deviation
   */
  calculateVolatility: function(returns) {
    if (!returns || returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance);
  },
  
  /**
   * Calculate correlation between two assets
   * @param {Array} returns1 - First asset returns
   * @param {Array} returns2 - Second asset returns
   * @returns {number} Correlation coefficient
   */
  calculateCorrelation: function(returns1, returns2) {
    if (!returns1 || !returns2 || returns1.length === 0) return 0;
    const n = Math.min(returns1.length, returns2.length);
    const mean1 = returns1.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const mean2 = returns2.slice(0, n).reduce((a, b) => a + b, 0) / n;
    
    let covariance = 0;
    let variance1 = 0;
    let variance2 = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;
      covariance += diff1 * diff2;
      variance1 += diff1 * diff1;
      variance2 += diff2 * diff2;
    }
    
    const stdDev1 = Math.sqrt(variance1 / n);
    const stdDev2 = Math.sqrt(variance2 / n);
    
    if (stdDev1 === 0 || stdDev2 === 0) return 0;
    return (covariance / n) / (stdDev1 * stdDev2);
  },
  
  /**
   * Calculate Expected Shortfall (CVaR)
   * @param {Array} returns - Historical returns
   * @param {number} confidence - Confidence level
   * @returns {number} Expected shortfall value
   */
  calculateExpectedShortfall: function(returns, confidence = 0.95) {
    if (!returns || returns.length === 0) return 0;
    const sorted = returns.slice().sort((a, b) => a - b);
    const index = Math.floor(sorted.length * (1 - confidence));
    const worstReturns = sorted.slice(0, index);
    return worstReturns.reduce((a, b) => a + b, 0) / worstReturns.length;
  },
  
  /**
   * Calculate Sortino Ratio (downside risk adjusted)
   * @param {number} returnValue - Portfolio return
   * @param {number} targetReturn - Target/minimum acceptable return
   * @param {Array} returns - Historical returns
   * @returns {number} Sortino ratio
   */
  calculateSortinoRatio: function(returnValue, targetReturn, returns) {
    if (!returns || returns.length === 0) return 0;
    const downsideReturns = returns.filter(r => r < targetReturn);
    if (downsideReturns.length === 0) return Infinity;
    
    const downvariance = downsideReturns.reduce((sum, val) => 
      sum + Math.pow(Math.min(val - targetReturn, 0), 2), 0) / downsideReturns.length;
    const downsideDeviation = Math.sqrt(downvariance);
    
    if (downsideDeviation === 0) return Infinity;
    return (returnValue - targetReturn) / downsideDeviation;
  },
  
  /**
   * Calculate Treynor Ratio (beta-adjusted returns)
   * @param {number} returnValue - Portfolio return
   * @param {number} riskFreeRate - Risk-free rate
   * @param {number} beta - Portfolio beta
   * @returns {number} Treynor ratio
   */
  calculateTreynorRatio: function(returnValue, riskFreeRate, beta) {
    if (!beta || beta === 0) return 0;
    return (returnValue - riskFreeRate) / beta;
  }
};

/**
 * Load portfolio risk metrics
 */
async function loadPortfolioRiskMetrics() {
  try {
    // Check cache first
    const cached = cacheManager.get(RISK_METRICS_CACHE);
    if (cached) {
      console.log('Risk metrics loaded from cache');
      return cached;
    }
    
    const userEmail = localStorage.getItem('si_user_email');
    const res = await blockchainFetchWithTimeout('/api/blockchain/risk-metrics', {
      headers: { 'x-user-email': userEmail || '' }
    });
    const { parsed, text } = await blockchainSafeJson(res);
    
    if (!res.ok) {
      console.error('Failed to load risk metrics:', parsed?.error || text);
      return null;
    }
    
    const data = parsed || { success: false };
    if (data.success) {
      cacheManager.set(RISK_METRICS_CACHE, data);
      console.log('Risk metrics loaded and cached');
      return data;
    }
  } catch (error) {
    console.error('Error loading risk metrics:', error);
  }
  return null;
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
 * WebSocket Real-time Data Connection
 */
function initializeWebSocket() {
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws/market-prices`;
    
    wsConnection = new WebSocket(wsUrl);
    
    wsConnection.onopen = () => {
      console.log('WebSocket connected for real-time market data');
      wsReconnectAttempts = 0;
      
      // Send subscription for market data
      const userEmail = localStorage.getItem('si_user_email');
      wsConnection.send(JSON.stringify({
        type: 'subscribe',
        email: userEmail,
        channels: ['market-prices', 'derivatives', 'portfolio-updates']
      }));
    };
    
    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleRealtimeUpdate(data);
      } catch (e) {
        console.error('WebSocket message parse error:', e);
      }
    };
    
    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsConnection.onclose = () => {
      console.log('WebSocket disconnected, attempting reconnect...');
      attemptWebSocketReconnect();
    };
  } catch (error) {
    console.error('WebSocket initialization error:', error);
  }
}

/**
 * Attempt WebSocket reconnection with exponential backoff
 */
function attemptWebSocketReconnect() {
  if (wsReconnectAttempts < MAX_WS_RECONNECT_ATTEMPTS) {
    wsReconnectAttempts++;
    const backoffDelay = Math.min(1000 * Math.pow(2, wsReconnectAttempts), 30000);
    console.log(`Reconnecting WebSocket in ${backoffDelay}ms (attempt ${wsReconnectAttempts}/${MAX_WS_RECONNECT_ATTEMPTS})`);
    
    setTimeout(() => {
      initializeWebSocket();
    }, backoffDelay);
  } else {
    console.warn('Max WebSocket reconnection attempts reached');
  }
}

/**
 * Handle real-time data updates from WebSocket
 */
function handleRealtimeUpdate(data) {
  switch(data.type) {
    case 'market-price-update':
      updateCryptoPriceRealtime(data.payload);
      break;
    case 'derivatives-update':
      updateDerivativesPricing(data.payload);
      break;
    case 'portfolio-update':
      updatePortfolioDisplay(data.payload);
      break;
    default:
      console.log('Unknown WebSocket message type:', data.type);
  }
}

/**
 * Update crypto price in real-time
 */
function updateCryptoPriceRealtime(payload) {
  const cryptoCards = document.querySelectorAll('.crypto-card');
  cryptoCards.forEach(card => {
    const name = card.querySelector('.crypto-name')?.textContent;
    const symbol = extractSymbol(name);
    
    if (payload.symbol === symbol) {
      const priceElement = card.querySelector('[data-price]');
      if (priceElement) {
        priceElement.textContent = payload.price;
        priceElement.classList.add('price-updated');
        setTimeout(() => priceElement.classList.remove('price-updated'), 1000);
      }
    }
  });
}

/**
 * Update derivatives pricing
 */
function updateDerivativesPricing(payload) {
  console.log('Derivatives updated:', payload);
  // Update derivatives data in UI
}

/**
 * Update portfolio display
 */
function updatePortfolioDisplay(payload) {
  console.log('Portfolio updated:', payload);
  // Update portfolio data in UI
}

/**
 * Logout user and cleanup resources
 */
function logout() {
  try {
    // Close WebSocket connection
    if (wsConnection) {
      wsConnection.close();
    }
    
    // Clear cache
    cacheManager.clearAll();
    
    // Clear localStorage
    localStorage.removeItem('si_user_email');
    localStorage.removeItem('si_user_premium');
    localStorage.removeItem('si_user_token');
    
    window.location.href = '/index.html';
  } catch (e) {
    console.error('Logout error:', e);
    window.location.href = '/index.html';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await trackDashboardView();
    await initializeBlockchainDashboard();
    
    // Initialize WebSocket for real-time updates (optional, graceful degradation)
    try {
      initializeWebSocket();
    } catch (e) {
      console.log('WebSocket unavailable, using polling mode');
    }
  });
} else {
  trackDashboardView().catch(console.log);
  initializeBlockchainDashboard().catch(console.error);
  
  try {
    initializeWebSocket();
  } catch (e) {
    console.log('WebSocket unavailable, using polling mode');
  }
}
