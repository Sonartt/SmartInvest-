# Backend Integration Testing Guide

## Quick Test Checklist

Use this guide to verify that all backend payment endpoints are working correctly.

## Prerequisites

1. **Server Running:** Start the server with `node server.js`
2. **Authentication:** You need a valid JWT token or admin credentials
3. **Tools:** Use `curl`, Postman, or browser DevTools

## Environment Setup

Ensure `.env` file has:
```env
ADMIN_USER=admin
ADMIN_PASS=your_secure_password
JWT_SECRET=your_jwt_secret
PORT=3000
```

## Test Scenarios

### Test 1: Process Payment (User Endpoint)

**Purpose:** Verify payment processing works

**Requirements:** Valid JWT token (user must be logged in)

```bash
# Test with curl
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "amount": 1000,
    "currency": "KES",
    "method": "mpesa",
    "phone": "+254712345678",
    "email": "test@example.com",
    "description": "Test payment from API"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "transactionId": "txn_1704067200000_abc123",
  "reference": "SMI-1704067200000-xyz789",
  "amount": 1000,
  "currency": "KES",
  "status": "processing",
  "message": "M-Pesa STK push initiated. Check your phone."
}
```

**Check:**
- ✅ Status code: 200
- ✅ Response has `success: true`
- ✅ Transaction ID is generated
- ✅ Reference is generated

---

### Test 2: Record Transaction (User Endpoint)

**Purpose:** Verify transaction recording works

```bash
curl -X POST http://localhost:3000/api/payments/record \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "transactionId": "txn_1704067200000_abc123",
    "amount": 1000,
    "currency": "KES",
    "method": "mpesa",
    "status": "completed",
    "email": "test@example.com",
    "phone": "+254712345678",
    "reference": "SMI-1704067200000-xyz789",
    "description": "Test payment completed"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Transaction recorded successfully"
}
```

**Check:**
- ✅ Status code: 200
- ✅ Response has `success: true`
- ✅ Check `transactions.json` - transaction should be there

---

### Test 3: Get User Transaction History

**Purpose:** Verify users can see their own transactions

```bash
curl -X GET "http://localhost:3000/api/payments/user/history?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn_1704067200000_abc123",
      "amount": 1000,
      "currency": "KES",
      "method": "mpesa",
      "status": "completed",
      "description": "Test payment completed",
      "email": "test@example.com",
      "phone": "+254712345678",
      "reference": "SMI-1704067200000-xyz789",
      "timestamp": "2024-01-27T...",
      "receiptUrl": null,
      "note": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Check:**
- ✅ Status code: 200
- ✅ Transactions array contains user's transactions only
- ✅ Pagination object is present
- ✅ Total count matches

---

### Test 4: Get All Transactions (Admin Endpoint)

**Purpose:** Verify admin can see all transactions

```bash
# Using Basic Auth
curl -X GET "http://localhost:3000/api/payments/admin/all?page=1&pageSize=15" \
  -H "Authorization: Basic $(echo -n 'admin:your_secure_password' | base64)"
```

**Expected Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn_1704067200000_abc123",
      "userId": "test@example.com",
      "amount": 1000,
      "currency": "KES",
      "method": "mpesa",
      "status": "completed",
      "description": "Test payment completed",
      "email": "test@example.com",
      "phone": "+254712345678",
      "reference": "SMI-1704067200000-xyz789",
      "timestamp": "2024-01-27T...",
      "receiptUrl": null,
      "note": null,
      "paidAt": null,
      "updatedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 15,
    "total": 1,
    "totalPages": 1
  }
}
```

**Check:**
- ✅ Status code: 200
- ✅ Admin sees ALL transactions (not just their own)
- ✅ Includes userId field
- ✅ Pagination works

---

### Test 5: Export Transactions to CSV (Admin)

**Purpose:** Verify CSV export functionality

```bash
curl -X GET "http://localhost:3000/api/payments/export/csv" \
  -H "Authorization: Basic $(echo -n 'admin:your_secure_password' | base64)" \
  -o transactions_export.csv
```

**Expected:** File downloaded as `transactions_export.csv`

**Check:**
- ✅ Status code: 200
- ✅ File is downloaded
- ✅ File contains CSV data with headers
- ✅ Transaction data is properly formatted

**View the file:**
```bash
cat transactions_export.csv
```

---

### Test 6: Verify Transaction (Admin Action)

**Purpose:** Test admin can verify transactions

```bash
curl -X POST http://localhost:3000/api/payments/admin/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:your_secure_password' | base64)" \
  -d '{
    "transactionId": "txn_1704067200000_abc123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Transaction verified"
}
```

**Check:**
- ✅ Status code: 200
- ✅ Transaction status updated to "completed"
- ✅ `verifiedAt` timestamp added
- ✅ Note added with admin email

---

### Test 7: Add Note to Transaction (Admin)

**Purpose:** Test admin can add notes

```bash
curl -X POST http://localhost:3000/api/payments/admin/note \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:your_secure_password' | base64)" \
  -d '{
    "transactionId": "txn_1704067200000_abc123",
    "note": "Customer contacted and confirmed payment"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Note added successfully"
}
```

**Check:**
- ✅ Status code: 200
- ✅ Note is appended to transaction
- ✅ Timestamp included in note
- ✅ Admin email included in note

