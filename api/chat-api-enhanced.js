/**
 * Enhanced Chat Support API Endpoints
 * Handles user conversations, admin replies, image uploads, and real-time updates
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ChatManager } = require('../chat-support');

const router = express.Router();
const chatManager = new ChatManager();

// Image upload configuration
const uploadDir = path.join(__dirname, '..', 'uploads', 'chat-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Middleware to verify admin token
function requireAdminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token === process.env.ADMIN_TOKEN || process.env.NODE_ENV === 'development') {
    req.isAdmin = true;
    next();
  } else {
    next();
  }
}

// =======================
// USER ENDPOINTS
// =======================

/**
 * Create or get user conversation
 * POST /api/chat/start-conversation
 * Body: { email: string, userName?: string, category?: string }
 */
router.post('/start-conversation', (req, res) => {
  const { email, userName = 'Anonymous', category = 'general' } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Get existing conversation for this email
  let chat = chatManager.getUserChats(email).find(c => c.status !== 'closed');

  if (!chat) {
    // Create new conversation
    const userId = req.headers['x-user-id'] || `user-${Date.now()}`;
    chat = chatManager.createChat(userId, email, category);
  }

  res.json({
    conversationId: chat.conversationId,
    email: chat.email,
    category: chat.category
  });
});

/**
 * Send message with optional image
 * POST /api/chat/send-message
 * Body (multipart/form-data): { conversationId, content, image? }
 */
router.post('/send-message', upload.single('image'), (req, res) => {
  const { conversationId, content } = req.body;

  if (!conversationId || !content) {
    return res.status(400).json({ error: 'Conversation ID and content are required' });
  }

  const chat = chatManager.getChat(conversationId);
  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // If closed, don't allow new messages
  if (chat.status === 'closed') {
    return res.status(403).json({ error: 'Conversation is closed' });
  }

  const imageUrl = req.file ? `/uploads/chat-images/${req.file.filename}` : null;
  const message = chatManager.addMessage(conversationId, 'user', content, imageUrl ? [imageUrl] : []);

  // Mark as in-progress if not already
  if (chat.status === 'open') {
    chat.status = 'in-progress';
    chatManager.saveChats();
  }

  // Notify admins of new message
  broadcastToAdmins({
    type: 'new-user-message',
    conversationId,
    message
  });

  res.json({ success: true, message });
});

/**
 * Get conversation messages
 * GET /api/chat/messages/:conversationId
 */
router.get('/messages/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const chat = chatManager.getChat(conversationId);

  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Filter out admin-only notes from user view
  const userMessages = chat.messages.filter(m => m.type !== 'admin_note');

  res.json({
    conversationId: chat.conversationId,
    status: chat.status,
    messages: userMessages,
    priority: chat.priority,
    category: chat.category
  });
});

/**
 * Mark conversation messages as read
 * POST /api/chat/mark-read
 * Body: { conversationId, messageIds: string[] }
 */
router.post('/mark-read', (req, res) => {
  const { conversationId, messageIds } = req.body;
  const chat = chatManager.getChat(conversationId);

  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  messageIds.forEach(id => chat.markRead(id));
  chatManager.saveChats();

  res.json({ success: true });
});

// =======================
// ADMIN ENDPOINTS
// =======================

/**
 * List all conversations (admin only)
 * GET /api/chat/list-conversations
 * Query: { status?, priority?, search?, limit, offset }
 */
router.get('/list-conversations', requireAdminAuth, (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { status, priority, search, limit = 50, offset = 0 } = req.query;

  let conversations = chatManager.chats;

  if (status) {
    conversations = conversations.filter(c => c.status === status);
  }
  if (priority) {
    conversations = conversations.filter(c => c.priority === priority);
  }
  if (search) {
    conversations = chatManager.searchChats(search);
  }

  // Sort by most recent first
  conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const paginated = conversations.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  const result = paginated.map(c => ({
    id: c.conversationId,
    userName: c.messages[0]?.content?.split(' ')[0] || 'Customer',
    email: c.email,
    status: c.status,
    priority: c.priority,
    category: c.category,
    messageCount: c.messages.length,
    unreadCount: c.messages.filter(m => !m.read && m.role === 'admin').length,
    lastMessageTime: c.updatedAt,
    createdAt: c.createdAt,
    assignedTo: c.assignedTo,
    read: c.messages.filter(m => !m.read && m.role === 'admin').length === 0
  }));

  res.json(result);
});

/**
 * Get single conversation with all messages (admin only)
 * GET /api/chat/get-conversation/:conversationId
 */
