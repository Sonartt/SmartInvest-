# SmartInvest Marketplace - Quick Deployment + Testing Guide

**Status**: ✅ Production-Ready  
**Master Admin**: delijah5415@gmail.com (auto-seeded on first run)  
**Payment Mode**: LIVE ONLY (Stripe, PayPal, Crypto, Bank Transfer)

---

## 🚀 5-Minute Quick Start

### 1. **Update `.env` with Live Payment Keys**

```bash
# Copy example
cp .env.example .env

# Edit .env with your LIVE API keys
# ⚠️ CRITICAL: Use LIVE keys, NOT sandbox/test keys!
STRIPE_LIVE_API_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_LIVE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
PAYPAL_LIVE_CLIENT_ID=xxxxxxxxxxxxx
PAYPAL_LIVE_SECRET=xxxxxxxxxxxxx
CRYPTO_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
CRYPTO_TREASURY_ADDRESS=0xYourWalletAddress
ADMIN_EMAIL=delijah5415@gmail.com
```

### 2. **Run Database Migration**

```bash
cd /workspaces/SmartInvest-
dotnet ef migrations add Marketplace
dotnet ef database update
```

Creates 31 tables + 15 indexes automatically.

### 3. **Start Application**

```bash
dotnet run
```

**On startup, the application will:**
1. ✅ Apply pending migrations
2. ✅ Seed initial data
3. ✅ Create master admin user (delijah5415@gmail.com)
4. ✅ Generate random initial password
5. ✅ Display password in console (save it!)

**Console Output**:
```
╔════════════════════════════════════════════════════════════════╗
║                  MASTER ADMIN CREATED                           ║
╠════════════════════════════════════════════════════════════════╣
║ Email:    delijah5415@gmail.com                                ║
║ Password: xK7$mP9nL2zQ4vW@rT6fB1yJ                            ║
║                                                                ║
║ ⚠️  CHANGE THIS PASSWORD IMMEDIATELY after first login         ║
╚════════════════════════════════════════════════════════════════╝
```

---

## ✅ Test Scenarios (5-10 minutes)

### Test 1: Admin Dashboard Access

```bash
# 1. Get JWT token
curl -X POST https://localhost:7001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "delijah5415@gmail.com",
    "password": "xK7$mP9nL2zQ4vW@rT6fB1yJ"
  }'

# Response:
# {
#   "token": "eyJhbGciOiJIUzI1NiIs...",
#   "expiresIn": 7200
# }

# 2. Access dashboard
curl https://localhost:7001/api/admin/dashboard/data \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Expected: 
# {
#   "totalUsers": 0,
#   "totalSellers": 0,
#   "totalTransactions": 0,
#   "totalRevenue": 0,
#   "unresolvedFraudAlerts": [],
#   "activeIntegrations": 0
# }
```

✅ **Pass**: Returns dashboard data  
❌ **Fail**: Returns 403 Forbidden (master admin not seeded correctly)

---

### Test 2: Seller Registration

```bash
# Register a seller account
curl -X POST https://localhost:7001/api/accounts/seller/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}" \
  -d '{
    "storeName": "Tech Electronics Inc",
    "storeDescription": "Premium tech products",
    "storeEmail": "seller@example.com",
    "storePhone": "+1-555-0100",
    "payoutMethod": "bank_transfer",
    "payoutAccount": "1234567890"
  }'

# Expected:
# {
#   "id": "seller_abc123",
#   "userId": "user_123",
#   "storeName": "Tech Electronics Inc",
#   "status": "pending",  # Awaiting KYC
#   "kycVerified": false,
#   "createdAt": "2025-02-09T16:00:00Z"
# }
```

✅ **Pass**: Seller created with status="pending"  
❌ **Fail**: Returns 400 Bad Request (validation error)

---

### Test 3: Fraud Detection (Pre-Payment Check)

```bash
# Check fraud score before payment
curl -X POST https://localhost:7001/api/payments/fraud-check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}" \
  -d '{
    "sellerId": "seller_abc123",
    "amount": 100.00,
    "paymentMethod": "card"
  }'

# Expected (LOW RISK):
# {
#   "riskScore": 15,
#   "riskLevel": "Low",
#   "isBlocked": false,
#   "indicators": [],
#   "canProceed": true
# }
```

