# 🚀 SmartInvest- Quick Start Guide

## New Features Summary

Your website now has **THREE major live features**:

### 1. 💬 Live Chat Widget
- Floating chat button on every page (bottom-right corner)
- Collects user info (name + email)
- Sends admin email notifications instantly
- Stores chat history
- Auto-replies for common questions

### 2. 📧 Live Email Service
- Contact forms send real emails
- Admin gets notified of all messages
- Professional HTML email templates
- Configured with your Gmail account

### 3. 📱 Social Media Management
- Admin can add/edit social media links
- Dynamic social media icons on all pages
- Supports 8 platforms: Instagram, Twitter, Facebook, LinkedIn, WhatsApp, Telegram, TikTok, YouTube
- WhatsApp auto-formats phone numbers

---

## ⚡ 5-Minute Setup

### Step 1: Get Gmail App Password (2 minutes)

1. Go to https://myaccount.google.com/
2. Click **Security** (left sidebar)
3. Enable **2-Step Verification** (if not enabled)
4. Scroll down to **App passwords**
5. Click **App passwords**
6. Generate password for "SmartInvest Email"
7. **Copy the 16-character password** (something like: `abcd efgh ijkl mnop`)

### Step 2: Create .env File (1 minute)

In your project root, create a file named `.env`:

```env
EMAIL_USER=smartinvest254@gmail.com
EMAIL_PASSWORD=paste_your_16_character_password_here
ADMIN_EMAIL=delijah5415@gmail.com
WEBSITE_EMAIL=smartinvest254@gmail.com
SUPPORT_PHONE_1=0731856995
SUPPORT_PHONE_2=0114383762
BASE_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123
```

**Replace `paste_your_16_character_password_here` with the password from Step 1!**

### Step 3: Start Server (1 minute)

```bash
# Install dependencies (first time only)
npm install

# Start server
node server.js
```

You should see:
```
🚀 Server running on http://localhost:3000
📧 Email service configured: smartinvest254@gmail.com
```

### Step 4: Test Live Chat (1 minute)

1. Open http://localhost:3000
2. Click the **purple chat button** (bottom-right)
3. Enter your name and email
4. Send a test message
5. Check `smartinvest254@gmail.com` inbox - you should receive an email!

---

## 🎯 Admin Access

### Login to Admin Dashboard

1. Go to http://localhost:3000/admin.html
2. Login:
   - **Username**: `admin`
   - **Password**: `changeme123` (or whatever you set in `.env`)

### Manage Social Media Links

1. Go to http://localhost:3000/admin-social-media.html
2. Add your social media handles:
   - **Instagram**: `@smartinvest254`
   - **Twitter**: `@smartinvest254`
   - **Facebook**: `SmartInvestAfrica`
   - **LinkedIn**: `company/smartinvest-africa`
   - **WhatsApp**: `0731856995` (already set)
3. Click **Update All**

The social media icons will now appear on all pages!

---

## 📋 Feature Details

### Live Chat Features
- **Auto-replies**: Responds to "hello", "hi", "help", "hours", "pricing"
- **Email Notifications**: Admin gets email for every chat message
- **Message History**: Saved in browser (localStorage)
- **User Info**: Collects name and email before chat
- **Minimize**: Click to minimize/maximize chat window

### Email Service Features
- **Contact Form**: Sends to `smartinvest254@gmail.com`
- **Admin Notifications**: Copies `delijah5415@gmail.com`
- **Templates**: Professional HTML emails with logo
- **Error Handling**: Shows user-friendly error messages

### Social Media Widget
- **Dynamic Loading**: Fetches links from server
- **8 Platforms**: Instagram, Twitter, Facebook, LinkedIn, WhatsApp, Telegram, TikTok, YouTube
- **Icons & Colors**: Platform-specific styling
- **WhatsApp**: Auto-formats phone numbers (e.g., `0731856995` → `254731856995`)

---

## 🔧 Troubleshooting

### "Failed to send email" error

**Cause**: Gmail app password not set correctly

**Fix**:
1. Check `.env` file has `EMAIL_PASSWORD` set
2. Verify the password is the 16-character app password (not your regular Gmail password)
3. Restart the server: `Ctrl+C` then `node server.js`

### Chat widget not appearing

**Cause**: JavaScript not loading

**Fix**:
1. Open browser console (F12)
2. Check for errors
3. Verify `public/js/live-chat-widget.js` exists
4. Hard refresh page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Social media icons not showing

**Cause**: No social media links configured

**Fix**:
1. Go to http://localhost:3000/admin-social-media.html
2. Add at least one social media handle
3. Click **Update All**
4. Refresh your website

---

## 🚀 Deploy to Production (Vercel)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

### 4. Add Environment Variables in Vercel Dashboard

Go to: **Project → Settings → Environment Variables**

Add these variables:
- `EMAIL_USER` = `smartinvest254@gmail.com`
- `EMAIL_PASSWORD` = `your_gmail_app_password`
- `ADMIN_EMAIL` = `delijah5415@gmail.com`
- `WEBSITE_EMAIL` = `smartinvest254@gmail.com`
- `SUPPORT_PHONE_1` = `0731856995`
- `SUPPORT_PHONE_2` = `0114383762`
- `BASE_URL` = `https://your-domain.vercel.app`
- `ADMIN_USERNAME` = `admin`
- `ADMIN_PASSWORD` = `your_secure_password`

### 5. Redeploy
```bash
vercel --prod
```

---

## 📞 Contact Configuration

All contact information is now centralized:

| Field | Value |
|-------|-------|
| **Website Email** | smartinvest254@gmail.com |
| **Admin Email** | delijah5415@gmail.com |
| **Phone 1** | 0731856995 |
| **Phone 2** | 0114383762 |
| **WhatsApp** | 0731856995 |
| **Location** | Nairobi, Kenya |
| **Hours** | Mon-Fri, 9am-6pm EAT |

---

## ✅ Testing Checklist

After setup, test these features:

- [ ] Live chat button appears on homepage
- [ ] Can send chat message
- [ ] Admin receives email notification
- [ ] Contact form sends email
- [ ] Social media icons appear (after configuring)
- [ ] WhatsApp link opens correctly
- [ ] Admin dashboard accessible
- [ ] Can update social media links

---

## 🎉 You're All Set!

Your website now has:
- ✅ Live chat with email notifications
- ✅ Professional email service
- ✅ Social media integration
- ✅ Share links for products
- ✅ Premium file management
- ✅ Admin user search

**Need Help?**
- 📧 Email: smartinvest254@gmail.com
- 📧 Admin: delijah5415@gmail.com
- 📱 Phone: 0731856995 / 0114383762
- 💬 WhatsApp: [Click to Chat](https://wa.me/254731856995)

---

*Last Updated: January 2025*
