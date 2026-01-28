// SmartInvest - Content Management & User Analytics API Endpoints
// This file contains additional endpoints for admin content management

// ============================================================================
// DATA FILES & HELPERS
// ============================================================================

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const CONTENT_DIR = path.join(__dirname, 'data', 'content');
const USERS_TRACKING_FILE = path.join(__dirname, 'data', 'user-analytics.json');
const COURSES_FILE = path.join(CONTENT_DIR, 'courses.json');
const INSIGHTS_FILE = path.join(CONTENT_DIR, 'insights.json');
const TOOLS_FILE = path.join(CONTENT_DIR, 'tools.json');
const SME_FILE = path.join(CONTENT_DIR, 'sme-content.json');
const COMMUNITY_USERS_FILE = path.join(CONTENT_DIR, 'community-users.json');
const ACTIVE_SESSIONS_FILE = path.join(CONTENT_DIR, 'active-sessions.json');

// Ensure directories exist
if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });

// Initialize all content files if they don't exist
const initContentFiles = () => {
  const files = [
    { path: COURSES_FILE, default: [] },
    { path: INSIGHTS_FILE, default: [] },
    { path: TOOLS_FILE, default: [] },
    { path: SME_FILE, default: [] },
    { path: COMMUNITY_USERS_FILE, default: [] },
    { path: USERS_TRACKING_FILE, default: { visitors: [], signups: [], logins: [] } },
    { path: ACTIVE_SESSIONS_FILE, default: [] }
  ];
  
  files.forEach(({ path: filePath, default: defaultData }) => {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
  });
};
initContentFiles();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const readJSON = (filePath, defaultValue = []) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return defaultValue;
  }
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const readCourses = () => readJSON(COURSES_FILE, []);
const writeCourses = (data) => writeJSON(COURSES_FILE, data);

const readInsights = () => readJSON(INSIGHTS_FILE, []);
const writeInsights = (data) => writeJSON(INSIGHTS_FILE, data);

const readTools = () => readJSON(TOOLS_FILE, []);
const writeTools = (data) => writeJSON(TOOLS_FILE, data);

const readSMEContent = () => readJSON(SME_FILE, []);
const writeSMEContent = (data) => writeJSON(SME_FILE, data);

const readCommunityUsers = () => readJSON(COMMUNITY_USERS_FILE, []);
const writeCommunityUsers = (data) => writeJSON(COMMUNITY_USERS_FILE, data);

const readUserAnalytics = () => readJSON(USERS_TRACKING_FILE, { visitors: [], signups: [], logins: [] });
const writeUserAnalytics = (data) => writeJSON(USERS_TRACKING_FILE, data);

const readActiveSessions = () => readJSON(ACTIVE_SESSIONS_FILE, []);
const writeActiveSessions = (data) => writeJSON(ACTIVE_SESSIONS_FILE, data);

// ============================================================================
// COURSES MANAGEMENT
// ============================================================================