✅ **Pass**: Returns risk score <70 for legitimate purchase  
❌ **Fail**: Returns error or incorrect scoring

---

### Test 4: Card Payment (Stripe Live)

```bash
# Process card payment
curl -X POST https://localhost:7001/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}" \
  -d '{
    "sellerId": "seller_abc123",
    "amount": 50.00,
    "paymentMethod": "card",
    "cardToken": "tok_visa"  # Stripe token from client
  }'

# Expected:
# {
#   "success": true,
#   "transactionId": "txn_live_123456",
#   "reference": "pi_3MioceSMxR2a1E0N1234",
#   "fraudScore": 18,
#   "riskLevel": "Low",
#   "requiresManualReview": false,
#   "message": "Payment processed successfully"
# }
```

✅ **Pass**: payment.success=true, status="completed"  
❌ **Fail**: STRIPE_LIVE_API_KEY not set (using sandbox key)

---

### Test 5: Crypto Payment (On-Chain Verification)

```bash
# Process crypto payment
curl -X POST https://localhost:7001/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}" \
  -d '{
    "sellerId": "seller_abc123",
    "amount": 2.5,
    "paymentMethod": "crypto",
    "transactionHash": "0x7e3f9f7f3f7f3f7f3f7f3f7f3f7f3f7f3f7f3f7f3f7f3f7f3f7f3f7f3f7f3f7f"
  }'

# Expected:
# {
#   "success": true,
#   "transactionId": "txn_crypto_789",
#   "reference": "0x7e3f9f7f...",
#   "fraudScore": 45,
#   "riskLevel": "Medium",
#   "requiresManualReview": true,
#   "message": "Crypto payment verified on-chain"
# }
```

✅ **Pass**: transaction verified on blockchain  
❌ **Fail**: RPC endpoint not responding (check CRYPTO_RPC_URL)

---

### Test 6: PayPal Payment (Live)

```bash
# Process PayPal payment
curl -X POST https://localhost:7001/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}" \
  -d '{
    "sellerId": "seller_abc123",
    "amount": 75.50,
    "paymentMethod": "paypal",
    "paypalOrderId": "7C519041-7E81-4871-BCE6-5B549F5379C1"
  }'

# Expected:
# {
#   "success": true,
#   "transactionId": "txn_paypal_456",
#   "reference": "7C519041-7E81-4871-BCE6-5B549F5379C1",
#   "fraudScore": 22,
#   "riskLevel": "Low",
#   "message": "PayPal payment verified"
# }
```

✅ **Pass**: PayPal order confirmed  
❌ **Fail**: PAYPAL_LIVE_CLIENT_ID not configured

---

### Test 7: High-Risk Transaction (Auto-Block at 70+)

```bash
# Simulate transaction that triggers fraud detection
# Create multiple transactions rapidly, or try large amount

curl -X POST https://localhost:7001/api/payments/fraud-check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}" \
  -d '{
    "sellerId": "seller_high_chargeback",
    "amount": 50000.00,
    "paymentMethod": "card"
  }'

# Expected (HIGH RISK):
# {
#   "riskScore": 78,
#   "riskLevel": "Critical",
#   "isBlocked": true,
#   "indicators": [
#     "Exceeds buyer 30-day average by 5x",
#     "Seller has 8% chargeback rate",
#     "Transaction frequency > 50 in last 7 days"
#   ],
#   "canProceed": false,
#   "message": "Payment blocked due to fraud risk. Contact support@example.com"
# }

# Then try to process payment:
curl -X POST https://localhost:7001/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}" \
  -d '{
    "sellerId": "seller_high_chargeback",
    "amount": 50000.00,
    "paymentMethod": "card",
    "cardToken": "tok_visa"
  }'

# Expected: 
# {
#   "success": false,
#   "message": "Payment blocked: Fraud risk score (78) exceeds auto-block threshold (70)",
#   "fraudScore": 78,
#   "requiresManualReview": true
# }
```

