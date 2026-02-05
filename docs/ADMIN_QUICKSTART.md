# Quick Start - Admin Dashboard Setup

## 1. Start the Server with Admin Credentials

```bash
cd /workspaces/SmartInvest-
ADMIN_USER=admin ADMIN_PASS=admin123 node server.js
```

The server will start on `http://localhost:3000`

## 2. Access the Admin Dashboard

Navigate to: `http://localhost:3000/admin`

You'll see a login prompt. Enter:
- **Username**: admin
- **Password**: admin123

## 3. Create Your First Course

1. Go to the **Courses** tab
2. Click **+ Add Course**
3. Fill in:
   - Title: "Investment Fundamentals"
   - Description: "Learn the basics of investing"
   - Level: "Beginner"
   - Duration: "4 weeks"
   - Price: "2000"
4. Click **Create Course**

## 4. Add an Insight

1. Go to **Insights** tab
2. Click **+ Add Insight**
3. Fill in:
   - Title: "The Power of Compound Interest"
   - Content: (your article text)
   - Category: "General"
4. Click **Create Insight**

## 5. Create an Investment Tool

1. Go to **Tools** tab
2. Click **+ Add Tool**
3. Fill in:
   - Title: "ROI Calculator"
   - Description: "Calculate your return on investment"
   - Icon: "📊"
4. Click **Create Tool**

## 6. Add SME Content

1. Go to **SME Content** tab
2. Click **+ Add SME Content**
3. Fill in:
   - Title: "Getting Ready for Funding"
   - Description: "Guide for SMEs preparing for investment"
   - Resources: (URL links, comma-separated)
4. Click **Create Content**

## 7. View Community Members

Go to the **Community** tab to see all members who have joined your community.

To add members programmatically:
```bash
curl -X POST http://localhost:3000/api/community/join \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Investor",
    "email": "jane@example.com",
    "interests": ["real estate", "stocks"]
  }'
```

## 8. Check Analytics

Go to the **Analytics** tab to see:
- Website visitors
- New signups
- User login activity
- Active users right now

## 9. View All Sign-In Users

Go to the **Users** tab to see complete list of all users who have signed in, with their login history.

## 10. Verify Data Storage

Data is saved in `data/content/`:

```bash
ls -la data/content/
# Shows: courses.json, insights.json, tools.json, sme-content.json, 
#        community-users.json, active-sessions.json
```

View the data:
```bash
cat data/content/courses.json
```

## API Testing with cURL

### Create a Course (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/courses \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Crypto Investing",
    "description": "Learn about cryptocurrency",
    "level": "Advanced",
    "duration": "6 weeks",
    "price": 5000
  }'
```

### Get All Courses (Public)
```bash
curl http://localhost:3000/api/courses | jq
```

### Track a Visitor
```bash
curl -X POST http://localhost:3000/api/analytics/visitor \
  -H "Content-Type: application/json" \
  -d '{"source": "direct"}'
```

### Track a Signup
```bash
curl -X POST http://localhost:3000/api/analytics/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Get Analytics (Admin)
```bash
curl http://localhost:3000/api/admin/analytics \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" | jq
```

### Get Active Users (Admin)
```bash
curl http://localhost:3000/api/admin/active-users \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" | jq
```

## Features Overview

| Feature | Location | Capabilities |
|---------|----------|--------------|
| **Courses** | Courses Tab | Create, read, update, delete investment courses |
| **Insights** | Insights Tab | Publish articles with categories |
| **Tools** | Tools Tab | Manage investment calculators/trackers |
| **SME** | SME Content Tab | Create funding guides with resources |
| **Community** | Community Tab | Track members, see join dates |
| **Analytics** | Analytics Tab | Real-time visitor and engagement metrics |
| **Users** | Users Tab | View all signin users and login history |

## Demo Content Setup

To quickly populate demo data, run:
```bash
# Create demo courses
curl -X POST http://localhost:3000/api/admin/courses \
  -H "Authorization: Basic YWRtaW46YWRtaW4=" \
  -H "Content-Type: application/json" \
  -d '{"title":"Stock Trading 101","description":"Master stock trading","level":"Beginner","duration":"3 weeks","price":1500}'

# Create demo insight  
curl -X POST http://localhost:3000/api/admin/insights \
  -H "Authorization: Basic YWRtaW46YWRtaW4=" \
  -H "Content-Type: application/json" \
  -d '{"title":"Why Diversification Matters","content":"Spreading your investments reduces risk...","category":"General"}'

# Create demo community member
curl -X POST http://localhost:3000/api/community/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo User","email":"demo@example.com","interests":["investing"]}'
```

## Important Notes

1. **Admin Credentials**: Set via environment variables before starting the server
2. **Public Tracking**: Visitor/signup/login tracking works without admin auth
3. **Data Persistence**: All data stored in JSON files in `data/content/` directory
4. **Auto-refresh**: Analytics dashboard auto-refreshes every 30 seconds
5. **Browser Auth**: Admin dashboard prompts for credentials on first access

For full documentation, see [ADMIN_DASHBOARD_GUIDE.md](./ADMIN_DASHBOARD_GUIDE.md)
