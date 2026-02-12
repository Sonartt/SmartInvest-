# SmartInvest: Critical Security Implementation Plan
**Status:** READY FOR IMPLEMENTATION  
**Phase:** 1 (CRITICAL) - Implement within 1-2 weeks  
**Effort:** ~6-8 hours  
**Date:** February 11, 2026

---

## 🎯 Overview

This document contains **production-ready code patches** to fix all Phase 1 critical security issues. Each fix includes:
- Problem statement
- Current vulnerable code
- Fixed code
- Testing instructions
- Estimated effort

---

## 📋 Implementation Checklist

- [ ] Fix #1: JWT Secret Validation (30 min)
- [ ] Fix #2: Add Helmet.js Security Headers (30 min)
- [ ] Fix #3: CORS Whitelist (30 min)
- [ ] Fix #4: Request Body Size Limits (20 min)
- [ ] Fix #5: Admin Rate Limiting (1-2 hrs)
- [ ] Fix #6: Input Validation Middleware (2-3 hrs)
- [ ] Fix #7: Error Message Sanitization (1 hr)
- [ ] Testing & Verification (1-2 hrs)

**Total Time:** ~6-8 hours

---

## 🔧 FIX #1: JWT Secret Validation (30 min)

### Current Code (VULNERABLE)
Location: `server.js` lines 18-21
```javascript
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('⚠️  JWT_SECRET not set in .env — using insecure fallback');
  return 'INSECURE-DEV-SECRET-CHANGE-ME';
})();
```

### Fixed Code
```javascript
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // In production, REQUIRE JWT_SECRET to be set and valid
  if (nodeEnv === 'production' || process.env.ENFORCE_STRICT_JWT === 'true') {
    if (!secret) {
      throw new Error('CRITICAL: JWT_SECRET must be set in .env for production');
    }
    if (secret === 'INSECURE-DEV-SECRET-CHANGE-ME' || secret.length < 32) {
      throw new Error('CRITICAL: JWT_SECRET must be at least 32 random characters and not be the default value');
    }
    return secret;
  }
  
  // In development, allow fallback but warn
  if (!secret) {
    console.warn('⚠️ WARNING: JWT_SECRET not set in .env — using insecure fallback (DEV ONLY)');
    return 'INSECURE-DEV-SECRET-CHANGE-ME';
  }
  
  return secret;
})();
```

### Testing
```bash
# Test 1: Should fail without JWT_SECRET in production
NODE_ENV=production npm start
# Expected: Error about missing JWT_SECRET

# Test 2: Should fail with default value in production
NODE_ENV=production JWT_SECRET=INSECURE-DEV-SECRET-CHANGE-ME npm start
# Expected: Error about default secret value

# Test 3: Should work with valid secret in production
NODE_ENV=production JWT_SECRET=your-32-character-random-secret-here npm start
# Expected: Server starts successfully
```

---

## 🔧 FIX #2: Add Helmet.js Security Headers (30 min)

### Current Code (MISSING)
Location: `server.js` lines 1-12
```javascript
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
```

### Fixed Code
Add helmet dependency first:
```bash
npm install helmet
```

Then update server.js:
```javascript
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Apply Helmet FIRST, before any other middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // Keep unsafe-inline if needed for existing scripts
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  strictTransportSecurity: { 
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameGuard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

app.use(cors());
```

### Testing
```bash
# Test: Verify security headers are set
curl -i http://localhost:3000/api/health

# Expected response headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
```

---

## 🔧 FIX #3: CORS Whitelist (30 min)

### Current Code (VULNERABLE)
Location: `server.js` line 13
```javascript
app.use(cors());  // Allows ALL origins!
```

### Fixed Code
```javascript
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400  // 24 hours
};

app.use(cors(corsOptions));
```

### Update .env
```env
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000,https://yourdomain.com
```

### Testing
```bash
# Test 1: Allowed origin should work
curl -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3000/api/health -v
# Expected: CORS headers present

# Test 2: Disallowed origin should fail
curl -H "Origin: http://evil.com" \
  -X GET http://localhost:3000/api/health -v
# Expected: CORS error
```

---

## 🔧 FIX #4: Request Body Size Limits (20 min)

### Current Code (VULNERABLE)
Location: `server.js` line 15
```javascript
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
```

### Fixed Code
```javascript
// Limit request body size to prevent DoS
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

// Also set limit on raw body parser if used
app.use(express.raw({ limit: '1mb' }));
```

### Testing
```bash
# Test: Try to send 2MB payload
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d "$(printf '{\"text\":"%0.s#"{1..2000000}"}' )" \
  2>/dev/null | head -20

# Expected: 413 Payload Too Large error
```

