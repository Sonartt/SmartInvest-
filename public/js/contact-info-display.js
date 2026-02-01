// Contact Information Display Component
class ContactInfoDisplay {
  constructor() {
    this.contactInfo = {
      email: 'smartinvestsi254@gmail.com',
      adminEmail: 'delijah5415@gmail.com',
      phones: ['0731856995', '0114383762'],
      address: 'Nairobi, Kenya',
      hours: 'Mon-Fri: 9:00 AM - 6:00 PM EAT'
    };
  }

  async loadContactInfo() {
    try {
      const response = await fetch('/api/email/contact-info');
      const data = await response.json();
      
      if (data.success) {
        this.contactInfo.email = data.supportEmail;
        this.contactInfo.adminEmail = data.adminEmail;
        this.contactInfo.phones = data.phones;
      }
    } catch (error) {
      console.error('Failed to load contact info:', error);
    }
  }

  renderContactCard() {
    return `
      <div class="contact-info-card" style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px; font-weight: 600;">Contact Us</h3>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">📧</span>
            <div>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Email</div>
              <a href="mailto:${this.contactInfo.email}" style="color: #4CAF50; text-decoration: none; font-weight: 500;">
                ${this.contactInfo.email}
              </a>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">📞</span>
            <div>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Phone</div>
              ${this.contactInfo.phones.map(phone => `
                <a href="tel:${phone}" style="color: #4CAF50; text-decoration: none; font-weight: 500; display: block;">
                  ${phone}
                </a>
              `).join('')}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">💬</span>
            <div>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">WhatsApp</div>
              <a href="https://wa.me/254${this.contactInfo.phones[0].replace(/^0/, '')}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="color: #25D366; text-decoration: none; font-weight: 500;">
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">📍</span>
            <div>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Location</div>
              <span style="color: #333; font-weight: 500;">${this.contactInfo.address}</span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">🕐</span>
            <div>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Business Hours</div>
              <span style="color: #333; font-weight: 500;">${this.contactInfo.hours}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
          <button 
            onclick="document.getElementById('chatToggle').click()" 
            style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 16px; transition: transform 0.2s;"
            onmouseover="this.style.transform='scale(1.02)'"
            onmouseout="this.style.transform='scale(1)'"
          >
            💬 Start Live Chat
          </button>
        </div>
      </div>
    `;
  }

  renderContactLinks() {
    return `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
        <a href="mailto:${this.contactInfo.email}" style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #f0f0f0; border-radius: 6px; text-decoration: none; color: #333; transition: background 0.2s;"
           onmouseover="this.style.background='#e0e0e0'"
           onmouseout="this.style.background='#f0f0f0'">
          <span>📧</span>
          <span>Email Us</span>
        </a>

        <a href="tel:${this.contactInfo.phones[0]}" style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #f0f0f0; border-radius: 6px; text-decoration: none; color: #333; transition: background 0.2s;"
           onmouseover="this.style.background='#e0e0e0'"
           onmouseout="this.style.background='#f0f0f0'">
          <span>📞</span>
          <span>Call Us</span>
        </a>

        <a href="https://wa.me/254${this.contactInfo.phones[0].replace(/^0/, '')}" target="_blank" rel="noopener noreferrer"
           style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #25D366; border-radius: 6px; text-decoration: none; color: white; transition: background 0.2s;"
           onmouseover="this.style.background='#1FAD54'"
           onmouseout="this.style.background='#25D366'">
          <span>💬</span>
          <span>WhatsApp</span>
        </a>

        <button onclick="document.getElementById('chatToggle').click()"
                style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #667eea; border: none; border-radius: 6px; color: white; cursor: pointer; transition: background 0.2s;"
                onmouseover="this.style.background='#5568d3'"
                onmouseout="this.style.background='#667eea'">
          <span>💬</span>
          <span>Live Chat</span>
        </button>
      </div>
    `;
  }

  async init() {
    await this.loadContactInfo();
    
    // Render contact cards
    const cardContainers = document.querySelectorAll('[data-contact-card]');
    cardContainers.forEach(container => {
      container.innerHTML = this.renderContactCard();
    });

    // Render contact links
    const linkContainers = document.querySelectorAll('[data-contact-links]');
    linkContainers.forEach(container => {
      container.innerHTML = this.renderContactLinks();
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.contactInfoDisplay = new ContactInfoDisplay();
  window.contactInfoDisplay.init();
});

window.ContactInfoDisplay = ContactInfoDisplay;
