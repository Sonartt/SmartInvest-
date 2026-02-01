const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const SHARE_LINKS_FILE = path.join(__dirname, '../data/share-links.json');

class ShareLinkService {
  async loadLinks() {
    try {
      const data = await fs.readFile(SHARE_LINKS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async saveLinks(links) {
    await fs.writeFile(SHARE_LINKS_FILE, JSON.stringify(links, null, 2));
  }

  async generateShareLink(type, options = {}) {
    const links = await this.loadLinks();
    const id = crypto.randomBytes(16).toString('hex');
    const baseUrl = process.env.BASE_URL || 'https://smartinvest.vercel.app';
    const expiryDays = options.expiryDays || 30;
    
    const shareLink = {
      id,
      token: id,
      url: `${baseUrl}/share/${id}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString(),
      userId: options.userId,
      productId: options.productId,
      contentId: options.contentId,
      type: type, // 'product', 'referral', 'content'
      clicks: 0,
      maxUses: options.maxUses || null
    };

    links.push(shareLink);
    await this.saveLinks(links);
    return shareLink;
  }

  async validateAndTrackLink(linkId) {
    const links = await this.loadLinks();
    const link = links.find(l => l.id === linkId || l.token === linkId);

    if (!link) {
      return null;
    }

    // Check if expired
    if (new Date(link.expiresAt) < new Date()) {
      return null;
    }

    // Check max uses
    if (link.maxUses && link.clicks >= link.maxUses) {
      return null;
    }

    // Increment click count
    link.clicks++;
    await this.saveLinks(links);
    
    return link;
  }

  async getUserLinks(userId) {
    const links = await this.loadLinks();
    return links.filter(l => l.userId === userId);
  }

  async deleteLink(linkId) {
    const links = await this.loadLinks();
    const filteredLinks = links.filter(l => l.id !== linkId);
    await this.saveLinks(filteredLinks);
  }
}

module.exports = new ShareLinkService();
