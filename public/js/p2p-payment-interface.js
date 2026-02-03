/**
 * P2P Payment Interface
 * Client-side handler for peer-to-peer payments with $5 transaction cost
 */

class P2PPaymentInterface {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/p2p';
    this.platformNumber = options.platformNumber || '0114383762';
    this.transactionFee = options.transactionFee || 5.00;
    this.currency = options.currency || 'USD';
    this.affiliateCode = options.affiliateCode || null;
  }

  /**
   * Show P2P payment modal
   */
  showPaymentModal() {
    const modal = this.createModal();
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
  }

  /**
   * Create payment modal
   */
  createModal() {
    const modal = document.createElement('div');
    modal.className = 'p2p-modal-overlay';
    modal.innerHTML = `
      <div class="p2p-modal">
        <div class="p2p-modal-header">
          <h2>💸 Send Money P2P</h2>
          <button class="p2p-close-btn" onclick="this.closest('.p2p-modal-overlay').remove()">×</button>
        </div>
        
        <div class="p2p-modal-body">
          <div class="p2p-info-box">
            <p><strong>Transaction Fee:</strong> $${this.transactionFee.toFixed(2)} USD per transfer</p>
            <p><small>Fee goes to platform number: ${this.platformNumber}</small></p>
          </div>
          
          <form id="p2pPaymentForm">
            <div class="p2p-form-group">
              <label>Your Phone Number</label>
              <input type="tel" id="senderPhone" placeholder="+254712345678" required>
            </div>
            
            <div class="p2p-form-group">
              <label>Your Email (Optional)</label>
              <input type="email" id="senderEmail" placeholder="your@email.com">
            </div>
            
            <div class="p2p-form-group">
              <label>Recipient Phone Number</label>
              <input type="tel" id="recipientPhone" placeholder="+254712345678" required>
            </div>
            
            <div class="p2p-form-group">
              <label>Recipient Email (Optional)</label>
              <input type="email" id="recipientEmail" placeholder="recipient@email.com">
            </div>
            
            <div class="p2p-form-group">
              <label>Amount to Send (USD)</label>
              <input type="number" id="amount" placeholder="10.00" min="1" step="0.01" required>
              <small class="p2p-helper-text">Dynamic fee: Lower for small amounts, capped at $5 + 2% for large transfers</small>
            </div>
            
            <div class="p2p-form-group">
              <label>Currency</label>
              <select id="currency">
                <option value="USD">USD - US Dollar</option>
                <option value="KES" selected>KES - Kenyan Shilling</option>
                <option value="NGN">NGN - Nigerian Naira</option>
                <option value="GHS">GHS - Ghanaian Cedi</option>
                <option value="ZAR">ZAR - South African Rand</option>
              </select>
            </div>
            
            <div class="p2p-form-group">
              <label>Description</label>
              <input type="text" id="description" placeholder="Payment for...">
            </div>
            
            <div class="p2p-form-group">
              <label>Affiliate Code (Optional)</label>
              <input type="text" id="affiliateCode" placeholder="Enter affiliate code" value="${this.affiliateCode || ''}">
              <small class="p2p-helper-text">Support an affiliate and earn them commission</small>
            </div>
            
            <div id="p2pTotalDisplay" class="p2p-total-box">
              <strong>Total Amount:</strong> <span id="p2pTotalAmount">---</span>
            </div>
            
            <button type="submit" class="p2p-btn p2p-btn-primary">
              🚀 Initiate Payment
            </button>
          </form>
          
          <div id="p2pStatusMessage" class="p2p-status-message"></div>
        </div>
      </div>
    `;

    // Add event listeners
    const form = modal.querySelector('#p2pPaymentForm');
    form.addEventListener('submit', (e) => this.handleSubmit(e, modal));
    
    const amountInput = modal.querySelector('#amount');
    const currencySelect = modal.querySelector('#currency');
    [amountInput, currencySelect].forEach(el => {
      el.addEventListener('input', () => this.updateTotal(modal));
    });

    // Add styles if not already present
    if (!document.getElementById('p2p-payment-styles')) {
      this.injectStyles();
    }

    return modal;
  }

  /**
   * Update total amount display with dynamic pricing
   */
  updateTotal(modal) {
    const amount = parseFloat(modal.querySelector('#amount').value) || 0;
    const currency = modal.querySelector('#currency').value;
    
    if (amount <= 0) {
      modal.querySelector('#p2pTotalAmount').textContent = '---';
      return;
    }
    
    // Calculate dynamic fee
    const feeDetails = this.calculateFee(amount);
    const total = amount + feeDetails.totalFee;
    
    const exchangeRates = {
      'KES': 130.0,
      'USD': 1.0,
      'GHS': 12.0,
      'NGN': 750.0,
      'ZAR': 18.5
    };
    
    const rate = exchangeRates[currency] || 1.0;
    const localTotal = (total * rate).toFixed(2);
    const localAmount = (amount * rate).toFixed(2);
    const localFee = (feeDetails.totalFee * rate).toFixed(2);
    
    modal.querySelector('#p2pTotalAmount').innerHTML = `
      ${localTotal} ${currency}
      <div style="font-size: 14px; margin-top: 5px; color: #666;">
        (Amount: ${localAmount} + Fee: ${localFee})
        <br><small>Fee: $${feeDetails.flatFee} + ${feeDetails.feeRate}</small>
      </div>
    `;
  }

  /**
   * Calculate dynamic transaction fee
   */
  calculateFee(amount) {
    const tiers = [
      { max: 10, flatFee: 0.50, percentFee: 0.05 },
      { max: 50, flatFee: 1.00, percentFee: 0.04 },
      { max: 100, flatFee: 2.00, percentFee: 0.03 },
      { max: 500, flatFee: 3.00, percentFee: 0.025 },
      { max: Infinity, flatFee: 5.00, percentFee: 0.02 }
    ];
    
    const tier = tiers.find(t => amount <= t.max);
    const percentageFee = amount * tier.percentFee;
    const totalFee = tier.flatFee + percentageFee;
    
    return {
      flatFee: tier.flatFee,
      percentageFee: parseFloat(percentageFee.toFixed(2)),
      totalFee: parseFloat(totalFee.toFixed(2)),
      feeRate: `${(tier.percentFee * 100)}%`
    };
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e, modal) {
    e.preventDefault();
    
    const formData = {
      senderPhone: modal.querySelector('#senderPhone').value.trim(),
      senderEmail: modal.querySelector('#senderEmail').value.trim(),
      recipientPhone: modal.querySelector('#recipientPhone').value.trim(),
      recipientEmail: modal.querySelector('#recipientEmail').value.trim(),
      amount: parseFloat(modal.querySelector('#amount').value),
      currency: modal.querySelector('#currency').value,
      description: modal.querySelector('#description').value.trim() || 'P2P Transfer',
      affiliateCode: modal.querySelector('#affiliateCode').value.trim() || null
    };

    const statusDiv = modal.querySelector('#p2pStatusMessage');
    statusDiv.innerHTML = '<div class="p2p-loading">Processing payment...</div>';

    try {
      const response = await fetch(`${this.apiBase}/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        statusDiv.innerHTML = `
          <div class="p2p-success">
            <h3>✅ Payment Initiated!</h3>
            <p><strong>Reference:</strong> ${data.transaction.reference}</p>
            <p><strong>Total Amount:</strong> ${data.transaction.totalAmount} ${data.transaction.currency}</p>
            <p><strong>Recipient Gets:</strong> ${data.transaction.recipientAmount} ${data.transaction.currency}</p>
            <p><strong>Transaction Fee:</strong> ${data.transaction.transactionFee} ${data.transaction.currency}</p>
            <p style="margin-top: 15px;">${data.message}</p>
            <p><small>An M-Pesa prompt will be sent to your phone shortly.</small></p>
          </div>
        `;
        
        // Store transaction reference
        this.storeTransaction(data.transaction);
        
        // Clear form
        modal.querySelector('#p2pPaymentForm').reset();
      } else {
        statusDiv.innerHTML = `
          <div class="p2p-error">
            <h3>❌ Payment Failed</h3>
            <p>${data.error || 'An error occurred'}</p>
          </div>
        `;
      }
    } catch (error) {
      statusDiv.innerHTML = `
        <div class="p2p-error">
          <h3>❌ Error</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  /**
   * Store transaction in localStorage
   */
  storeTransaction(transaction) {
    try {
      const transactions = JSON.parse(localStorage.getItem('p2p_transactions') || '[]');
      transactions.unshift({
        ...transaction,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('p2p_transactions', JSON.stringify(transactions.slice(0, 50)));
    } catch (error) {
      console.error('Error storing transaction:', error);
    }
  }

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(phone, email = null) {
    try {
      const url = `${this.apiBase}/transactions/${phone}${email ? `?email=${email}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        return data.transactions;
      }
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Inject CSS styles
   */
  injectStyles() {
    const style = document.createElement('style');
    style.id = 'p2p-payment-styles';
    style.textContent = `
      .p2p-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .p2p-modal-overlay.active {
        opacity: 1;
      }
      .p2p-modal {
        background: white;
        border-radius: 15px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      }
      .p2p-modal-header {
        padding: 25px 30px;
        border-bottom: 2px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .p2p-modal-header h2 {
        margin: 0;
        color: #667eea;
      }
      .p2p-close-btn {
        background: none;
        border: none;
        font-size: 32px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 40px;
        height: 40px;
        line-height: 1;
      }
      .p2p-close-btn:hover {
        color: #333;
      }
      .p2p-modal-body {
        padding: 30px;
      }
      .p2p-info-box {
        background: #f0f4ff;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 25px;
        border-left: 4px solid #667eea;
      }
      .p2p-info-box p {
        margin: 5px 0;
      }
      .p2p-form-group {
        margin-bottom: 20px;
      }
      .p2p-form-group label {
        display: block;
        margin-bottom: 8px;
        color: #333;
        font-weight: 600;
      }
      .p2p-form-group input,
      .p2p-form-group select {
        width: 100%;
        padding: 12px 15px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 15px;
        font-family: inherit;
      }
      .p2p-form-group input:focus,
      .p2p-form-group select:focus {
        outline: none;
        border-color: #667eea;
      }
      .p2p-helper-text {
        display: block;
        margin-top: 5px;
        color: #666;
        font-size: 13px;
      }
      .p2p-total-box {
        background: #f9fafb;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        text-align: center;
        font-size: 18px;
      }
      .p2p-total-box span {
        color: #667eea;
        font-weight: bold;
      }
      .p2p-btn {
        padding: 14px 28px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        width: 100%;
        transition: all 0.3s;
      }
      .p2p-btn-primary {
        background: #667eea;
        color: white;
      }
      .p2p-btn-primary:hover {
        background: #5568d3;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      }
      .p2p-status-message {
        margin-top: 20px;
      }
      .p2p-loading {
        text-align: center;
        padding: 20px;
        color: #667eea;
        font-weight: 600;
      }
      .p2p-success {
        background: #d1fae5;
        padding: 20px;
        border-radius: 8px;
        border: 2px solid #10b981;
      }
      .p2p-success h3 {
        margin: 0 0 15px 0;
        color: #065f46;
      }
      .p2p-success p {
        margin: 8px 0;
        color: #065f46;
      }
      .p2p-error {
        background: #fee2e2;
        padding: 20px;
        border-radius: 8px;
        border: 2px solid #ef4444;
      }
      .p2p-error h3 {
        margin: 0 0 15px 0;
        color: #991b1b;
      }
      .p2p-error p {
        margin: 8px 0;
        color: #991b1b;
      }
    `;
    document.head.appendChild(style);
  }
}

// Make available globally
window.P2PPaymentInterface = P2PPaymentInterface;
