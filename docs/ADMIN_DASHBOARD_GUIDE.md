# SmartInvest Admin Dashboard - Content Management & User Analytics Guide

## Overview

The SmartInvest admin dashboard has been significantly expanded to provide comprehensive content management and user analytics capabilities. The new system allows administrators to:

1. **Manage Course Content** - Create, update, and organize investment courses
2. **Manage Insights** - Publish articles and investment insights
3. **Manage Tools** - Add and configure investment tools
4. **Manage SME Content** - Create funding readiness guides for SMEs
5. **Track Community** - Monitor community member signups and activity
6. **View User Analytics** - Real-time data on visitors, signups, and active users
7. **Monitor Active Users** - See who's currently active on the platform

## Accessing the Admin Dashboard

**URL**: `http://localhost:3000/admin` (or `https://yourdomain.com/admin` in production)

When accessing, you'll be prompted for credentials:
- **Username**: Set via `ADMIN_USER` environment variable
- **Password**: Set via `ADMIN_PASS` environment variable

```bash
# Example - Start server with credentials
ADMIN_USER=admin ADMIN_PASS=password node server.js
```

## Dashboard Features

### 1. Overview Tab
- Quick stats dashboard showing:
  - Total courses created
  - Total insights published
  - Active users right now
  - Community members
- Quick action buttons to add content
- Recent activity feed

### 2. Courses Tab
**Purpose**: Manage investment courses for the "Explore Courses" section

**Features**:
- View all courses with descriptions, levels, and duration
- Add new courses with:
  - Title
  - Description
  - Level (Beginner, Intermediate, Advanced)
  - Duration (e.g., "4 weeks")
  - Price (in KES)
- Edit course details
- Delete courses

**API Endpoints**:
```
GET    /api/admin/courses                    - List all courses
POST   /api/admin/courses                    - Create new course
PUT    /api/admin/courses/:id                - Update course
DELETE /api/admin/courses/:id                - Delete course
GET    /api/courses                          - Public: Get published courses
```

**Example - Create Course**:
```bash
curl -X POST http://localhost:3000/api/admin/courses \
  -H "Authorization: Basic YWRtaW46YWRtaW4=" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Stock Market 101",
    "description": "Learn how to invest in stocks",
    "level": "Beginner",
    "duration": "4 weeks",
    "price": 2000
  }'
```

### 3. Insights Tab
**Purpose**: Manage articles and investment insights for "Latest Insights" section

**Features**:
- View published insights with content preview
- Create new insights with:
  - Title
  - Content (full article body)
  - Category (e.g., Fintech, Agribusiness, Energy)
  - Featured flag (upcoming feature)
- Edit insight content and metadata
- Delete insights

**API Endpoints**:
```
GET    /api/admin/insights                   - List all insights
POST   /api/admin/insights                   - Create new insight
PUT    /api/admin/insights/:id               - Update insight
DELETE /api/admin/insights/:id               - Delete insight
GET    /api/insights                         - Public: Get published insights
```

### 4. Tools Tab
**Purpose**: Manage investment tools (calculators, trackers) for "Tools" section

**Features**:
- View all tools with descriptions
- Add new tools with:
  - Title
  - Description
  - Icon (emoji)
- Edit tool details
- Delete tools

**API Endpoints**:
```
GET    /api/admin/tools                      - List all tools
POST   /api/admin/tools                      - Create new tool
PUT    /api/admin/tools/:id                  - Update tool
DELETE /api/admin/tools/:id                  - Delete tool
GET    /api/tools                            - Public: Get published tools
```

### 5. SME Content Tab
**Purpose**: Manage SME funding readiness guides

**Features**:
- View funding guides with resources
- Create SME content with:
  - Title
  - Description
  - Resources (comma-separated URLs/file links)
- Edit and update content
- Delete guides

**API Endpoints**:
```
GET    /api/admin/sme                        - List all SME content
POST   /api/admin/sme                        - Create new SME content
PUT    /api/admin/sme/:id                    - Update SME content
DELETE /api/admin/sme/:id                    - Delete SME content
GET    /api/sme                              - Public: Get SME content
```

### 6. Community Tab
**Purpose**: Track and manage community members

**Features**:
- View all community members with:
  - Name and email
  - Join date
  - Interests
  - Status
- Remove members from community
- See total community size

**API Endpoints**:
```
GET    /api/admin/community-users            - List all community members
POST   /api/community/join                   - User joins community (public)
DELETE /api/admin/community-users/:id        - Remove member
```

**Example - Join Community**:
```bash
curl -X POST http://localhost:3000/api/community/join \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Investor",
    "email": "john@example.com",
    "interests": ["stocks", "crypto"]
  }'
```

