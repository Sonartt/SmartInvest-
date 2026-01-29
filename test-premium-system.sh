#!/bin/bash
# Test SmartInvest Premium Calculator System
# This script tests all functionality end-to-end

set -e

BASE_URL="http://localhost:3000"
ADMIN_CREDS="delijah5415@gmail.com:=ELIJAH-41168990"
ADMIN_AUTH=$(echo -n "$ADMIN_CREDS" | base64)

echo "=========================================="
echo "SmartInvest Premium System - Test Suite"
echo "=========================================="
echo ""
echo "Base URL: $BASE_URL"
echo "Admin Auth: $ADMIN_CREDS"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() {
  echo -e "${GREEN}✓ PASS:${NC} $1"
}

fail() {
  echo -e "${RED}✗ FAIL:${NC} $1"
  exit 1
}

warn() {
  echo -e "${YELLOW}⚠ WARN:${NC} $1"
}

# Test 1: User Login/Registration
echo "Test 1: User Login/Registration"
echo "--------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  pass "User login/registration works"
  USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "  User ID: $USER_ID"
else
  fail "User login/registration failed"
  echo "Response: $LOGIN_RESPONSE"
fi

echo ""

# Test 2: Get User Data
echo "Test 2: Get User Data"
echo "---------------------"
USER_RESPONSE=$(curl -s "$BASE_URL/api/users/$USER_ID")

if echo "$USER_RESPONSE" | grep -q '"success":true'; then
  pass "Retrieve user data works"
  IS_PREMIUM=$(echo "$USER_RESPONSE" | grep -o '"isPremium":[^,}]*' | cut -d':' -f2)
  echo "  Is Premium: $IS_PREMIUM"
else
  fail "Get user data failed"
  echo "Response: $USER_RESPONSE"
fi

echo ""

# Test 3: Check Free Calculator Access
echo "Test 3: Check Free Calculator Access"
echo "------------------------------------"
FREE_ACCESS=$(curl -s -X POST "$BASE_URL/api/calculators/investment/access" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}")

if echo "$FREE_ACCESS" | grep -q '"access":true'; then
  pass "Free calculator access granted"
else
  fail "Free calculator access denied"
  echo "Response: $FREE_ACCESS"
fi

echo ""

# Test 4: Check Premium Calculator Access (Should Fail for Free User)
echo "Test 4: Check Premium Calculator Access (Should Fail for Free User)"
echo "-------------------------------------------------------------------"
PREMIUM_ACCESS=$(curl -s -X POST "$BASE_URL/api/calculators/bonds/access" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}")

if echo "$PREMIUM_ACCESS" | grep -q '"access":false'; then
  pass "Premium calculator access denied for free user (as expected)"
else
  fail "Premium calculator should be denied for free user"
  echo "Response: $PREMIUM_ACCESS"
fi

echo ""

# Test 5: Admin Create Subscription
echo "Test 5: Admin Create Subscription"
echo "---------------------------------"
VALID_UNTIL=$(date -d "+30 days" -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+30d +"%Y-%m-%dT%H:%M:%SZ")
VALID_FROM=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")

SUB_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/subscriptions" \
  -H "Authorization: Basic $ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"amount\": 9999,
    \"paymentMethod\": \"manual\",
    \"paymentReference\": \"TEST001\",
    \"validFrom\": \"$VALID_FROM\",
    \"validUntil\": \"$VALID_UNTIL\",
    \"reason\": \"Test premium subscription\"
  }")

