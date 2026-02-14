# 🚀 Vercel Deployment - Quick Start (5 Steps)

## Step 1: Get Vercel Secrets
1. Go to https://vercel.com/account/tokens
2. Create new token → Copy to clipboard
3. Go to https://vercel.com/dashboard
4. Find your project, copy ORG_ID and PROJECT_ID from URL/settings

## Step 2: Add GitHub Secrets
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these 3 secrets:
   - VERCEL_TOKEN (from step 1)
   - VERCEL_ORG_ID
   - VERCEL_PROJECT_ID

## Step 3: Create Vercel Project
1. Visit https://vercel.com/dashboard
2. Click "New Project"
3. Select your GitHub repository
4. Deploy! (uses your vercel.json config)

## Step 4: Set Up Database
1. Create PostgreSQL (try Supabase at https://supabase.com)
2. Get connection string → Add to Vercel Settings → Environment Variables:
   - DATABASE_URL (connection pooling)
   - DIRECT_URL (direct connection)
3. Run migration: `npm run prisma:migrate:deploy`

## Step 5: Deploy!
```bash
git push origin main
```

That's it! GitHub Actions will automatically:
- Build your app ✅
- Run tests ✅
- Deploy to Vercel ✅

---

## After Each Code Change

```bash
# Make your changes
git add .
git commit -m "feat: description of changes"
git push origin main

# Automatically:
# → GitHub Actions builds & tests
# → Deploys to Vercel production
# → Website updates live
```

---

## Vercel Dashboard
- View deployments: https://vercel.com/dashboard
- View logs: Click deployment → Logs
- Configure domain: Settings → Domains
- Environment variables: Settings → Environment Variables

---

## Local Testing
```bash
npm install
npm run build
npm run start
# Visit http://localhost:3000
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check GitHub Actions logs |
| 500 errors | Check Vercel deployment logs |
| Database error | Verify DATABASE_URL in Vercel |
| CSS/JS not loading | Check vercel.json routes |

---

## Generated Secrets (Already in .env)

```
JWT_SECRET=1FWBfPrbhr3uETnwF91ykFrauU/jBEvtaCJwKzkobQQ=
ADMIN_USER=admin@smartinvest.co.ke
ADMIN_PASS=8cXNIIZw6kJfRvaJyPtB/fUUhx70C9Ws
MPESA_CALLBACK_SECRET=4aKurUuqnHH2BGcsP/jk3GYBHPB7skXOSzuGzhX+yZ4=
SMTP_USER=smartinvestsi254@gmail.com
```

---

**Questions?** See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) or [DEPLOYMENT_COMPLETE.md](./DEPLOYMENT_COMPLETE.md)

**Ready?** Push to main and watch your app deploy automatically! 🎉