---

## 🔧 FIX #5: Admin Rate Limiting (1-2 hours)

### Current Code (VULNERABLE)
Location: `server.js` lines 59-87
```javascript
function adminAuth(req, res, next) {
  // NO RATE LIMITING - can attempt unlimited logins
  const auth = (req.headers.authorization || '').toString();
  if (auth && auth.startsWith('Basic ')) {
    const creds = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8');
    const [user, pass] = creds.split(':');
    if (user === adminUserEnv && pass === adminPassEnv) {
      // Success - no failed attempt tracking
    }
  }
}
```

### Fixed Code
Add to top of server.js after requires:
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

// Create in-memory store for failed attempts
const failedAttempts = new Map();

// Rate limiter for admin endpoints (10 attempts per 15 minutes)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 requests per windowMs
  keyGenerator: (req) => {
    // Rate limit by IP address
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    return res.status(429).json({
      error: 'Too many login attempts. Please try again later.'
    });
  },
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
});

// Enhanced admin authentication with rate limiting
function adminAuth(req, res, next) {
  // Check rate limit first
  const clientIp = req.ip || req.connection.remoteAddress;
  const attemptKey = `admin-${clientIp}`;
  const attempts = failedAttempts.get(attemptKey) || { count: 0, resetTime: Date.now() + 15*60*1000 };
  
  // Reset if time window expired
  if (Date.now() > attempts.resetTime) {
    failedAttempts.delete(attemptKey);
    attempts = { count: 0, resetTime: Date.now() + 15*60*1000 };
  }
  
  // Block if too many failed attempts
  if (attempts.count >= 5) {
    return res.status(429).json({
      error: 'Too many failed login attempts. Try again later.'
    });
  }

  const adminUserEnv = process.env.ADMIN_USER;
  const adminPassEnv = process.env.ADMIN_PASS;
  
  if (!adminUserEnv || !adminPassEnv) {
    return res.status(500).json({ error: 'Admin authentication not configured' });
  }
  
  const payload = verifyTokenFromReq(req);
  if (payload && payload.admin) {
    req.user = { email: payload.email, admin: true };
    failedAttempts.delete(attemptKey);  // Clear failed attempts on success
    return next();
  }

  const auth = (req.headers.authorization || '').toString();
  if (auth && auth.startsWith('Basic ')) {
    const creds = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8');
    const [user, pass] = creds.split(':');
    if (user === adminUserEnv && pass === adminPassEnv) {
      req.user = { email: user, admin: true };
      failedAttempts.delete(attemptKey);  // Clear on success
      return next();
    }
    
    // Track failed attempt
    attempts.count++;
    failedAttempts.set(attemptKey, attempts);
    
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).end('Unauthorized');
  }

  // Track failed attempt
  attempts.count++;
  failedAttempts.set(attemptKey, attempts);

  return res.status(401).json({ error: 'Unauthorized: admin access required' });
}

// APPLY rate limiter to admin routes
// Add this line before defining admin routes:
app.use('/api/admin/', adminLimiter);
```

### Testing
```bash
# Test: Try 11 login attempts in quick succession
for i in {1..15}; do
  curl -u admin@example.com:wrongpass \
    http://localhost:3000/api/admin/verify-access 2>/dev/null
  echo "Attempt $i"
  sleep 1
done

# Expected: First 10 should return 401, 11+ should return 429
```

---

## 🔧 FIX #6: Input Validation Middleware (2-3 hours)

### Create Validators File

Create new file: `lib/validators.js`
```javascript
/**
 * Input Validation Middleware
 * Prevents XSS, injection, malformed data
 */

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && 
         email.length <= 254 && 
         emailRegex.test(email);
}

// Phone number validation (E.164 format)
function isValidPhone(phone) {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return typeof phone === 'string' && phoneRegex.test(phone);
}

// Amount validation (positive number, max 2 decimals, reasonable limit)
function isValidAmount(amount, min = 0, max = 10000000) {
  const num = Number(amount);
  return !isNaN(num) && 
         num >= min && 
         num <= max && 
         Number.isFinite(num);
}

// String validation (no null bytes, length limits)
function isValidString(str, minLength = 1, maxLength = 5000) {
  return typeof str === 'string' &&
         str.length >= minLength &&
         str.length <= maxLength &&
         !str.includes('\0');
}

// Password validation
function isValidPassword(password) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return typeof password === 'string' && passwordRegex.test(password);
}

// Account reference validation
function isValidAccountRef(ref) {
  // Alphanumeric + hyphen/underscore, 1-50 chars
  const refRegex = /^[a-zA-Z0-9_-]{1,50}$/;
  return typeof ref === 'string' && refRegex.test(ref);
}

