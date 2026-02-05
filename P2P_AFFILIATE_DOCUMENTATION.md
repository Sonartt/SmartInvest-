# P2P Payment System & Affiliate Program Documentation

## Overview

SmartInvest now includes a comprehensive P2P (Peer-to-Peer) payment system with an integrated affiliate program. Every P2P transaction includes a $5 USD transaction cost that goes to the platform admin number (0114383762).

## Features

### P2P Payment System

- **$5 Transaction Fee**: Every P2P transfer includes a $5 USD fee
- **Multi-Currency Support**: USD, KES, NGN, GHS, ZAR
- **Real-time Processing**: Instant payment initiation via M-Pesa STK Push
- **Transaction Tracking**: Complete history of all P2P transfers
- **Affiliate Integration**: Optional affiliate code for commission tracking

### Affiliate Program

- **Three Tier System**: Bronze, Silver, Gold
- **Automatic Premium Access**: All affiliates get premium features
- **Commission Structure**:
  - Bronze: 10% of transaction fee ($0.50 per transaction)
  - Silver: 15% of transaction fee ($0.75 per transaction)
  - Gold: 20% of transaction fee ($1.00 per transaction)
- **Tier Upgrades**:
  - Silver: 10+ referrals
  - Gold: 50+ referrals

## Premium Features for Affiliates

All affiliates automatically receive:
- ✅ Premium Calculator Access
- ✅ P2P Transaction Commission
- ✅ Advanced Dashboard
- ✅ Referral Tracking
- ✅ Withdrawal Management
- ✅ API Access (Gold tier)
- ✅ Dedicated Support (Silver & Gold)

## API Endpoints

### P2P Payment Endpoints

#### Initiate P2P Payment
```
POST /api/p2p/initiate
```
**Request Body:**
```json
{
  "senderPhone": "+254712345678",
  "senderEmail": "sender@example.com",
  "recipientPhone": "+254798765432",
  "recipientEmail": "recipient@example.com",
  "amount": 10.00,
  "currency": "KES",
  "description": "Payment for services",
  "affiliateCode": "JOH4F2A9B"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "reference": "P2P-1738123456789-A1B2C3D4",
    "totalAmount": "1950.00",
    "recipientAmount": "1300.00",
    "transactionFee": "650.00",
    "currency": "KES",
    "platformNumber": "0114383762"
  },
  "message": "Payment initiated..."
}
```

#### Complete P2P Transaction
```
POST /api/p2p/complete
```
**Request Body:**
```json
{
  "reference": "P2P-1738123456789-A1B2C3D4",
  "mpesaReceipt": "QAB12CD3EF"
}
```

#### Get User Transactions
```
GET /api/p2p/transactions/:phone?email=user@example.com
```

#### Get All Transactions (Admin)
```
GET /api/p2p/admin/transactions?status=completed&fromDate=2026-01-01
```

#### Get Transaction Statistics (Admin)
```
GET /api/p2p/admin/stats
```

### Affiliate Program Endpoints

#### Register as Affiliate
```
POST /api/affiliate/register
```
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "country": "Kenya",
  "referredBy": "ABC123XYZ"
}
```

**Response:**
```json
{
  "success": true,
  "affiliate": {
    "code": "JOH4F2A9B",
    "tier": "bronze",
    "commissionRate": 0.10,
    "premiumAccess": true
  },
  "message": "Affiliate registration successful! Premium features unlocked."
}
```

#### Get Affiliate Dashboard
```
GET /api/affiliate/dashboard/:code
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "affiliate": {
      "code": "JOH4F2A9B",
      "name": "John Doe",
      "email": "john@example.com",
      "tier": "bronze",
      "status": "active"
    },
    "tier": {
      "name": "Bronze",
      "commissionRate": "10%",
      "features": ["P2P Commission", "Premium Calculator Access", "Basic Dashboard"]
    },
    "earnings": {
      "totalEarned": "25.50",
      "totalPaid": "0.00",
      "pending": "25.50",
      "availableForWithdrawal": "25.50",
      "currency": "USD"
    },
    "referrals": {
      "total": 5,
      "active": 5
    },
    "transactions": {
      "total": 51,
      "pending": 10,
      "paid": 41
    },
    "premiumAccess": true
  }
}
```

#### Get Commission History
```
GET /api/affiliate/commissions/:code?limit=50
```

#### Request Withdrawal
```
POST /api/affiliate/withdraw
```
**Request Body:**
```json
{
  "affiliateCode": "JOH4F2A9B",
  "amount": 25.00,
  "method": "mpesa"
}
```

#### Process Withdrawal (Admin)
```
POST /api/affiliate/admin/process-withdrawal
```
**Request Body:**
```json
{
  "affiliateCode": "JOH4F2A9B",
  "withdrawalId": "uuid-here",
  "status": "paid"
}
```

#### Get All Affiliates (Admin)
```
GET /api/affiliate/admin/all?tier=bronze&status=active
```

#### Upgrade Affiliate Tier
```
POST /api/affiliate/upgrade-tier/:code
```

## Frontend Implementation

### P2P Payment Interface

```html
<!-- Include the P2P payment interface -->
<script src="/public/js/p2p-payment-interface.js"></script>

