# SmartInvest Marketplace - Admin Quick Reference Card

**Print this card and keep it at your desk**

---

## 🔑 Master Admin Credentials

**Email**: delijah5415@gmail.com  
**Initial Password**: Check console output on first `dotnet run`  
**⚠️ ACTION**: Change immediately after first login!

---

## 📍 Admin Dashboard URLs

```
Dashboard:     https://yourapp.com/api/admin/dashboard/data
Analytics:     https://yourapp.com/api/admin/dashboard/analytics
Audit Logs:    https://yourapp.com/api/admin/dashboard/audit-logs
Grant Admin:   https://yourapp.com/api/admin/dashboard/users/{email}/grant-access
Revoke Admin:  https://yourapp.com/api/admin/dashboard/users/{email}/revoke-access
```

---

## 🚀 Quick Commands

### Get Dashboard Data
```bash
curl https://localhost:7001/api/admin/dashboard/data \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

### Grant Admin Access to Someone
```bash
curl -X POST https://localhost:7001/api/admin/dashboard/users/newadmin@example.com/grant-access \
  -H "Authorization: Bearer {MASTER_JWT}" \
  -H "Content-Type: application/json" \
  -d '{"fullName": "John Doe", "role": "Admin"}'
```

### View Admin Action Audit Trail (Last 30 Days)
```bash
curl https://localhost:7001/api/admin/dashboard/audit-logs?days=30 \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

### Get Platform Analytics
```bash
curl https://localhost:7001/api/admin/dashboard/analytics \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

### Check Fraud Alerts
```bash
# Alerts are in the dashboard response, look for:
# "unresolvedFraudAlerts": [...]
```

### Approve External Integration
```bash
curl -X POST https://localhost:7001/api/external/admin/{integrationId}/approve \
  -H "Authorization: Bearer {MASTER_JWT}"
```

### Reject External Integration
```bash
curl -X POST https://localhost:7001/api/external/admin/{integrationId}/reject \
  -H "Authorization: Bearer {MASTER_JWT}"
```

### View Pending Integration Requests
```bash
curl https://localhost:7001/api/external/admin/pending \
  -H "Authorization: Bearer {MASTER_JWT}"
```

---

## ⚠️ Key Thresholds

| Threshold | Value | Action |
|-----------|-------|--------|
| Fraud Auto-Block | 70+ | Payment blocked, requires review |
| Fraud Manual Review | 50-69 | Payment processed, flag for review |
| Fraud Low Risk | <50 | Payment processed normally |
| Free Tier Quota | 1,000 req/month | Integration rate limit |
| Premium Tier Quota | 100,000 req/month | Integration rate limit |
| Recapture Max Attempts | 3 | Don't retry after 3 failures |
| Recapture Delays | 1h, 2h, 4h | Exponential backoff |
| Admin Lockout | 5 failed attempts | 15 minute timeout |

---

## 📊 Dashboard Metrics You'll See

```
✓ Total Users        → Registered accounts
✓ Total Sellers      → Active seller accounts
✓ Total Buyers       → Active buyer accounts
✓ Total Transactions → All completed payments
✓ Total Revenue      → Sum of all payment amounts
✓ Fraud Alerts       → Need immediate review
✓ Top Sellers        → By total revenue
✓ Integrations       → Active approved partners
```

---

## 🔴 Emergency Actions

### Blacklist a User (Block Payments)
```bash
curl -X POST https://localhost:7001/api/admin/blacklist \
  -H "Authorization: Bearer {MASTER_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "user_email",
    "targetValue": "fraudster@example.com",
    "reason": "Chargeback fraud detected",
    "durationDays": 365
  }'
```

### Blacklist an IP Address
```bash
curl -X POST https://localhost:7001/api/admin/blacklist \
  -H "Authorization: Bearer {MASTER_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "ip_address",
    "targetValue": "192.168.1.100",
    "reason": "Automated attack detected",
    "durationDays": 30
  }'
```

---

## 🎯 Daily Admin Checklist

**Morning (5 min)**:
- [ ] Check for unresolved fraud alerts
- [ ] Review new registrations
- [ ] Check pending integration requests

**Throughout Day**:
- [ ] Monitor fraud score distribution
- [ ] Review payment failure rates
- [ ] Respond to integration approval requests

**End of Day (5 min)**:
- [ ] Review audit logs
- [ ] Check for unusual patterns
- [ ] Backup database (if not automated)

---

## 🚨 Fraud Alert Response

**When Alert Appears** (Score 70+ = Auto-Blocked):

1. **Check Details**: Risk score, risk level, indicators
2. **Investigate**: Seller history, buyer history, patterns
3. **Decide**: 
   - **Approve**: Allow payment to proceed
   - **Block**: Add to blacklist
   - **Monitor**: Flag for review
4. **Document**: Add note to audit trail

---

## 📞 Emergency Contacts

```
Master Admin:     delijah5415@gmail.com
Support Email:    support@example.com
Payment Issues:   payments-support@example.com
Error Hotline:    +1-XXXX-XXXX
```

---

## 💾 Backup Procedure

```bash
# Stop application
Ctrl+C

# Backup database
mysqldump [database_name] > backup_$(date +%Y%m%d).sql

# Restart
dotnet run
```

---

## 🏁 Pre-Launch Sign-Off

- [ ] Master admin password changed
- [ ] All environment variables configured
- [ ] Database migration applied
- [ ] Fraud detection tested
- [ ] All payment methods tested
- [ ] Admin audit logging working
- [ ] Monitoring configured
- [ ] Team trained

---

**Last Updated**: 2025-02-09  
**Master Admin Email**: delijah5415@gmail.com