---

### Test 8: Dispute Transaction (Admin)

**Purpose:** Test dispute functionality

```bash
curl -X POST http://localhost:3000/api/payments/admin/dispute \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:your_secure_password' | base64)" \
  -d '{
    "transactionId": "txn_1704067200000_abc123",
    "reason": "Customer claims non-receipt"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Transaction marked as disputed"
}
```

**Check:**
- ✅ Status code: 200
- ✅ Transaction status = "disputed"
- ✅ `disputedAt` timestamp added
- ✅ Reason logged in note

---

### Test 9: Refund Transaction (Admin)

**Purpose:** Test refund processing

```bash
curl -X POST http://localhost:3000/api/payments/admin/refund \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:your_secure_password' | base64)" \
  -d '{
    "transactionId": "txn_1704067200000_abc123",
    "reason": "Duplicate payment"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Transaction refunded"
}
```

**Check:**
- ✅ Status code: 200
- ✅ Transaction status = "refunded"
- ✅ `refundedAt` timestamp added
- ✅ Reason logged in note

---

## Frontend Testing (Browser)

### Test 10: Payment Modal (Dashboard)

1. Open browser to `http://localhost:3000/dashboard.html`
2. Log in as a user
3. Click "💰 Make a Payment" button
4. Fill in payment details:
   - Amount: 500
   - Currency: KES
   - Phone: +254712345678
   - Email: test@example.com
   - Description: Test from UI
5. Click "Next"
6. Select payment method (e.g., M-Pesa)
7. Click "Next"
8. Review and click "Confirm Payment"

**Check:**
- ✅ Modal opens smoothly
- ✅ Form validation works
- ✅ Payment processing shows spinner
- ✅ Success message displays
- ✅ Transaction appears in transactions.json

---

### Test 11: Transaction History (Dashboard)

1. In dashboard, click "📜 Payment History" link
2. Transaction list should appear

**Check:**
- ✅ Transactions load
- ✅ User sees only their transactions
- ✅ Pagination works
- ✅ Search works
- ✅ Status filter works
- ✅ Transaction details expand

---

### Test 12: Admin Transaction Viewer

1. Open `http://localhost:3000/admin.html`
2. Log in as admin
3. Go to "Payments" tab
4. Transaction history should load

**Check:**
- ✅ Admin sees ALL transactions
- ✅ Search works across all users
- ✅ Admin action buttons appear
- ✅ Verify button works
- ✅ Dispute button works
- ✅ Refund button works
- ✅ Add Note button works
- ✅ Export CSV button works

---

## Error Testing

### Test 13: Unauthorized Access

```bash
# Try to access without token
curl -X GET "http://localhost:3000/api/payments/user/history"
```

**Expected:** 401 Unauthorized

---

### Test 14: Admin Endpoint as Regular User

```bash
# Try admin endpoint with user token
curl -X GET "http://localhost:3000/api/payments/admin/all" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

**Expected:** 401 Unauthorized (not admin)

---

### Test 15: Invalid Transaction ID

```bash
curl -X POST http://localhost:3000/api/payments/admin/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:your_secure_password' | base64)" \
  -d '{"transactionId": "invalid_id_123"}'
```

**Expected:** 404 Not Found

---

### Test 16: Missing Required Fields

```bash
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"amount": 1000}'
```

**Expected:** 400 Bad Request (missing currency and method)

---

## Data Verification

### Check transactions.json

```bash
cat transactions.json | jq .
```

**Should show:**
- Array of transaction objects
- Each has required fields (id, userId, amount, currency, method, status)
- Timestamps are in ISO format
- Admin actions are logged in notes

---

## Performance Testing

### Test 17: Pagination Performance

Create multiple test transactions:

```bash
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/payments/process \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d "{\"amount\": $((100 * i)), \"currency\": \"KES\", \"method\": \"mpesa\", \"phone\": \"+254712345678\", \"email\": \"test@example.com\", \"description\": \"Test payment $i\"}" \
    > /dev/null 2>&1
  echo "Created transaction $i"
done
```

Then test pagination:

```bash
# Page 1
curl -X GET "http://localhost:3000/api/payments/user/history?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Page 2
curl -X GET "http://localhost:3000/api/payments/user/history?page=2&pageSize=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Check:**
- ✅ Correct number of items per page
- ✅ Total count is accurate
- ✅ No duplicate transactions across pages

---

## Troubleshooting

### Issue: "Authentication required" error
**Solution:** Ensure you have a valid JWT token. Get one by logging in first.

### Issue: "Admin access required" error
**Solution:** Check ADMIN_USER and ADMIN_PASS in .env file. Use Basic Auth with correct credentials.

### Issue: Transactions not saving
**Solution:** Check that transactions.json file exists and has write permissions.

### Issue: Empty transaction list
**Solution:** Create test transactions first using the process endpoint.

### Issue: Server not starting
**Solution:** Check PORT is not in use. Kill existing process: `killall node`

---

## Success Criteria

All tests should pass with:
- ✅ Correct status codes
- ✅ Expected JSON responses
- ✅ Data persisted in transactions.json
- ✅ Frontend displays correctly
- ✅ Admin functions work
- ✅ Authentication enforced
- ✅ No server errors in console

---

**Testing Complete:** Once all tests pass, the payment system is fully operational! 🎉
