const fs = require('fs').promises;
const path = require('path');

const SOCIAL_MEDIA_FILE = path.join(__dirname, '../data/social-media.json');

class SocialMediaService {
  async loadSocialMedia() {
    try {
      const data = await fs.readFile(SOCIAL_MEDIA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Return default configuration if file doesn't exist
      return {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: '',
        whatsapp: '0731856995',
        telegram: '',
        tiktok: '',
        updatedAt: new Date().toISOString(),
        updatedBy: 'system'
      };
    }
  }

  async saveSocialMedia(data) {
    data.updatedAt = new Date().toISOString();
    await fs.writeFile(SOCIAL_MEDIA_FILE, JSON.stringify(data, null, 2));
  }

  async updateSocialMedia(platform, url, updatedBy = 'admin') {
    const socialMedia = await this.loadSocialMedia();
    
    const validPlatforms = [
      'facebook', 'twitter', 'instagram', 'linkedin', 
      'youtube', 'whatsapp', 'telegram', 'tiktok'
    ];

    if (!validPlatforms.includes(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }

    socialMedia[platform] = url;
    socialMedia.updatedBy = updatedBy;
    await this.saveSocialMedia(socialMedia);

    return socialMedia;
  }

  async updateMultiple(updates, updatedBy = 'admin') {
    const socialMedia = await this.loadSocialMedia();
    
    Object.keys(updates).forEach(platform => {
      if (socialMedia.hasOwnProperty(platform)) {
        socialMedia[platform] = updates[platform];
      }
    });

    socialMedia.updatedBy = updatedBy;
    await this.saveSocialMedia(socialMedia);

    return socialMedia;
  }

  async getSocialMedia() {
    return await this.loadSocialMedia();
  }

  async deletePlatform(platform) {
    const socialMedia = await this.loadSocialMedia();
    if (socialMedia[platform]) {
      socialMedia[platform] = '';
      await this.saveSocialMedia(socialMedia);
    }
    return socialMedia;
  }

  formatWhatsAppLink(number) {
    // Remove non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // Add Kenya country code if not present
    let formatted = cleaned;
    if (!cleaned.startsWith('254')) {
      formatted = '254' + cleaned.replace(/^0/, '');
    }
    
    return `https://wa.me/${formatted}`;
  }

  getPlatformIcon(platform) {
    const icons = {
      facebook: '📘',
      twitter: '🐦',
      instagram: '📷',
      linkedin: '💼',
      youtube: '📺',
      whatsapp: '💬',
      telegram: '✈️',
      tiktok: '🎵'
    };
    return icons[platform] || '🔗';
  }
}

module.exports = new SocialMediaService();
