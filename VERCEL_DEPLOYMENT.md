# Vercel Deployment Setup Guide

## Overview

SmartInvest is now configured for **automatic full-stack deployment to Vercel** when you push to the `main` branch.

## Architecture

- **Frontend**: Static HTML dashboards (30 files), CSS, JavaScript controllers
- **Backend**: Express.js server running as Node.js serverless functions on Vercel
- **Database**: Prisma ORM with PostgreSQL (Supabase recommended)
- **CI/CD**: GitHub Actions automatically builds and deploys on every push to main

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **GitHub Integration**: Connect your Vercel account to GitHub
3. **Project Created on Vercel**: At https://vercel.com/dashboard, create a new project linked to this repository

## Required Setup Steps

### 1. Add GitHub Secrets

In your repository settings (`Settings → Secrets and variables → Actions`), add:

```
VERCEL_TOKEN           = Your Vercel API Token
VERCEL_ORG_ID          = Your Vercel Organization ID  
VERCEL_PROJECT_ID      = Your Vercel Project ID
```

**How to get these values:**

- **VERCEL_TOKEN**: Visit https://vercel.com/account/tokens and create a new token
- **VERCEL_ORG_ID**: Found in Vercel team settings or in project URL (vercel.com/dashboard/team/[ORG_ID])
- **VERCEL_PROJECT_ID**: Found in project settings on Vercel dashboard

### 2. Add Vercel Environment Variables

In your Vercel project settings (`Settings → Environment Variables`), add these production variables:

```
# JWT & Auth
JWT_SECRET=1FWBfPrbhr3uETnwF91ykFrauU/jBEvtaCJwKzkobQQ=
ADMIN_USER=admin@smartinvest.co.ke
ADMIN_PASS=8cXNIIZw6kJfRvaJyPtB/fUUhx70C9Ws

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?ssl=require
DIRECT_URL=postgresql://user:password@host/database?ssl=require

# Email (SMTP via Gmail)
SMTP_USER=smartinvestsi254@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=SmartInvest <smartinvestsi254@gmail.com>

# Payment Gateway - M-Pesa
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_mpesa_passkey
MPESA_CALLBACK_SECRET=4aKurUuqnHH2BGcsP/jk3GYBHPB7skXOSzuGzhX+yZ4=
MPESA_CALLBACK_URL=https://yourdomain.com/api/pochi/callback

# Payment Gateway - PayPal
PAYPAL_CLIENT_ID=your_paypal_live_client_id
PAYPAL_CLIENT_SECRET=your_paypal_live_client_secret

# Payment Gateway - KCB
KCB_ACCOUNT_NAME=ELIJAH MUSYOKA DANIEL
KCB_ACCOUNT_NUMBER=your_kcb_account_number
KCB_BRANCH_CODE=your_kcb_branch_code

# Application URLs
APP_URL=https://your-production-domain.com
ALLOWED_ORIGINS=https://your-production-domain.com,https://www.your-production-domain.com

# Node Environment
NODE_ENV=production
PORT=3000
```

### 3. Configure Database (PostgreSQL with Supabase)

1. Create a Supabase project at https://supabase.com
2. Copy the connection string (connection pooling) and set as `DATABASE_URL`
3. Copy the direct connection string and set as `DIRECT_URL`
4. Run migrations: `npm run prisma:migrate:deploy`

## Deployment Workflow

### ✅ Automatic (On Push to Main)

When you push to `main`:

1. ✅ GitHub Actions workflow triggers
2. 🔍 Runs linting and tests
3. 🏗️ Builds the project
4. 🚀 Deploys to Vercel production automatically

### 🔄 Manual (Pull Requests)

When you create a pull request:

1. ✅ Tests run
2. 🚀 Vercel deploys a preview environment
3. 💬 A comment is added with the preview URL
4. ✅ Review and merge when ready

## Monitoring Deployments

### GitHub Actions Dashboard
- Visit: `Repository → Actions → Deploy to Vercel`
- Check status of each deployment

### Vercel Dashboard
- Visit: https://vercel.com/dashboard
- View deployment history, logs, and analytics
- Configure custom domains

## Troubleshooting

### Deployment Failed

1. **Check GitHub Actions logs**: Go to Actions tab and view the workflow output
2. **Check Vercel logs**: In Vercel dashboard, view deployment logs
3. **Verify environment variables**: Ensure all secrets are set correctly
4. **Check database connection**: Test Prisma migration with `npm run prisma:generate`

### Build Issues

```bash
# Local testing before pushing
npm install
npm run build
npm start
```

### Database Migration Issues

```bash
# Generate Prisma client
npm run prisma:generate

# Run pending migrations
npm run prisma:migrate:deploy

# Reset database (⚠️ WARNING: Deletes all data)
npm run prisma:migrate:reset
```

## Commands

```bash
# Development
npm start           # Run locally at http://localhost:3000

# Build for production
npm run build       # Vercel runs this automatically

# Database
npm run prisma:generate          # Generate Prisma client
npm run prisma:migrate:dev       # Create/run migration locally
npm run prisma:migrate:deploy    # Run migrations on production database

# Testing
npm test           # Run test suite
npm run lint       # Run ESLint

# View local logs
npm start -- --log
```

## Project Structure

```
/
├── server.js                     # Main Express server
├── src/
│   ├── server.ts                # TypeScript Express server (alternative)
│   ├── routes/                  # API route handlers
│   ├── services/                # Business logic (email, payments, etc)
│   ├── workflows/               # Content workflow engine
│   └── incidents/               # Incident management
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
├── public/                       # Static assets (CSS, JS, images)
├── wwwroot/                      # wwwroot assets
├── *.html                        # Dashboard HTML files (30+ files)
├── vercel.json                  # Vercel configuration
├── .env.example                 # Environment variables template
└── .github/
    └── workflows/
        └── vercel-deploy.yml    # GitHub Actions workflow
```

## Next Steps

1. ✅ Create Vercel account and link repository
2. ✅ Add GitHub repository secrets (3 variables)
3. ✅ Set up Supabase PostgreSQL database
4. ✅ Add Vercel environment variables
5. ✅ Run initial migration: `npm run prisma:migrate:deploy`
6. 🚀 Push to `main` branch - deployment happens automatically!

## Support

For issues or questions:
- Check GitHub Actions logs for build errors
- Review Vercel dashboard for runtime issues
- Test locally: `npm install && npm start`