router.get('/get-conversation/:conversationId', requireAdminAuth, (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const chat = chatManager.getChat(req.params.conversationId);
  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Admin can see all messages including internal notes
  res.json({
    id: chat.conversationId,
    userId: chat.userId,
    email: chat.email,
    userName: 'Customer',
    status: chat.status,
    priority: chat.priority,
    category: chat.category,
    messages: chat.messages,
    messageCount: chat.messages.length,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    assignedTo: chat.assignedTo,
    tags: chat.tags,
    timeline: [
      {
        timestamp: chat.createdAt,
        action: 'Conversation started'
      },
      ...chat.messages.map(m => ({
        timestamp: m.timestamp,
        action: `${m.role === 'user' ? 'Customer' : 'Admin'} sent message`
      }))
    ]
  });
});

/**
 * Admin sends reply to customer or internal note
 * POST /api/chat/admin-reply
 * Body: { conversationId, content, type: 'admin_reply' | 'admin_note' }
 */
router.post('/admin-reply', requireAdminAuth, (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { conversationId, content, type = 'admin_reply' } = req.body;

  if (!conversationId || !content) {
    return res.status(400).json({ error: 'Conversation ID and content are required' });
  }

  const chat = chatManager.getChat(conversationId);
  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Add message with type
  const message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: 'admin',
    type: type, // 'admin_reply' is visible to user, 'admin_note' is internal only
    content,
    timestamp: new Date().toISOString(),
    read: true
  };

  chat.messages.push(message);
  chat.updatedAt = new Date().toISOString();

  // If this is a reply (not a note), mark status and notify user
  if (type === 'admin_reply') {
    if (chat.status === 'open') {
      chat.status = 'in-progress';
    }
    // Notify customer of new message
    broadcastToUser(conversationId, {
      type: 'new-admin-reply',
      message
    });
  }

  chatManager.saveChats();
  res.json({ success: true, message });
});

/**
 * Mark messages as read (admin)
 * POST /api/chat/mark-read/:conversationId
 */
router.post('/mark-read/:conversationId', requireAdminAuth, (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const chat = chatManager.getChat(req.params.conversationId);
  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  chat.messages.forEach(m => {
    if (m.role === 'admin') m.read = true;
  });
  chatManager.saveChats();

  res.json({ success: true });
});

/**
 * Update conversation status
 * POST /api/chat/update-status
 * Body: { conversationId, status: 'open' | 'in-progress' | 'closed' }
 */
router.post('/update-status', requireAdminAuth, (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { conversationId, status } = req.body;
  const chat = chatManager.getChat(conversationId);

  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  chat.status = status;
  chat.updatedAt = new Date().toISOString();
  chatManager.saveChats();

  res.json({ success: true });
});

/**
 * Update priority
 * POST /api/chat/update-priority
 * Body: { conversationId, priority: 'low' | 'medium' | 'high' | 'urgent' }
 */
router.post('/update-priority', requireAdminAuth, (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { conversationId, priority } = req.body;
  const chat = chatManager.getChat(conversationId);

  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  chat.priority = priority;
  chatManager.saveChats();

  res.json({ success: true });
});

/**
 * Assign conversation to admin
 * POST /api/chat/assign
 * Body: { conversationId, adminId?: string }
 */
router.post('/assign', requireAdminAuth, (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { conversationId, adminId } = req.body;
  const chat = chatManager.getChat(conversationId);

  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  chat.assignedTo = adminId || null;
  chatManager.saveChats();

  res.json({ success: true });
});

/**
 * Add tag
 * POST /api/chat/add-tag
 * Body: { conversationId, tag: string }
 */
router.post('/add-tag', requireAdminAuth, (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { conversationId, tag } = req.body;
  const chat = chatManager.getChat(conversationId);

  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  chat.addTag(tag);
  chatManager.saveChats();

  res.json({ success: true });
});

/**
 * Remove tag
 * POST /api/chat/remove-tag
 * Body: { conversationId, tag: string }
 */
router.post('/remove-tag', requireAdminAuth, (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { conversationId, tag } = req.body;
  const chat = chatManager.getChat(conversationId);

  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  chat.tags = chat.tags.filter(t => t !== tag);
  chatManager.saveChats();

  res.json({ success: true });
});

/**
 * Get chat statistics (admin only)
 * GET /api/chat/statistics
 */
router.get('/statistics', requireAdminAuth, (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  res.json(chatManager.getStatistics());
});

/**
 * Check if user is admin
 * GET /api/chat/admin-check
 */
router.get('/admin-check', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const isAdmin = token === process.env.ADMIN_TOKEN || process.env.NODE_ENV === 'development';
  res.json({ isAdmin });
});

// =======================
// REAL-TIME FEATURES (WebSocket)
// =======================

let adminConnections = new Map(); // adminId -> WebSocket

function broadcastToAdmins(data) {
  adminConnections.forEach((ws) => {
    try {
      ws.send(JSON.stringify(data));
    } catch (e) {
      console.error('Error broadcasting to admin:', e);
    }
  });
}

function broadcastToUser(conversationId, data) {
  // Would implement user WebSocket connections here
  // For now, data is pulled on demand
}

module.exports = router;
