# SmartInvest Africa - Vercel Deployment Guide

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Sonartt/SmartInvest-)

## Prerequisites

1. A Vercel account
2. Environment variables configured (see below)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (see Environment Variables section)
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

## Environment Variables

Configure these environment variables in your Vercel project settings:

### Required for Production

```
NODE_ENV=production
PORT=3000
```

### M-Pesa Configuration (Optional)

```
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_NUMBER=your_mpesa_number
MPESA_CALLBACK_URL=https://yourdomain.com/api/pay/mpesa/callback
MPESA_CALLBACK_SECRET=your_callback_secret
MPESA_ACCOUNT_REF=SmartInvest
MPESA_ENV=production
MPESA_DEBUG=false
```

### PayPal Configuration (Optional)

```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENV=production
PAYPAL_RETURN_URL=https://yourdomain.com/paypal/return
PAYPAL_CANCEL_URL=https://yourdomain.com/paypal/cancel
EXCHANGE_RATE_KES_USD=0.0065
```

### KCB Bank Configuration

```
KCB_BANK_NAME=KCB Bank
KCB_ACCOUNT_NAME=SmartInvest Africa
KCB_ACCOUNT_NUMBER=your_account_number
```

### Email/SMTP Configuration (Optional)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=SmartInvest <no-reply@yourdomain.com>
NOTIFY_EMAIL=admin@yourdomain.com
```

### Admin Authentication (Optional)

```
ADMIN_USER=admin
ADMIN_PASS=your_secure_password
```

## Important Notes

### File Persistence

⚠️ **Vercel uses serverless functions which are stateless.** The current implementation uses JSON files for data storage (`data/*.json`, `transactions.json`). For production deployment on Vercel:

1. **Use a Database**: Replace JSON file storage with a database like:
   - MongoDB Atlas (recommended)
   - PostgreSQL (Vercel Postgres)
   - Redis (Upstash)
   - Firebase Firestore

2. **Use Vercel KV Storage**: For simple key-value storage

3. **External Storage**: Use cloud storage for uploaded files:
   - AWS S3
   - Vercel Blob Storage
   - Cloudinary

### File Uploads

The `/uploads` directory will not persist on Vercel. Consider:
- Vercel Blob Storage
- AWS S3
- Cloudinary

## Local Development

```bash
# Install dependencies
npm install

# Copy environment example
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start development server
npm run dev
```

## Testing Deployment

After deployment, test these endpoints:

- `https://yourdomain.vercel.app/` - Main page
- `https://yourdomain.vercel.app/api/catalog` - API endpoint
- `https://yourdomain.vercel.app/admin.html` - Admin panel (requires auth if configured)

## Troubleshooting

### Build Fails

Check:
- Node version (must be >= 18.0.0)
- All dependencies are in `package.json`
- Environment variables are set

### Runtime Errors

Check Vercel logs:
```bash
vercel logs
```

### File Permissions

Ensure `data/` and `uploads/` directories exist and have proper permissions.

## Support

For issues, please check:
- [Vercel Documentation](https://vercel.com/docs)
- [Project Issues](https://github.com/Sonartt/SmartInvest-/issues)
