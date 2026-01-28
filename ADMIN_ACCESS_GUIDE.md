# 🔐 SmartInvest Africa - Admin Dashboard Access Guide

## Admin Credentials

**Admin Email:** `delijah5415@gmail.com`  
**Admin Username:** `admin`  
**Admin Password:** `admin`

> ⚠️ **IMPORTANT**: These are default credentials for development. Change them in production by setting environment variables `ADMIN_USER` and `ADMIN_PASS`.

---

## 🚀 Accessing the Admin Dashboard

### Method 1: Direct URL Access
Simply navigate to:
```
http://localhost:3000/admin
```

**What happens:**
1. Your browser will prompt for HTTP Basic Authentication
2. Enter username: `admin`
3. Enter password: `admin`
4. Click "Sign in" or press Enter
5. You'll be taken to the SmartInvest Admin Dashboard

### Method 2: From Homepage
1. Go to `http://localhost:3000`
2. Manually navigate to `/admin` in the URL bar
3. Enter authentication credentials when prompted

---

## 🔑 Authentication Details

The admin dashboard uses **HTTP Basic Authentication**. Here's how it works:

```javascript
// Server-side authentication middleware (server.js)
const adminAuth = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Authentication required');
    }
    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString();
    const [username, password] = credentials.split(':');
    const validUser = process.env.ADMIN_USER || 'admin';
    const validPass = process.env.ADMIN_PASS || 'admin';
    if (username === validUser && password === validPass) {
        return next();
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    res.status(401).send('Invalid credentials');
};
```

---

## 📊 Admin Dashboard Features

Once logged in, you'll have access to 8 powerful tabs:

### 1. 📈 Overview
- **Real-time Statistics Dashboard**
  - Total courses, insights, tools, SME content
  - Community members count
  - Visitor tracking
  - User signups and logins
  - Active users (real-time)
- **Quick Action Buttons**
  - Add new course
  - Publish insight
  - Upload tool
  - Create SME content

### 2. 📚 Courses Management
- View all investment courses
- Create new courses with:
  - Title, description
  - Duration, difficulty level
  - Price, instructor
  - Enrollment count
- Edit existing courses
- Delete courses
- Search and filter

### 3. 📰 Insights Management
- Publish financial insights and articles
- Edit existing content
- Delete insights
- Track publication dates
- Manage categories

### 4. 🛠️ Tools Management
- Upload investment tools
- Manage tool descriptions
- Set pricing
- Track tool usage
- Delete tools

### 5. 💼 SME Content
- Create SME funding guides
- Manage business resources
- Edit SME content
- Track engagement

### 6. 👥 Community
- View all community members
- See member interests
- Track join dates
- Export member lists
- Manage community engagement

### 7. 📊 Analytics
- **Real-time Metrics** (auto-refresh every 30s)
  - Total page visitors
  - User signups
  - Login events
  - Active users online
- **Engagement Tracking**
  - Time-based analytics
  - User behavior patterns
- **Export Capabilities**
  - Download analytics data
  - Generate reports

### 8. 👤 Users
- Complete user signin history
- View all registered users
- Track login timestamps
- Email addresses
- User management tools

---

## 🔒 Protected API Endpoints

All admin endpoints require authentication:

### Content Management
```
GET    /api/admin/courses
POST   /api/admin/courses
PUT    /api/admin/courses/:id
DELETE /api/admin/courses/:id

GET    /api/admin/insights
POST   /api/admin/insights
PUT    /api/admin/insights/:id
DELETE /api/admin/insights/:id

GET    /api/admin/tools
POST   /api/admin/tools
PUT    /api/admin/tools/:id
DELETE /api/admin/tools/:id

GET    /api/admin/sme-content
POST   /api/admin/sme-content
PUT    /api/admin/sme-content/:id
DELETE /api/admin/sme-content/:id
```

### Community & Analytics
```
GET    /api/admin/community
DELETE /api/admin/community/:id

GET    /api/admin/analytics
GET    /api/admin/users
```

### Payment Management
```
GET    /api/admin/kcb-transfers
POST   /api/admin/kcb/mark-paid
GET    /api/admin/kcb-export
POST   /api/admin/kcb/reconcile
```

### File Management
```
GET    /api/admin/files
POST   /api/admin/files/upload
POST   /api/admin/files/:id
DELETE /api/admin/files/:id
POST   /api/admin/files/:id/grant
```

---

## 🌐 Production Deployment

### Setting Custom Admin Credentials

**Using Environment Variables:**

