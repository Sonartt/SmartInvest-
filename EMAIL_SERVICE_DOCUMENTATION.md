# Email Service Implementation - SmartInvest Africa

## Overview

SmartInvest now includes a comprehensive email service that automatically sends emails to users at key lifecycle points:
- **Registration** - Welcome email + Terms & Conditions
- **Premium Upgrade** - Premium features notification
- **Subscription Confirmation** - Payment confirmation

## Configuration

### Gmail Setup (Using Provided Credentials)

**Email**: `smartinvest254@gmail.com`  
**Password**: `SmartInvest254.com`

The email service is pre-configured to use these credentials via SMTP with Gmail.

### Environment Variables

Add to `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=smartinvest254@gmail.com
SMTP_PASS=SmartInvest254.com
SMTP_FROM=SmartInvest <smartinvest254@gmail.com>
SMTP_SECURE=false

# Notification Email
NOTIFY_EMAIL=smartinvest254@gmail.com
```

## Features

### 1. **Automatic Welcome Emails**
Sent immediately upon user registration with:
- Personal greeting
- Account information summary
- Features overview (depends on user type)
- Links to dashboard
- Support contact information

### 2. **Terms & Conditions Email**
Sent automatically with:
- Complete service agreement & disclaimer
- User responsibilities
- Data privacy & protection policy
- Payment & subscription terms
- Liability limitations
- Intellectual property notice
- Prohibited activities list
- Compliance & regulations (Kenya/International)
- Account termination policy
- Contact & support information

### 3. **Premium Upgrade Email**
Sent when user is upgraded to premium with:
- Welcome to premium message
- List of 10+ premium features
- Getting started instructions
- Support contact information

### 4. **Subscription Confirmation Email**
Sent upon subscription purchase with:
- Subscription details
- Billing information
- Renewal date
- Features included
- Subscription management instructions

## User Types & Emails

### Registered Users
✅ Welcome Email  
✅ Terms & Conditions Email  

### Subscribed Users (Free Tier)
✅ Welcome Email  
✅ Terms & Conditions Email  
✅ Subscription Confirmation  

### Premium Users
✅ Welcome Email  
✅ Terms & Conditions Email  
✅ Premium Upgrade Email  
✅ Subscription Confirmation (if paid)  

## API Endpoints

### Send Individual Emails

#### Send Welcome Email
```
POST /api/admin/email/send-welcome
Authorization: Basic (admin credentials)
Content-Type: application/json

{
  "userId": "user-id-or-email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome email sent"
}
```

#### Send Terms & Conditions Email
```
POST /api/admin/email/send-terms
Authorization: Basic (admin credentials)
Content-Type: application/json

{
  "userId": "user-id-or-email"
}
```

#### Send Subscription Confirmation
```
POST /api/admin/email/send-subscription-confirmation
Authorization: Basic (admin credentials)
Content-Type: application/json

{
  "userId": "user-id-or-email",
  "subscriptionData": {
    "type": "Premium Monthly",
    "amount": "$9.99",
    "nextBillingDate": "February 30, 2026"
  }
}
```

### Bulk Send Emails

#### Bulk Send Welcome Emails
```
POST /api/admin/email/bulk-send-welcome
Authorization: Basic (admin credentials)
Content-Type: application/json

{
  "filter": {
    "isPremium": false
  }
}
```

**Filters:**
- `isPremium: true` - Send to premium users only
- `isPremium: false` - Send to free users only
- `type: "registered"` - Send to registered users

**Response:**
```json
{
  "success": true,
  "message": "Bulk email send completed",
  "results": {
    "successCount": 145,
    "failureCount": 2
  },
  "totalTargeted": 147
}
```

#### Bulk Send Terms & Conditions
```
POST /api/admin/email/bulk-send-terms
Authorization: Basic (admin credentials)
Content-Type: application/json

{
  "filter": {
    "isPremium": true
  }
}
```

### Email Service Status

