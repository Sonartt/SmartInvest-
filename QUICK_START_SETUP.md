# SmartInvest - Quick Setup & Deployment Guide

**Version**: 2.0 - Enterprise Edition with Tiered Access  
**Status**: ✅ Production Ready  
**Date**: 2026-02-11

---

## 🏢 Business Model: Investor-Grade Access Control (Rolex Model)

SmartInvest operates on a **premium access tier system** similar to luxury brands. Access is hierarchical:

- **Free Tier** ✅ Public browsing, basic features
- **Premium Tier** 💳 Paid users - advanced features, priority support
- **Enterprise Tier** 🏆 Investors/partners - full platform access, API integrations
- **Admin Tier** 🔐 Master admin only (delijah5415@gmail.com) - system control

### Key Principle: **"If it generates value, it requires investment"**

---

## 🚀 Installation Checklist

### Phase 1: Core Setup (5 minutes)

**Step 1.1 - Environment Configuration**
```bash
cp .env.example .env
```

**Step 1.2 - Configure Production Settings**
```env
# ⚠️ CRITICAL: All systems MUST be in production mode

# Payment Processing (LIVE MODE ONLY - NO SANDBOX)
MPESA_ENV=production
PAYPAL_ENV=production
CRYPTO_CHAIN_ID=1  # Ethereum mainnet

# Admin Email - HARDCODED (Cannot be changed without rebuilding)
ADMIN_EMAIL=delijah5415@gmail.com

# Database
DefaultConnection=Server=YOUR_SERVER;Database=SmartInvest;User Id=sa;Password=YourPassword;

# Feature Flags (Enable based on tier)
FEATURE_PREMIUM_ANALYTICS=true
FEATURE_API_INTEGRATIONS=true
FEATURE_GEOLOCATION_SHIPPING=true
FEATURE_ADVANCED_FRAUD_DETECTION=true

# Security
ENABLE_IP_GEOLOCATION=true
ENABLE_2FA_FOR_PREMIUM=true
ENABLE_ENCRYPTED_AUDIT_LOGS=true
```

**Step 1.3 - Database Migration**
```bash
# Install NuGet packages
dotnet restore

# Create and run migrations
dotnet ef migrations add EnterpriseEdition
dotnet ef database update
```

**Step 1.4 - Verify & Start**
```bash
dotnet run
# Expected: Application runs on https://localhost:7001
```

## � Database Tables & Schemas

| Table | Purpose | Tier | Access |
|-------|---------|------|--------|
| `AspNetUsers` | User accounts | All | Public registration |
| `SubscriptionTiers` | Freemium/Premium/Enterprise plans | All | Based on tier |
| `Products` | Marketplace catalog | Free | View only (Free: 5/month limit) |
| `Orders` | Transactions | Premium+ | Purchase & track |
| `ShippingTracking` | Real-time tracking with geolocation | Premium+ | Live map + IP tracking |
| `ShippingAdvices` | Shipping status updates | Premium+ | GPS + address verification |
| `GeolocationLogs` | IP address mapping to location | Admin | Audit trail |
| `ApiKeys` | Third-party integrations | Enterprise | Rate-limited API access |
| `FraudChecks` | Security assessments | Premium+ | Real-time detection |
| `UserSecurityEvents` | Login attempts, 2FA | Premium+ | Security alerts |
| `ExecutiveAccesses` | Investor/partner permissions | Enterprise | Granular access control |
| `UsageLogs` | Encrypted audit trail | Admin | Searchable history |
| `UserConnections` | Social networking | Premium | Network building |
| `WorkPosts` | Public portfolio gallery | All | Free to view, Premium to publish |
| `CryptoPaymentIntents` | Blockchain transactions | Premium+ | Live tracking |

---

## 💰 Feature Tiers (Investor Model)

### **🟢 Free Tier** (Unlimited Users)
- ✅ Browse products (5 items/month limit)
- ✅ View public work posts
- ✅ Basic user profile
- ✅ View seller ratings
- ❌ No purchasing capability
- ❌ No advanced features
- **Cost**: $0/month

