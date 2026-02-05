const express = require('express');
const router = express.Router();
const emailService = require('../services/live-email-service');
const fs = require('fs').promises;
const path = require('path');

// Send contact form email
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, subject, and message are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Send email
    const result = await emailService.sendContactEmail({
      name,
      email,
      subject,
      message,
      phone
    });

    if (result.success) {
      // Save to messages.json for admin dashboard
      const messagesPath = path.join(__dirname, '../data/messages.json');
      let messages = [];
      
      try {
        const data = await fs.readFile(messagesPath, 'utf-8');
        messages = JSON.parse(data);
      } catch (error) {
        // File doesn't exist, start with empty array
      }

      messages.push({
        id: Date.now().toString(),
        name,
        email,
        phone: phone || '',
        subject,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        replied: false
      });

      await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2));

      res.json({
        success: true,
        message: 'Your message has been sent successfully!'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send message. Please try again.'
      });
    }
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while sending your message'
    });
  }
});

// Send chat message notification
router.post('/chat-notify', async (req, res) => {
  try {
    const { userName, userEmail, message } = req.body;

    if (!userName || !userEmail || !message) {
      return res.status(400).json({
        success: false,
        error: 'User name, email, and message are required'
      });
    }

    const result = await emailService.sendChatNotification({
      userName,
      userEmail,
      message,
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    console.error('Chat notify error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

// Send welcome email to new user
router.post('/welcome', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    const result = await emailService.sendWelcomeEmail({ name, email });
    res.json(result);
  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send welcome email'
    });
  }
});

// Get contact information
router.get('/contact-info', (req, res) => {
  const contactInfo = emailService.getContactInfo();
  res.json({
    success: true,
    ...contactInfo
  });
});

module.exports = router;