module.exports.courseEndpoints = (app, adminAuth) => {
  // Get all courses
  app.get('/api/admin/courses', adminAuth, (req, res) => {
    try {
      const courses = readCourses();
      res.json({ success: true, courses });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create course
  app.post('/api/admin/courses', adminAuth, (req, res) => {
    try {
      const { title, description, level, duration, price } = req.body;
      if (!title) return res.status(400).json({ error: 'title required' });

      const courses = readCourses();
      const course = {
        id: uuidv4(),
        title,
        description: description || '',
        level: level || 'Beginner', // Beginner, Intermediate, Advanced
        duration: duration || '', // e.g., "4 weeks"
        price: price || 0,
        icon: '📚',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      courses.push(course);
      writeCourses(courses);
      res.json({ success: true, course });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update course
  app.put('/api/admin/courses/:id', adminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const courses = readCourses();
      const idx = courses.findIndex(c => c.id === id);

      if (idx === -1) return res.status(404).json({ error: 'course not found' });

      const allowedFields = ['title', 'description', 'level', 'duration', 'price'];
      allowedFields.forEach(field => {
        if (field in req.body) courses[idx][field] = req.body[field];
      });
      courses[idx].updatedAt = new Date().toISOString();

      writeCourses(courses);
      res.json({ success: true, course: courses[idx] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete course
  app.delete('/api/admin/courses/:id', adminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const courses = readCourses();
      const idx = courses.findIndex(c => c.id === id);

      if (idx === -1) return res.status(404).json({ error: 'course not found' });

      courses.splice(idx, 1);
      writeCourses(courses);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
};

// ============================================================================
// INSIGHTS MANAGEMENT
// ============================================================================

module.exports.insightsEndpoints = (app, adminAuth) => {
  // Get all insights
  app.get('/api/admin/insights', adminAuth, (req, res) => {
    try {
      const insights = readInsights();
      res.json({ success: true, insights });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create insight
  app.post('/api/admin/insights', adminAuth, (req, res) => {
    try {
      const { title, content, category } = req.body;
      if (!title || !content) return res.status(400).json({ error: 'title and content required' });

      const insights = readInsights();
      const insight = {
        id: uuidv4(),
        title,
        content,
        category: category || 'General', // e.g., Fintech, Agribusiness, Energy
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      insights.push(insight);
      writeInsights(insights);
      res.json({ success: true, insight });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update insight
  app.put('/api/admin/insights/:id', adminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const insights = readInsights();
      const idx = insights.findIndex(i => i.id === id);

      if (idx === -1) return res.status(404).json({ error: 'insight not found' });

      const allowedFields = ['title', 'content', 'category', 'featured'];
      allowedFields.forEach(field => {
        if (field in req.body) insights[idx][field] = req.body[field];
      });
      insights[idx].updatedAt = new Date().toISOString();

      writeInsights(insights);
      res.json({ success: true, insight: insights[idx] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete insight
  app.delete('/api/admin/insights/:id', adminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const insights = readInsights();
      const idx = insights.findIndex(i => i.id === id);

      if (idx === -1) return res.status(404).json({ error: 'insight not found' });

      insights.splice(idx, 1);
      writeInsights(insights);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
};

// ============================================================================
// INVESTMENT TOOLS MANAGEMENT
// ============================================================================

module.exports.toolsEndpoints = (app, adminAuth) => {
  // Get all tools
  app.get('/api/admin/tools', adminAuth, (req, res) => {
    try {
      const tools = readTools();
      res.json({ success: true, tools });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create tool
  app.post('/api/admin/tools', adminAuth, (req, res) => {
    try {
      const { title, description, icon } = req.body;
      if (!title) return res.status(400).json({ error: 'title required' });

      const tools = readTools();
      const tool = {
        id: uuidv4(),
        title,
        description: description || '',
        icon: icon || '🛠️',
        url: `/tools/${uuidv4()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      tools.push(tool);
      writeTools(tools);
      res.json({ success: true, tool });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update tool
  app.put('/api/admin/tools/:id', adminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const tools = readTools();
      const idx = tools.findIndex(t => t.id === id);

      if (idx === -1) return res.status(404).json({ error: 'tool not found' });

      const allowedFields = ['title', 'description', 'icon', 'url'];
      allowedFields.forEach(field => {
        if (field in req.body) tools[idx][field] = req.body[field];
      });
      tools[idx].updatedAt = new Date().toISOString();

      writeTools(tools);
      res.json({ success: true, tool: tools[idx] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete tool
  app.delete('/api/admin/tools/:id', adminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const tools = readTools();
      const idx = tools.findIndex(t => t.id === id);

      if (idx === -1) return res.status(404).json({ error: 'tool not found' });

      tools.splice(idx, 1);
      writeTools(tools);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
};

// ============================================================================
// SME FUNDING READINESS MANAGEMENT
// ============================================================================

module.exports.smeEndpoints = (app, adminAuth) => {
  // Get SME content
  app.get('/api/admin/sme', adminAuth, (req, res) => {
    try {
      const content = readSMEContent();
      res.json({ success: true, content });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create SME content
  app.post('/api/admin/sme', adminAuth, (req, res) => {
    try {
      const { title, description, resources } = req.body;
      if (!title) return res.status(400).json({ error: 'title required' });

      const content = readSMEContent();
      const item = {
        id: uuidv4(),
        title,
        description: description || '',
        resources: resources || [], // Array of resource links/files
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      content.push(item);
      writeSMEContent(content);
      res.json({ success: true, item });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update SME content
  app.put('/api/admin/sme/:id', adminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const content = readSMEContent();
      const idx = content.findIndex(c => c.id === id);

      if (idx === -1) return res.status(404).json({ error: 'SME content not found' });

      const allowedFields = ['title', 'description', 'resources'];
      allowedFields.forEach(field => {
        if (field in req.body) content[idx][field] = req.body[field];
      });
      content[idx].updatedAt = new Date().toISOString();

      writeSMEContent(content);
      res.json({ success: true, item: content[idx] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete SME content
  app.delete('/api/admin/sme/:id', adminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const content = readSMEContent();
      const idx = content.findIndex(c => c.id === id);

      if (idx === -1) return res.status(404).json({ error: 'SME content not found' });

      content.splice(idx, 1);
      writeSMEContent(content);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
};

// ============================================================================
// COMMUNITY USER TRACKING
// ============================================================================

module.exports.communityEndpoints = (app, adminAuth) => {
  // Get all community users
  app.get('/api/admin/community-users', adminAuth, (req, res) => {
    try {
      const users = readCommunityUsers();
      res.json({ success: true, users, total: users.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Join community (public endpoint)
  app.post('/api/community/join', (req, res) => {
    try {
      const { name, email, interests } = req.body;
      if (!email) return res.status(400).json({ error: 'email required' });

      const users = readCommunityUsers();
      const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) return res.status(409).json({ error: 'already a community member' });

      const user = {
        id: uuidv4(),
        name: name || 'Community Member',
        email: email.toLowerCase(),
        interests: interests || [],
        joinedAt: new Date().toISOString(),
        status: 'active'
      };

      users.push(user);
      writeCommunityUsers(users);
      res.json({ success: true, user });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Remove community user
  app.delete('/api/admin/community-users/:id', adminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const users = readCommunityUsers();
      const idx = users.findIndex(u => u.id === id);

      if (idx === -1) return res.status(404).json({ error: 'user not found' });

      users.splice(idx, 1);
      writeCommunityUsers(users);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
};

// ============================================================================
// USER ANALYTICS & TRACKING
// ============================================================================

module.exports.analyticsEndpoints = (app, adminAuth) => {
  // Track visitor (public endpoint)
  app.post('/api/analytics/visitor', (req, res) => {
    try {
      const { source, referrer } = req.body;
      const analytics = readUserAnalytics();

      analytics.visitors = analytics.visitors || [];
      analytics.visitors.push({
        id: uuidv4(),
        source: source || 'direct',
        referrer: referrer || '',
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent'] || ''
      });

      writeUserAnalytics(analytics);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Track signup (public endpoint)
  app.post('/api/analytics/signup', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'email required' });

      const analytics = readUserAnalytics();
      analytics.signups = analytics.signups || [];
      analytics.signups.push({
        id: uuidv4(),
        email: email.toLowerCase(),
        timestamp: new Date().toISOString()
      });

      writeUserAnalytics(analytics);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Track login (public endpoint)
  app.post('/api/analytics/login', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'email required' });

      const analytics = readUserAnalytics();
      analytics.logins = analytics.logins || [];
      analytics.logins.push({
        id: uuidv4(),
        email: email.toLowerCase(),
        timestamp: new Date().toISOString()
      });

      // Track as active session
      const sessions = readActiveSessions();
      sessions.push({
        id: uuidv4(),
        email: email.toLowerCase(),
        startTime: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
      writeActiveSessions(sessions);

      writeUserAnalytics(analytics);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get all user analytics
  app.get('/api/admin/analytics', adminAuth, (req, res) => {
    try {
      const analytics = readUserAnalytics();
      const uniqueVisitors = [...new Set(analytics.visitors.map(v => v.id))].length;
      const uniqueSignups = [...new Set(analytics.signups.map(s => s.email))].length;
      const uniqueLogins = [...new Set(analytics.logins.map(l => l.email))].length;

      res.json({
        success: true,
        stats: {
          totalVisitors: analytics.visitors.length,
          uniqueVisitors,
          totalSignups: analytics.signups.length,
          uniqueSignups,
          totalLogins: analytics.logins.length,
          uniqueLogins
        },
        analytics
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get active users right now
  app.get('/api/admin/active-users', adminAuth, (req, res) => {
    try {
      const sessions = readActiveSessions();
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const activeSessions = sessions.filter(s => 
        new Date(s.lastActive).getTime() > oneHourAgo
      );

      res.json({
        success: true,
        activeNow: activeSessions.length,
        activeSessions: activeSessions.map(s => ({
          email: s.email,
          lastActive: s.lastActive
        }))
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get all signin users
  app.get('/api/admin/signin-users', adminAuth, (req, res) => {
    try {
      const analytics = readUserAnalytics();
      const users = [...new Set(analytics.logins.map(l => l.email))].map(email => {
        const lastLogin = analytics.logins
          .filter(l => l.email === email)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        return {
          email,
          lastLogin: lastLogin?.timestamp || '',
          totalLogins: analytics.logins.filter(l => l.email === email).length
        };
      });

      res.json({ success: true, users, total: users.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get all website visitors
  app.get('/api/admin/visitors', adminAuth, (req, res) => {
    try {
      const analytics = readUserAnalytics();
      res.json({
        success: true,
        visitors: analytics.visitors || [],
        total: (analytics.visitors || []).length
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Clear old sessions (cleanup)
  app.post('/api/admin/cleanup-sessions', adminAuth, (req, res) => {
    try {
      const sessions = readActiveSessions();
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      const active = sessions.filter(s => 
        new Date(s.lastActive).getTime() > twentyFourHoursAgo
      );

      writeActiveSessions(active);
      res.json({ success: true, removed: sessions.length - active.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
};

// ============================================================================
// EXPORT PUBLIC API FOR COURSES AND INSIGHTS
// ============================================================================

module.exports.publicEndpoints = (app) => {
  // Public: Get published courses
  app.get('/api/courses', (req, res) => {
    try {
      const courses = readCourses();
      res.json({ success: true, courses });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Public: Get published insights
  app.get('/api/insights', (req, res) => {
    try {
      const insights = readInsights();
      res.json({ success: true, insights });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Public: Get published tools
  app.get('/api/tools', (req, res) => {
    try {
      const tools = readTools();
      res.json({ success: true, tools });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Public: Get SME content
  app.get('/api/sme', (req, res) => {
    try {
      const content = readSMEContent();
      res.json({ success: true, content });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
};
