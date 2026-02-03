# SmartInvest Africa

SmartInvest Africa is a comprehensive web application focused on democratizing investment knowledge, tools, and opportunities across Africa.

## 🌟 New Live Features

### � P2P Payment System (NEW!)
- **Peer-to-peer money transfers** with $5 USD transaction cost
- **Platform number**: 0114383762 (receives all transaction fees)
- **Multi-currency support**: USD, KES, NGN, GHS, ZAR
- **All users have access** to P2P transfers
- **M-Pesa integration** for instant payments
- **Transaction tracking** and history

### 🎯 Affiliate Program (NEW!)
- **Three-tier system**: Bronze (10%), Silver (15%), Gold (20%)
- **Automatic premium access** for all affiliates
- **Commission on P2P transactions**: $0.50 - $1.00 per transaction
- **Withdrawal system**: Minimum $10 USD
- **Referral tracking** and management
- **Advanced dashboard** with analytics
- **Premium calculator access** included

### 💬 Live Chat Support
- **Floating chat widget** on all pages
- **Real-time messaging** with admin email notifications
- **Auto-reply system** for common questions
- **Message history** stored in browser
- **User-friendly interface** with minimize/maximize

### 📧 Live Email Service
- **Professional email templates** for all communications
- **Contact form integration** with instant delivery
- **Chat notifications** sent to admin immediately
- **Gmail SMTP integration** for reliable delivery
- **Branded HTML emails** with SmartInvest styling

### 📱 Social Media Management
- **Admin dashboard** for managing all social media links
- **8 platforms supported**: Instagram, Twitter, Facebook, LinkedIn, WhatsApp, Telegram, TikTok, YouTube
- **Dynamic widgets** on all pages
- **WhatsApp integration** with auto-formatted phone numbers
- **Platform-specific icons** and colors

## 🚀 Core Features

- **Landing Page**: Investment Academy, Insights, Tools, SME funding readiness, Community, and Contact
- **Payment Integration**: M-Pesa, PayPal, and KCB Bank manual transfers
- **P2P Transfers**: Send money peer-to-peer with $5 transaction fee
- **Affiliate Program**: Earn commissions and get premium access
- **File Marketplace**: Upload, manage, and sell digital resources
- **Share Links**: Generate shareable product links with tracking and expiration
- **Premium File Management**: Admin-only file uploads for premium users (100MB limit)
- **Admin User Search**: Search users by email, ID, or name
- **Admin Dashboard**: Manage transfers, files, users, and social media
- **Accessibility & SEO**: WCAG compliant with comprehensive SEO optimization
- **Investment Calculator**: Standalone tool for investment and insurance projections

## 💰 P2P Payment Details

### Transaction Costs
- **Base Amount**: What recipient receives
- **Transaction Fee**: $5 USD (goes to 0114383762)
- **Total**: Base + $5

### Example
```
Sending $10:
- Recipient receives: $10.00
- Transaction fee:    $5.00
- You pay total:      $15.00
```

### Affiliate Commission
When using an affiliate code:
- Bronze tier: Earns $0.50 (10% of $5)
- Silver tier: Earns $0.75 (15% of $5)
- Gold tier: Earns $1.00 (20% of $5)

## 🎁 Affiliate Program Benefits

All affiliates receive:
- ✅ Automatic premium calculator access
- ✅ Commission on referred P2P transactions
- ✅ Personal affiliate dashboard
- ✅ Withdrawal system (min $10)
- ✅ Referral tracking
- ✅ Tier progression (Bronze → Silver → Gold)

## 📞 Contact Information