✅ **Pass**: Transaction blocked before payment gateway  
❌ **Fail**: Transaction processed despite high risk (fraud detection not working)

---

### Test 8: Failed Payment → Recapture Campaign

```bash
# Initiate recapture for a failed/blocked transaction
curl -X POST https://localhost:7001/api/payments/recapture \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}" \
  -d '{
    "transactionId": "txn_blocked_123",
    "reason": "Fraud check resolved - retrying after manual review"
  }'

# Expected:
# {
#   "campaignId": "rcp_abc123",
#   "status": "active",
#   "originalAmount": 50000.00,
#   "maxAttempts": 3,
#   "currentAttempt": 1,
#   "nextRetryAt": "2025-02-09T18:00:00Z",
#   "retrySchedule": [
#     {"attempt": 1, "retryAt": "...", "backoffMinutes": 60},
#     {"attempt": 2, "retryAt": "...", "backoffMinutes": 120},
#     {"attempt": 3, "retryAt": "...", "backoffMinutes": 240}
#   ]
# }

# Get active recapture campaigns:
curl https://localhost:7001/api/payments/recapture/campaigns \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}"

# Expected:
# {
#   "campaigns": [
#     {
#       "campaignId": "rcp_abc123",
#       "status": "active",
#       "currentAttempt": 1,
#       "nextRetryAt": "2025-02-09T18:00:00Z"
#     }
#   ]
# }
```

✅ **Pass**: Recapture campaign created with 3 retry schedule  
❌ **Fail**: Campaign service returns error

---

### Test 9: Shipping Label Creation

```bash
# Create shipping label for order
curl -X POST https://localhost:7001/api/shipping/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {SELLER_JWT_TOKEN}" \
  -d '{
    "orderId": "order_123",
    "originAddress": "123 Warehouse St, Chicago, IL 60601",
    "destinationAddress": "456 Customer Ave, New York, NY 10001",
    "weightKg": 2.5,
    "carrierId": "dhl"
  }'

# Expected:
# {
#   "labelId": "lbl_abc123",
#   "trackingNumber": "DHL1739046300-K7M2Q",
#   "carrier": "DHL",
#   "estimatedDelivery": "2025-02-14",
#   "cost": 25.50,
#   "status": "pending"
# }
```

✅ **Pass**: Label created with tracking number  
❌ **Fail**: Carrier not found or validation error

---

### Test 10: Public Tracking (No Auth Required)

```bash
# Anyone can track without authentication
curl https://localhost:7001/api/shipping/tracking/DHL1739046300-K7M2Q

# Expected:
# {
#   "trackingNumber": "DHL1739046300-K7M2Q",
#   "carrier": "DHL",
#   "status": "pending",
#   "currentLocation": "Origin Facility, Chicago, IL",
#   "estimatedDelivery": "2025-02-14",
#   "events": [
#     {
#       "status": "pending",
#       "message": "Shipment created",
#       "timestamp": "2025-02-09T16:15:00Z"
#     }
#   ]
# }
```

✅ **Pass**: Public tracking accessible without auth  
❌ **Fail**: Returns 401 Unauthorized

---

### Test 11: External Integration Request

Partner website requests integration:

```bash
# POST to partner request endpoint
curl -X POST https://yourapp.com/api/external/request \
  -H "Content-Type: application/json" \
  -d '{
    "websiteName": "Partner Marketplace",
    "websiteUrl": "https://partner.example.com",
    "category": "marketplace",
    "requestPremium": true
  }'

# Expected (PENDING approval):
# {
#   "integrationId": "integ_123",
#   "apiKey": "sk_live_ABCDefghIJKlmnopQRSTu",
#   "status": "pending",
#   "message": "Integration request submitted. Awaiting admin approval."
# }
```

✅ **Pass**: Integration created in "pending" state  
❌ **Fail**: Returns 400 Bad Request

---

### Test 12: Admin Approves Integration

Master admin approves pending integration:

```bash
curl -X POST https://localhost:7001/api/external/admin/integ_123/approve \
  -H "Authorization: Bearer {MASTER_ADMIN_JWT_TOKEN}"

# Expected (APPROVED):
# {
#   "integrationId": "integ_123",
#   "status": "approved",
#   "isActive": true,
#   "apiKey": "sk_live_ABCDefghIJKlmnopQRSTu",
#   "monthlyRequestLimit": 100000,
#   "monthlyCost": 99.99,
#   "message": "Integration activated. Partner can now access API."
# }
```

✅ **Pass**: Integration now active, partner can call API  
❌ **Fail**: 403 Forbidden (not logged in as master admin)

---

### Test 13: Admin Audit Logging

Master admin views all their actions:

```bash
curl https://localhost:7001/api/admin/dashboard/audit-logs?days=30 \
  -H "Authorization: Bearer {MASTER_ADMIN_JWT_TOKEN}"

# Expected:
# {
#   "logs": [
#     {
#       "id": "audit_123",
#       "adminEmail": "delijah5415@gmail.com",
#       "actionType": "ApprovedIntegration",
#       "resourceType": "ExternalIntegration",
#       "resourceId": "integ_123",
#       "details": "Approved premium tier integration for Partner Marketplace",
#       "ipAddress": "192.168.1.100",
#       "success": true,
#       "createdAt": "2025-02-09T16:30:00Z"
#     },
#     {
#       "id": "audit_124",
#       "adminEmail": "delijah5415@gmail.com",
#       "actionType": "ViewedDashboard",
#       "resourceType": "Dashboard",
#       "ipAddress": "192.168.1.100",
#       "success": true,
#       "createdAt": "2025-02-09T16:25:00Z"
#     }
#   ]
# }
```

✅ **Pass**: All admin actions logged with IP + timestamp  
❌ **Fail**: Audit logs empty or missing actions

---

## 🔍 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Master admin can't login | Password not copied from console | Check console output during startup, save password |
| 403 Forbidden on admin dashboard | Wrong email address | Ensure using delijah5415@gmail.com (hardcoded) |
| Payment returns 500 error | Live API keys not configured | Check .env has STRIPE_LIVE_*, PAYPAL_LIVE_* |
| Card payment fails with "Invalid API Key" | Using test key instead of live key | Replace STRIPE_LIVE_API_KEY with actual live key |
| Crypto payment fails | RPC endpoint unreachable | Verify CRYPTO_RPC_URL is valid and reachable |
| Fraud score always 0 | Fraud detection service not registered | Check Program.cs has `AddScoped<IFraudDetectionService>` |
| Shipping label fails | Carrier not found in database | Database migration incomplete - run `dotnet ef database update` |
| Admin seeder doesn't run | AdminSeeder not registered | Verify AdminSeeder added to Program.cs |

---

## 📊 Performance Expectations

**After successful deployment, expect:**

| Metric | Target | Notes |
|--------|--------|-------|
| Dashboard load time | <200ms | With 100K+ transactions |
| Fraud risk calculation | <50ms | Real-time during payment |
| Shipping label generation | <100ms | Atomic transaction |
| Card payment (Stripe) | 1-3 seconds | Network dependent |
| Crypto payment (on-chain) | 15-30 seconds | Blockchain confirmation |
| PayPal payment | 2-5 seconds | PayPal API latency |
| API concurrent requests | 100+ | Asp.NET Core scaling |

---

## 🔐 Security Checklist

- [ ] HTTPS enforced in production
- [ ] All payment keys stored in .env (never in code)
- [ ] Master admin password changed immediately
- [ ] Database backups automated
- [ ] Audit logs reviewed daily
- [ ] Fraud alerts monitored continuously
- [ ] Rate limiting enabled (1K free / 100K premium)
- [ ] SSL certificates valid
- [ ] No test/sandbox keys in production
- [ ] Admin 2FA recommended (future feature)

---

## 📞 Support

- **Admin Email**: delijah5415@gmail.com
- **Support**: support@example.com
- **API Documentation**: See MARKETPLACE_ADMIN_GUIDE.md
- **Production Setup**: See MARKETPLACE_PRODUCTION_SETUP.md

---

**Status**: ✅ Ready for Production  
**Last Updated**: 2025-02-09