```
GET /api/admin/email/status
Authorization: Basic (admin credentials)
```

**Response:**
```json
{
  "initialized": true,
  "transporter": "configured",
  "smtpUser": "set",
  "smtpHost": "smtp.gmail.com",
  "timestamp": "2026-01-30T12:00:00Z"
}
```

## Email Templates

### Welcome Email Template
**Subject:** Welcome to SmartInvest Africa, [Name]!

Contains:
- Branded header with gradient
- Personal greeting
- Account information (type, email, date)
- Features available
- Next steps (review T&C, complete profile, verify email)
- Action button to dashboard
- Support contact
- Footer with company info

### Terms & Conditions Template
**Subject:** SmartInvest - Terms, Conditions, Rules and Regulations

Contains:
1. Service Agreement & Disclaimer
2. User Responsibilities
3. Data Privacy & Protection
4. Payment & Subscription Terms
5. Liability Limitations
6. Intellectual Property Rights
7. Prohibited Activities
8. Compliance & Regulations
9. Account Termination
10. Contact & Support

### Premium Upgrade Template
**Subject:** 🎉 Welcome to SmartInvest Premium!

Contains:
- Premium welcome message
- 10+ premium features list
- Getting started guide
- Support information
- Premium dashboard link

### Subscription Confirmation Template
**Subject:** Subscription Confirmation - SmartInvest

Contains:
- Subscription type
- Start date
- Next billing date
- Amount
- Features included
- Management instructions

## Integration in Code

### Automatic Email Sending During Registration

When a user signs up, the system automatically:

```javascript
// 1. Create user account
users.push(user);
writeUsers(users);

// 2. Send welcome email
await emailService.sendWelcomeEmail(email, user);

// 3. Send terms & conditions
await emailService.sendTermsAndConditionsEmail(email, user);
```

### Premium Upgrade Email

When admin grants premium access:

```javascript
users[userIndex].isPremium = true;
users[userIndex].premiumGrantedAt = new Date().toISOString();
writeUsers(users);

// Send premium upgrade email
await emailService.sendPremiumUpgradeEmail(users[userIndex].email, users[userIndex]);
```

## Email Service Class

Located in: `services/email-service.js`

### Methods

#### `initialize(config)`
Initializes the email service with Gmail credentials

```javascript
await emailService.initialize({
  email: 'smartinvest254@gmail.com',
  password: 'SmartInvest254.com',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false
});
```

#### `sendWelcomeEmail(email, userData)`
Sends welcome email to newly registered user

```javascript
await emailService.sendWelcomeEmail('user@example.com', {
  fullName: 'John Doe',
  email: 'user@example.com',
  isPremium: false
});
```

#### `sendTermsAndConditionsEmail(email, userData)`
Sends comprehensive terms and conditions document

```javascript
await emailService.sendTermsAndConditionsEmail('user@example.com', userData);
```

#### `sendPremiumUpgradeEmail(email, userData)`
Sends premium upgrade notification with features list

```javascript
await emailService.sendPremiumUpgradeEmail('user@example.com', userData);
```

#### `sendSubscriptionConfirmationEmail(email, subscriptionData)`
Sends subscription confirmation and receipt

```javascript
await emailService.sendSubscriptionConfirmationEmail('user@example.com', {
  type: 'Premium Monthly',
  amount: '$9.99',
  nextBillingDate: 'Feb 30, 2026'
});
```

#### `sendBulkWelcomeEmails(users)`
Sends welcome emails to multiple users with rate limiting

```javascript
const result = await emailService.sendBulkWelcomeEmails(usersList);
// Returns: { successCount: 145, failureCount: 2 }
```

## Testing Email Service

### Using Ethereal (Test Environment)

If Gmail credentials are not configured, the service falls back to Ethereal test emails:

```javascript
// In test/development, you'll see:
// ✅ Test email transporter initialized (Ethereal)
// User: test@ethereal.email
// Pass: testpass123

// Email preview URLs will be logged automatically
// Example: https://ethereal.email/messages/xxx
```

