# 🔐 Quick Reference - Admin & Email Credentials

## 👤 Admin Login

**Access URL**: `/admin-login.html`

```
Email:    delijah5415@gmail.com
Password: ELIJAH-41168990
Name:     ELIJAH DANIEL
Role:     super-admin
```

## 📧 Email Configuration

**Website Email Account**:
```
Email:    smartinvestsi254@gmail.com
Password: SmartInvest254.com
Purpose:  Receives all website data (contact forms, chat messages, notifications)
```

**Admin Email**:
```
Email:    delijah5415@gmail.com
Purpose:  Admin notifications and management
```

## 📞 Contact Information

**Support Channels**:
```
Phone 1:  0731856995
Phone 2:  0114383762
Email:    smartinvestsi254@gmail.com
Admin:    ELIJAH DANIEL (delijah5415@gmail.com)
WhatsApp: +254731856995
```

## ⚡ Quick Test Commands

### Test Admin Login
```bash
# Visit admin login page
open http://localhost:3000/admin-login.html

# Login with:
# Email: delijah5415@gmail.com
# Password: ELIJAH-41168990
```

### Test Email Service
```bash
# Start server
npm start

# Send test email
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'

# Check inbox: smartinvestsi254@gmail.com
```

### Test Chat Widget
```bash
# Open any page with chat widget
# Click chat button (bottom right)
# Send message
# Check auto-reply shows: smartinvestsi254@gmail.com
```

## 📋 Files to Configure

### Required for Production

1. **Create `.env` file**:
```bash
cp .env.example .env
```

2. **Set Gmail App Password**:
   - Go to Google Account → Security → 2-Step Verification
   - Generate App Password
   - Update `EMAIL_PASSWORD` in `.env`

3. **Update Environment Variables**:
   - On hosting platform (Vercel/Heroku)
   - Set all values from `.env.example`
   - Use secure app password, not plain password

## 🔒 Security Checklist

- [x] Admin password set in config
- [x] Email credentials in .env.example
- [x] Floating chat shows correct contact
- [x] All email templates updated
- [ ] Gmail App Password generated (production)
- [ ] 2FA enabled on admin account
- [ ] .env file created (don't commit!)
- [ ] Production URLs configured
- [ ] Test all email flows

## 📁 Modified Files (13 total)

**Config**: `.env.example`, `config/admin-config.json`
**Backend**: `api/admin-auth.js`, `services/*.js`, `server.js`
**Frontend**: `public/js/*.js`, `contact.html`
**Docs**: `README.md`

## 🚀 Deployment Ready

**Status**: ✅ All credentials configured
**Next Step**: Create production `.env` file with real Gmail app password

---

**Last Updated**: February 1, 2026
