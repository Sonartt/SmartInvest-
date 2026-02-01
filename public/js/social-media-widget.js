// Social Media Widget
class SocialMediaWidget {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.socialMedia = {};
    this.init();
  }

  async init() {
    await this.loadSocialMedia();
    this.render();
  }

  async loadSocialMedia() {
    try {
      const response = await fetch('/api/social-media');
      const data = await response.json();
      
      if (data.success) {
        this.socialMedia = data.socialMedia;
      }
    } catch (error) {
      console.error('Failed to load social media:', error);
    }
  }

  render() {
    if (!this.container) return;

    const platforms = [
      { name: 'facebook', icon: '📘', color: '#1877F2' },
      { name: 'twitter', icon: '🐦', color: '#1DA1F2' },
      { name: 'instagram', icon: '📷', color: '#E4405F' },
      { name: 'linkedin', icon: '💼', color: '#0A66C2' },
      { name: 'youtube', icon: '📺', color: '#FF0000' },
      { name: 'whatsapp', icon: '💬', color: '#25D366' },
      { name: 'telegram', icon: '✈️', color: '#0088cc' },
      { name: 'tiktok', icon: '🎵', color: '#000000' }
    ];

    const links = platforms
      .filter(platform => this.socialMedia[platform.name])
      .map(platform => {
        const url = platform.name === 'whatsapp' 
          ? this.formatWhatsAppLink(this.socialMedia[platform.name])
          : this.socialMedia[platform.name];

        return `
          <a 
            href="${url}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="social-media-link"
            style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              background: ${platform.color};
              color: white;
              border-radius: 50%;
              text-decoration: none;
              font-size: 20px;
              transition: transform 0.3s, box-shadow 0.3s;
              margin: 0 4px;
            "
            onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)'"
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'"
            title="${this.capitalize(platform.name)}"
          >
            ${platform.icon}
          </a>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center;">
        ${links || '<p style="color: #666; font-size: 14px;">No social media links added yet</p>'}
      </div>
    `;
  }

  formatWhatsAppLink(number) {
    const cleaned = number.replace(/\D/g, '');
    let formatted = cleaned;
    if (!cleaned.startsWith('254')) {
      formatted = '254' + cleaned.replace(/^0/, '');
    }
    return `https://wa.me/${formatted}`;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const socialContainers = document.querySelectorAll('[data-social-media-widget]');
  socialContainers.forEach(container => {
    new SocialMediaWidget(container.id);
  });
});

window.SocialMediaWidget = SocialMediaWidget;
