# Premium Calculator Access Control System

## Overview
This system implements a **NO-BYPASS** subscription and access control system for the calculator suite. All premium calculator access is verified through the server, preventing any client-side bypasses.

## Architecture

### Components

1. **Subscription Manager** (`api/subscription-manager.js`)
   - Manages users and subscriptions
   - Authoritative access verification
   - Soft delete with audit trails
   - File-based persistence (JSON)

2. **Calculator Dashboard** (`tools/calculator-dashboard.html`)
   - User authentication interface
   - Conditional calculator display (free vs premium)
   - Premium features upsell
   - Subscription status display

3. **API Endpoints** (integrated into `server.js`)
   - User authentication
   - Access verification
   - Admin subscription management
   - User management

## User Types & Access

### Free Users
- **Calculators Available:**
  - Investment Calculator
  - Amortization/Loan Schedules
  - Insurance Premium Calculation

### Premium Users
- **Additional Calculators:**
  - Bond Valuation & Analysis
  - Pension/Retirement Planning
  - Actuarial Science Tools
  - Risk Analysis (VaR, Sharpe Ratio)
  - Business Finance (NPV, IRR, Break-Even)
  - Audit Tools & Fraud Detection

## Data Files

```
data/
├── users.json              # User accounts
├── subscriptions.json      # Subscription records
└── logs/
    └── access.log         # Access verification log
```

### User Object
```json
{
  "id": "unique-hex-id",
  "email": "user@example.com",
  "name": "User Name",
  "phone": "254712345678",
  "location": "Kenya",
  "taxId": "P001234567A",
  "isPremium": false,
  "subscriptionId": null,
  "createdAt": "2026-01-29T10:00:00.000Z",
  "lastLogin": "2026-01-29T14:30:00.000Z",
  "deleted": false
}
```

### Subscription Object
```json
{
  "id": "unique-hex-id",
  "userId": "user-id",
  "amount": 9999,
  "paymentMethod": "mpesa|paypal|manual|stripe",
  "paymentReference": "payment-ref-123",
  "status": "active|revoked",
  "validFrom": "2026-01-29T00:00:00.000Z",
  "validUntil": "2026-02-28T23:59:59.000Z",
  "reason": "Premium access granted",
  "grantedBy": "admin",
  "grantedAt": "2026-01-29T10:00:00.000Z",
  "notes": "Manual approval after payment verification"
}
```

## API Endpoints

### User Authentication

**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "userId": "" // Optional: for existing users
}
```
Response: User object with subscription details

**GET** `/api/users/:userId`
- Retrieve user data with current subscription status
- Returns: User object with isPremium flag and subscription details

### Access Control (NO BYPASSES)

**POST** `/api/calculators/:calcType/access`
```json
{
  "userId": "user-id"
}
```
Response:
```json
{
  "access": true|false,
  "type": "free|premium",
  "reason": "explanation"
}
```

**Critical:** This endpoint performs authoritative validation:
- Checks user exists
- For free calculators: Always allows
- For premium calculators: Verifies valid, non-expired subscription
- Logs all access attempts (success/denied)

### Admin Subscription Management

All admin endpoints require HTTP Basic Auth with `ADMIN_USER` and `ADMIN_PASS`.

**POST** `/api/admin/subscriptions` (Create subscription)
```json
{
  "userId": "user-id",
  "amount": 9999,
  "paymentMethod": "mpesa|paypal|manual|stripe",
  "paymentReference": "ref-123",
  "validFrom": "2026-01-29T00:00:00.000Z",
  "validUntil": "2026-02-28T23:59:59.000Z",
  "reason": "Premium access",
  "notes": "After payment verification"
}
```

**GET** `/api/admin/subscriptions?status=active&userId=user-id`
- List all subscriptions (with optional filters)

**PUT** `/api/admin/subscriptions/:subId/extend`
```json
{
  "days": 30
}
```
- Extend subscription validity

**POST** `/api/admin/subscriptions/:subId/revoke`
```json
{
  "reason": "Request by user|Non-payment|Violation of terms|Other"
}
```
- Revoke subscription (soft delete, creates audit trail)

### User Management

**GET** `/api/admin/users?isPremium=true`
- List all users (with optional filters)

**PUT** `/api/admin/users/:userId`
```json
{
  "name": "New Name",
  "phone": "0712345678",
  "location": "New Location",
  "taxId": "P001234567A"
}
```

**DELETE** `/api/admin/users/:userId`
```json
{
  "reason": "Requested deletion|Terms violation|Other"
}
```
- Soft delete user (preserves data for audits)

## Workflow Examples

### Granting Premium Access

1. **User registers/logs in** → Sent to dashboard as free user
2. **User makes payment** → Manually verified by admin
3. **Admin creates subscription:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/subscriptions \
     -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "user-id",
       "amount": 9999,
       "paymentMethod": "mpesa",
       "paymentReference": "KES123ABC456",
       "validFrom": "2026-01-29T00:00:00Z",
       "validUntil": "2026-02-28T23:59:59Z",
       "reason": "Premium subscription - M-Pesa verified"
     }'
   ```
