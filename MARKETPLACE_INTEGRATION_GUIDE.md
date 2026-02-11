# SmartInvest Marketplace & Integration Guide

## 🚀 New Features Overview

This comprehensive update adds enterprise-grade e-commerce, marketplace, and integration capabilities to SmartInvest with strict admin controls and live payment processing.

---

## 🔐 Admin & Security

### Admin Access Control

**CRITICAL: Only `delijah5415@gmail.com` has admin access**

- No bypass mechanisms exist
- All admin actions are logged
- Executives can be granted limited access by admin only

### Admin Endpoints

All admin endpoints require authentication and proper authorization:

```
GET  /api/admin/verify-access           - Verify admin/executive access
GET  /api/admin/dashboard                - View comprehensive dashboard stats
GET  /api/admin/users                    - View all registered users (pagination)
GET  /api/admin/transactions             - View all transactions (pagination)
GET  /api/admin/usage                    - View system usage logs
POST /api/admin/executives/grant         - Grant executive access to users
POST /api/admin/executives/revoke        - Revoke executive access
GET  /api/admin/executives               - List all executives
```

### Executive Access Management

Admin can grant limited access to trusted users:

```bash
POST /api/admin/executives/grant
{
  "targetUserId": "user-id-here",
  "accessLevel": "Executive",
  "permissions": "ViewDashboard,ViewReports",
  "reason": "Trusted business partner"
}
```

---

## 🛒 Marketplace Features

### User Roles

- **Buyer**: Can purchase products
- **Seller**: Can list and sell products
- **Merchant**: Business account with advanced features
- **Executive**: Limited admin access (granted by admin)
- **Admin**: Full system access (delijah5415@gmail.com only)

### Product Management

**Create Product** (Sellers/Merchants only)
```bash
POST /api/marketplace/products
Authorization: Bearer {jwt-token}
{
  "name": "Investment Portfolio Analysis Tool",
  "description": "Professional-grade portfolio analysis software",
  "price": 299.99,
  "currency": "USD",
  "stock": 100,
  "category": "Software",
  "weight": 0,
  "dimensions": "Digital Product"
}
```

**List Products**
```bash
GET /api/marketplace/products?category=Software&limit=20
```

### Order Processing

**Create Order** (Buyers)
```bash
POST /api/marketplace/orders?recaptchaToken={token}
Authorization: Bearer {jwt-token}
{
  "productId": 123,
  "quantity": 1,
  "shippingAddress": "123 Main St",
  "shippingCity": "Nairobi",
  "shippingCountry": "Kenya",
  "shippingPhone": "+254712345678",
  "recipientName": "John Doe"
}
```

**Update Order Status**
```bash
PUT /api/marketplace/orders/456/status
{
  "status": "Shipped"
}
```

### Shipping & Tracking

**Create Shipping Advice** (Sellers/Merchants)
```bash
POST /api/marketplace/orders/456/shipping
{
  "carrier": "DHL Express",
  "trackingNumber": "1234567890",
  "estimatedDelivery": "2026-02-15",
  "shippingMethod": "Express",
  "shippingCost": 25.00,
  "origin": "Nairobi, Kenya",
  "destination": "Lagos, Nigeria",
  "insurancePurchased": true,
  "insuranceAmount": 500.00,
  "signatureRequired": true,
  "notes": "Handle with care - fragile items"
}
```

**Safety Measures**:
- Insurance options for high-value shipments
- Signature required for delivery
- Real-time tracking updates
- Carrier verification

---

## 🔌 Website Integration (Premium Feature)

### API Key Management

**Requirements**:
- Active premium subscription
- Verified user account
- Compliance with rate limits

**Create API Key**
```bash
POST /api/integration/api-keys
Authorization: Bearer {jwt-token}
{
  "name": "Production Website Integration",
  "description": "API access for mywebsite.com",
  "allowedOrigins": "https://mywebsite.com,https://www.mywebsite.com",
  "rateLimitPerHour": 5000,
  "expiresInDays": 365
}
```

**Response**:
```json
{
  "id": 1,
  "key": "sk_AbCdEf123456...",
  "name": "Production Website Integration",
  "status": "Active",
  "rateLimitPerHour": 5000,
  "expiresAt": "2027-02-11T00:00:00Z"
}
```

### Using API Keys

External websites can authenticate using the API key:

```bash
GET /api/marketplace/products
x-api-key: sk_AbCdEf123456...
```

**Rate Limiting**:
- Per-key hourly limits
- Automatic throttling
- 429 status code when exceeded

**Allowed Endpoints**:
- `/api/marketplace/*` - Product and order management
- `/api/payments/crypto/*` - Cryptocurrency payments
- `/api/social/feed` - Public work gallery

---

## 💳 Live Payment Processing

### Configuration (PRODUCTION MODE)

Update `.env` with live credentials:

```env
# M-Pesa LIVE
MPESA_ENV=production
MPESA_CONSUMER_KEY=your_live_key
MPESA_CONSUMER_SECRET=your_live_secret

# PayPal LIVE
PAYPAL_ENV=production
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_secret

# Crypto LIVE (Mainnet)
CRYPTO_CHAIN_ID=1
CRYPTO_RPC_URL=https://mainnet.infura.io/v3/your_key
```

### Payment Methods

1. **M-Pesa** (Kenya, Tanzania, etc.)
   - Live STK Push
   - Real-time callbacks
   - Production shortcodes

2. **PayPal** (Global)
   - Live checkout
   - Production API
   - Real money processing

3. **Cryptocurrency** (Global)
   - On-chain verification
   - Multiple confirmations
   - Mainnet transactions
   - EVM-compatible chains (ETH, Polygon, BSC, etc.)

### Premium Access via Crypto

