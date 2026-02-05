# P2P Payment System & Affiliate Program - Quick Start Guide

## 🚀 What's New

SmartInvest now includes:

1. **P2P Payment System** - Send money peer-to-peer with a $5 transaction fee
2. **Affiliate Program** - Earn commissions and get premium access
3. **Premium Features** - All affiliates get automatic premium access

## 💰 Transaction Costs

**Every P2P transfer includes:**
- Base amount (what recipient receives)
- $5 USD transaction fee (goes to platform number: 0114383762)
- Total = Base Amount + $5

**Example:**
```
Sending $10 USD:
- Recipient receives: $10.00
- Transaction fee: $5.00
- You pay total: $15.00
```

## 🎯 Affiliate Program

### Benefits
✅ **Automatic Premium Access** - Full calculator suite
✅ **Earn Commissions** - 10-20% of transaction fees
✅ **Advanced Dashboard** - Track earnings and referrals
✅ **Withdrawal System** - Cash out your earnings

### Commission Tiers

| Tier   | Referrals | Commission Rate | Per Transaction |
|--------|-----------|-----------------|-----------------|
| Bronze | 0+        | 10%             | $0.50           |
| Silver | 10+       | 15%             | $0.75           |
| Gold   | 50+       | 20%             | $1.00           |

## 🔗 Access Points

### For Users
- **Dashboard**: [/dashboard.html](/dashboard.html) - Click "💸 Send Money P2P"
- **Direct P2P**: Use the P2P payment interface anywhere

### For Affiliates
- **Affiliate Dashboard**: [/affiliate-dashboard.html](/affiliate-dashboard.html)
- **Registration**: Sign up at affiliate dashboard
- **Login**: Use your affiliate code

## 📱 How to Use P2P Payments

### Step 1: Access P2P Interface
```javascript
// From dashboard
Click "💸 Send Money P2P" in sidebar

// Or programmatically
const p2p = new P2PPaymentInterface();
p2p.showPaymentModal();
```

### Step 2: Fill Payment Details
- Your phone number
- Recipient phone number
- Amount to send
- Currency (KES, USD, NGN, GHS, ZAR)
- Optional: Affiliate code (support an affiliate)

### Step 3: Confirm & Pay
- Review total amount (includes $5 fee)
- Click "Initiate Payment"
- Complete M-Pesa payment on your phone

## 🎁 Become an Affiliate

### Registration
1. Go to [/affiliate-dashboard.html](/affiliate-dashboard.html)
2. Click "Register" tab
3. Fill in:
   - Full Name
   - Email
   - Phone Number
   - Country
   - Referral Code (optional)
4. Submit

### What You Get
- Unique affiliate code (e.g., `JOH4F2A9B`)
- Premium calculator access
- Commission on all referred P2P transactions
- Personal dashboard

### Share Your Link
```
https://smartinvest.africa/signup.html?ref=YOUR_CODE
```

## 💸 Withdrawing Earnings

### Requirements
- Minimum: $10 USD
- Available balance (Total Earned - Total Paid)

### Process
1. Login to affiliate dashboard
2. Navigate to "Withdraw Earnings"
3. Enter amount
4. Select method (M-Pesa, Bank, PayPal)
5. Submit request
6. Admin processes within 1-3 business days

## 🔌 API Integration

### P2P Endpoints

#### Initiate Payment
```bash
POST /api/p2p/initiate
Content-Type: application/json

{
  "senderPhone": "+254712345678",
  "recipientPhone": "+254798765432",
  "amount": 10.00,
  "currency": "USD",
  "affiliateCode": "JOH4F2A9B"
}
```

#### Get Transaction History
```bash
GET /api/p2p/transactions/:phone?email=user@example.com
```

### Affiliate Endpoints

#### Register
```bash
POST /api/affiliate/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "country": "Kenya"
}
```

#### Get Dashboard
```bash
GET /api/affiliate/dashboard/:affiliateCode
```

#### Request Withdrawal
```bash
POST /api/affiliate/withdraw
Content-Type: application/json

{
  "affiliateCode": "JOH4F2A9B",
  "amount": 25.00,
  "method": "mpesa"
}
```

## 🛠️ Configuration

### Environment Variables

Add to `.env`:
```env
# Platform Configuration
PLATFORM_MPESA_NUMBER=0114383762
P2P_TRANSACTION_FEE=5.00

# Already configured
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENV=sandbox
```

### Server Integration

The system auto-integrates when server starts. No additional setup needed.

