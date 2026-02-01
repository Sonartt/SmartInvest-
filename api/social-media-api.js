const express = require('express');
const router = express.Router();
const socialMediaService = require('../services/social-media-service');

// Get all social media links (public)
router.get('/', async (req, res) => {
  try {
    const socialMedia = await socialMediaService.getSocialMedia();
    res.json({
      success: true,
      socialMedia
    });
  } catch (error) {
    console.error('Get social media error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve social media links'
    });
  }
});

// Update single platform (admin only)
router.put('/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { url } = req.body;

    if (!url && url !== '') {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const updatedBy = req.adminUser || 'admin';
    const socialMedia = await socialMediaService.updateSocialMedia(
      platform,
      url,
      updatedBy
    );

    res.json({
      success: true,
      message: `${platform} updated successfully`,
      socialMedia
    });
  } catch (error) {
    console.error('Update social media error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update social media'
    });
  }
});

// Update multiple platforms at once (admin only)
router.post('/update-all', async (req, res) => {
  try {
    const updates = req.body;
    const updatedBy = req.adminUser || 'admin';

    const socialMedia = await socialMediaService.updateMultiple(
      updates,
      updatedBy
    );

    res.json({
      success: true,
      message: 'Social media links updated successfully',
      socialMedia
    });
  } catch (error) {
    console.error('Update all social media error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update social media links'
    });
  }
});

// Delete platform URL (admin only)
router.delete('/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const socialMedia = await socialMediaService.deletePlatform(platform);

    res.json({
      success: true,
      message: `${platform} link removed`,
      socialMedia
    });
  } catch (error) {
    console.error('Delete social media error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete social media link'
    });
  }
});

// Get WhatsApp link
router.get('/whatsapp-link', async (req, res) => {
  try {
    const socialMedia = await socialMediaService.getSocialMedia();
    const whatsappNumber = socialMedia.whatsapp || '0731856995';
    const whatsappLink = socialMediaService.formatWhatsAppLink(whatsappNumber);

    res.json({
      success: true,
      number: whatsappNumber,
      link: whatsappLink
    });
  } catch (error) {
    console.error('WhatsApp link error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate WhatsApp link'
    });
  }
});

module.exports = router;
