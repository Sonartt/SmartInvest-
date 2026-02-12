# Production Environment Setup Checklist

## ✅ Status: Production `.env` Generated
**Date**: February 12, 2026  
**File**: `.env` (Updated from `.env.example`)

---

## 🔴 CRITICAL - Must Update Before Deployment

### 1. JWT Authentication
- [ ] Generate strong JWT_SECRET (32+ characters, alpha + numeric + special)
  ```bash
  # Generate random JWT secret:
  openssl rand -base64 32
  ```
- [ ] Update `JWT_SECRET` in `.env`
- [ ] Set `JWT_EXPIRES` (default: 12h)

### 2. Admin Credentials
- [ ] Change `ADMIN_USER` to production email
- [ ] Change `ADMIN_PASS` to strong password (12+ chars, mix case, numbers, special)
- [ ] Test admin login after deployment

### 3. Security Keys
- [ ] Generate `COOKIE_SECRET` (32+ characters)
- [ ] Generate `SESSION_SECRET` (32+ characters)
- [ ] Store securely (never commit to git)

---

## 🟠 HIGH PRIORITY - Payment Integration

### M-Pesa (Safaricom Daraja)
- [ ] Obtain production credentials from https://developer.safaricom.co.ke
  - `MPESA_CONSUMER_KEY`
  - `MPESA_CONSUMER_SECRET`
  - `MPESA_PASSKEY`
- [ ] Set `MPESA_ENV=production`
- [ ] Update `MPESA_NUMBER` (business shortcode)
- [ ] Update `MPESA_SHORTCODE` (business shortcode)
- [ ] Update `MPESA_PAYBILL` (if applicable)
- [ ] Set `MPESA_CALLBACK_URL` to your domain
- [ ] Test with small transaction

### PayPal
- [ ] Obtain production credentials from PayPal Developer
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
- [ ] Set `PAYPAL_ENV=production`
- [ ] Set `PAYPAL_MODE=production`
- [ ] Update return/cancel URLs to your domain
- [ ] Test transaction flow

### Stripe (Optional)
- [ ] Obtain live API keys from Stripe Dashboard
- [ ] Update `STRIPE_LIVE_API_KEY` (starts with `sk_live_`)
- [ ] Update `STRIPE_LIVE_SECRET_KEY`
- [ ] Test payment processing

---

## 🟡 IMPORTANT - Configuration

### Email/SMTP
- [ ] Configure `EMAIL_HOST` (e.g., smtp.gmail.com)
- [ ] Set `EMAIL_PORT` (587 for TLS, 465 for SSL)
- [ ] Set `EMAIL_USER` (SMTP username)
- [ ] Set `EMAIL_PASSWORD` (SMTP password or app-specific)
- [ ] Set `EMAIL_FROM` (sender address)
- [ ] Set `EMAIL_FROM_NAME` (sender display name)
- [ ] Update `SUPPORT_EMAIL`
- [ ] Update `SUPPORT_PHONE`
- [ ] Test email sending

### Database
- [ ] Update `DATABASE_URL` with production database
  - Format: `postgresql://user:password@host:5432/database`
  - Or: `Server=host;Database=db;User Id=user;Password=pass;`
- [ ] Create database and run migrations
- [ ] Test database connection

### URLs & CORS
- [ ] Update `APP_URL` to your domain (HTTPS)
- [ ] Update `FRONTEND_URL` to your domain (HTTPS)
- [ ] Update `ALLOWED_ORIGINS` (remove localhost)
  - Format: `https://yourdomain.com,https://www.yourdomain.com`
- [ ] Verify HTTPS certificate is valid

---

## 🟢 OPTIONAL - Enhanced Features

### Cryptocurrency Payments
- [ ] Update `CRYPTO_TREASURY_ADDRESS` (your wallet)
- [ ] Set `CRYPTO_RPC_URL` (Infura or Alchemy endpoint)
- [ ] Set `CRYPTO_USD_RATE` (current rate)
- [ ] Test crypto payment flow

### Geolocation & Fraud Detection
- [ ] Set `FRAUD_CHECK_ENABLED=true`
- [ ] Configure fraud thresholds
- [ ] Set `SHIPPING_CARRIERS_ENABLED=true`
- [ ] Configure shipping parameters

### reCAPTCHA (Security)
- [ ] Obtain reCAPTCHA v3 keys from Google
- [ ] Update `RECAPTCHA_SECRET_KEY`
- [ ] Update `RECAPTCHA_SITE_KEY`
- [ ] Enable on forms

### Bank Details (Manual Payments)
- [ ] Update `KCB_BANK_NAME`
- [ ] Update `KCB_ACCOUNT_NAME`
- [ ] Update `KCB_ACCOUNT_NUMBER`
- [ ] Update `KCB_BRANCH_NAME`
- [ ] Update `KCB_BRANCH_CODE`

---

## 🔒 Security Checklist

- [ ] `NODE_ENV=production`
- [ ] `LOG_LEVEL=warn` (not debug)
- [ ] All secrets are 32+ characters
- [ ] No hardcoded secrets in code
- [ ] `.env` file in `.gitignore`
- [ ] `.env` NOT committed to git
- [ ] HTTPS enabled on all URLs
- [ ] CORS restricted to your domain
- [ ] Rate limiting enabled
- [ ] Database backups enabled
- [ ] Secrets stored in vault
- [ ] IP whitelisting (if applicable)

---

## 📋 Testing Checklist

After configuration:

- [ ] Admin login works
- [ ] JWT tokens generate correctly
- [ ] Emails send successfully
- [ ] M-Pesa transactions process
- [ ] PayPal payments complete
- [ ] Database queries work
- [ ] File uploads work
- [ ] CORS allows frontend
- [ ] Rate limiting is effective
- [ ] Error logging works

---

## 🚀 Deployment Checklist

Before going live:

- [ ] All critical variables set
- [ ] All optional features configured (or disabled)
- [ ] `.env` file secured and not in git
- [ ] Database migrations complete
- [ ] Backups configured
- [ ] Monitoring alerts set up
- [ ] SSL certificate valid
- [ ] DNS records updated
- [ ] Load testing completed
- [ ] Incident response plan ready

---

## 📖 Quick Commands

### Verify Configuration
```bash
cd /workspaces/SmartInvest-
cat .env | grep -E "^[A-Z_].*=" | head -20
```

### Generate Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Cookie Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Configuration
```bash
npm install
npm run build
npm start
```

### Check for Unset Variables
```bash
grep -E "your_|change_this|placeholder" .env
```

---

## 📞 Support Resources

- M-Pesa Docs: https://developer.safaricom.co.ke
- PayPal Docs: https://developer.paypal.com
- Stripe Docs: https://stripe.com/docs
- Email Issues: Check SMTP settings with telnet
- Database: Use connection string tester

---

## ⚠️ Important Notes

1. **Never share .env file** - Contains sensitive credentials
2. **Rotate secrets regularly** - Every 90 days recommended
3. **Backup .env** - Keep secure offsite backup
4. **Monitor logs** - Check for unauthorized access attempts
5. **Update dependencies** - Regular security patches

---

**Last Updated**: February 12, 2026  
**Version**: 1.0  
**Status**: Ready for Configuration