### **🔵 Premium Tier** (Per User)
- ✅ All Free features PLUS:
- ✅ Purchase products (unlimited)
- ✅ Real-time shipping tracking (with GPS map)
- ✅ Fraud protection shield
- ✅ Advanced search filters
- ✅ Seller rating & reviews
- ✅ Email notifications
- ✅ 2FA security
- ✅ Encrypted transactions
- ✅ Priority support (24h response)
- ✅ Post unlimited work items
- ✅ API access (100 calls/day)
- **Cost**: $9.99/month or $99/year

### **🟠 Enterprise Tier** (Investor/Partner)
- ✅ All Premium features PLUS:
- ✅ Unlimited API calls + webhooks
- ✅ Custom integrations
- ✅ White-label options
- ✅ Dedicated account manager
- ✅ Advanced analytics dashboard
- ✅ Custom fraud rules
- ✅ Geolocation-based insights
- ✅ Compliance certifications
- ✅ SLA guarantee
- ✅ Custom domain support
- **Cost**: Custom pricing ($999+/month)

### **🔴 Admin Tier** (Master Admin Only)
- ✅ Complete system access
- ✅ User management
- ✅ Payment reconciliation
- ✅ Security audit logs
- ✅ System configuration
- **Email**: delijah5415@gmail.com (HARDCODED)
- **Access**: No bypass, no exceptions

---

## 🗺️ Geolocation & Shipment Tracking (Premium+)

### Real-Time Shipping Map

**Feature**: Interactive map showing:
- 📍 Sender location (shipper IP → geocoded address)
- 📍 Current package location (GPS from carrier)
- 📍 Receiver location (delivery address)
- 🛣️ Route visualization
- ⏱️ ETA calculation
- 🚚 Carrier vehicle tracking

### API Endpoints (Premium+ only)

```bash
# Get shipment with geolocation
GET /api/shipping/trackings/{trackingId}/geolocation
{
  "trackingNumber": "DHL123",
  "currentLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "New York, NY 10001",
    "timezone": "America/New_York"
  },
  "shipperLocation": {
    "ipAddress": "203.0.113.45",
    "latitude": 34.0522,
    "longitude": -118.2437,
    "address": "Los Angeles, CA 90001"
  },
  "receiverLocation": {
    "latitude": 51.5074,
    "longitude": -0.1278,
    "address": "London, UK"
  },
  "route": {
    "distance": 5432,  # km
    "estimatedDelivery": "2026-02-15T14:30:00Z",
    "waypoints": [...]
  },
  "carrierInfo": {
    "name": "DHL Express",
    "vehicleId": "DHL-TRUCK-002",
    "driverLocation": {...}
  }
}

# Get IP-to-address mapping (Premium+ only)
GET /api/shipping/geolocation/{ipAddress}
{
  "ipAddress": "203.0.113.45",
  "location": {
    "country": "United States",
    "state": "California",
    "city": "Los Angeles",
    "latitude": 34.0522,
    "longitude": -118.2437,
    "timezone": "America/Los_Angeles",
    "isp": "Example ISP"
  }
}

# Interactive tracking map (iframe)
<iframe src="https://app.smartinvest.com/tracking/{trackingId}?view=map" 
        width="100%" height="600"></iframe>
```

---

## 🔐 Enterprise-Grade Security Integration

### Multi-Layer Security (All Tiers)

**Layer 1: User Protection**
- ✅ HTTPS/TLS 1.3 encryption
- ✅ Password hashing (bcrypt + salt)
- ✅ Rate limiting (100 requests/minute per IP)
- ✅ Bot detection (reCAPTCHA v3)
- ✅ Session management (30-min timeout)

**Layer 2: Admin Protection**
- ✅ Master admin isolation (delijah5415@gmail.com only)
- ✅ IP whitelist for admin access
- ✅ Mandatory 2FA (TOTP + backup codes)
- ✅ All actions logged with timestamp + IP
- ✅ Encrypted audit trails
- ✅ Daily security scans

**Layer 3: Payment Security**
- ✅ PCI-DSS compliance
- ✅ Tokenization (no card data stored)
- ✅ 3D Secure authentication
- ✅ Fraud detection (real-time ML scoring)
- ✅ Chargeback protection
- ✅ Transaction encryption

**Layer 4: Data Security**
- ✅ Database encryption (TDE)
- ✅ API key rotation (90-day cycle)
- ✅ Encrypted backups
- ✅ GDPR-compliant data handling
- ✅ Audit log immutability
- ✅ DLP (Data Loss Prevention)

