/**
 * Ads Display Widget - Show Active Paid Ads as Popup Only
 * Only displays ads after payment and admin approval
 * Shows popup once per session - no recurrence during same visit
 */

class AdsDisplayWidget {
  constructor(options = {}) {
    this.position = 'popup'; // Only popup ads
    this.apiBase = options.apiBase || '/api/ads';
    this.displayDuration = options.displayDuration || 10000; // 10 seconds
    this.ads = [];
    this.sessionKey = 'adsShownThisSession';
    this.hasShownAd = false;
  }

  /**
   * Initialize and load ads
   */
  async init() {
    // Check if ad already shown in this session
    if (sessionStorage.getItem(this.sessionKey)) {
      console.log('Ad already shown in this session');
      return;
    }

    await this.loadAds();
    if (this.ads.length > 0 && !this.hasShownAd) {
      this.showPopupAd();
    }
  }

  /**
   * Load active popup ads
   */
  async loadAds() {
    try {
      const response = await fetch(`${this.apiBase}/active?position=popup`);
      const data = await response.json();
      
      if (data.success) {
        this.ads = data.ads;
      }
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  }

  /**
   * Show popup ad
   */
  showPopupAd() {
    if (this.ads.length === 0 || this.hasShownAd) return;

    // Select random ad
    const ad = this.ads[Math.floor(Math.random() * this.ads.length)];
    
    // Create popup overlay
    const popup = document.createElement('div');
    popup.id = 'adPopup';
    popup.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        animation: fadeIn 0.3s ease-in;
      ">
        <div style="
          position: relative;
          background: white;
          border-radius: 15px;
          padding: 30px;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideIn 0.4s ease-out;
        ">
          <!-- Close Button -->
          <button id="closeAdPopup" style="
            position: absolute;
            top: 15px;
            right: 15px;
            background: #f87171;
            color: white;
            border: none;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            z-index: 10;
          " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#f87171'">
            ×
          </button>

          <!-- Ad Content -->
          <div style="margin-top: 20px;">
            <div style="
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
              text-transform: uppercase;
              margin-bottom: 15px;
            ">Sponsored Advertisement</div>
            
            <a href="${ad.targetUrl}" 
               target="_blank" 
               id="adLink"
               data-ad-id="${ad.id}"
               style="
                 text-decoration: none;
                 color: inherit;
                 display: block;
               ">
              <div class="ad-content" style="
                text-align: center;
                padding: 20px;
              ">
                ${ad.content}
              </div>
              ${ad.advertiser?.company ? `
                <div style="
                  margin-top: 20px;
                  text-align: center;
                  font-size: 14px;
                  color: #64748b;
                ">
                  Brought to you by <strong>${ad.advertiser.company}</strong>
                </div>
              ` : ''}
            </a>

            <!-- Progress Bar -->
            <div style="
              margin-top: 25px;
              background: #e5e7eb;
              height: 4px;
              border-radius: 2px;
              overflow: hidden;
            ">
              <div id="adProgressBar" style="
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                height: 100%;
                width: 0%;
                transition: width 0.1s linear;
              "></div>
            </div>
            
            <div style="
              margin-top: 10px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
            ">
              Ad will close in <span id="adCountdown">${this.displayDuration / 1000}</span>s or click X to close
            </div>
          </div>
        </div>
      </div>

      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            transform: translateY(-50px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
      </style>
    `;

    document.body.appendChild(popup);

    // Record impression
    this.recordImpression(ad.id);

    // Mark as shown in session
    this.hasShownAd = true;
    sessionStorage.setItem(this.sessionKey, 'true');

    // Handle click tracking
    document.getElementById('adLink').addEventListener('click', () => {
      this.recordClick(ad.id);
    });

    // Handle close button
    const closeBtn = document.getElementById('closeAdPopup');
    const closePopup = () => {
      popup.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => popup.remove(), 300);
    };

    closeBtn.addEventListener('click', closePopup);
    
    // Close on overlay click
    popup.addEventListener('click', (e) => {
      if (e.target === popup.firstElementChild.parentElement) {
        closePopup();
      }
    });

    // Auto-close with countdown
    let secondsLeft = this.displayDuration / 1000;
    const countdownEl = document.getElementById('adCountdown');
    const progressBar = document.getElementById('adProgressBar');
    
    const countdownInterval = setInterval(() => {
      secondsLeft--;
      if (countdownEl) countdownEl.textContent = secondsLeft;
      
      const progress = ((this.displayDuration / 1000 - secondsLeft) / (this.displayDuration / 1000)) * 100;
      if (progressBar) progressBar.style.width = `${progress}%`;
      
      if (secondsLeft <= 0) {
        clearInterval(countdownInterval);
        closePopup();
      }
    }, 1000);

    // Add fadeOut animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Record ad impression
   */
  async recordImpression(adId) {
    try {
      await fetch(`${this.apiBase}/impression/${adId}`, { method: 'POST' });
    } catch (error) {
      console.error('Error recording impression:', error);
    }
  }

  /**
   * Record ad click
   */
  async recordClick(adId) {
    try {
      await fetch(`${this.apiBase}/click/${adId}`, { method: 'POST' });
    } catch (error) {
      console.error('Error recording click:', error);
    }
  }
}

// Make available globally
window.AdsDisplayWidget = AdsDisplayWidget;
window.adsWidget = null;

// Auto-initialize popup ad on page load (once per session)
document.addEventListener('DOMContentLoaded', () => {
  // Show popup ad once per session
  window.adsWidget = new AdsDisplayWidget({
    displayDuration: 10000 // 10 seconds
  });
  window.adsWidget.init();
});
