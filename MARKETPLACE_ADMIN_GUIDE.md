# SmartInvest Marketplace & Admin Platform

## Overview

This comprehensive marketplace system includes:

### 1. Multi-Role Accounts
- **Admin/CEO** (Master Admin: delijah5415@gmail.com only)
- **Merchant Accounts** - Business entities managing sellers
- **Seller Accounts** - Individual/business sellers
- **Buyer Accounts** - Customers purchasing goods

### 2. Admin Dashboard
- **Endpoint**: `POST /api/admin/dashboard/data`
- **Access**: Only `delijah5415@gmail.com` and granted admins
- **Features**:
  - View all registration data
  - Monitor all transactions
  - Track usage analytics
  - Access all platform features
  - Manage user roles

#### Key Endpoints:
```
GET  /api/admin/dashboard/data              - Get dashboard metrics
GET  /api/admin/dashboard/analytics         - Platform analytics
GET  /api/admin/dashboard/audit-logs        - Admin audit logs
POST /api/admin/dashboard/users/{email}/grant-access  - Grant admin access
POST /api/admin/dashboard/users/{email}/revoke-access - Revoke admin access
```

#### Admin Features:
- Transaction monitoring & review
- Fraud alert management
- Seller/buyer management
- Integration approval
- Revenue tracking
- Usage statistics

### 3. Buyer & Seller System

#### Seller Registration:
```
POST /api/accounts/seller/register
{
  "storeName": "My Store",
  "storeDescription": "Store description",
  "storeEmail": "store@example.com",
  "storePhone": "+1234567890",
  "payoutMethod": "bank_transfer",
  "payoutAccount": "account_details"
}
```

#### Buyer Registration:
```
POST /api/accounts/buyer/register
```

### 4. Live Payment Processing (PRODUCTION ONLY)

**NO DEMO MODE** - All payments are live and real

#### Supported Payment Methods:
1. **Credit/Debit Cards** (Stripe Live)
2. **Bank Transfers/Wire**
3. **PayPal** (Live mode)
4. **Cryptocurrency** (On-chain verification with ETH/BTC/etc)

#### Process Payment:
```
POST /api/payments/process
{
  "sellerId": "seller_user_id",
  "amount": 1000.00,
  "paymentMethod": "card|bank_transfer|paypal|crypto"
}

Response:
{
  "success": true,
  "transactionId": 123,
  "reference": "TXN-20260211XXXX-YYYY",
  "fraudScore": 15.5,
  "requiresManualReview": false
}
```

### 5. Fraud Detection & Safety Measures

#### Fraud Analysis:
```
POST /api/payments/fraud-check
{
  "sellerId": "seller_id",
  "amount": 5000.00,
  "paymentMethod": "card"
}

Response:
{
  "riskScore": 25.5,
  "riskLevel": "Medium",
  "isBlocked": false,
  "requiresManualReview": false,
  "indicators": [
    "Unusual transaction frequency",
    "Amount exceeds buyer's average"
  ]
}
```

#### Fraud Detection Criteria:
- Buyer blacklist status
- Seller blacklist status
- Transaction frequency (7-day window)
- Daily spending limits
- Amount vs. buyer's average
- Seller chargeback rate
- Payment method risk level

#### Safety Mechanisms:
- Real-time fraud scoring
- Automatic transaction blocking (score ≥ 70)
- Manual review flagging (score ≥ 50)
- Blacklist management
- Safety alerts & notifications

### 6. Recapture Campaigns

Automatic retry mechanism for failed payments:

```
POST /api/payments/recapture
{
  "transactionId": 123,
  "reason": "Initial payment failed - customer authorized retry"
}
```

**Features**:
- Up to 3 automatic retry attempts
- Exponential backoff (1 hour, 2 hours, 4 hours)
- Email notifications to buyer
- Manual override capability

### 7. Shipping Management

#### Create Shipping Label:
```
POST /api/shipping/labels
{
  "orderId": 456,
  "originAddress": "123 Warehouse St, City, State 12345",
  "destinationAddress": "456 Customer St, City, State 67890",
  "weightKg": 2.5,
  "carrierId": 1
}
```

#### Get Shipping Rates:
```
GET /api/shipping/rates?from=US&to=UK&weightGrams=2500

Response:
{
  "rates": [
    {
      "id": 1,
      "serviceType": "Standard",
      "baseRate": 15.99,
      "ratePerKg": 0.50,
      "estimatedDaysMin": 5,
      "estimatedDaysMax": 7
    }
  ]
}
```

#### Track Shipment:
```
GET /api/shipping/tracking/{trackingNumber}
```

#### Add Shipping Advice:
```
POST /api/shipping/labels/{labelId}/advice
{
  "status": "in_transit",
  "message": "Package picked up and in transit"
}
```

### 8. External Integration System

#### Premium Two-Tier Model:

