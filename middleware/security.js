/**
 * SmartInvest Security & Rate Limiting Middleware
 * Enterprise-grade security features: DDoS protection, rate limiting, IP blocking
 */

const fs = require('fs');
const path = require('path');

// Configuration
const RATE_LIMIT_CONFIG = {
  // API endpoints rate limits (requests per window)
  api: {
    windowMs: 60000, // 1 minute
    maxRequests: 60,
    blockDuration: 300000 // 5 minutes
  },
  // Login rate limits
  login: {
    windowMs: 300000, // 5 minutes
    maxRequests: 5,
    blockDuration: 900000 // 15 minutes
  },
  // Admin endpoints
  admin: {
    windowMs: 60000,
    maxRequests: 100,
    blockDuration: 600000 // 10 minutes
  },
  // Payment endpoints
  payment: {
    windowMs: 300000,
    maxRequests: 10,
    blockDuration: 1800000 // 30 minutes
  }
};

// In-memory rate limit storage (use Redis in production)
const rateLimitStore = new Map();
const blockedIPs = new Map();

// Paths for persistent storage
const BLOCKED_IPS_PATH = path.join(__dirname, '../data/blocked-ips.json');
const SECURITY_LOG_PATH = path.join(__dirname, '../data/security-log.json');

/**
 * Helper: Read JSON file
 */
function readJSON(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

/**
 * Helper: Write JSON file
 */
function writeJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

/**
 * Helper: Get client IP
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         'unknown';
}

/**
 * Helper: Log security event
 */
function logSecurityEvent(type, ip, details = {}) {
  const log = readJSON(SECURITY_LOG_PATH, { events: [] });
  
  log.events.push({
    timestamp: new Date().toISOString(),
    type,
    ip,
    details
  });

  // Keep only last 50000 events
  if (log.events.length > 50000) {
    log.events = log.events.slice(-50000);
  }

  writeJSON(SECURITY_LOG_PATH, log);
}

/**
 * Check if IP is blocked
 */
function isIPBlocked(ip) {
  // Check in-memory blocked IPs
  if (blockedIPs.has(ip)) {
    const blockInfo = blockedIPs.get(ip);
    if (Date.now() < blockInfo.until) {
      return true;
    } else {
      blockedIPs.delete(ip);
    }
  }

  // Check persistent blocked IPs
  const persistentBlocked = readJSON(BLOCKED_IPS_PATH, { ips: {} });
  if (persistentBlocked.ips[ip]) {
    const blockInfo = persistentBlocked.ips[ip];
    if (blockInfo.permanent || Date.now() < new Date(blockInfo.until).getTime()) {
      return true;
    }
  }

  return false;
}

/**
 * Block IP address
 */
function blockIP(ip, duration = null, reason = 'Rate limit exceeded') {
  const until = duration ? Date.now() + duration : null;
  
  blockedIPs.set(ip, {
    until,
    reason,
    timestamp: new Date().toISOString()
  });

  // Log the block
  logSecurityEvent('ip-blocked', ip, { reason, duration });

  // Persist if permanent or long-duration
  if (!duration || duration > 3600000) {
    const persistentBlocked = readJSON(BLOCKED_IPS_PATH, { ips: {} });
    persistentBlocked.ips[ip] = {
      until: until ? new Date(until).toISOString() : null,
      permanent: !until,
      reason,
      timestamp: new Date().toISOString()
    };
    writeJSON(BLOCKED_IPS_PATH, persistentBlocked);
  }
}

/**
 * Unblock IP address
 */
function unblockIP(ip, reason = 'Admin authorized') {
  if (!ip) return false;
  if (blockedIPs.has(ip)) {
    blockedIPs.delete(ip);
  }
  const persistentBlocked = readJSON(BLOCKED_IPS_PATH, { ips: {} });
  if (persistentBlocked.ips[ip]) {
    delete persistentBlocked.ips[ip];
    writeJSON(BLOCKED_IPS_PATH, persistentBlocked);
  }
  logSecurityEvent('ip-unblocked', ip, { reason });
  return true;
}

/**
 * Rate Limiting Middleware Factory
 */
function createRateLimiter(type = 'api') {
  const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.api;

  return function rateLimiter(req, res, next) {
    const ip = getClientIP(req);

    // Check if IP is blocked
    if (isIPBlocked(ip)) {
      logSecurityEvent('blocked-request', ip, { url: req.url, method: req.method });
      return res.status(403).json({
        success: false,
        error: 'Access denied. IP address blocked due to security policy.'
      });
    }

    // Rate limiting logic
    const key = `${type}:${ip}`;
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, {
        requests: [],
        blocked: false,
        blockUntil: null
      });
    }

    const record = rateLimitStore.get(key);

    // Check if temporarily blocked
    if (record.blocked && now < record.blockUntil) {
      const remainingTime = Math.ceil((record.blockUntil - now) / 1000);
      logSecurityEvent('rate-limit-hit', ip, { 
        url: req.url, 
        remainingTime,
        type 
      });
      
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Try again in ${remainingTime} seconds.`,
        retryAfter: remainingTime
      });
    }

    // Clear block if expired
    if (record.blocked && now >= record.blockUntil) {
      record.blocked = false;
      record.requests = [];
    }

    // Filter out old requests outside the window
    record.requests = record.requests.filter(timestamp => 
      now - timestamp < config.windowMs
    );

    // Check if limit exceeded
    if (record.requests.length >= config.maxRequests) {
      record.blocked = true;
      record.blockUntil = now + config.blockDuration;
      
      logSecurityEvent('rate-limit-exceeded', ip, { 
        url: req.url,
        requests: record.requests.length,
        type 
      });

      // Block IP if excessive violations
      if (record.violations === undefined) {
        record.violations = 1;
      } else {
        record.violations++;
        if (record.violations >= 3) {
          blockIP(ip, 3600000, 'Multiple rate limit violations');
        }
      }

      const remainingTime = Math.ceil(config.blockDuration / 1000);
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Blocked for ${remainingTime} seconds.`,
        retryAfter: remainingTime
      });
    }

    // Add current request
    record.requests.push(now);
    rateLimitStore.set(key, record);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', config.maxRequests - record.requests.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString());

    next();
  };
}

