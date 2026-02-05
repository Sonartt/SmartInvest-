// Share Link Generator
class ShareLinkGenerator {
  constructor() {
    this.baseUrl = window.location.origin;
  }

  async generateLink(type, options = {}) {
    try {
      const response = await fetch('/api/share/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          ...options
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Failed to generate share link');
      }
    } catch (error) {
      console.error('Share link generation error:', error);
      throw error;
    }
  }

  showShareModal(shareUrl, expiresAt) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%;">
        <h2 style="margin: 0 0 20px 0;">🔗 Share Link Generated</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px; word-break: break-all;">
          <code id="shareUrlText" style="font-size: 14px;">${shareUrl}</code>
        </div>
        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
          Expires: ${new Date(expiresAt).toLocaleString()}
        </p>
        <div style="display: flex; gap: 10px;">
          <button id="copyBtn" style="flex: 1; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            📋 Copy Link
          </button>
          <button id="closeBtn" style="flex: 1; padding: 12px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('copyBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(shareUrl);
      const btn = document.getElementById('copyBtn');
      btn.textContent = '✅ Copied!';
      setTimeout(() => {
        btn.innerHTML = '📋 Copy Link';
      }, 2000);
    });

    document.getElementById('closeBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
}

// Add share buttons to products
function addShareButtonToProduct(productId, productName) {
  const shareBtn = document.createElement('button');
  shareBtn.innerHTML = '🔗 Share';
  shareBtn.style.cssText = `
    padding: 8px 16px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    margin-left: 10px;
  `;

  shareBtn.addEventListener('click', async () => {
    const generator = new ShareLinkGenerator();
    try {
      const result = await generator.generateLink('product', {
        productId,
        expiryDays: 30
      });
      generator.showShareModal(result.shareUrl, result.expiresAt);
    } catch (error) {
      alert('Failed to generate share link');
    }
  });

  return shareBtn;
}

// Handle share link access (for the /share/:token route)
async function handleShareLinkAccess() {
  const pathParts = window.location.pathname.split('/');
  if (pathParts[1] === 'share' && pathParts[2]) {
    const token = pathParts[2];
    
    try {
      const response = await fetch(`/api/share/${token}`);
      const data = await response.json();
      
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert('This share link is invalid or has expired');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Share link error:', error);
      alert('Failed to process share link');
      window.location.href = '/';
    }
  }
}

// Auto-handle share links on page load
if (window.location.pathname.startsWith('/share/')) {
  handleShareLinkAccess();
}

// Make globally accessible
window.ShareLinkGenerator = ShareLinkGenerator;
window.addShareButtonToProduct = addShareButtonToProduct;
