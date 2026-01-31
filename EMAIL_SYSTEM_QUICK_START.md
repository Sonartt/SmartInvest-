# Email System Quick Start - SmartInvest

## What's Been Implemented ✅

Your SmartInvest application now has a **complete email notification system** that automatically sends emails to users:

### Automated Email Triggers

1. **On User Registration** → 2 emails sent automatically
   - Welcome Email (personalized greeting)
   - Terms & Conditions Email (legal document with all regulations)

2. **On Premium Upgrade** → 1 email sent automatically
   - Premium Features Notification

3. **On Subscription** → 1 email sent automatically
   - Subscription Confirmation Receipt

### Email Recipients Supported

| User Type | Emails Sent |
|-----------|------------|
| **Registered User** | Welcome + T&C |
| **Free Subscriber** | Welcome + T&C + Confirmation |
| **Premium User** | Welcome + T&C + Premium Notice + Confirmation |

## Configuration in 3 Steps

### Step 1: Update `.env` File

Add these lines to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=smartinvest254@gmail.com
SMTP_PASS=SmartInvest254.com
SMTP_FROM=SmartInvest <smartinvest254@gmail.com>
SMTP_SECURE=false
NOTIFY_EMAIL=smartinvest254@gmail.com
```

### Step 2: Restart Your Server

```bash
npm run dev
# or
npm start
```

### Step 3: Test Email Sending

Option A - Sign up a new test user:
1. Go to http://localhost:3000/login.html
2. Click "Sign Up"
3. Fill in details and register
4. Check email for welcome + T&C emails

Option B - Use Admin API (if you have admin access):
```bash
curl -X GET -u admin:admin \
  http://localhost:3000/api/admin/email/status
```

## Email Content Summary

### Welcome Email
- Personalized greeting with user's name
- Account information (type, email, registration date)
- Available features overview
- Quick start instructions
- Support contact info

### Terms & Conditions Email
Contains 10 comprehensive sections:
1. **Service Agreement & Disclaimer** - What SmartInvest offers and limitations
2. **User Responsibilities** - What users must do
3. **Data Privacy & Protection** - How data is handled (GDPR, Kenya privacy laws)
4. **Payment & Subscription Terms** - Billing, refunds, cancellation
5. **Liability Limitations** - What SmartInvest is not responsible for
6. **Intellectual Property Rights** - Copyright and usage rights
7. **Prohibited Activities** - What users cannot do (hacking, fraud, spam)
8. **Compliance & Regulations** - Kenya laws, international standards
9. **Account Termination** - How accounts can be closed
10. **Contact & Support** - Who to contact with issues

### Premium Email
- Celebratory message for upgrade
- List of 10+ premium features
- How to access premium dashboard
- Support information

### Subscription Confirmation
- Subscription type and start date
- Amount paid
- Next billing/renewal date
- Features included
- How to manage subscription

## Bulk Operations for Admins

### Send Welcome Emails to All Free Users

```bash
curl -X POST -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{"filter":{"isPremium":false}}' \
  http://localhost:3000/api/admin/email/bulk-send-welcome
```

### Send Terms & Conditions to Premium Users

```bash
curl -X POST -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{"filter":{"isPremium":true}}' \
  http://localhost:3000/api/admin/email/bulk-send-terms
```

### Send Individual Email

```bash
curl -X POST -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{"userId":"user@example.com"}' \
  http://localhost:3000/api/admin/email/send-welcome