- **Website Email**: smartinvestsi254@gmail.com
- **Admin Email**: delijah5415@gmail.com
- **Admin Name**: ELIJAH DANIEL
- **Phone**: 0731856995 / 0114383762 (Platform P2P Number)
- **WhatsApp**: [Chat with us](https://wa.me/254731856995)
- **Location**: Nairobi, Kenya
- **Hours**: Mon-Fri, 9am-6pm EAT

## 🔗 Quick Access

- **User Dashboard**: `/dashboard.html` (includes P2P payment button)
- **Affiliate Dashboard**: `/affiliate-dashboard.html`
- **P2P Documentation**: `/P2P_AFFILIATE_DOCUMENTATION.md`
- **Quick Start Guide**: `/P2P_AFFILIATE_QUICKSTART.md`
- **Implementation Summary**: `/P2P_AFFILIATE_IMPLEMENTATION.md`

## 🔐 Admin Access

SmartInvest has a **separate admin authentication system** distinct from regular user login:

- **Admin Login**: [/admin-login.html](/admin-login.html)
- **Admin Dashboard**: [/admin.html](/admin.html) (protected)
- **User Login**: [/login.html](/login.html)

### Quick Access
- Homepage navigation has both "Login" (users) and "Admin" (administrators)
- Footer has dedicated "Administration" section

### Default Admin Accounts
See `/config/admin-config.json` for configured admins:
- `delijah5415@gmail.com` (super-admin)
- `admin@smartinvest.com` (admin)

### Documentation
- **[ADMIN_SYSTEM_SUMMARY.md](./ADMIN_SYSTEM_SUMMARY.md)** - Quick overview
- **[docs/ADMIN_LOGIN_SETUP.md](./docs/ADMIN_LOGIN_SETUP.md)** - Complete setup guide

## ⚡ Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Gmail account with app password

### Installation

```bash
# Clone the repository
git clone https://github.com/Sonartt/SmartInvest-.git
cd SmartInvest-

# Install dependencies
npm install

# Copy environment example
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable **2-Step Verification**
3. Generate **App Password** for "SmartInvest Email"
4. Copy the 16-character password to `.env` file

### Start Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## 📚 Documentation

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Complete deployment checklist
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Vercel deployment guide

### Features & Integration
- **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** - Comprehensive feature summary
- **[LIVE_FEATURES_COMPLETE.md](./LIVE_FEATURES_COMPLETE.md)** - Live chat, email, and social media docs
- **[FEATURE_INTEGRATION_COMPLETE.md](./FEATURE_INTEGRATION_COMPLETE.md)** - Feature integration status

### Admin & Security
- **[ADMIN_SYSTEM_SUMMARY.md](./ADMIN_SYSTEM_SUMMARY.md)** - Admin login system overview
- **[docs/ADMIN_LOGIN_SETUP.md](./docs/ADMIN_LOGIN_SETUP.md)** - Complete admin setup guide
- **[docs/ADMIN_DASHBOARD_GUIDE.md](./docs/ADMIN_DASHBOARD_GUIDE.md)** - Admin dashboard usage
- **[ADMIN_ACCESS_GUIDE.md](./ADMIN_ACCESS_GUIDE.md)** - Admin access control
- **[SECRET_MANAGEMENT.md](./SECRET_MANAGEMENT.md)** - Security best practices

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Sonartt/SmartInvest-)

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

### Other Platforms

The application can also be deployed to:
- Heroku
- Railway
- Render
- AWS EC2/ECS
- Digital Ocean

## Environment Variables

See `.env.example` for all available configuration options. Key variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `MPESA_*` - M-Pesa/Daraja API credentials
- `PAYPAL_*` - PayPal API credentials
- `SMTP_*` - Email configuration
- `ADMIN_USER`, `ADMIN_PASS` - Admin authentication

## API Endpoints

### Public Endpoints

- `GET /` - Main landing page
- `GET /api/catalog` - List published files
- `GET /api/messages` - Get public messages
- `GET /api/scenarios` - Get saved calculator scenarios
- `POST /api/pay/mpesa` - Initiate M-Pesa payment
- `POST /api/pay/paypal/create-order` - Create PayPal order
- `POST /api/pay/kcb/manual` - Record manual bank transfer

### Admin Endpoints (requires authentication)

- `GET /admin.html` - Admin dashboard
- `GET /api/admin/kcb-transfers` - List KCB transfers
- `POST /api/admin/files/upload` - Upload files
- `GET /api/admin/files` - List all files
- `POST /api/admin/files/:id` - Update file metadata
- `POST /api/admin/files/:id/grant` - Grant file access to user

## Project Structure

```
SmartInvest-/
├── server.js              # Main server application
├── index.html             # Landing page
├── admin.html             # Admin dashboard
├── terms.html             # Terms of service
├── package.json           # Dependencies and scripts
├── vercel.json            # Vercel deployment config
├── .env.example           # Environment variables template
├── data/                  # JSON data storage
│   ├── users.json
│   ├── files.json
│   ├── purchases.json
│   ├── messages.json
│   └── scenarios.json
├── uploads/               # User uploaded files
├── tools/                 # Standalone tools
│   └── investment_calculator.html
└── docs/                  # Documentation
    └── webhooks.md
```

## Testing

```bash
# Syntax check
npm test

# Start development server
npm run dev
```

## Admin Panel

Access the admin panel at `/admin.html`. Features include:

- View and manage KCB manual transfers
- Upload and manage marketplace files
- Grant file access to users
- View and reply to user messages
- Export transfers to CSV
- Reconcile bank statements

Enable authentication by setting `ADMIN_USER` and `ADMIN_PASS` environment variables.

## Security Notes

⚠️ **Important Security Considerations:**

1. Always use strong passwords for `ADMIN_USER` and `ADMIN_PASS`
2. Never commit `.env` file to version control
3. Use HTTPS in production
4. Validate all webhook signatures
5. For production, replace JSON file storage with a proper database
6. Regularly update dependencies: `npm audit fix`

## Development Notes

- Built with Express.js 5.x and Node.js 18+
- Uses JSON files for data storage (replace with database for production)
- Payment webhooks require public HTTPS endpoints
- Email notifications use Nodemailer (Ethereal test account in dev mode)

## Webhook Simulation

See `docs/webhooks.md` for instructions on testing webhooks locally.

## Investment Calculator

Access the standalone calculator at `/tools/investment_calculator.html`

Features:
- Lump-sum and recurring investment projections
- Insurance premium calculator
- CSV export and print support
- Multiple scenario comparison

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
- GitHub Issues: [SmartInvest- Issues](https://github.com/Sonartt/SmartInvest-/issues)
- Documentation: Check `docs/` folder
- WhatsApp: 0114383762
- Phone: 0114383762

## Changelog

### Version 1.0.0 (Latest)

- Fixed duplicate endpoints and functions
- Added missing helper functions for purchases and tokens
- Improved admin panel UI and functionality
- Added Vercel deployment support
- Updated dependencies and fixed security vulnerabilities
- Added comprehensive environment variable documentation
- Improved error handling and logging

---

**SmartInvest Africa** - Democratizing investment knowledge, tools and opportunity across Africa. 🌍