/**
 * Security Headers Middleware
 */
function securityHeaders(req, res, next) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

/**
 * Input Validation Middleware
 */
function validateInput(req, res, next) {
  const ip = getClientIP(req);

  // Check for common attack patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /\.\.\//,
    /union.*select/i,
    /base64/i,
    /eval\(/i,
    /exec\(/i
  ];

  const checkString = (str) => {
    if (typeof str !== 'string') return false;
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (checkString(key) || checkString(obj[key])) {
        return true;
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkObject(obj[key])) return true;
      }
    }
    return false;
  };

  // Check query parameters
  if (checkObject(req.query)) {
    logSecurityEvent('suspicious-input', ip, { 
      type: 'query',
      url: req.url 
    });
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected'
    });
  }

  // Check body
  if (req.body && checkObject(req.body)) {
    logSecurityEvent('suspicious-input', ip, { 
      type: 'body',
      url: req.url 
    });
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected'
    });
  }

  next();
}

/**
 * CORS Configuration
 */
function configureCORS(allowedOrigins = []) {
  return function cors(req, res, next) {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

/**
 * Request Logging Middleware
 */
function requestLogger(req, res, next) {
  const ip = getClientIP(req);
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log only errors and slow requests
    if (res.statusCode >= 400 || duration > 1000) {
      logSecurityEvent('request', ip, {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        userAgent: req.headers['user-agent']
      });
    }
  });

  next();
}

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (!record.blocked && record.requests.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimits, 300000);

module.exports = {
  createRateLimiter,
  securityHeaders,
  validateInput,
  configureCORS,
  requestLogger,
  isIPBlocked,
  blockIP,
  unblockIP,
  logSecurityEvent,
  getClientIP
};