<script>
// Initialize P2P payment interface
const p2pInterface = new P2PPaymentInterface({
  apiBase: '/api/p2p',
  platformNumber: '0114383762',
  transactionFee: 5.00,
  currency: 'USD',
  affiliateCode: null // or specific affiliate code
});

// Show payment modal
document.getElementById('sendMoneyBtn').addEventListener('click', () => {
  p2pInterface.showPaymentModal();
});

// Get transaction history
async function loadHistory() {
  const transactions = await p2pInterface.getTransactionHistory('+254712345678');
  console.log(transactions);
}
</script>
```

### Affiliate Dashboard

Access the affiliate dashboard at:
```
/affiliate-dashboard.html
```

Features:
- Login with affiliate code
- Register new affiliate account
- View earnings and statistics
- Request withdrawals
- Copy referral link
- View commission history

## Configuration

### Environment Variables

Add to `.env`:
```env
# Platform Configuration
PLATFORM_MPESA_NUMBER=0114383762
P2P_TRANSACTION_FEE=5.00

# M-Pesa Configuration (already configured)
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENV=sandbox
```

## Data Files

The system creates and maintains:
- `/data/p2p-transactions.json` - All P2P transactions
- `/data/affiliates.json` - Affiliate accounts and commissions

## Transaction Flow

1. **User initiates P2P payment**
   - Enters sender/recipient details
   - Specifies amount
   - Optionally adds affiliate code

2. **System calculates total**
   - Base amount + $5 transaction fee
   - Converts to local currency

3. **Payment processing**
   - M-Pesa STK Push sent to sender
   - Transaction recorded as "pending"

4. **M-Pesa confirmation**
   - User completes payment on phone
   - Callback received
   - Transaction marked "completed"

5. **Commission distribution**
   - If affiliate code provided:
     - Affiliate earns 10-20% of $5 fee
     - Commission marked as "pending"
   - Platform receives full $5 fee

6. **Withdrawal process**
   - Affiliates request withdrawal (min $10)
   - Admin processes within 1-3 business days
   - Payout via M-Pesa, Bank, or PayPal

## Security Features

- All admin endpoints protected with authentication
- Transaction validation and sanitization
- Affiliate code uniqueness enforced
- Minimum withdrawal amounts
- Audit trail for all transactions
- Premium access automatically granted to affiliates

## Usage Examples

### Example 1: Send $10 via P2P
```javascript
const result = await fetch('/api/p2p/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    senderPhone: '+254712345678',
    recipientPhone: '+254798765432',
    amount: 10.00,
    currency: 'KES'
  })
});
// User pays: 1950 KES (10 USD + 5 USD fee = 15 USD × 130 rate)
// Recipient gets: 1300 KES (10 USD × 130 rate)
// Platform gets: 650 KES (5 USD × 130 rate)
```

### Example 2: Register as Affiliate
```javascript
const result = await fetch('/api/affiliate/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+254723456789',
    country: 'Kenya'
  })
});
// Returns affiliate code: JAN8A4C2D
// Automatically grants premium access
```

### Example 3: P2P with Affiliate Commission
```javascript
const result = await fetch('/api/p2p/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    senderPhone: '+254712345678',
    recipientPhone: '+254798765432',
    amount: 10.00,
    currency: 'USD',
    affiliateCode: 'JAN8A4C2D'
  })
});
// Platform gets: $5.00 transaction fee
// Affiliate earns: $0.50 (10% of $5 for Bronze tier)
```

## Support

For questions or issues:
- Technical support: Contact admin
- Affiliate support: Access dashboard at `/affiliate-dashboard.html`
- Documentation: This file

## Version

**Version:** 1.0.0
**Last Updated:** February 3, 2026
**Platform:** SmartInvest Africa
