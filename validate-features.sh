#!/bin/bash

# SmartInvest- Feature Validation Script
# This script helps verify that all features are properly configured and working

echo "🔍 SmartInvest- Feature Validation"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation results
PASSED=0
FAILED=0
WARNINGS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((FAILED++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1/"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Missing: $1/"
        ((FAILED++))
    fi
}

# Function to check environment variable
check_env() {
    if grep -q "^$1=" .env 2>/dev/null; then
        if grep -q "^$1=.*[^=]" .env; then
            echo -e "${GREEN}✓${NC} Configured: $1"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠${NC} Empty: $1 (needs value)"
            ((WARNINGS++))
        fi
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((FAILED++))
    fi
}

echo "📦 Checking Core Files..."
echo "-------------------------"
check_file "server.js"
check_file "package.json"
check_file ".env.example"
check_dir "public"
check_dir "services"
check_dir "api"
check_dir "data"
echo ""

echo "💬 Checking Live Chat Files..."
echo "------------------------------"
check_file "public/js/live-chat-widget.js"
echo ""

echo "📧 Checking Email Service Files..."
echo "----------------------------------"
check_file "services/live-email-service.js"
check_file "api/live-email-api.js"
check_file "public/js/contact-form-handler.js"
echo ""

echo "📱 Checking Social Media Files..."
echo "---------------------------------"
check_file "services/social-media-service.js"
check_file "api/social-media-api.js"
check_file "admin-social-media.html"
check_file "public/js/social-media-widget.js"
check_file "data/social-media.json"
echo ""

echo "🔗 Checking Share Link Files..."
echo "-------------------------------"
check_file "services/share-link-service.js"
check_file "api/share-link-api.js"
check_file "public/js/share-link-generator.js"
check_file "share.html"
echo ""

echo "📁 Checking Product File System..."
echo "----------------------------------"
check_file "services/product-file-service.js"
check_file "api/product-files-api.js"
check_file "admin-product-files.html"
check_file "public/js/admin-product-file-manager.js"
echo ""

echo "🔍 Checking User Search..."
echo "-------------------------"
check_file "api/user-search-api.js"
check_file "public/js/admin-user-search.js"
echo ""

echo "📄 Checking Documentation..."
echo "---------------------------"
check_file "README.md"
check_file "QUICK_START.md"
check_file "DEPLOYMENT_CHECKLIST.md"
check_file "INTEGRATION_SUMMARY.md"
check_file "LIVE_FEATURES_COMPLETE.md"
echo ""

echo "🌐 Checking Main Pages..."
echo "------------------------"
check_file "index.html"
check_file "contact.html"
check_file "about.html"
check_file "products.html"
check_file "dashboard.html"
check_file "admin.html"
echo ""

# Check .env file
if [ -f ".env" ]; then
    echo "⚙️  Checking Environment Variables..."
    echo "-----------------------------------"
    check_env "EMAIL_USER"
    check_env "EMAIL_PASSWORD"
    check_env "ADMIN_EMAIL"
    check_env "WEBSITE_EMAIL"
    check_env "SUPPORT_PHONE_1"
    check_env "SUPPORT_PHONE_2"
    check_env "BASE_URL"
    check_env "ADMIN_USERNAME"
    check_env "ADMIN_PASSWORD"
    echo ""
else
    echo -e "${YELLOW}⚠${NC} .env file not found!"
    echo "   Run: cp .env.example .env"
    echo ""
    ((WARNINGS++))
fi

# Check Node modules
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules installed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} node_modules not found"
    echo "   Run: npm install"
    ((FAILED++))
fi
echo ""

# Check package.json dependencies
echo "📚 Checking Dependencies..."
echo "--------------------------"
if [ -f "package.json" ]; then
    for dep in "express" "nodemailer" "multer" "uuid" "cors"; do
        if grep -q "\"$dep\"" package.json; then
            echo -e "${GREEN}✓${NC} $dep listed in package.json"
            ((PASSED++))
        else
            echo -e "${RED}✗${NC} $dep missing from package.json"
            ((FAILED++))
        fi
    done
fi
echo ""

# Summary
echo "=================================="
echo "📊 Validation Summary"
echo "=================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready to deploy!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure Gmail app password in .env"
    echo "2. Run: node server.js"
    echo "3. Test at: http://localhost:3000"
    echo "4. Deploy to Vercel when ready"
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Some warnings found. Please review.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Add values to empty environment variables in .env"
    echo "- Ensure Gmail app password is configured"
    exit 1
else
    echo -e "${RED}❌ Some critical files are missing!${NC}"
    echo ""
    echo "Please ensure all files are present before deployment."
    exit 2
fi