### 7. Analytics Tab
**Purpose**: Real-time dashboard for user activity and engagement

**Features**:
- Website traffic metrics:
  - Total visitors
  - Unique visitors
  - Visitor list with timestamps
- User signup metrics:
  - Total signups
  - Unique signups
  - Email list
- User login metrics:
  - Total logins
  - Unique users
- Active user monitoring:
  - Users active in last hour
  - User activity status
- Auto-refresh every 30 seconds

**API Endpoints**:
```
GET    /api/admin/analytics                  - Get all analytics
GET    /api/admin/active-users               - Get currently active users
GET    /api/admin/visitors                   - Get all visitor records
GET    /api/admin/signin-users               - Get all signin users
POST   /api/admin/cleanup-sessions           - Remove old session records
POST   /api/analytics/visitor                - Track visitor (public)
POST   /api/analytics/signup                 - Track signup (public)
POST   /api/analytics/login                  - Track login (public)
```

### 8. Users Tab
**Purpose**: View all users who have signed in to the platform

**Features**:
- Complete list of all signin users showing:
  - Email address
  - Last login timestamp
  - Total login count
- Real-time updates
- User count statistics

## Data Storage

All content and analytics are stored in JSON files in the `data/` directory:

```
data/
├── content/
│   ├── courses.json              # Course definitions
│   ├── insights.json             # Published insights/articles
│   ├── tools.json                # Investment tools
│   ├── sme-content.json          # SME funding guides
│   ├── community-users.json      # Community members
│   └── active-sessions.json      # Active user sessions
├── users.json                    # User auth records
├── files.json                    # File metadata
├── messages.json                 # Support messages
├── purchases.json                # Purchase records
└── ...
```

## Auto-Tracking Features

The system automatically tracks user activity:

1. **Visitor Tracking** - Triggered when homepage loads
2. **Signup Tracking** - Triggered when user signs up
3. **Login Tracking** - Triggered when user logs in
4. **Session Management** - Automatic session creation on login

These happen automatically without additional configuration needed.

## Environment Variables

```bash
# Admin Credentials
ADMIN_USER=admin              # Admin username
ADMIN_PASS=password           # Admin password

# Other (existing)
PORT=3000                     # Server port
MPESA_CONSUMER_KEY=...       # M-Pesa API key
MPESA_CONSUMER_SECRET=...    # M-Pesa API secret
PAYPAL_CLIENT_ID=...         # PayPal client ID
PAYPAL_CLIENT_SECRET=...     # PayPal secret
```

## API Response Format

All API endpoints follow this response format:

**Success**:
```json
{
  "success": true,
  "data": { ... }  // or specific field like "courses", "users", etc.
}
```

**Error**:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Integration with Website

The admin system seamlessly integrates with the main website:

1. **Courses** - Added courses appear in "Explore Courses" section on homepage
2. **Insights** - Published insights appear in "Latest Insights" section
3. **Tools** - Created tools appear in "Investment Tools" section
4. **Community** - Community members can be tracked and managed
5. **Analytics** - User engagement data is automatically collected

## Backup & Recovery

For production environments, regularly backup the `data/` directory:

```bash
# Backup
tar -czf smartinvest-data-$(date +%Y%m%d).tar.gz data/

# Restore
tar -xzf smartinvest-data-20260128.tar.gz
```

## Security Considerations

1. **Admin Authentication**: All admin endpoints require HTTP Basic Auth
2. **Public APIs**: Tracking endpoints are public but log-only
3. **Data Isolation**: Each content type is stored separately
4. **Session Cleanup**: Old sessions (>24 hours) can be cleaned via `/api/admin/cleanup-sessions`

## Troubleshooting

### Credentials not working
- Verify `ADMIN_USER` and `ADMIN_PASS` environment variables are set
- Restart the server after setting credentials
- Check server logs: `ADMIN_USER=test ADMIN_PASS=test node server.js`

### Data files not found
- Ensure `data/content/` directory exists
- Initialize files manually:
  ```bash
  mkdir -p data/content
  echo '[]' > data/content/courses.json
  echo '[]' > data/content/insights.json
  # ... etc
  ```

### Analytics not tracking
- Verify `/api/analytics/visitor` endpoint is accessible
- Check browser console for fetch errors
- Ensure CORS is enabled on server

## Future Enhancements

Potential features to add:
- Course enrollment and progress tracking
- Insight commenting and ratings
- Tool analytics (usage stats)
- Advanced user segmentation
- Email notifications
- Dashboard charts and graphs
- Bulk imports/exports
- Scheduled content publishing
- User role management
