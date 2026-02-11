# SmartInvest Marketplace - Production Setup Guide

**Status**: Ready for go-live deployment  
**Master Admin**: delijah5415@gmail.com (hardcoded, no bypass)  
**Payment Mode**: LIVE ONLY (no sandbox/demo routes)  
**Database**: 31 new tables, 15 unique indexes, all compiled

---

## 🚀 Pre-Deployment Checklist

- [ ] Database migration created & applied
- [ ] Environment configuration (.env) - all payment API keys filled
- [ ] Master admin user seeded (delijah5415@gmail.com)
- [ ] Live payment routing tested (card → Stripe, crypto → on-chain, PayPal → live)
- [ ] Fraud detection thresholds validated (70 = auto-block, 50-70 = manual review)
- [ ] Admin dashboard accessible by master admin only
- [ ] Shipping label generation working
- [ ] External integration approval workflow tested
- [ ] Audit logging capturing all admin actions with IP address
- [ ] Recapture campaign automation tested
- [ ] Email notifications configured (fraud alerts, transaction confirmations)
- [ ] SSL/TLS certificates installed (HTTPS in production)
- [ ] Rate limiting configured (free tier 1K/month, premium 100K/month)

---

## 📋 Step 1: Database Migration

### Create Migration
```bash
cd /workspaces/SmartInvest-
dotnet ef migrations add Marketplace
```

This creates:
- 31 new tables in SQL Server
- 15 unique indexes for performance
- 10 decimal precision configs (18,2) for financial fields

### Apply Migration
```bash
dotnet ef database update
```

**Verify**: Check SQL Server for these tables:
- `MerchantAccounts`, `SellerAccounts`, `BuyerAccounts`, `AdminAccounts`
- `ExternalIntegrations`, `IntegrationWebhooks`, `IntegrationAuditLogs`
- `ShippingCarriers`, `ShippingRates`, `ShippingLabels`, `ShippingAdvices`
- `TransactionRecords`, `FraudDetectionScores`, `SafetyAlerts`, `BlacklistEntries`, `RecaptureCampaigns`
- `AdminAuditLogs`, `AdminDashboardMetrics`, `PlatformAnalytics`

---

## 🔑 Step 2: Environment Configuration

### Create `.env` file from template:
```bash
cp .env.example .env
```

### Payment API Keys (LIVE MODE ONLY)

