# SmartInvest Africa - Dynamic Web Application

A dynamic investment platform with user authentication, role-based dashboards, and live payment processing.

## Features

### 🔐 Authentication System
- Secure user signup and login with JWT tokens
- Role-based access control (Admin/User)
- Session management with 24-hour expiration
- Bcrypt password hashing

### 🆔 User Registration IDs
- Unique user IDs generated on signup (Format: `SI-YYYYMMDD-XXXXX`)
- User ID displayed in profile and can be used for password recovery

### 🔐 Two-Factor Authentication (2FA)
- Password recovery via email with 6-digit verification code
- Codes expire after 15 minutes
- Recovery using email OR user ID
- 2FA automatically enabled after password reset

### 👥 Role-Based Dashboards

**User Dashboard** (`/user.html`):
- Personal file library
- Investment courses
- Financial tools
- Profile with User ID and 2FA status

**Admin Dashboard** (`/admin.html`):
- User management
- Premium access control
- File uploads and management
- Payment reconciliation
- Support ticket management
- Email tools

### 💳 Payment Integration
- **M-Pesa**: STK Push with Daraja API
- **PayPal**: Checkout integration
- **KCB Bank**: Manual transfer processing
- Webhook handlers for payment confirmations

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Security (REQUIRED in production!)
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_PASSKEY=your-mpesa-passkey
MPESA_NUMBER=your-business-shortcode
MPESA_CALLBACK_URL=https://yourdomain.com/api/pay/mpesa/callback
MPESA_ACCOUNT_REF=SmartInvest
MPESA_ENV=sandbox  # or 'production'
MPESA_DEBUG=true   # Enable detailed logging

# PayPal Configuration
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENV=sandbox  # or 'production'
PAYPAL_RETURN_URL=https://yourdomain.com/paypal/return
PAYPAL_CANCEL_URL=https://yourdomain.com/paypal/cancel
EXCHANGE_RATE_KES_USD=0.0065

# KCB Bank Details
KCB_BANK_NAME=KCB Bank
KCB_ACCOUNT_NAME=SmartInvest Africa
KCB_ACCOUNT_NUMBER=1234567890

# Email Configuration (for 2FA codes)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
SMTP_FROM=no-reply@smartinvest.com
NOTIFY_EMAIL=admin@smartinvest.com

# CORS
CORS_ORIGIN=*  # or specific domain in production
```

### 3. Create Admin User

```bash
node create-admin.js
```

This creates an admin account:
- Email: `admin@smartinvest.com`
- Password: `admin123`
- **Change the password after first login!**

### 4. Start the Server

```bash
node server.js
```

The server will start on `http://localhost:3000`

## Usage

### For Users

1. **Sign Up**: Visit the homepage and scroll to the "Sign In" section
   - Enter email and password
   - Accept terms and conditions
   - Click "Sign Up"
   - **Save your User ID!** It's needed for password recovery

2. **Log In**: Use your email and password to access the user dashboard

3. **Forgot Password**:
   - Click "Forgot Password?" on the login form
   - Enter your email OR User ID
   - Check email for 6-digit verification code
   - Enter code and new password
   - 2FA is automatically enabled for security

### For Admins

1. **Log In**: Use admin credentials to access admin dashboard
2. **Manage Users**: View and manage all registered users
3. **Grant Premium**: Manually grant premium access to users
4. **Manage Files**: Upload and publish files for users
5. **Handle Payments**: Reconcile bank transfers and review payments
6. **Send Emails**: Send individual or bulk emails to users

## Security Notes

⚠️ **IMPORTANT**: 

- Always set `JWT_SECRET` and `SESSION_SECRET` in production
- Use strong, random secrets (minimum 32 characters)
- Never commit `.env` file to version control
- Change default admin password immediately
- Enable HTTPS in production
- Set `NODE_ENV=production` in production
- Use secure cookie settings (`secure: true` with HTTPS)

## File Structure

```
.
├── server.js                 # Main server with all API endpoints
├── index.html               # Homepage with unified login
├── user.html                # User dashboard
├── admin.html               # Admin dashboard
├── create-admin.js          # Script to create admin user
├── data/
│   ├── users.json          # User accounts (auto-created)
│   ├── purchases.json      # Purchase records (auto-created)
│   └── files.json          # File metadata (auto-created)
├── uploads/                 # Uploaded files (auto-created)
└── logs/                    # Server logs (auto-created)
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/forgot-password` - Request password reset code
- `POST /api/auth/reset-password` - Reset password with code

### Payments
- `POST /api/pay/mpesa` - Initiate M-Pesa payment
- `POST /api/pay/paypal/create-order` - Create PayPal order
- `POST /api/pay/kcb/manual` - Record manual bank transfer
- `POST /api/pay/mpesa/callback` - M-Pesa webhook
- `POST /api/pay/paypal/webhook` - PayPal webhook

### Admin (requires admin role)
- `GET /api/admin/dashboard-stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/grant-premium` - Grant premium access
- `POST /api/admin/revoke-premium` - Revoke premium access
- `GET /api/admin/files` - List files
- `POST /api/admin/files/upload` - Upload file
- `DELETE /api/admin/files/:id` - Delete file
- `GET /api/admin/kcb-transfers` - List bank transfers
- `POST /api/admin/kcb/mark-paid` - Mark transfer as paid
- And more...

## Testing

### Test Accounts

**Admin:**
- Email: `admin@smartinvest.com`
- Password: `admin123`

**Regular User:**
- Email: `user@smartinvest.com`
- Password: `user123`

### Test 2FA Flow

1. Create a new account or use test user
2. Click "Forgot Password?"
3. Enter email or User ID
4. Check console/logs for 2FA code (if email not configured)
5. Enter code and new password
6. Login with new password
7. Check profile - 2FA should be enabled

## Troubleshooting

### Email not working
- Check SMTP configuration in `.env`
- For development, the server creates an Ethereal test account
- Check console for preview URLs

### Default secrets warning
- Set `JWT_SECRET` and `SESSION_SECRET` in `.env`
- Generate random secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Cannot access admin dashboard
- Ensure you're logged in as admin
- Check that user has `role: 'admin'` in `data/users.json`
- Clear browser cache and cookies

## License

All rights reserved © 2024 SmartInvest Africa
