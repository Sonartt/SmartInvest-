# Environment Configuration Guide

This document outlines all required environment variables and configuration files for the SmartInvest Africa application.

## Files Overview

### Environment Files
- **`.env`** - Main environment variables (auto-loaded by Node.js server.js)
- **`.env.example`** - Template with default values and comments
- **`.env.security`** - Additional security-specific configurations
- **`appsettings.Development.json`** - .NET development configuration
- **`appsettings.Production.json`** - .NET production configuration

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update payment credentials:**
   - Set your M-Pesa API keys
   - Configure platform payment number
   - Set admin credentials

3. **Configure payment systems:**
   - Enable/disable features as needed
   - Adjust pricing for your region
   - Set fee structures

## Environment Variables

### Core Application
```env
PORT=3000                    # Server port
NODE_ENV=development        # Environment mode (development/production)
LOG_LEVEL=info             # Logging level (debug/info/warn/error)
BASE_URL=https://smartinvest.vercel.app  # Production URL
APP_URL=http://localhost:3000            # Application URL
```

### Payment Platform Configuration
```env
# Main platform payment number (receives all payments)
PLATFORM_MPESA_NUMBER=0114383762
PLATFORM_PAYMENT_NAME=SmartInvest Africa
```

### P2P Payment System
```env
# Enable/Disable P2P
P2P_ENABLED=true
P2P_MIN_AMOUNT=1
P2P_MAX_AMOUNT=100000
P2P_PLATFORM_NUMBER=0114383762

# Dynamic Tiered Fee Structure
P2P_FEE_TIER1_MAX=10          # Up to $10
P2P_FEE_TIER1_FLAT=0.50       # $0.50 flat fee
P2P_FEE_TIER1_PERCENT=5       # + 5%

P2P_FEE_TIER2_MAX=50          # $10 - $50
P2P_FEE_TIER2_FLAT=1.00
P2P_FEE_TIER2_PERCENT=4

P2P_FEE_TIER3_MAX=100         # $50 - $100
P2P_FEE_TIER3_FLAT=2.00
P2P_FEE_TIER3_PERCENT=3

P2P_FEE_TIER4_MAX=500         # $100 - $500
P2P_FEE_TIER4_FLAT=3.00
P2P_FEE_TIER4_PERCENT=2.5

# Over $500
P2P_FEE_TIER5_FLAT=5.00
P2P_FEE_TIER5_PERCENT=2
```

### Affiliate Program
```env
# Enable/Disable Affiliate Program
AFFILIATE_ENABLED=true
AFFILIATE_MIN_WITHDRAWAL=10

# Commission Rates (percentage of P2P fees)
AFFILIATE_COMMISSION_BRONZE=10    # 10%
AFFILIATE_COMMISSION_SILVER=15    # 15%
AFFILIATE_COMMISSION_GOLD=20      # 20%

# Auto Premium Access for Affiliates
AFFILIATE_AUTO_PREMIUM=true
AFFILIATE_PREMIUM_DURATION_DAYS=365
```

### Ads Payment System
```env
# Enable/Disable Ads System
ADS_ENABLED=true
ADS_PLATFORM_NUMBER=0114383762
ADS_ADMIN_APPROVAL_REQUIRED=true
ADS_DEFAULT_DISPLAY_DURATION=10000  # 10 seconds

# Banner Ads Pricing (USD)
ADS_BANNER_DAY=5
ADS_BANNER_WEEK=30
ADS_BANNER_MONTH=100
ADS_BANNER_QUARTER=250
ADS_BANNER_YEAR=900

# Featured Listings Pricing (USD)
ADS_FEATURED_DAY=10
ADS_FEATURED_WEEK=60
ADS_FEATURED_MONTH=200
ADS_FEATURED_QUARTER=500
ADS_FEATURED_YEAR=1800

# Popup Ads Pricing (USD)
ADS_POPUP_DAY=15
ADS_POPUP_WEEK=90
ADS_POPUP_MONTH=300
ADS_POPUP_QUARTER=750
ADS_POPUP_YEAR=2500

# Sponsored Content Pricing (USD)
ADS_SPONSORED_WEEK=100
ADS_SPONSORED_MONTH=350
ADS_SPONSORED_QUARTER=900
ADS_SPONSORED_YEAR=3000

# Video Ads Pricing (USD)
ADS_VIDEO_DAY=20
ADS_VIDEO_WEEK=120
ADS_VIDEO_MONTH=400
ADS_VIDEO_QUARTER=1000
ADS_VIDEO_YEAR=3500
```