### Security Configuration

```env
# User Security
ENABLE_2FA_AUTHENTICATION=true
ENABLE_BIOMETRIC_LOGIN=true
SESSION_TIMEOUT_MINUTES=30
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Admin Security (Enterprise Edition)
ADMIN_IP_WHITELIST=203.0.113.1,203.0.113.2
ADMIN_REQUIRE_2FA=true
ADMIN_AUDIT_ENCRYPTION=true
ADMIN_SESSION_TIMEOUT_MINUTES=15

# Payment Security
PCI_COMPLIANCE_MODE=true
ENABLE_3D_SECURE=true
FRAUD_DETECTION_ML=true
CHARGEBACK_PROTECTION=true

# Data Security
DATABASE_ENCRYPTION=true
BACKUP_ENCRYPTION=true
BACKUP_FREQUENCY=daily
RETENTION_DAYS=90
```

---

## 🛡️ Payment Gateway Setup (Production)
### M-Pesa (Live) - East Africa
```env
MPESA_ENV=production
MPESA_CONSUMER_KEY=your_production_key
MPESA_CONSUMER_SECRET=your_production_secret
MPESA_PASSKEY=your_production_passkey
MPESA_BUSINESS_CODE=174379  # Your merchant code
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa-callback
```

### PayPal (Live) - Global
```env
PAYPAL_ENV=production
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_secret
PAYPAL_MODE=live
PAYPAL_ENDPOINT=https://api.paypal.com/v1
```

### Cryptocurrency (Live Mainnet)
```env
CRYPTO_CHAIN_ID=1  # Etherleum mainnet
CRYPTO_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
CRYPTO_TREASURY_ADDRESS=0xYourTreasuryWalletAddress
CRYPTO_USD_RATE=3200  # Update via price oracle
CRYPTO_NETWORK=ethereum
CRYPTO_CONFIRMATION_BLOCKS=12
```

---

## 🛡️ reCAPTCHA & Bot Protection

**Register at**: https://www.google.com/recaptcha/admin

```env
RECAPTCHA_VERSION=3  # v3 for invisible protection
RECAPTCHA_SECRET_KEY=your_secret_key
RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SCORE_THRESHOLD=0.5  no # 0.0-1.0
```

---

## 🧪 Testing & Verification

### Admin Access Test
```bash
curl -X GET https://localhost:7001/api/admin/verify-access \
  -H "Authorization: Bearer {admin-jwt-token}"

# Expected Response:
# {
#   "authenticated": true,
#   "adminEmail": "delijah5415@gmail.com",
#   "permissions": ["All"],
#   "tier": "Admin"
# }
```

### Tier-Based Feature Test

**Test Free Tier** (No payment):
```bash
# Browse products (limited to 5/month)
curl https://localhost:7001/api/marketplace/products?limit=5

# View public work posts
curl https://localhost:7001/api/workposts/public
```

**Test Premium Tier** (Paid user):
```bash
# Purchase product (requires Premium)
curl -X POST https://localhost:7001/api/orders/create \
  -H "Authorization: Bearer {premium-jwt-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-123",
    "quantity": 1,
    "paymentMethod": "paypal"
  }'

# Get shipment with geolocation map
curl https://localhost:7001/api/shipping/trackings/{id}/geolocation \
  -H "Authorization: Bearer {premium-jwt-token}"
```

**Test Enterprise Tier** (API):
```bash
# Unlimited API calls with webhooks
curl -X GET https://localhost:7001/api/enterprise/analytics \
  -H "Authorization: Bearer {api-key}" \
  -H "X-API-Version: 2.0"
```

### Payment Test (Safe - Use Sandbox First)
```bash
# M-Pesa STK Push
curl -X POST https://localhost:7001/api/payments/mpesa/stk-push \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "amount": 1000,
    "accountReference": "test-order-001"
  }'

# PayPal Order
curl -X POST https://localhost:7001/api/payments/paypal/create \
  -d '{
    "amount": 99.99,
    "currency": "USD"
  }'

# Crypto Transaction
curl -X POST https://localhost:7001/api/payments/crypto/initiate \
  -d '{
    "amount": 0.5,
    "tokenSymbol": "ETH",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc3e7d11E1Bffc"
  }'
```

