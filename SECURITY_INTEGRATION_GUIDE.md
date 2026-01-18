# SmartInvest Security Integration Guide

## Quick Setup

To integrate all security, chat, and firewall features into `server.js`, follow these steps:

### Step 1: Add Imports (Top of server.js, after existing requires)

```javascript
const {
  DataCompartment,
  UserDataProtection,
  AccessRequest,
  SecurityFirewall,
  PrivacyControl,
  SecureCache,
  DataBreachPrevention
} = require('./data-protection');

const {
  ChatManager
} = require('./chat-support');

const securityIntegration = require('./security-integration');
```

### Step 2: Initialize Security Layers (After app.use(bodyParser.json()))

```javascript
// Initialize security modules
const firewall = new SecurityFirewall();
const privacyControl = new PrivacyControl();
const cache = new SecureCache();
const breachPrevention = new DataBreachPrevention();
const chatManager = new ChatManager();

// Apply firewall globally (must be early in middleware chain)
app.use(firewall.middleware());
```

### Step 3: Initialize Endpoints (Before app.listen())

```javascript
// Chat support endpoints
securityIntegration.initChatEndpoints(app, adminAuth, express);

// Data access request endpoints
securityIntegration.initAccessRequestEndpoints(app, adminAuth, express);

// Security & audit endpoints
securityIntegration.initSecurityEndpoints(app, adminAuth, express);

// Catalog PDF metadata endpoints
const readFilesMeta = () => {
  try {
    return JSON.parse(fs.readFileSync('./data/files.json', 'utf8')) || [];
  } catch {
    return [];
  }
};

const writeFilesMeta = (files) => {
  fs.writeFileSync('./data/files.json', JSON.stringify(files, null, 2));
};

securityIntegration.initCatalogPDFEndpoints(app, adminAuth, express, readFilesMeta, writeFilesMeta);
```

## Features Enabled

### 1. Chat Support System
**User endpoints:**
- `POST /api/support/chat/create` - Start new support conversation
- `GET /api/support/chat/my-chats` - Get user's conversations
- `GET /api/support/chat/:conversationId` - View specific conversation
- `POST /api/support/chat/:conversationId/message` - Send message

**Admin endpoints:**
- `GET /api/support/admin/chats` - View all open chats
- `POST /api/support/admin/assign/:conversationId` - Assign to self
- `POST /api/support/admin/reply/:conversationId` - Reply to chat
- `POST /api/support/admin/close/:conversationId` - Close conversation
- `GET /api/support/admin/search?q=text` - Search conversations
- `GET /api/support/admin/stats` - View performance metrics

### 2. Data Access Request System
**User:**
- `POST /api/data/request-access` - Request sensitive data access
  - Must be approved by admin
  - Access grants expire in 24 hours
  - Full audit trail logged

**Admin:**
- `GET /api/data/admin/access-requests` - Review pending requests
- `POST /api/data/admin/approve/:requestId` - Grant access (24 hrs)
- `POST /api/data/admin/deny/:requestId` - Reject request
- `POST /api/data/admin/revoke/:requestId` - Revoke granted access

### 3. Security & Firewall
**Admin:**
- `GET /api/security/admin/audit-log` - View all system activity
- `GET /api/security/admin/breach-alerts` - View suspicious activities
- `POST /api/security/admin/block-ip` - Block/unblock IP addresses
- `POST /api/security/admin/block-email` - Block/unblock emails
- `GET /api/security/admin/status` - View security dashboard

**Features:**
- IP-based rate limiting: 100 req/min globally, 50 req/min per user
- Auto-blocks on violation (15-min lockout)
- Anomaly detection for suspicious activities
- Email/IP anonymization in logs (non-tracking)
- Automatic cache cleanup (TTL-based)

### 4. Catalog PDF Metadata
**Admin:**
- `POST /api/admin/files/:id/add-pdf-info` - Add PDF info to catalog item

**Public:**
- `GET /api/catalog-with-pdfs` - Browse catalog with PDF details

```json
{
  "pdfInfo": {
    "url": "https://example.com/file.pdf",
    "title": "Investment Guide",
    "description": "Complete guide to smart investing",
    "pages": 42,
    "addedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Data Protection Features

### DataCompartment
- Encrypts sensitive data at rest
- Logs all access attempts
- Requires admin approval for sensitive fields
- Sanitizes email addresses in logs

### UserDataProtection
- `getSanitized()` - User-safe view (no sensitive data)
- `getFull()` - Admin-only complete data
- `hideSensitive()` - Removes passwords, tokens, etc.

### SecurityFirewall
```javascript
firewall.blockIP('192.168.1.1', 'Suspicious activity');
firewall.blockEmail('attacker@example.com', 'Multiple failed login');
firewall.unblockIP('192.168.1.1');
```

### PrivacyControl
- Strips sensitive fields from all API responses
- Disables tracking (set header `X-Disable-Tracking: true`)
- Anonymizes IP addresses in logs
- Redacts passwords, tokens, API keys

### SecureCache
```javascript
// Set with TTL and role-based access
cache.set('key', data, 3600, 'admin'); // 1 hour, admin only
cache.get('key', 'user'); // Won't return if user doesn't have access
```

### DataBreachPrevention
- Records all data access in audit log
- Detects anomalies (unusual access patterns)
- Generates breach alerts on suspicious activity
- Hashes sensitive fields before logging
- Anonymizes IPs: `192.168.x.x` → `192.168.0.0`

## Single Email Per User Enforcement

In signup endpoint, add:

```javascript
app.post('/api/auth/signup', express.json(), (req, res) => {
  const { email, password } = req.body;
  
  // Check existing email
  const users = readUserData();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  
  // Continue with signup...
});
```

## Privacy & Non-Tracking

All responses automatically:
- ✅ Hide passwords, tokens, API keys
- ✅ Anonymize IP addresses
- ✅ Hash emails in logs
- ✅ Exclude tracking headers
- ✅ Remove internal server details
- ✅ Disable tracking pixels

Example sanitized response:
```json
{
  "id": "user123",
  "name": "John Doe",
  "email": "hash:3d2c1f..." // Hashed if in logs
  // NO: password, token, apiKey, internal_id, created_at
}
```

## Testing

```bash
# Test firewall rate limiting
for i in {1..101}; do curl http://localhost:3000/api/health; done
# Should block after 100 requests

# Test chat
curl -X POST http://localhost:3000/api/support/chat/create \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "category": "billing"}'

# Test access request
curl -X POST http://localhost:3000/api/data/request-access \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "dataType": "payment_history", "reason": "Need to verify transactions"}'

# Test security status (admin)
curl -H "Authorization: Basic admin:password" \
  http://localhost:3000/api/security/admin/status
```

## Summary of Compliance

✅ **Storage compartments** - DataCompartment + encryption
✅ **Cache layer** - SecureCache with TTL
✅ **User protection** - UserDataProtection wrapper
✅ **Admin protection** - Admin-only endpoints + audit trail
✅ **One email per user** - Signup validation
✅ **Chat support** - ChatManager with persistence + real-time
✅ **Admin PDF uploads** - PDF metadata per catalog item
✅ **Protective firewall** - IP/email rate limiting + blocking
✅ **Non-breach policy** - Request/approval system
✅ **No data sharing** - Access control + audit logs
✅ **Non-tracking** - Anonym IPs, hash emails, no tracking
✅ **Hide sensitive data** - PrivacyControl strips fields