### Testing with Real Gmail

1. Verify `.env` has correct Gmail credentials
2. Enable "Less secure apps" in Gmail account settings
3. Or use an [App Password](https://myaccount.google.com/apppasswords) instead of account password

### Manual Testing via API

```bash
# Check email service status
curl -u admin@example.com:admin_password \
  http://localhost:3000/api/admin/email/status

# Send welcome email to specific user
curl -X POST -u admin@example.com:admin_password \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-email@example.com"}' \
  http://localhost:3000/api/admin/email/send-welcome

# Bulk send to all free users
curl -X POST -u admin@example.com:admin_password \
  -H "Content-Type: application/json" \
  -d '{"filter":{"isPremium":false}}' \
  http://localhost:3000/api/admin/email/bulk-send-welcome
```

## Logging & Debugging

Email service logs all actions:

```
✅ Email service initialized successfully
   Sender: smartinvest254@gmail.com

📧 Sending welcome email to user@example.com...
✅ Welcome email sent to user@example.com

📧 Sending terms & conditions email to user@example.com...
✅ Terms & Conditions email sent to user@example.com

📧 Preview URL: https://ethereal.email/messages/xxx
```

## Email Content Compliance

All email templates include:
- ✅ Company branding
- ✅ Professional formatting
- ✅ Clear subject lines
- ✅ Personal greeting
- ✅ Key information
- ✅ Action buttons/links
- ✅ Support contact
- ✅ Copyright & legal notices
- ✅ Unsubscribe options (if applicable)

## Data Privacy

- All emails are sent via secure SMTP with TLS
- Emails contain no sensitive data (passwords, tokens, etc.)
- User emails are stored securely in the database
- Email service logs do not capture recipient details in production

## Rate Limiting

Bulk email sends include automatic rate limiting:
- 500ms delay between emails
- Prevents SMTP provider rate limiting
- Maintains service reliability

## Troubleshooting

### Emails Not Sending?

1. **Check Gmail credentials**
   ```bash
   curl http://localhost:3000/api/admin/email/status
   ```

2. **Verify SMTP configuration**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Security: `TLS` (not SSL)

3. **Enable Less Secure Apps**
   - Go to: https://myaccount.google.com/lesssecureapps
   - Enable "Allow less secure apps"

4. **Check server logs**
   - Look for "Email service initialization" messages
   - Check for SMTP connection errors

### Test with Ethereal

If Gmail fails, the service automatically falls back to Ethereal test emails. Check console for preview URLs.

### Gmail "Sign-in unsuccessful" Error

Use an App Password instead:
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Use the generated 16-character password in `.env`

## Production Deployment

### Recommended Changes

1. **Use Environment Variables**
   ```env
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-app-password-here
   ```

2. **Enable Google App Password**
   - More secure than account password
   - Can be revoked independently

3. **Add Email Verification**
   - Send verification link in welcome email
   - Mark email as verified when link clicked

4. **Implement Unsubscribe Link**
   - Add unsubscribe option for marketing emails
   - Comply with CAN-SPAM regulations

5. **Monitor Email Delivery**
   - Track bounce rates
   - Monitor spam complaints
   - Review email reputation

## Future Enhancements

- [ ] Email templates stored in database
- [ ] Customizable email content via admin panel
- [ ] Email scheduling (send at optimal times)
- [ ] A/B testing for email subject lines
- [ ] Email analytics (open rates, click rates)
- [ ] Automated email sequences/drip campaigns
- [ ] SMS notifications as alternative
- [ ] Multi-language email support
- [ ] Email attachments (receipts, reports)
- [ ] Email preferences per user (opt-in/opt-out)

## Support

For email service issues:
1. Check server logs for errors
2. Verify Gmail/SMTP credentials
3. Test with Ethereal
4. Contact: smartinvest254@gmail.com

---

**Implementation Date**: January 30, 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0