#### Stripe Live
1. Go to [stripe.com](https://stripe.com) → Dashboard
2. Copy **Live** API keys (not test keys!)
3. Set in `.env`:
```
STRIPE_LIVE_API_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_LIVE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

#### PayPal Live
1. Go to [paypal.com/developer](https://developer.paypal.com)
2. Navigate to **Studio** → **Apps & Credentials**
3. Switch to **Live** tab (not Sandbox!)
4. Copy Client ID & Secret
5. Set in `.env`:
```
PAYPAL_LIVE_CLIENT_ID=xxxxxxxx
PAYPAL_LIVE_SECRET=xxxxxxxx
```

#### Cryptocurrency (On-Chain)
1. Choose RPC provider:
   - **Infura** (Ethereum): https://infura.io
   - **Alchemy** (Multi-chain): https://alchemy.com
   - **Ankr** (All chains): https://ankr.com
2. Create Live project (not testnet!)
3. Set in `.env`:
```
CRYPTO_RPC_URL=https://mainnet.infura.io/v3/{YOUR_PROJECT_ID}
CRYPTO_CHAIN_ID=1  # Ethereum mainnet
CRYPTO_TREASURY_ADDRESS=0xYourTreasuryWalletAddress
CRYPTO_USD_RATE=3200  # Current ETH price
```

#### Master Admin Email
```
ADMIN_EMAIL=delijah5415@gmail.com
```
⚠️ **This is hardcoded in AdminDashboardService.cs** - Only this email can access admin dashboard.

### Fraud Detection Configuration
```
FRAUD_CHECK_ENABLED=true
FRAUD_BLOCK_THRESHOLD=70        # Automatic block
FRAUD_REVIEW_THRESHOLD=50       # Manual review flag
```

### External Integration Quotas
```
FREE_TIER_MONTHLY_REQUESTS=1000
PREMIUM_TIER_MONTHLY_REQUESTS=100000
PREMIUM_SUBSCRIPTION_COST=99.99
```

### Shipping Configuration
```
SHIPPING_CARRIERS_ENABLED=true
SHIPPING_LABEL_EXPIRY_DAYS=30
```

---

## 👤 Step 3: Seed Master Admin

### Option A: Entity Framework Seeding

Create `Data/Seeders/AdminSeeder.cs`:

```csharp
using Microsoft.AspNetCore.Identity;
using SmartInvest.Models.Entities.Marketplace;
using SmartInvest.Data;

namespace SmartInvest.Data.Seeders;

public class AdminSeeder
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;

    public AdminSeeder(UserManager<ApplicationUser> userManager, ApplicationDbContext context, IConfiguration config)
    {
        _userManager = userManager;
        _context = context;
        _config = config;
    }

    public async Task SeedMasterAdminAsync()
    {
        var adminEmail = _config["ADMIN_EMAIL"] ?? "delijah5415@gmail.com";
        
        // Check if admin already exists
        var existingUser = await _userManager.FindByEmailAsync(adminEmail);
        if (existingUser != null)
        {
            Console.WriteLine($"✓ Master admin {adminEmail} already exists");
            return;
        }

        // Create ApplicationUser
        var adminUser = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true,
            FullName = "Master Administrator",
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(adminUser, "SecureAdminPassword123!");
        if (!result.Succeeded)
        {
            Console.WriteLine($"✗ Failed to create admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            return;
        }

        // Add to Admin role
        await _userManager.AddToRoleAsync(adminUser, "Admin");

        // Create AdminAccount with full permissions
        var adminAccount = new AdminAccount
        {
            UserId = adminUser.Id,
            AdminEmail = adminEmail,
            FullName = "Master Administrator",
            Role = "Master Admin",
            CanViewDashboard = true,
            CanManageUsers = true,
            CanManageTransactions = true,
            CanManagePayments = true,
            CanManageIntegrations = true,
            CanViewAnalytics = true,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.AdminAccounts.Add(adminAccount);
        await _context.SaveChangesAsync();

        Console.WriteLine($"✓ Master admin created successfully: {adminEmail}");
        Console.WriteLine($"  - All permissions granted");
        Console.WriteLine($"  - Account is active");
        Console.WriteLine($"\n⚠️  IMPORTANT: Change password immediately after first login!");
    }
}
```

### Update `Program.cs` to run seeder:

Add after `app.UseAuthentication()`:
```csharp
// Seed master admin
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<AdminSeeder>();
    await seeder.SeedMasterAdminAsync();
}
```

Register seeder in DI:
```csharp
builder.Services.AddScoped<AdminSeeder>();
```

### Run Application
```bash
dotnet run
```

The seeder will:
1. Check if admin already exists
2. Create ApplicationUser with email `delijah5415@gmail.com`
3. Create AdminAccount with all permissions enabled
4. Output confirmation to console

---

## 🧪 Step 4: Test Live Payment Routing

### Test Card Payment (Stripe Live)

```bash
curl -X POST https://localhost:7001/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -d '{
    "sellerId": "seller_id_here",
    "amount": 100.00,
    "paymentMethod": "card",
    "cardToken": "tok_visa"  # Stripe token from client
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "transactionId": "txn_1234567890",
  "reference": "stripe_pi_123456",
  "fraudScore": 18,
  "riskLevel": "Low",
  "requiresManualReview": false,
  "message": "Payment processed successfully"
}
```

### Test Crypto Payment (On-Chain)

```bash
curl -X POST https://localhost:7001/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -d '{
    "sellerId": "seller_id_here",
    "amount": 5.5,
    "paymentMethod": "crypto",
    "transactionHash": "0xabc123..."  # User's blockchain tx hash
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "transactionId": "txn_9876543210",
  "reference": "0xabc123...",
  "fraudScore": 45,
  "riskLevel": "Medium",
  "requiresManualReview": true,
  "message": "Crypto payment verified on-chain"
}
```

### Test PayPal Payment (Live)

```bash
curl -X POST https://localhost:7001/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -d '{
    "sellerId": "seller_id_here",
    "amount": 50.00,
    "paymentMethod": "paypal",
    "paypalOrderId": "7C519041-7E81-4871-BCE6-5B549F5379C1"
  }'
```

### Pre-Payment Fraud Check

```bash
curl -X POST https://localhost:7001/api/payments/fraud-check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -d '{
    "sellerId": "seller_id_here",
    "amount": 1000.00,
    "paymentMethod": "card"
  }'