```bash
# 1. Create payment intent
POST /api/payments/crypto/intent
Authorization: Bearer {jwt-token}
{
  "amountUsd": 99.99
}

# Response includes wallet address and amount
{
  "reference": "SI-20260211123456-abc123",
  "treasuryAddress": "0x...",
  "amountNative": 0.031,
  "amountWei": "31000000000000000",
  "chainId": 1,
  "expiresAt": "2026-02-11T13:04:56Z"
}

# 2. User sends crypto to treasuryAddress with memo

# 3. Verify payment
POST /api/payments/crypto/verify
{
  "reference": "SI-20260211123456-abc123",
  "transactionHash": "0x..."
}
```

---

## 🛡️ Security Measures

### reCAPTCHA Integration

All order creation requires reCAPTCHA verification:

```javascript
// Frontend
const token = await grecaptcha.execute(siteKey, {action: 'create_order'});
fetch('/api/marketplace/orders?recaptchaToken=' + token, {...});
```

### Fraud Detection

Automatic risk assessment on every transaction:

- **Low Risk**: Proceed normally
- **Medium Risk**: Additional verification
- **High Risk**: Manual review required
- **Critical Risk**: Automatically blocked

**Risk Factors**:
- Transaction velocity
- IP reputation
- Transaction amount
- User history
- Device fingerprinting

### Usage Tracking

All actions are logged for audit:
- User ID
- Action type
- Entity affected
- IP address
- User agent
- Timestamp
- Metadata

Admin can review all logs:
```bash
GET /api/admin/usage?page=1&pageSize=100
```

---

## 📊 Admin Dashboard Features

### Real-time Statistics

```bash
GET /api/admin/dashboard
```

Returns:
- Total users
- Total products
- Total orders
- Pending orders
- Total revenue
- Active API keys
- Executive count
- 24-hour activity

### User Management

View all registered users with filters:
```bash
GET /api/admin/users?page=1&pageSize=50
```

**User Data Includes**:
- Registration info
- KYC status
- Role assignments
- Last login
- Regional data

### Transaction Monitoring

View all marketplace transactions:
```bash
GET /api/admin/transactions?page=1&pageSize=50
```

**Transaction Details**:
- Order number
- Buyer/seller info
- Product details
- Payment status
- Shipping status
- Timestamps

---

## 🚢 Shipping Information & Best Practices

### Supported Carriers

Integration-ready for:
- DHL Express
- FedEx
- UPS
- Local carriers (configurable)

### Shipping Workflow

1. **Order Created** → Status: `Pending`
2. **Payment Received** → Status: `Paid`
3. **Seller Processes** → Status: `Processing`
4. **Shipping Advice Created** → Status: `Shipped`
5. **Customer Receives** → Status: `Delivered`

### Safety Recommendations

```javascript
{
  "insurancePurchased": true,      // For items > $100
  "insuranceAmount": 500.00,       // Coverage amount
  "signatureRequired": true,       // For items > $50
  "notes": "Handle with care"      // Special instructions
}
```

---

## 🌐 External Website Connection

### Premium Feature Access

Premium subscribers can:
1. Generate API keys
2. Connect their websites
3. Access SmartInvest marketplace
4. Process payments
5. View analytics

### Integration Steps

**Step 1**: Subscribe to premium
```bash
POST /api/payments/crypto/intent
{ "amountUsd": 99.99 }
```

**Step 2**: Create API key
```bash
POST /api/integration/api-keys
{
  "name": "My Website",
  "allowedOrigins": "https://mysite.com"
}
```

**Step 3**: Use API key
```bash
curl -H "x-api-key: sk_..." \
  https://smartinvest.com/api/marketplace/products
```

---

## 🔒 Role Permissions Matrix

| Feature | User | Buyer | Seller | Merchant | Executive | Admin |
|---------|------|-------|--------|----------|-----------|-------|
| View Products | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Products | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Manage Orders | ❌ | Own | Own | Own | ❌ | ✅ |
| Create Shipping | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Generate API Keys | Premium | Premium | Premium | Premium | ✅ | ✅ |
| View Dashboard | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View All Users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Grant Executive | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 📝 Database Migration

### Required Migration Steps

1. **Add new entities** to database:
```bash
dotnet ef migrations add AddMarketplaceAndIntegration
dotnet ef database update
```

2. **Seed admin user** (if not exists):
```csharp
// Admin user with email: delijah5415@gmail.com
// Must be created manually or via seed script
```

3. **Configure environment variables** in `.env`

---

## 🎯 Quick Start Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Update all `your_*` placeholders with live credentials
- [ ] Set `MPESA_ENV=production`
- [ ] Set `PAYPAL_ENV=production`
- [ ] Configure `CRYPTO_RPC_URL` for mainnet
- [ ] Set `RECAPTCHA_SECRET_KEY`
- [ ] Verify `ADMIN_EMAIL=delijah5415@gmail.com`
- [ ] Run database migrations
- [ ] Test admin login
- [ ] Test payment processing
- [ ] Enable reCAPTCHA on frontend

---

## 📞 Support & Documentation

For detailed API documentation, visit:
- Full API Reference: `/api/integration/public/connect-info`
- Admin Guide: See ADMIN_CONTROL_GUIDE.md
- Security Guide: See README_SECURITY.md

**Admin Contact**: delijah5415@gmail.com

---

## ⚠️ Important Notes

1. **Admin Access**: Hardcoded to `delijah5415@gmail.com` - cannot be bypassed
2. **Live Payments**: All demo modes disabled - real transactions only
3. **API Keys**: Require active premium subscription
4. **Rate Limits**: Enforced per API key
5. **Security**: All actions logged and monitored
6. **Compliance**: GDPR, POPIA, FICA ready

---

*Last Updated: February 11, 2026*
