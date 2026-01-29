# Admin Quick Reference - delijah5415@gmail.com

## 🔐 Login Credentials
```
Email: delijah5415@gmail.com
Password: Ishmaah5415
Method: HTTP Basic Auth
```

## 📁 File Management (ADMIN ONLY)

### Upload File
```bash
curl -X POST http://localhost:3000/api/admin/upload \
  -u "delijah5415@gmail.com:Ishmaah5415" \
  -F "file=@document.pdf" \
  -F "title=Investment Guide" \
  -F "price=0"
```

### Delete File
```bash
curl -X DELETE http://localhost:3000/api/admin/files/FILE_ID \
  -u "delijah5415@gmail.com:Ishmaah5415"
```

---

## 💬 Chat Support (ADMIN ONLY - Reply Permission)

### View All Messages
```bash
curl http://localhost:3000/api/admin/messages \
  -u "delijah5415@gmail.com:Ishmaah5415"
```

### Reply to Message (ADMIN EXCLUSIVE)
```bash
curl -X POST http://localhost:3000/api/admin/messages/MESSAGE_ID/reply \
  -u "delijah5415@gmail.com:Ishmaah5415" \
  -H "Content-Type: application/json" \
  -d '{"reply":"Thank you for your message!"}'
```

**Note:** Public users can ONLY post messages. They CANNOT reply. Only admin can reply.

---

## 👥 User Access Control (ADMIN ONLY)

### Grant Premium Access
```bash
curl -X POST http://localhost:3000/api/admin/grant-premium \
  -u "delijah5415@gmail.com:Ishmaah5415" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","days":30,"reason":"Admin approved"}'
```

### Revoke Premium Access
```bash
curl -X POST http://localhost:3000/api/admin/revoke-premium \
  -u "delijah5415@gmail.com:Ishmaah5415" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

---

## 📊 Dashboard & Stats

### View All Users
```bash
curl http://localhost:3000/api/admin/users \
  -u "delijah5415@gmail.com:Ishmaah5415"
```

### Dashboard Statistics
```bash
curl http://localhost:3000/api/admin/dashboard-stats \
  -u "delijah5415@gmail.com:Ishmaah5415"
```

---

## 🚫 Access Restrictions

### ✅ ADMIN CAN:
- Upload/Delete/Update files
- Reply to chat messages
- Grant premium access
- Revoke premium access
- View all user data
- Send bulk emails
- Access all payment methods (bypass country restrictions)
- Access premium content (bypass subscription)

### ❌ REGULAR USERS CANNOT:
- Upload files (401 Forbidden)
- Reply to messages (can only post)
- Grant/revoke access
- View other users' data
- Access admin endpoints

---

## 🔑 Authentication Format

### Command Line (curl):
```bash
-u "delijah5415@gmail.com:Ishmaah5415"
```

### JavaScript (fetch):
```javascript
const auth = btoa('delijah5415@gmail.com:Ishmaah5415');
fetch('/api/admin/users', {
  headers: { 'Authorization': `Basic ${auth}` }
});
```

### HTTP Header:
```
Authorization: Basic ZGVsaWphaDU0MTVAZ21haWwuY29tOklzaG1hYWg1NDE1
```

---

## 📍 Admin Dashboard URL
```
Areas/Admin/Views/Dashboard/Index.cshtml
```

---

## ⚠️ Security Notes

1. **Unrestricted Access:** Admin bypasses ALL restrictions (premium, country, file access)
2. **Exclusive Permissions:** Only admin can upload files, reply to messages, grant/revoke access
3. **HTTPS Required:** Use HTTPS in production (Basic Auth is base64, not encrypted)
4. **All Actions Logged:** Admin activities tracked in storage-complex

---

**Full Documentation:** [ADMIN_CONTROL_GUIDE.md](ADMIN_CONTROL_GUIDE.md)