// Filename validation (prevent path traversal)
function isValidFilename(filename) {
  // No path separators, null bytes, win reserved names
  const invalid = ['..', '/', '\\', '\0', 'CON', 'PRN', 'AUX', 'NUL'];
  const name = (filename || '').toLowerCase();
  return !invalid.some(pattern => name.includes(pattern)) &&
         filename.length > 0 &&
         filename.length <= 255;
}

// MIME type validation
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel'
];

function isValidMimeType(mimeType) {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidAmount,
  isValidString,
  isValidPassword,
  isValidAccountRef,
  isValidFilename,
  isValidMimeType
};
```

### Apply Validators to Endpoints

Update `server.js` - Add at top:
```javascript
const validators = require('./lib/validators');
```

#### Validate /api/pay/mpesa Endpoint

Location: `server.js` line 118
```javascript
// OLD - NO VALIDATION
app.post('/api/pay/mpesa', async (req, res) => {
  try {
    const { phone, accountReference } = req.body || {};
    const amount = Number(req.body && req.body.amount) || 1000;
    if (!phone) return res.status(400).json({ error: 'phone required' });
    // ... no further validation
  } catch (err) {
    console.error('mpesa error', err.message);
    return res.status(500).json({ error: err.message });  // Leaks error details!
  }
});
```

```javascript
// NEW - WITH VALIDATION
app.post('/api/pay/mpesa', async (req, res) => {
  try {
    const { phone, accountReference } = req.body || {};
    let amount = Number(req.body && req.body.amount);

    // Validate inputs
    if (!phone) {
      return res.status(400).json({ error: 'phone field is required' });
    }
    if (!validators.isValidPhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    if (!validators.isValidAmount(amount, 1, 1000000)) {
      return res.status(400).json({ error: 'Amount must be between 1 and 1,000,000' });
    }
    if (accountReference && !validators.isValidAccountRef(accountReference)) {
      return res.status(400).json({ error: 'Invalid account reference format' });
    }

    const token = await getMpesaAuth();
    const shortcode = process.env.MPESA_NUMBER || process.env.MPESA_SHORTCODE || process.env.MPESA_PAYBILL;
    if (!shortcode) throw new Error('M-Pesa payment gateway not configured');
    // ... rest of implementation
  } catch (err) {
    console.error('mpesa error', err.message);
    // Don't expose error details to client
    return res.status(500).json({ 
      error: 'Payment processing failed. Please try again or contact support.',
      // Only in development:
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
```

#### Validate /api/auth/signup Endpoint

Location: `server.js` line 289
```javascript
// NEW - WITH VALIDATION
app.post('/api/auth/signup', bodyParser.json(), (req, res) => {
  try {
    const { email, password, name } = req.body || {};

    // Validate inputs
    if (!email || !validators.isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!password || !validators.isValidPassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
      });
    }
    if (name && !validators.isValidString(name, 2, 100)) {
      return res.status(400).json({ error: 'Name must be between 2 and 100 characters' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // ... rest of implementation
  } catch (err) {
    console.error('signup error', err.message);
    return res.status(500).json({ 
      error: 'Signup failed. Please try again or contact support.',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
```

### Testing
```bash
# Test 1: Invalid email should fail
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"ValidPass1!"}'
# Expected: 400 Invalid email format

# Test 2: Invalid phone for M-Pesa
curl -X POST http://localhost:3000/api/pay/mpesa \
  -H "Content-Type: application/json" \
  -d '{"phone":"123","amount":1000}'
# Expected: 400 Invalid phone number format

# Test 3: Valid input should succeed
curl -X POST http://localhost:3000/api/pay/mpesa \
  -H "Content-Type: application/json" \
  -d '{"phone":"+254700000000","amount":500}'
# Expected: 200 or valid error about gateway
```

---

## 🔧 FIX #7: Error Message Sanitization (1 hour)

### Create Sanitizer File

Create new file: `lib/sanitizer.js`
```javascript
/**
 * Error Message Sanitization
 * Prevents credential and sensitive information leaks
 */

const SENSITIVE_PATTERNS = [
  /password[^:]*:/gi,
  /secret[^:]*:/gi,
  /token[^:]*:/gi,
  /api[_-]?key[^:]*:/gi,
  /authorization[^:]*:/gi,
  /bearer\s+\S+/gi,
  /basic\s+\S+/gi
];

/**
 * Sanitize error messages to prevent information leakage
 * @param {string} message - Error message to sanitize
 * @returns {string} Sanitized error message
 */
function sanitizeError(message) {
  let sanitized = message;
  
  // Remove sensitive patterns
  SENSITIVE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]:');
  });
  
  // Remove common sensitive field names
  sanitized = sanitized
    .replace(/password[^,}]*/gi, '[REDACTED]')
    .replace(/secret[^,}]*/gi, '[REDACTED]')
    .replace(/token[^,}]*/gi, '[REDACTED]')
    .replace(/api[-_]?key[^,}]*/gi, '[REDACTED]')
    .replace(/auth[^,}]*/gi, '[REDACTED]');
  
  return sanitized;
}

/**
 * General error handler middleware
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Build response
  const response = {
    error: isDevelopment ? sanitizeError(err.message) : 'Internal server error',
  };
  
  // In development, include stack trace (sanitized)
  if (isDevelopment && err.stack) {
    response.stack = sanitizeError(err.stack).split('\n');
  }
  
  // Log the real error internally
  console.error(`[${new Date().toISOString()}] Error:`, {
    path: req.path,
    method: req.method,
    statusCode,
    message: err.message,
    stack: err.stack
  });
  
  return res.status(statusCode).json(response);
}

module.exports = {
  sanitizeError,
  errorHandler
};
```

### Apply to server.js

Add to end of server.js (before app.listen):
```javascript
const sanitizer = require('./lib/sanitizer');

// Apply error handler middleware
app.use(sanitizer.errorHandler);
```

Update all error responses to use sanitizer:
```javascript
// Example update - find and replace error responses
// OLD:
return res.status(500).json({ error: err.message });

// NEW:
return res.status(500).json({ 
  error: 'Operation failed. Please try again or contact support.',
  debug: process.env.NODE_ENV === 'development' ? err.message : undefined
});
```

### Testing
```bash
# Test: Try to trigger an error and check for credential leaks
curl -X POST http://localhost:3000/api/pay/mpesa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer secret_token_12345" \
  -d '{"phone":"invalid","amount":"invalid"}'

# Check response - should NOT contain any credentials or secrets
```

---

## ✅ VERIFICATION CHECKLIST

After implementing all 7 fixes, verify:

### Security Headers
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Strict-Transport-Security present
- [ ] Content-Security-Policy configured

### Authentication & Rate Limiting
- [ ] JWT_SECRET required in production
- [ ] Admin endpoint has rate limiting
- [ ] Failed login attempts tracked
- [ ] Rate limit message returns 429 status

### Input Validation
- [ ] Email validation active
- [ ] Phone validation active
- [ ] Amount validation active
- [ ] Filename validation active

### Error Handling
- [ ] No credentials in error messages
- [ ] No stack traces in production errors
- [ ] Development mode shows debug info
- [ ] 500 errors log internally, return generic message

### CORS
- [ ] Only whitelisted origins allowed
- [ ] Credentials handled properly
- [ ] Preflight requests work

### Body Size Limits
- [ ] Requests >1MB rejected with 413
- [ ] Normal requests work fine

---

## 📊 Progress Tracking

Use this template to track implementation:

```
Date: [Date]
Developer: [Name]
Time Spent: [Hours]

Fixes Completed:
- [x] Fix #1: JWT Secret Validation (30 min)
- [ ] Fix #2: Helmet.js (30 min)
- [ ] Fix #3: CORS Whitelist (30 min)
- [ ] Fix #4: Body Size Limits (20 min)
- [ ] Fix #5: Admin Rate Limiting (1-2 hrs)
- [ ] Fix #6: Input Validation (2-3 hrs)
- [ ] Fix #7: Error Sanitization (1 hr)

Testing:
- [ ] Manual testing completed
- [ ] All endpoints tested
- [ ] Security headers verified
- [ ] Rate limiting tested

Issues Found:
- [Issue description]

Next Steps:
- [Action item]
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All 7 fixes implemented
- [ ] Tests passed
- [ ] .env configured with: JWT_SECRET, ADMIN_USER, ADMIN_PASS, ALLOWED_ORIGINS
- [ ] NODE_ENV=production set
- [ ] SSL/HTTPS enabled
- [ ] Backup of current server.js created
- [ ] Rollback plan documented
- [ ] Monitoring set up for errors and rate limiting triggers

---

## 📞 Support

If you encounter issues during implementation:

1. **JWT Secret Error**: Ensure JWT_SECRET is set in .env and is 32+ characters
2. **Helmet CSP Issues**: Add origins to directives if external resources needed
3. **Rate Limiting Too Strict**: Adjust windowMs or max in adminLimiter config
4. **Validation Too Strict**: Adjust regex patterns in lib/validators.js

---

**Next Document:** `PHASE_2_IMPLEMENTATION_GUIDE.md` (Important fixes for weeks 3-4)
