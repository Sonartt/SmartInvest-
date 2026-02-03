const express = require('express');
const router = express.Router();
const shareLinkService = require('../services/share-link-service');

// Generate a new share link (authenticated users)
router.post('/generate', async (req, res) => {
  try {
    const { type, productId, contentId, expiryDays, maxUses } = req.body;
    
    if (!type || !['product', 'referral', 'content', 'affiliate'].includes(type)) {
      return res.status(400).json({ error: 'Invalid share link type' });
    }

    const userId = req.userId || req.body.userId; // From auth middleware or request

    if (type === 'affiliate' && !userId) {
      return res.status(400).json({ error: 'userId is required for affiliate links' });
    }
    
    const shareLink = await shareLinkService.generateShareLink(type, {
      userId,
      productId,
      contentId,
      expiryDays,
      maxUses
    });

    res.json({
      success: true,
      shareUrl: shareLink.url,
      token: shareLink.token,
      expiresAt: shareLink.expiresAt
    });
  } catch (error) {
    console.error('Generate share link error:', error);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// Validate and track share link access
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const link = await shareLinkService.validateAndTrackLink(token);

    if (!link) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    res.json({
      success: true,
      type: link.type,
      productId: link.productId,
      contentId: link.contentId,
      redirectUrl: link.type === 'product' && link.productId 
        ? `/products.html?id=${link.productId}`
        : link.type === 'content' && link.contentId
        ? `/content/${link.contentId}`
        : link.type === 'affiliate'
        ? `/signup.html?ref=${encodeURIComponent(link.token)}`
        : '/'
    });
  } catch (error) {
    console.error('Validate share link error:', error);
    res.status(500).json({ error: 'Failed to process share link' });
  }
});

// Get user's share links
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const links = await shareLinkService.getUserLinks(userId);
    
    res.json({
      success: true,
      links
    });
  } catch (error) {
    console.error('Get user links error:', error);
    res.status(500).json({ error: 'Failed to retrieve links' });
  }
});

// Delete share link
router.delete('/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    await shareLinkService.deleteLink(linkId);
    
    res.json({
      success: true,
      message: 'Share link deleted'
    });
  } catch (error) {
    console.error('Delete share link error:', error);
    res.status(500).json({ error: 'Failed to delete share link' });
  }
});

module.exports = router;