### Premium Subscriptions
```env
PREMIUM_ENABLED=true
PREMIUM_MONTHLY_PRICE=9.99
PREMIUM_ANNUAL_PRICE=99.99
PREMIUM_PLATFORM_NUMBER=0114383762
```

### Currency Exchange Rates
```env
EXCHANGE_RATE_KES_USD=0.0065
EXCHANGE_RATE_USD_KES=130
EXCHANGE_RATE_USD_NGN=750
EXCHANGE_RATE_USD_GHS=12
EXCHANGE_RATE_USD_ZAR=18.5
```

### JWT & Security
```env
JWT_SECRET=your_key_32_chars_min    # JWT signing key (minimum 32 chars)
SESSION_SECRET=your_session_secret_here
BCRYPT_ROUNDS=10
CORS_ENABLED=true
CORS_ORIGIN=*
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000         # Rate limit window (15 min default)
RATE_LIMIT_MAX_REQUESTS=100         # Max requests per window
```

### M-Pesa Payment Integration
```env
MPESA_ENV=sandbox                          # Environment (sandbox/production)
MPESA_CONSUMER_KEY=your_key               # Daraja consumer key
MPESA_CONSUMER_SECRET=your_secret         # Daraja consumer secret
MPESA_PASSKEY=your_passkey                # M-Pesa passkey
MPESA_NUMBER=0114383762                   # M-Pesa shortcode
MPESA_SHORTCODE=your_shortcode            # Business shortcode
MPESA_PAYBILL=your_paybill                # Paybill number (if using)
MPESA_ACCOUNT_REF=SmartInvest             # Account reference
MPESA_CALLBACK_URL=https://domain/callback # Callback URL
MPESA_CALLBACK_SECRET=your_secret         # Callback authentication
MPESA_DEBUG=false                         # Debug mode

# M-Pesa Pochi La Biashara
MPESA_POCHI_NAME=SmartInvest
MPESA_POCHI_NUMBER=0114383762
MPESA_POCHI_CALLBACK=https://domain/pochi
```

### Third-Party Payment Processors
```env
# PayPal
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
PAYPAL_ENV=sandbox
PAYPAL_RETURN_URL=https://domain/paypal/return
PAYPAL_CANCEL_URL=https://domain/paypal/cancel

# Paystack
PAYSTACK_PUBLIC_KEY=pk_live_xxxx
PAYSTACK_SECRET_KEY=sk_live_xxxx
PAYSTACK_CALLBACK_URL=https://domain/payment/callback

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_xxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_xxxx

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_xxxx
STRIPE_SECRET_KEY=sk_live_xxxx
```

### Email/SMTP Configuration
```
SMTP_HOST=smtp.gmail.com              # SMTP server
SMTP_PORT=587                         # SMTP port
SMTP_USER=your_email@gmail.com        # SMTP user
SMTP_PASS=your_app_password           # SMTP password
SMTP_FROM=SmartInvest <email@>        # From address
SMTP_SECURE=false                     # Use TLS
NOTIFY_EMAIL=admin@domain.com         # Notification recipient
```

### Database
```
DATABASE_URL=Server=localhost;Database=SmartInvest;Integrated Security=true;TrustServerCertificate=True
```

### File Management
```
UPLOAD_DIR=./uploads          # Upload directory
MAX_FILE_SIZE=10485760        # Max file size (10MB default)
```

### Application URLs
```
APP_URL=http://localhost:3000     # Application URL
FRONTEND_URL=http://localhost:3000 # Frontend URL
```