```

**Response (if HIGH RISK)**:
```json
{
  "riskScore": 72,
  "riskLevel": "Critical",
  "isBlocked": true,
  "indicators": [
    "Exceeds buyer 30-day average by 5x",
    "Seller has 6% chargeback rate",
    "Transaction frequency > 50 in last 7 days"
  ],
  "message": "Payment blocked due to fraud risk. Contact support@example.com"
}
```

---

## 👥 Step 5: Register First Seller & Buyer

### Seller Registration

```bash
curl -X POST https://localhost:7001/api/accounts/seller/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {SELLER_JWT_TOKEN}" \
  -d '{
    "storeName": "Tech Gadgets Store",
    "storeDescription": "Premium electronics and accessories",
    "storeEmail": "seller@techstore.com",
    "storePhone": "+1-555-0100",
    "payoutMethod": "bank_transfer",
    "payoutAccount": "1234567890"
  }'
```

### Buyer Registration

```bash
curl -X POST https://localhost:7001/api/accounts/buyer/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}" \
  -d '{
    "shippingAddress": "123 Main St, City, State 12345",
    "billingAddress": "123 Main St, City, State 12345",
    "preferredPaymentMethod": "card"
  }'
```

---

## 📊 Step 6: Access Admin Dashboard

### Login as Master Admin

1. Navigate to: `https://yourapp.com/login`
2. Use `delijah5415@gmail.com`
3. Use password from seeder step

### Admin Dashboard Endpoints

**Get Dashboard Data**:
```bash
curl https://localhost:7001/api/admin/dashboard/data \
  -H "Authorization: Bearer {ADMIN_JWT_TOKEN}"
```

**Response**:
```json
{
  "totalUsers": 150,
  "totalSellers": 25,
  "totalBuyers": 125,
  "totalTransactions": 342,
  "totalRevenue": 45230.50,
  "unresolvedFraudAlerts": [
    {
      "id": "alert_123",
      "buyerId": "buyer_1",
      "amount": 5000,
      "riskScore": 78,
      "createdAt": "2025-02-09T14:30:00Z"
    }
  ],
  "topSellers": [
    {
      "id": "seller_1",
      "storeName": "Premium Electronics",
      "totalRevenue": 12500.00,
      "averageRating": 4.8
    }
  ],
  "recentRegistrations": [
    {
      "id": "user_456",
      "email": "newuser@example.com",
      "registeredAt": "2025-02-09T10:15:00Z"
    }
  ],
  "activeIntegrations": 7
}
```

**View Audit Logs** (last 30 days):
```bash
curl https://localhost:7001/api/admin/dashboard/audit-logs?days=30 \
  -H "Authorization: Bearer {ADMIN_JWT_TOKEN}"
```

**Get Platform Analytics**:
```bash
curl https://localhost:7001/api/admin/dashboard/analytics \
  -H "Authorization: Bearer {ADMIN_JWT_TOKEN}"
```

**Grant Admin Access** (master admin only):
```bash
curl -X POST https://localhost:7001/api/admin/dashboard/users/newadmin@example.com/grant-access \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {MASTER_ADMIN_JWT_TOKEN}" \
  -d '{
    "role": "Admin",
    "fullName": "John Admin",
    "permissions": {
      "canViewDashboard": true,
      "canManageUsers": true,
      "canManageTransactions": true,
      "canManagePayments": true,
      "canManageIntegrations": true,
      "canViewAnalytics": true
    }
  }'
```

---

## 🔒 Step 7: Security Hardening

### 1. Force HTTPS in Production

In `Program.cs`:
```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();  // Strict-Transport-Security header
}
app.UseHttpsRedirection();
```

### 2. Enable Admin Access Logging

All admin actions are automatically logged to `AdminAuditLogs` table:
- **Who**: Admin email
- **What**: Action type (ViewDashboard, ManageUsers, GrantAccess, etc.)
- **When**: Timestamp (UTC)
- **Where**: IP address of request
- **Why**: Resource type + resource ID
- **Result**: Success/failure + error message

### 3. Rate Limiting for External Integrations

Free tier:
- **1,000 requests/month**
- Auto-reset on 1st of each month
- 429 Too Many Requests when exceeded

Premium tier:
- **100,000 requests/month**
- Cost: $99.99/month
- Per-second throttle: 10 requests/sec

### 4. Fraud Detection - Auto-Block at Score 70+

