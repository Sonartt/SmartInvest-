# Environment Configuration Guide

This document outlines all required environment variables and configuration files for the SmartInvest Africa application.

## Files Overview

### Environment Files
- **`.env`** - Main environment variables (auto-loaded by Node.js server.js)
- **`.env.example`** - Template with default values and comments
- **`.env.security`** - Additional security-specific configurations
- **`appsettings.Development.json`** - .NET development configuration
- **`appsettings.Production.json`** - .NET production configuration

## Environment Variables

### Core Application
```
PORT=3000                    # Server port
NODE_ENV=development        # Environment mode (development/production)
LOG_LEVEL=info             # Logging level (debug/info/warn/error)
```

### JWT & Security
```
JWT_SECRET=your_key_32_chars_min    # JWT signing key (minimum 32 chars)
ALLOWED_ORIGINS=origin1,origin2     # CORS allowed origins
ENABLE_SECURITY_HEADERS=true        # Enable security headers
RATE_LIMIT_WINDOW_MS=900000         # Rate limit window (15 min default)
RATE_LIMIT_MAX_REQUESTS=100         # Max requests per window
```

### M-Pesa Payment Integration
```
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
MPESA_POCHI_NAME=SmartInvest              # Pochi account name
MPESA_POCHI_CALLBACK=https://domain/pochi # Pochi callback URL
MPESA_DEBUG=false                         # Debug mode
```

### Third-Party Payment Processors
```
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