---

## ⚙️ Production Deployment Checklist

- [ ] **Database**: Migrated & backed up daily
- [ ] **SSL/TLS**: Valid certificate installed
- [ ] **Payment APIs**: All set to production (NOT sandbox)
- [ ] **Admin Email**: Verified as delijah5415@gmail.com
- [ ] **Geolocation**: API key configured (GeoIP2 or MaxMind)
- [ ] **2FA**: Enabled for Premium+ users
- [ ] **Email Service**: SMTP configured + verified
- [ ] **Backup**: Daily automated + tested restores
- [ ] **Monitoring**: Application Insights / CloudWatch active
- [ ] **Security**: HTTPS redirect + HSTS headers enabled
- [ ] **API Keys**: Rotated & stored in vault
- [ ] **Audit Logs**: Encrypted & immutable
- [ ] **DDoS Protection**: Cloudflare or WAF enabled
- [ ] **Load Balancer**: Health checks configured
- [ ] **CDN**: Static assets cached globally

---

## 🔧 Optional Next Steps & Advanced Features

### 1. Advanced Geolocation Features
```csharp
// Implement in ShippingService
public class GeolocationShippingService
{
    // Real-time tracking with IP-to-coordinates mapping
    public async Task<ShipmentGeolocation> GetLiveLocationAsync(string trackingId)
    {
        var location = await _geoIpService.ResolveAsync(userIpAddress);
        return new ShipmentGeolocation
        {
            TrackingId = trackingId,
            CurrentLocation = location,
            ShipperLocation = await GetShipperLocationAsync(),
            ReceiverLocation = order.ShippingAddress,
            Route = await _mapService.CalculateRouteAsync()
        };
    }

    // Geofence alerts for delivery
    public async Task MonitorGeofenceAsync(string trackingId)
    {
        // Alert user when package enters delivery zone
        // Notify driver when near destination
        // Confirm delivery with geolocation proof
    }
}
```

### 2. Investor Dashboard (Enterprise)
```endpoint
GET /api/enterprise/dashboard
{
  "revenue": 125000.50,
  "activeUsers": 5234,
  "premiumSubscriptions": 1200,
  "apiCallsThisMonth": 2500000,
  "averageOrderValue": 89.99,
  "fraud prevented": 23450.00,
  "regions": {
    "North America": 45%,
    "Europe": 30%,
    "Asia": 25%
  }
}
```

### 3. Blockchain Integration (Premium+)
```bash
# Smart contract for escrow
# Automated dispute resolution
# Token rewards for sellers
# NFT certificates for work posts
```

### 4. AI-Powered Features (Enterprise)
```bash
# Machine learning fraud detection
# Customer behavior analysis
# Predictive analytics
# Chatbot support (24/7)
```

### 5. Compliance & Audit Tools
```bash
# GDPR data export
# CCPA compliance
# Tax reporting
# PCI-DSS audit logs
# SOC 2 certification
```

### 6. Mobile App Integration
```bash
# React Native for iOS/Android
# Push notifications
# Offline mode
# Biometric authentication
```

### 7. White-Label Solution (Enterprise)
```bash
# Custom domain + branding
# API-first architecture
# Webhook support
# SLA monitoring
```

---

## 🚨 Common Issues & Solutions

### ❌ Issue: "Admin login rejected, but email is correct"
**Root Cause**: Case sensitivity or whitespace in email  
**Solution**:
```bash
# Verify exact email in database
SELECT Email FROM AspNetUsers WHERE Role = 4;

# Must be exactly (no spaces):
# delijah5415@gmail.com
```

### ❌ Issue: "Payment always fails with 'Sandbox mode detected'"
**Root Cause**: Environment not set to production  
**Solution**:
```env
# WRONG:
MPESA_ENV=sandbox
PAYPAL_ENV=sandbox

# CORRECT:
MPESA_ENV=production
PAYPAL_ENV=production
```

### ❌ Issue: "Geolocation map not loading on shipment page"
**Root Cause**: GeoIP API key missing or tier is Free  
**Solution**:
```bash
# Check user tier
SELECT SubscriptionTier FROM AspNetUsers WHERE Id = {userId};

# Must be Premium or Enterprise
# And configure GeoIP key:
GEOIP_API_KEY=your_maxmind_key
```