**Free Tier**:
- 1,000 API requests/month
- Basic integration features
- $0/month

**Premium Tier**:
- 100,000 API requests/month
- Priority support
- Advanced webhooks
- $99.99/month

#### Request Integration:
```
POST /api/external/request
{
  "integrationName": "My Marketplace",
  "integrationUrl": "https://mymarketplace.com",
  "category": "marketplace",
  "requestPremium": true
}

Response:
{
  "success": true,
  "apiKey": "sk_live_xxxxx",
  "integration": { ... }
}
```

#### Integration Approval (Admin Only):
```
POST /api/external/admin/{integrationId}/approve
POST /api/external/admin/{integrationId}/reject
GET  /api/external/admin/pending
```

#### Verify Integration:
```
POST /api/external/verify/{apiKey}

GET /api/external/active  (Public list of verified integrations)
```

### 9. Transaction & Revenue Tracking

#### Get User Transactions:
```
GET /api/payments/user/transactions

Response:
[
  {
    "id": 123,
    "buyerId": "user_id",
    "sellerId": "seller_id",
    "amount": 1000.00,
    "currency": "USD",
    "paymentMethod": "card",
    "paymentStatus": "completed",
    "orderStatus": "confirmed",
    "fraudScore": 12.5,
    "fraudCheckPassed": true,
    "createdAt": "2026-02-11T10:30:00Z",
    "completedAt": "2026-02-11T10:31:00Z"
  }
]
```

### 10. Environment Configuration

```dotenv
# Admin
ADMIN_EMAIL=delijah5415@gmail.com

# Stripe (Card Payments)
STRIPE_LIVE_API_KEY=sk_live_xxxxx
STRIPE_LIVE_SECRET_KEY=sk_live_xxxxx

# PayPal (Live Mode)
PAYPAL_LIVE_CLIENT_ID=xxxxx
PAYPAL_LIVE_SECRET=xxxxx

# Crypto (On-chain)
CRYPTO_TREASURY_ADDRESS=0xYourAddress
CRYPTO_CHAIN_ID=1
CRYPTO_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
CRYPTO_USD_RATE=3200
CRYPTO_REQUIRED_CONFIRMATIONS=2
```

## Security Features

1. **Admin Access Control**
   - Hardcoded master admin: `delijah5415@gmail.com`
   - No bypass mechanisms
   - Audit logging for all admin actions
   - IP-based access tracking

2. **Payment Security**
   - Fraud detection at transaction time
   - Automatic blocking of high-risk transactions
   - Chargeback prevention
   - Payment method validation

3. **Integration Security**
   - Rate limiting per API key
   - Monthly request quotas
   - API key encryption
   - Request logging & audit trail

4. **Data Protection**
   - User registration data encrypted
   - KYC verification required for sellers
   - Transaction encryption
   - Audit logs for compliance

## Workflow Examples

### Complete Seller to Buyer Transaction

```
1. Buyer registers: POST /api/accounts/buyer/register
2. Seller registers: POST /api/accounts/seller/register
3. Seller verifies KYC: POST /api/accounts/seller/kyc-submit
4. Buyer finds seller: GET /api/accounts/sellers/top
5. Buyer checks fraud: POST /api/payments/fraud-check
6. Buyer processes payment: POST /api/payments/process
7. Admin approves if needed
8. Shipping label created: POST /api/shipping/labels
9. Tracking provided to buyer
10. Payment settled to seller
```

### Third-Party Integration Approval

```
1. Partner requests integration: POST /api/external/request
2. Admin reviews pending: GET /api/external/admin/pending
3. Admin approves: POST /api/external/admin/{id}/approve
4. Partner starts using API with received key
5. Partner checks limits: POST /api/external/check-request-limit
6. Admin monitors usage: GET /api/admin/dashboard/data
```

## Database Schema

**Core Tables**:
- `AdminAccounts` - Admin users and permissions
- `MerchantAccounts` - Business entities
- `SellerAccounts` - Seller profiles & metrics
- `BuyerAccounts` - Buyer profiles & metrics
- `TransactionRecords` - Payment transactions
- `FraudDetectionScores` - Fraud analysis results
- `SafetyAlerts` - Security alerts
- `BlacklistEntries` - Blocked users/IPs
- `RecaptureCampaigns` - Failed payment retries
- `ExternalIntegrations` - Third-party connections
- `ShippingLabels` - Shipment tracking
- `AdminAuditLogs` - All admin actions

## Testing Checklist

- [ ] Admin can view dashboard only with correct email
- [ ] Non-admin cannot bypass to dashboard
- [ ] Live payments process (not demos)
- [ ] Fraud detection blocks high-risk transactions
- [ ] Recapture retries failed payments
- [ ] Shipping labels generate tracking numbers
- [ ] External integrations require approval
- [ ] Admin audit logs all actions
- [ ] Rate limiting enforces quotas
- [ ] Seller KYC verification required