Real-time triggers during payment processing:
- **≥70**: Payment **BLOCKED immediately**, requires manual review
- **50-69**: Payment processed with **MANUAL REVIEW FLAG**
- **<50**: Payment processed normally

Risk factors checked:
1. Blacklist status (user + IP)
2. Transaction frequency (>50 in 7 days)
3. Daily spending limit (>$50K)
4. Amount deviation (>5x buyer's average)
5. Seller chargeback rate (>5%)
6. Payment method (crypto = higher risk)
7. Buyer account age (new = higher risk)
8. Shipping distance (unusual = higher risk)

### 5. Seller KYC Before Activation

Sellers cannot accept payments until:
- [ ] Identity document verified
- [ ] Proof of address verified
- [ ] Business registration verified (if merchant)

Endpoint to submit KYC:
```bash
curl -X POST https://localhost:7001/api/accounts/seller/kyc-submit \
  -H "Authorization: Bearer {SELLER_JWT_TOKEN}" \
  -F "identityDocument=@passport.pdf" \
  -F "proofOfAddress=@utility_bill.pdf" \
  -F "businessRegistration=@registration.pdf"
```

---

## 📦 Step 8: Shipping Integration

### Create Shipping Label

```bash
curl -X POST https://localhost:7001/api/shipping/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {SELLER_JWT_TOKEN}" \
  -d '{
    "orderId": "order_123",
    "originAddress": "123 Warehouse St, City, State 12345",
    "destinationAddress": "456 Customer Ave, City, State 67890",
    "weightKg": 2.5,
    "carrierId": "dhl"
  }'
```

**Response**:
```json
{
  "labelId": "lbl_123456",
  "trackingNumber": "DHL1739046230-A7B9C",
  "carrier": "DHL",
  "estimatedDelivery": "2025-02-15",
  "cost": 25.50,
  "status": "pending"
}
```

### Add Shipping Advice (Status Update)

```bash
curl -X POST https://localhost:7001/api/shipping/labels/lbl_123456/advice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {SELLER_JWT_TOKEN}" \
  -d '{
    "status": "in_transit",
    "message": "Package picked up from warehouse"
  }'
```

### Public Tracking

```bash
# Anyone can track without authentication
curl https://localhost:7001/api/shipping/tracking/DHL1739046230-A7B9C
```

**Response**:
```json
{
  "trackingNumber": "DHL1739046230-A7B9C",
  "carrier": "DHL",
  "status": "in_transit",
  "currentLocation": "Distribution Center, Chicago, IL",
  "estimatedDelivery": "2025-02-15",
  "events": [
    {
      "status": "pending",
      "message": "Shipment created",
      "timestamp": "2025-02-09T10:00:00Z"
    },
    {
      "status": "in_transit",
      "message": "Package picked up from warehouse",
      "timestamp": "2025-02-09T14:30:00Z"
    }
  ]
}
```

---

## 🔄 Step 9: Failed Payment Recapture

### Initiate Recapture Campaign

When a payment fails (fraud block, gateway error, etc.):

```bash
curl -X POST https://localhost:7001/api/payments/recapture \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}" \
  -d '{
    "transactionId": "txn_failed_123",
    "reason": "Fraud block - retrying after manual review approval"
  }'
```

**Response**:
```json
{
  "campaignId": "rcp_456",
  "transactionId": "txn_failed_123",
  "status": "active",
  "originalAmount": 150.00,
  "maxAttempts": 3,
  "currentAttempt": 1,
  "nextRetryAt": "2025-02-09T15:30:00Z",
  "retrySchedule": [
    {"attempt": 1, "retryAt": "2025-02-09T15:30:00Z", "backoffMinutes": 60},
    {"attempt": 2, "retryAt": "2025-02-09T17:30:00Z", "backoffMinutes": 120},
    {"attempt": 3, "retryAt": "2025-02-09T21:30:00Z", "backoffMinutes": 240}
  ]
}
```

Automatic retries happen at:
- **Attempt 1**: 1 hour after failure
- **Attempt 2**: 2 hours after attempt 1
- **Attempt 3**: 4 hours after attempt 2

### Get Recapture Campaigns

```bash
curl https://localhost:7001/api/payments/recapture/campaigns \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}"
```

---

## 🤝 Step 10: External Integration Approval Workflow

### Partner Requests Integration

Partner website calls:
```bash
curl -X POST https://yourapp.com/api/external/request \
  -H "Content-Type: application/json" \
  -d '{
    "websiteName": "E-Commerce Partner",
    "websiteUrl": "https://ecommerce-partner.com",
    "category": "marketplace",
    "requestPremium": true
  }'
```

**Response**:
```json
{
  "integrationId": "integ_789",
  "apiKey": "sk_live_abc123def456",
  "status": "pending",
  "message": "Integration request approved. Awaiting admin approval for activation."
}
```

### Admin Approves Integration

Master admin calls:
```bash
curl -X POST https://localhost:7001/api/external/admin/integ_789/approve \
  -H "Authorization: Bearer {MASTER_ADMIN_JWT_TOKEN}"
```

**Response**:
```json
{
  "integrationId": "integ_789",
  "status": "approved",
  "isActive": true,
  "apiKey": "sk_live_abc123def456",
  "monthlyRequestLimit": 100000,
  "monthlyCost": 99.99,
  "subscriptionStartDate": "2025-02-09T15:45:00Z",
  "message": "Integration activated. Partner can now access API."
}
```

### Partner Validates API Key

```bash
curl -X POST https://yourapp.com/api/external/verify/sk_live_abc123def456
```

**Response**:
```json
{
  "isValid": true,
  "integrationName": "E-Commerce Partner",
  "tier": "premium",
  "isActive": true
}
```

### Partner Checks Rate Limit

```bash
curl -X POST https://yourapp.com/api/external/check-request-limit \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk_live_abc123def456"
  }'
```

**Response**:
```json
{
  "canContinue": true,
  "requestsThisMonth": 5230,
  "requestsRemaining": 94770,
  "monthlyLimit": 100000,
  "resetAt": "2025-03-01T00:00:00Z"
}
```

---

## 🛑 Step 11: Fraud Prevention & Blacklist

### Create Blacklist Entry

Master admin can blacklist user or IP:

```bash
curl -X POST https://localhost:7001/api/admin/blacklist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {MASTER_ADMIN_JWT_TOKEN}" \
  -d '{
    "targetType": "user_email",
    "targetValue": "fraudster@example.com",
    "reason": "Multiple chargeback attempts",
    "durationDays": 30
  }'
```

**Effects**:
- All transactions from this user **blocked immediately**
- Fraud score = 100 (critical)
- Auto-triggers safety alert
- Logged to AdminAuditLog

### Manual Fraud Check

Before processing large transactions, check fraud score:

```bash
curl -X POST https://localhost:7001/api/payments/fraud-check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {BUYER_JWT_TOKEN}" \
  -d '{
    "sellerId": "seller_123",
    "amount": 5000.00,
    "paymentMethod": "card"
  }'
```

If score ≥70, payment will be **auto-blocked** even after attempting `POST /api/payments/process`.

---

## 📞 Step 12: Notification Configuration

### Email Notifications (Configure SMTP in `.env`)

```
SMTP_HOST=smtp.sendgrid.com
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD={YOUR_SENDGRID_API_KEY}
FROM_EMAIL=noreply@yourapp.com
```

Automatic emails sent for:
- Transaction confirmation (buyer + seller)
- Shipping status updates
- Fraud alerts (admin + seller)
- Recapture notifications
- Integration approval (partner)
- Admin action confirmations

---

## 🚀 Deployment Checklist

### Pre-Launch
- [ ] All configuration keys filled in `.env`
- [ ] Database migration applied
- [ ] Master admin seeded
- [ ] SSL certificates installed
- [ ] HTTPS enforced
- [ ] Logging configured (Application Insights, CloudWatch, etc.)
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

### Launch
- [ ] Test all payment methods (Stripe, PayPal, Crypto live)
- [ ] Test fraud detection (try high-risk scenarios)
- [ ] Verify audit logging
- [ ] Confirm admin dashboard accessible
- [ ] Test seller KYC submission
- [ ] Test shipping label creation
- [ ] Test external integration workflow
- [ ] Load test with expected traffic

### Post-Launch
- [ ] Monitor fraud score distribution
- [ ] Track payment success rates
- [ ] Monitor API latency
- [ ] Review admin audit logs daily
- [ ] Backup database daily
- [ ] Implement incident response procedures

---

## 📞 Support Contact

For API integration support or technical questions:
- Admin: delijah5415@gmail.com
- Support: support@example.com
- Emergency: +1-555-URGENT

---

**Last Updated**: 2025-02-09  
**Version**: 1.0 - Production Ready