## 📊 Admin Features

### View All P2P Transactions
```bash
GET /api/p2p/admin/transactions?status=completed
Authorization: Basic [admin credentials]
```

### View All Affiliates
```bash
GET /api/affiliate/admin/all?tier=bronze&status=active
Authorization: Basic [admin credentials]
```

### Process Withdrawals
```bash
POST /api/affiliate/admin/process-withdrawal
Authorization: Basic [admin credentials]
Content-Type: application/json

{
  "affiliateCode": "JOH4F2A9B",
  "withdrawalId": "uuid-here",
  "status": "paid"
}
```

### Transaction Statistics
```bash
GET /api/p2p/admin/stats
Authorization: Basic [admin credentials]
```

## 🎨 Frontend Integration

### Add P2P Button to Any Page

```html
<!-- Include the script -->
<script src="/public/js/p2p-payment-interface.js"></script>

<!-- Add button -->
<button onclick="showP2P()">Send Money P2P</button>

<script>
  const p2p = new P2PPaymentInterface({
    platformNumber: '0114383762',
    transactionFee: 5.00
  });
  
  function showP2P() {
    p2p.showPaymentModal();
  }
</script>
```

### Check Affiliate Status

```javascript
// Get affiliate code from URL
const params = new URLSearchParams(window.location.search);
const refCode = params.get('ref');

// Store for commission tracking
if (refCode) {
  localStorage.setItem('affiliateRef', refCode);
}

// Use in P2P payments
const storedRef = localStorage.getItem('affiliateRef');
const p2p = new P2PPaymentInterface({
  affiliateCode: storedRef
});
```

## 📈 Premium Features for Affiliates

All affiliates automatically receive:

### Calculator Access
- Investment Calculator ✅
- Amortization/Loan Schedules ✅
- Insurance Premium Calculation ✅
- **Bond Valuation & Analysis** ✅
- **Pension/Retirement Planning** ✅
- **Actuarial Science Tools** ✅
- **Risk Analysis (VaR, Sharpe)** ✅
- **Business Finance (NPV, IRR)** ✅
- **Audit Tools & Fraud Detection** ✅

### Dashboard Features
- Real-time commission tracking
- Referral management
- Withdrawal system
- Transaction history
- Performance analytics

## 🔒 Security

- All admin endpoints require authentication
- Transaction validation and sanitization
- Affiliate code uniqueness enforced
- Audit trails for all transactions
- Secure withdrawal processing

## 📞 Support

### For Users
- Email: support@smartinvest.africa
- Phone: +254 (0) 114 383 762

### For Affiliates
- Affiliate Dashboard: [/affiliate-dashboard.html](/affiliate-dashboard.html)
- Commission Questions: Contact admin
- Technical Support: Via dashboard

## 🚦 Getting Started Checklist

### For Regular Users
- [ ] Access dashboard at `/dashboard.html`
- [ ] Click "💸 Send Money P2P"
- [ ] Complete first P2P transfer
- [ ] Check transaction history

### For Affiliates
- [ ] Register at `/affiliate-dashboard.html`
- [ ] Receive unique affiliate code
- [ ] Share referral link
- [ ] Track first commission
- [ ] Request first withdrawal (min $10)

### For Admins
- [ ] Monitor transactions at `/api/p2p/admin/transactions`
- [ ] View affiliate list at `/api/affiliate/admin/all`
- [ ] Process withdrawal requests
- [ ] Review transaction statistics

## 🎯 Success Metrics

### User Activity
- Total P2P transactions
- Transaction volume
- Average transaction size
- Active users

### Affiliate Performance
- Total affiliates registered
- Commission paid
- Average earnings per affiliate
- Top performers

### Revenue
- Platform fees collected ($5 per transaction)
- Net revenue after commissions
- Growth rate
- User retention

## 📝 Next Steps

1. **Launch P2P System**: Test payment flow
2. **Recruit Affiliates**: Share registration link
3. **Monitor Performance**: Track metrics
4. **Scale**: Add features based on feedback

## 🔗 Important Links

- Main Dashboard: `/dashboard.html`
- Affiliate Dashboard: `/affiliate-dashboard.html`
- API Documentation: `/P2P_AFFILIATE_DOCUMENTATION.md`
- Premium Calculator: `/calculator.html`
- Support: `/contact.html`

---

**Version:** 1.0.0  
**Last Updated:** February 3, 2026  
**Platform:** SmartInvest Africa  
**Support:** support@smartinvest.africa
