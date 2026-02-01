const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Search users by email or ID (admin only)
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const usersPath = path.join(__dirname, '../data/users.json');
    const usersData = await fs.readFile(usersPath, 'utf-8');
    const users = JSON.parse(usersData);

    const searchTerm = query.toLowerCase().trim();
    
    const filteredUsers = users.filter(user => {
      const emailMatch = user.email && user.email.toLowerCase().includes(searchTerm);
      const idMatch = user.id && user.id.toLowerCase().includes(searchTerm);
      const nameMatch = user.name && user.name.toLowerCase().includes(searchTerm);
      
      return emailMatch || idMatch || nameMatch;
    }).map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || 'N/A',
      subscriptionTier: user.subscriptionTier || 'free',
      createdAt: user.createdAt || new Date().toISOString(),
      lastLogin: user.lastLogin
    }));

    res.json({
      success: true,
      users: filteredUsers,
      count: filteredUsers.length
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'User search failed' });
  }
});

// Get user details by ID (admin only)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const usersPath = path.join(__dirname, '../data/users.json');
    const usersData = await fs.readFile(usersPath, 'utf-8');
    const users = JSON.parse(usersData);

    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { password, ...userInfo } = user;

    res.json({
      success: true,
      user: userInfo
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// Get all premium users (admin only)
router.get('/premium/list', async (req, res) => {
  try {
    const usersPath = path.join(__dirname, '../data/users.json');
    const usersData = await fs.readFile(usersPath, 'utf-8');
    const users = JSON.parse(usersData);

    const premiumUsers = users.filter(user => 
      user.subscriptionTier && user.subscriptionTier !== 'free'
    ).map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || 'N/A',
      subscriptionTier: user.subscriptionTier,
      createdAt: user.createdAt || new Date().toISOString()
    }));

    res.json({
      success: true,
      users: premiumUsers,
      count: premiumUsers.length
    });
  } catch (error) {
    console.error('Get premium users error:', error);
    res.status(500).json({ error: 'Failed to retrieve premium users' });
  }
});

module.exports = router;
