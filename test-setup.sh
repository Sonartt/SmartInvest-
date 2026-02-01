#!/bin/bash

# Quick test script for SmartInvest-
echo "🧪 SmartInvest- Quick Test"
echo "=========================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your Gmail app password!"
    echo "   Open .env and replace 'your-app-specific-password-here'"
    echo "   with your actual Gmail app password."
    echo ""
else
    echo "✅ .env file exists"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
else
    echo "✅ Dependencies installed"
    echo ""
fi

# Check critical files
echo "🔍 Checking critical files..."
FILES=(
    "server.js"
    "public/js/live-chat-widget.js"
    "services/live-email-service.js"
    "api/live-email-api.js"
    "services/social-media-service.js"
    "api/social-media-api.js"
    "data/social-media.json"
)

ALL_PRESENT=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MISSING)"
        ALL_PRESENT=false
    fi
done
echo ""

if [ "$ALL_PRESENT" = true ]; then
    echo "🎉 All critical files present!"
    echo ""
    echo "📚 Documentation Files:"
    echo "  - README.md - Main documentation"
    echo "  - QUICK_START.md - 5-minute setup guide"
    echo "  - DEPLOYMENT_CHECKLIST.md - Deployment guide"
    echo "  - INTEGRATION_SUMMARY.md - Feature summary"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Configure Gmail app password in .env"
    echo "  2. Start server: node server.js"
    echo "  3. Open browser: http://localhost:3000"
    echo "  4. Test live chat widget (bottom-right corner)"
    echo "  5. Test contact form"
    echo "  6. Login to admin: /admin.html"
    echo "  7. Configure social media: /admin-social-media.html"
    echo ""
    echo "📧 Email Configuration:"
    echo "  Website: smartinvest254@gmail.com"
    echo "  Admin: delijah5415@gmail.com"
    echo "  Phone: 0731856995 / 0114383762"
    echo ""
else
    echo "❌ Some files are missing!"
    echo "Please ensure all files are present before starting."
    exit 1
fi