### Admin Authentication
```
ADMIN_USER=admin_email@example.com           # Admin username
ADMIN_PASS=secure_password_here              # Admin password
```

### Bank Details (Manual Deposits)
```
KCB_BANK_NAME=KCB Bank
KCB_ACCOUNT_NAME=your_account_name
KCB_ACCOUNT_NUMBER=0000000000000000
```

### Currency Exchange
```
EXCHANGE_RATE_KES_USD=0.0065  # KES to USD exchange rate
```

## Setup Instructions

### Development Setup

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   nano .env
   ```

3. **For M-Pesa Testing:**
   - Register with [Safaricom Daraja](https://developer.safaricom.co.ke)
   - Use sandbox credentials for development
   - Update MPESA_* variables

4. **For Email Testing:**
   - Gmail: Generate [app-specific password](https://support.google.com/accounts/answer/185833)
   - Or use any SMTP service

5. **For Database:**
   - SQL Server or LocalDB for development
   - Update DATABASE_URL connection string

### Production Setup

1. **Create production configuration:**
   ```bash
   cp appsettings.Production.json appsettings.Production.json
   # OR
   cp .env.example .env
   ```

2. **Set production values:**
   - Use production API keys
   - Set NODE_ENV=production
   - Enable all security features
   - Update all domain URLs to production domains

3. **Secure credentials:**
   - Never commit .env files
   - Use environment variable management (GitHub Secrets, Azure KeyVault, etc.)
   - Rotate credentials regularly

4. **Verify SSL/TLS:**
   - Ensure HTTPS is enforced
   - Update callback URLs to HTTPS
   - Verify certificate validity

## File Organization

```
SmartInvest-/
├── .env                          # Active environment variables (DO NOT COMMIT)
├── .env.example                  # Template for environment variables
├── .env.security                 # Security-specific vars
├── appsettings.Development.json  # .NET development config
├── appsettings.Production.json   # .NET production config
├── lib/                          # Utility libraries
│   ├── Idempotency.js
│   ├── amount-business-logic-validation.js
│   ├── core-reconciliation-states.js
│   └── shortcode-verification.js
├── middleware/                   # Express middleware
│   ├── data-protection.js
│   ├── rate-limiting.js
│   ├── security-integration.js
│   └── security.js
├── services/                     # Business logic services
├── src/                          # TypeScript/JavaScript source
└── server.js                     # Main application entry point
```

## Security Best Practices

1. **Never commit .env files to version control**
2. **Use strong, unique passwords for admin accounts**
3. **Keep JWT_SECRET minimum 32 characters**
4. **Enable HTTPS in production**
5. **Use production API credentials in production**
6. **Rotate credentials periodically**
7. **Monitor rate limits and adjust if needed**
8. **Keep dependencies updated**

## Troubleshooting

### M-Pesa Callbacks Not Working
- Verify MPESA_CALLBACK_URL is publicly accessible
- Check MPESA_CALLBACK_SECRET is set correctly
- Ensure firewall allows incoming requests on callback port

### Email Not Sending
- Verify SMTP credentials are correct
- Check Gmail requires app-specific password
- Ensure NOTIFY_EMAIL is valid
- Check firewall allows SMTP port 587

### Database Connection Failed
- Verify DATABASE_URL connection string syntax
- Check SQL Server is running and accessible
- Verify database exists and user has access

### Rate Limiting Too Strict
- Increase RATE_LIMIT_MAX_REQUESTS
- Increase RATE_LIMIT_WINDOW_MS
- Check for proxy/load balancer forwarding X-Forwarded-For headers

## Support

For issues or questions, refer to:
- [M-Pesa Documentation](https://developer.safaricom.co.ke)
- [Payment Integration Guide](./MODERN_PAYMENT_SYSTEM.md)
- [Security Setup Guide](./SECURITY_INTEGRATION_GUIDE.md)
- [Admin Documentation](./ADMIN_CONTROL_GUIDE.md)