4. **User logs back in** → Now sees premium calculators
5. **Dashboard verifies access** → Every calculator access checked via API
6. **Access log entry created** → Audit trail maintained

### Revoking Premium Access

```bash
curl -X POST http://localhost:3000/api/admin/subscriptions/:subId/revoke \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Non-payment - Invoice overdue 30 days"
  }'
```

Result:
- Subscription marked as "revoked"
- User's `isPremium` flag set to `false`
- User loses access to all premium calculators
- Audit trail created with revocation reason

### Extending Subscription

```bash
curl -X PUT http://localhost:3000/api/admin/subscriptions/:subId/extend \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"days": 30}'
```

## Security Features

### No Bypasses
- ✅ Server-side verification of ALL access
- ✅ Client-side display is informational only
- ✅ Every calculator access hits API endpoint
- ✅ Subscription expiration checked server-side
- ✅ Admin credentials required for any privilege escalation

### Audit Trails
- ✅ All access attempts logged (success/denied)
- ✅ Subscription changes logged
- ✅ User modifications logged
- ✅ Deletion reasons recorded

### Data Protection
- ✅ Soft deletes preserve data
- ✅ All timestamps in UTC ISO format
- ✅ Subscription validity checked against current time
- ✅ User updates exclude critical fields (isPremium, subscriptionId)

## Environment Variables

```bash
# Required
ADMIN_USER=delijah5415@gmail.com
ADMIN_PASS=ELIJAH-41168990

# Optional (for token-based future expansion)
JWT_SECRET=your-secret-key
```

## Migration Guide

### For Existing Systems

1. **Initialize subscription data:**
   ```bash
   node -e "const sm = require('./api/subscription-manager'); sm.ensureFilesExist();"
   ```

2. **Migrate existing users:**
   - Run migration script to create users from existing data
   - Records can be auto-created on first login

3. **Set up admin:**
   - Configure ADMIN_USER and ADMIN_PASS in `.env`
   - Log in to admin panel to grant subscriptions

## Testing

### Free Calculator Access
```bash
# User can access free calculators
curl -X POST http://localhost:3000/api/calculators/investment/access \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'

# Response: { "access": true, "type": "free" }
```

### Premium Without Subscription (Should FAIL)
```bash
curl -X POST http://localhost:3000/api/calculators/bonds/access \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'

# Response: { "access": false, "reason": "Premium subscription required" }
```

### Premium With Valid Subscription (Should SUCCEED)
```bash
# After admin creates subscription
curl -X POST http://localhost:3000/api/calculators/bonds/access \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'

# Response: { "access": true, "type": "premium" }
```

## Dashboard Usage

1. **Navigate to:** `http://localhost:3000/tools/calculator-dashboard.html`
2. **First time:** Enter email → System auto-creates account
3. **Free user:** See 3 free calculators
4. **Premium features:** Show as locked until subscription active
5. **Subscription info:** Display in dashboard (valid until date, days remaining)
6. **Direct access protection:** Navigating directly to premium calculator redirects to dashboard

## Roadmap

- [ ] Email notifications on subscription events
- [ ] Payment gateway integration (Stripe, M-Pesa direct)
- [ ] Subscription renewal reminders
- [ ] Usage analytics per calculator
- [ ] API keys for programmatic access
- [ ] Rate limiting per subscription tier