### ❌ Issue: "Premium features showing 'Contact sales' for everyone"
**Root Cause**: Not checking subscription in API  
**Solution**:
```csharp
[Authorize]
[RequireSubscription(SubscriptionTier.Premium)]  // Add this
public async Task<IActionResult> GetShippingGeolocation(string trackingId)
{
    // Premium-only endpoint
}
```

### ❌ Issue: "2FA not sending codes to Premium users"
**Root Cause**: Email/SMS service misconfigured  
**Solution**:
```env
# Verify SMTP settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # NOT regular password
SMTP_FROM_EMAIL=noreply@smartinvest.com
```

### ❌ Issue: "API keys returning 401 Unauthorized"
**Root Cause**: Key expired or rate limit exceeded  
**Solution**:
```bash
# Check key status
GET /api/integration/api-keys/{keyId}/status

# Response should show:
{
  "isActive": true,
  "expiresAt": "2027-02-11",
  "callsThisHour": 45,
  "rateLimit": 1000
}

# If 401, regenerate key:
POST /api/integration/api-keys/{keyId}/rotate
```

### ❌ Issue: "Database migration fails with 'table already exists'"
**Root Cause**: Migrations run multiple times  
**Solution**:
```bash
# Check migration history
dotnet ef migrations list

# If duplicate, remove last migration
dotnet ef migrations remove

# Reapply correctly
dotnet ef database update
```

### ❌ Issue: "Audit logs empty - admin actions not tracked"
**Root Cause**: Audit logging not enabled or database full  
**Solution**:
```env
# Enable audit logging
ENABLE_AUDIT_LOGS=true
AUDIT_LOG_RETENTION_DAYS=365
AUDIT_LOG_ENCRYPTION=true

# Check database space
SELECT 
  SUM(size) AS TotalSizeGB 
FROM sys.sysfiles 
WHERE type = 0;
```

### ❌ Issue: "Users see 'Tier upgrade required' for free features"
**Root Cause**: Feature flags misconfigured  
**Solution**:
```env
# Ensure free features are NOT gated
FEATURE_PRODUCT_BROWSING=free
FEATURE_PROFILE_VIEW=free
FEATURE_RATING_VIEW=free

# Premium features are gated
FEATURE_PURCHASE=premium
FEATURE_ADVANCED_ANALYTICS=premium
FEATURE_API_ACCESS=enterprise
```

### ❌ Issue: "Shipment tracking shows wrong address coordinates"
**Root Cause**: GeoIP database outdated or wrong resolver  
**Solution**:
```bash
# Update GeoIP database
# Use MaxMind GeoIP2 (most accurate):
GEOIP_PROVIDER=maxmind
GEOIP_DB_PATH=/var/lib/geoip/GeoLite2-City.mmdb

# Or fallback to IP-to-location API:
GEOIP_API_ENDPOINT=https://geoip.example.com/api
```

---

## 📞 Support & Escalation

| Issue Level | Contact | Response Time |
|---|---|---|
| Free Tier | Community Forum | 48-72 hours |
| Premium | support@smartinvest.com | 24 hours |
| Enterprise | Dedicated Manager | 1 hour |
| Critical | devops@smartinvest.com | 15 minutes |

**Master Admin**: delijah5415@gmail.com (System issues only)

---

## ✅ Verification Checklist (Post-Deployment)

- [ ] Admin can access dashboard without bypasses
- [ ] Free users see limited feature set
- [ ] Premium users can purchase + get geolocation tracking
- [ ] Enterprise users have full API access
- [ ] Shipping map displays user IP location + receiver address
- [ ] 2FA works for Premium+ login
- [ ] Payment gateways (M-Pesa, PayPal, Crypto) process live transactions
- [ ] Audit logs record all admin actions with timestamps
- [ ] Fraud detection blocks suspicious transactions
- [ ] Email notifications send successfully
- [ ] API rate limits enforce per tier
- [ ] Database backups complete daily
- [ ] SSL certificate valid and renewed
- [ ] DDoS/WAF protecting API

---

**Last Updated**: February 11, 2026  
**Edition**: Enterprise 2.0 with Investor Access Control  
**Status**: ✅ Production Ready