```

## Troubleshooting

### Emails Not Sending?

**Check 1: Is Email Service Initialized?**
```bash
curl http://localhost:3000/api/admin/email/status
```

Look for response like:
```json
{
  "initialized": true,
  "transporter": "configured",
  "smtpHost": "smtp.gmail.com"
}
```

**Check 2: Gmail Credentials Correct?**
- Email: `smartinvest254@gmail.com` ✅
- Password: `SmartInvest254.com` ✅

**Check 3: Is Gmail Blocking Access?**

Gmail may block if:
- "Less secure apps" is not enabled
- 2-factor authentication is enabled (use App Password instead)

**Solution:**

Option A - Enable Less Secure Apps:
1. Go to: https://myaccount.google.com/lesssecureapps
2. Enable "Allow less secure apps"
3. Restart server

Option B - Use App Password (More Secure):
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the generated 16-character password
4. Update `.env` with this password
5. Restart server

### Still Not Working?

Check server console for errors like:
```
✅ Email service initialized successfully
   Sender: smartinvest254@gmail.com
```

Or see this (indicates fallback to test mode):
```
⚠️ Email service not fully configured. Using test transporter.
📧 Email preview: https://ethereal.email/messages/xxx
```

## Files Created

| File | Purpose |
|------|---------|
| `/services/email-service.js` | Email service class (all email functions) |
| `/EMAIL_SERVICE_DOCUMENTATION.md` | Full technical documentation |
| `/EMAIL_SYSTEM_QUICK_START.md` | This file - quick setup guide |

## Files Modified

| File | Changes |
|------|---------|
| `/server.js` | Added email service initialization and integration into signup/premium endpoints |
| `.env.example` | SMTP configuration template (reference only) |

## What's Automatic (No Code Needed)

✅ When user registers → Welcome + T&C emails sent automatically  
✅ When admin grants premium → Premium email sent automatically  
✅ When subscription created → Confirmation email sent automatically  

## Admin API Endpoints

```
GET /api/admin/email/status
  → Check if email service is working

POST /api/admin/email/send-welcome
  → Send welcome email to specific user

POST /api/admin/email/send-terms
  → Send T&C email to specific user

POST /api/admin/email/send-subscription-confirmation
  → Send subscription receipt to user

POST /api/admin/email/bulk-send-welcome
  → Send welcome to multiple users at once

POST /api/admin/email/bulk-send-terms
  → Send T&C to multiple users at once
```

All admin endpoints require authentication.

## Next Steps

1. ✅ **Configure `.env`** with Gmail credentials
2. ✅ **Restart the server**
3. ✅ **Test by creating new user account** (check email)
4. ⚠️ **If emails don't arrive in 5 minutes:**
   - Check spam/junk folder
   - Verify Gmail credentials are correct
   - Check email service status endpoint
   - Enable "Less secure apps" in Gmail

## Email Service Architecture

```
User Signup Flow:
├─ User registration form submitted
├─ User data saved to users.json
├─ emailService.sendWelcomeEmail() called
├─ emailService.sendTermsAndConditionsEmail() called
└─ User receives 2 emails

Admin Premium Grant:
├─ Admin grants premium access
├─ User data updated (isPremium: true)
├─ emailService.sendPremiumUpgradeEmail() called
└─ User receives premium email

Bulk Send Operations:
├─ Admin makes API request with filter
├─ System fetches matching users
├─ Sends email to each user (500ms delay)
├─ Returns success/failure count
└─ Rate limiting prevents Gmail throttling
```

## Email Service Features

✅ **Secure SMTP** - TLS encryption  
✅ **Professional Templates** - HTML + Plain text  
✅ **Error Handling** - Graceful fallback to test mode  
✅ **Rate Limiting** - 500ms delay between bulk sends  
✅ **Logging** - All email actions logged to console  
✅ **Compliance** - Includes terms, conditions, regulations  
✅ **Multi-User Types** - Handles free/premium/subscriber users  
✅ **Admin Control** - Bulk send, individual send, status check  

## Support

- **Email Service Docs**: [EMAIL_SERVICE_DOCUMENTATION.md](EMAIL_SERVICE_DOCUMENTATION.md)
- **Email Account**: smartinvest254@gmail.com
- **Support Contact**: support@smartinvest.africa

---

**Status**: ✅ Ready to Use  
**Last Updated**: January 30, 2026  
**Version**: 1.0
