#!/bin/bash
# SmartInvest Premium Calculator Setup Guide
# Run this to initialize and test the system

set -e

echo "=========================================="
echo "SmartInvest Premium Calculator Setup"
echo "=========================================="
echo ""

# Step 1: Verify files exist
echo "✓ Checking files..."
required_files=(
  "api/subscription-manager.js"
  "tools/calculator-dashboard.html"
  "tools/investment_calculator.html"
  "tools/investment_calculator_premium.html"
  "SUBSCRIPTION_SYSTEM.md"
  "PREMIUM_CALCULATOR_SYSTEM.md"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file - MISSING"
    exit 1
  fi
done

echo ""
echo "✓ All files present"
echo ""

# Step 2: Check environment
echo "✓ Checking environment variables..."
if [ -f ".env" ]; then
  if grep -q "ADMIN_USER=" .env; then
    echo "  ✓ ADMIN_USER configured"
  else
    echo "  ⚠ ADMIN_USER not set in .env (required for admin access)"
  fi
  if grep -q "ADMIN_PASS=" .env; then
    echo "  ✓ ADMIN_PASS configured"
  else
    echo "  ⚠ ADMIN_PASS not set in .env (required for admin access)"
  fi
else
  echo "  ⚠ .env file not found"
  echo "  Creating default .env..."
  cat > .env << EOF
# Admin credentials for subscription management
ADMIN_USER=deijah545@gmail.com
ADMIN_PASS==ELIJAH-41168990

# Server port
PORT=3000
EOF
  echo "  ✓ .env created with default admin credentials"
fi

echo ""

# Step 3: Initialize data files
echo "✓ Initializing data files..."
mkdir -p data logs

if [ ! -f "data/users.json" ]; then
  echo "[]" > data/users.json
  echo "  ✓ Created data/users.json"
else
  echo "  ✓ data/users.json exists"
fi

if [ ! -f "data/subscriptions.json" ]; then
  echo "[]" > data/subscriptions.json
  echo "  ✓ Created data/subscriptions.json"
else
  echo "  ✓ data/subscriptions.json exists"
fi

if [ ! -f "logs/access.log" ]; then
  touch logs/access.log
  echo "  ✓ Created logs/access.log"
else
  echo "  ✓ logs/access.log exists"
fi

echo ""

# Step 4: Display next steps
echo "=========================================="
echo "Setup Complete! ✅"
echo "=========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Start the server:"
echo "   npm start"
echo ""
echo "2. Open dashboard in browser:"
echo "   http://localhost:3000/tools/calculator-dashboard.html"
echo ""
echo "3. Test the system:"
echo "   - Enter any email to register/login"
echo "   - You should see 3 free calculators"
echo "   - Premium calculators should be locked"
echo ""
echo "4. Grant premium access (as admin):"
echo "   curl -X POST http://localhost:3000/api/admin/subscriptions \\"
echo "     -H \"Authorization: Basic $(echo -n 'deijah545@gmail.com:=ELIJAH-41168990' | base64)\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{"
echo "       \"userId\": \"USER_ID_HERE\","
echo "       \"amount\": 9999,"
echo "       \"paymentMethod\": \"manual\","
echo "       \"validFrom\": \"2026-01-29T00:00:00Z\","
echo "       \"validUntil\": \"2026-02-28T23:59:59Z\","
echo "       \"reason\": \"Premium subscription\""
echo "     }'"
echo ""
echo "5. User logs in again → all 10 calculators available"
echo ""
echo "Documentation:"
echo "  - SUBSCRIPTION_SYSTEM.md - Full API documentation"
echo "  - PREMIUM_CALCULATOR_SYSTEM.md - Complete system overview"
echo ""
echo "=========================================="