```bash
# Linux/Mac
export ADMIN_USER="your_custom_username"
export ADMIN_PASS="your_secure_password"
node server.js

# Or in one line
ADMIN_USER="your_custom_username" ADMIN_PASS="your_secure_password" node server.js
```

**Using .env file:**

```env
# .env
ADMIN_USER=your_custom_username
ADMIN_PASS=your_secure_password
```

**On Vercel/Netlify/Heroku:**
1. Go to your project settings
2. Navigate to Environment Variables
3. Add:
   - `ADMIN_USER` = `your_custom_username`
   - `ADMIN_PASS` = `your_secure_password`

### Security Best Practices

1. **Change Default Credentials**
   - Never use `admin:admin` in production
   - Use strong, unique passwords

2. **Use HTTPS**
   - Basic Auth sends credentials in Base64 (not encrypted)
   - Always use HTTPS in production

3. **Restrict IP Access** (Optional)
   - Configure firewall rules
   - Allow admin access only from trusted IPs

4. **Enable Logging**
   - Monitor admin login attempts
   - Track admin actions

5. **Regular Password Updates**
   - Change admin password periodically
   - Use password manager

---

## 🧪 Testing Admin Access

### Quick Test Script

```bash
# Test admin authentication
curl -u admin:admin http://localhost:3000/admin

# Test API endpoint
curl -u admin:admin http://localhost:3000/api/admin/analytics

# Test with custom credentials
curl -u your_username:your_password http://localhost:3000/admin
```

### Browser Test
1. Open browser
2. Navigate to `http://localhost:3000/admin`
3. When prompted:
   - Username: `admin`
   - Password: `admin`
4. Verify dashboard loads successfully

---

## 📱 Admin Dashboard Screenshots

### Login Prompt
```
┌─────────────────────────────────────┐
│  Authentication Required            │
│                                     │
│  Username: [admin              ]    │
│  Password: [••••••             ]    │
│                                     │
│  [ Cancel ]  [ Sign in ]            │
└─────────────────────────────────────┘
```

### Dashboard Layout
```
┌────────────────────────────────────────────────────┐
│  SmartInvest Admin Dashboard                       │
├────────────────────────────────────────────────────┤
│ [Overview] [Courses] [Insights] [Tools] [SME]     │
│ [Community] [Analytics] [Users]                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  📊 Statistics                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐   │
│  │ Courses  │ Insights │  Tools   │   SME    │   │
│  │   12     │    45    │    8     │    23    │   │
│  └──────────┴──────────┴──────────┴──────────┘   │
│                                                    │
│  👥 Users & Engagement                            │
│  ┌──────────┬──────────┬──────────┬──────────┐   │
│  │ Visitors │ Signups  │  Logins  │  Active  │   │
│  │  1,234   │   456    │   789    │    12    │   │
│  └──────────┴──────────┴──────────┴──────────┘   │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Issue: "Authentication Required" Loop
**Solution:**
- Clear browser cache and cookies
- Ensure correct credentials
- Check server environment variables

### Issue: 401 Unauthorized
**Solution:**
- Verify ADMIN_USER and ADMIN_PASS environment variables
- Check if credentials match exactly (case-sensitive)
- Restart server after changing environment variables

### Issue: Dashboard Not Loading
**Solution:**
- Verify server is running: `curl http://localhost:3000`
- Check browser console for errors
- Ensure port 3000 is not blocked by firewall

### Issue: Can't Access on Remote Server
**Solution:**
- Ensure server is listening on 0.0.0.0, not just localhost
- Check firewall rules
- Verify HTTPS is enabled for secure Basic Auth

---

## 📞 Support

For admin dashboard issues, contact:
- **Email:** delijah5415@gmail.com
- **GitHub Issues:** https://github.com/Sonartt/SmartInvest-/issues

---

## 📝 Quick Reference Card

```
╔══════════════════════════════════════════════════╗
║        SMARTINVEST ADMIN ACCESS CARD             ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  URL:      http://localhost:3000/admin           ║
║                                                  ║
║  Username: admin                                 ║
║  Password: admin                                 ║
║                                                  ║
║  Admin Email: delijah5415@gmail.com              ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║  QUICK COMMANDS:                                 ║
║                                                  ║
║  Start Server:                                   ║
║  $ node server.js                                ║
║                                                  ║
║  Custom Credentials:                             ║
║  $ ADMIN_USER=admin ADMIN_PASS=admin \          ║
║    node server.js                                ║
║                                                  ║
║  Test Auth:                                      ║
║  $ curl -u admin:admin \                        ║
║    http://localhost:3000/admin                   ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

**Last Updated:** January 28, 2026  
**Version:** 1.0.0  
**Author:** SmartInvest Africa Development Team