if echo "$SUB_RESPONSE" | grep -q '"success":true'; then
  pass "Admin subscription creation works"
  SUB_ID=$(echo "$SUB_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "  Subscription ID: $SUB_ID"
else
  fail "Admin subscription creation failed"
  echo "Response: $SUB_RESPONSE"
fi

echo ""

# Test 6: Check Premium Calculator Access (Should Succeed Now)
echo "Test 6: Check Premium Calculator Access (Should Succeed Now)"
echo "-----------------------------------------------------------"
PREMIUM_ACCESS_2=$(curl -s -X POST "$BASE_URL/api/calculators/bonds/access" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}")

if echo "$PREMIUM_ACCESS_2" | grep -q '"access":true'; then
  pass "Premium calculator access granted after subscription"
else
  fail "Premium calculator access should be granted"
  echo "Response: $PREMIUM_ACCESS_2"
fi

echo ""

# Test 7: List All Subscriptions (Admin)
echo "Test 7: List All Subscriptions (Admin)"
echo "-------------------------------------"
LIST_SUBS=$(curl -s "$BASE_URL/api/admin/subscriptions" \
  -H "Authorization: Basic $ADMIN_AUTH")

if echo "$LIST_SUBS" | grep -q '"success":true'; then
  pass "Admin can list subscriptions"
  SUB_COUNT=$(echo "$LIST_SUBS" | grep -o '"id"' | wc -l)
  echo "  Subscriptions found: $SUB_COUNT"
else
  fail "Admin subscription listing failed"
  echo "Response: $LIST_SUBS"
fi

echo ""

# Test 8: Extend Subscription
echo "Test 8: Extend Subscription"
echo "---------------------------"
EXTEND_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/admin/subscriptions/$SUB_ID/extend" \
  -H "Authorization: Basic $ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{"days": 15}')

if echo "$EXTEND_RESPONSE" | grep -q '"success":true'; then
  pass "Subscription extension works"
else
  fail "Subscription extension failed"
  echo "Response: $EXTEND_RESPONSE"
fi

echo ""

# Test 9: Revoke Subscription
echo "Test 9: Revoke Subscription"
echo "---------------------------"
REVOKE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/subscriptions/$SUB_ID/revoke" \
  -H "Authorization: Basic $ADMIN_AUTH" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test revocation"}')

if echo "$REVOKE_RESPONSE" | grep -q '"success":true'; then
  pass "Subscription revocation works"
else
  fail "Subscription revocation failed"
  echo "Response: $REVOKE_RESPONSE"
fi

echo ""

# Test 10: Check Premium Access After Revocation (Should Fail)
echo "Test 10: Check Premium Access After Revocation (Should Fail)"
echo "-----------------------------------------------------------"
PREMIUM_ACCESS_3=$(curl -s -X POST "$BASE_URL/api/calculators/bonds/access" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}")

if echo "$PREMIUM_ACCESS_3" | grep -q '"access":false'; then
  pass "Premium calculator access denied after revocation (as expected)"
else
  fail "Premium calculator should be denied after revocation"
  echo "Response: $PREMIUM_ACCESS_3"
fi

echo ""

# Test 11: List All Users (Admin)
echo "Test 11: List All Users (Admin)"
echo "-------------------------------"
LIST_USERS=$(curl -s "$BASE_URL/api/admin/users" \
  -H "Authorization: Basic $ADMIN_AUTH")

if echo "$LIST_USERS" | grep -q '"success":true'; then
  pass "Admin can list users"
  USER_COUNT=$(echo "$LIST_USERS" | grep -o '"id":"' | wc -l)
  echo "  Users found: $USER_COUNT"
else
  fail "Admin user listing failed"
  echo "Response: $LIST_USERS"
fi

echo ""

# Summary
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
echo ""
echo "Total Tests: 11"
echo -e "${GREEN}All tests passed!${NC}"
echo ""
echo "Key Features Verified:"
echo "  ✓ User login/registration"
echo "  ✓ User data retrieval"
echo "  ✓ Free calculator access"
echo "  ✓ Premium calculator access control"
echo "  ✓ Admin subscription creation"
echo "  ✓ Subscription extension"
echo "  ✓ Subscription revocation"
echo "  ✓ Access revocation after subscription ends"
echo "  ✓ Admin user listing"
echo ""
echo "System Status: OPERATIONAL ✅"
echo ""
