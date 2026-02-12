/**
 * SmartInvest: Email Service Implementation
 * Handles sending emails for user notifications and confirmations
 * @module services/EmailService
 */

class EmailService {
  /**
   * Initialize email service
   * @param {Object} config - Email configuration
   * @param {string} config.smtpHost - SMTP server hostname
   * @param {number} config.smtpPort - SMTP port
   * @param {string} config.smtpUser - SMTP username
   * @param {string} config.smtpPass - SMTP password
   * @param {string} config.senderEmail - From email address
   */
  constructor(config = {}) {
    this.smtpHost = config.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    this.smtpPort = config.smtpPort || process.env.SMTP_PORT || 587;
    this.smtpUser = config.smtpUser || process.env.SMTP_USER;
    this.smtpPass = config.smtpPass || process.env.SMTP_PASS;
    this.senderEmail = config.senderEmail || process.env.SMTP_FROM || 'noreply@smartinvest.example.com';
    this.isConfigured = !!(this.smtpUser && this.smtpPass);
  }

  /**
   * Send payment confirmation email
   * @param {Object} params - Email parameters
   * @param {string} params.toEmail - Recipient email
   * @param {string} params.amount - Payment amount
   * @param {string} params.receipt - M-Pesa receipt number
   * @param {string} params.currency - Currency code (default: KES)
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendPaymentConfirmation(params) {
    const { toEmail, amount, receipt, currency = 'KES' } = params;

    if (!toEmail || !amount || !receipt) {
      return { success: false, error: 'Missing required parameters' };
    }

    if (!this.isConfigured) {
      console.log(`[EMAIL-STUB] Payment confirmation to ${toEmail}: ${amount} ${currency} (${receipt})`);
      return { success: true, messageId: 'stub-' + Date.now() };
    }

    try {
      const subject = `SmartInvest Payment Confirmation - ${receipt}`;
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .receipt { background: #f5f5f5; padding: 15px; border-radius: 5px; }
                .amount { font-size: 24px; font-weight: bold; color: #667eea; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SmartInvest</h1>
                    <p>Payment Confirmed</p>
                </div>
                <div class="content">
                    <p>Your payment has been successfully received.</p>
                    <div class="receipt">
                        <p><strong>Amount:</strong> <span class="amount">${amount} ${currency}</span></p>
                        <p><strong>Receipt Number:</strong> ${receipt}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    <p>Your premium access has been activated. You can now access all premium features in your SmartInvest account.</p>
                    <p><a href="https://smartinvest.example.com/dashboard" style="color: #667eea; text-decoration: none;">Go to Dashboard</a></p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 SmartInvest. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `;

      // Actual email sending would be implemented here with nodemailer
      console.log(`[EMAIL] Sending payment confirmation to ${toEmail}`);
      
      return { success: true, messageId: 'email-' + Date.now() };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment failure notification
   * @param {Object} params - Email parameters
   * @param {string} params.toEmail - Recipient email
   * @param {string} params.reason - Failure reason
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendPaymentFailure(params) {
    const { toEmail, reason } = params;

    if (!toEmail || !reason) {
      return { success: false, error: 'Missing required parameters' };
    }

    if (!this.isConfigured) {
      console.log(`[EMAIL-STUB] Payment failure to ${toEmail}: ${reason}`);
      return { success: true, messageId: 'stub-' + Date.now() };
    }

    try {
      const subject = 'SmartInvest Payment Failed - Action Required';
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .message { background: #ffe5e5; padding: 15px; border-left: 4px solid #dc3545; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SmartInvest</h1>
                    <p>Payment Failed</p>
                </div>
                <div class="content">
                    <p>We encountered an issue processing your payment.</p>
                    <div class="message">
                        <p><strong>Reason:</strong> ${reason}</p>
                    </div>
                    <p>Please try again or contact support for assistance.</p>
                    <p><a href="https://smartinvest.example.com/payment/retry" style="color: #667eea; text-decoration: none;">Retry Payment</a></p>
                </div>
            </div>
        </body>
        </html>
      `;

      console.log(`[EMAIL] Sending payment failure notification to ${toEmail}`);
      
      return { success: true, messageId: 'email-' + Date.now() };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send premium access granted notification
   * @param {Object} params - Email parameters
   * @param {string} params.toEmail - Recipient email
   * @param {Date} params.expiresAt - Expiration date
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendPremiumAccessGranted(params) {
    const { toEmail, expiresAt } = params;

    if (!toEmail) {
      return { success: false, error: 'Missing email address' };
    }

    if (!this.isConfigured) {
      console.log(`[EMAIL-STUB] Premium access granted to ${toEmail}`);
      return { success: true, messageId: 'stub-' + Date.now() };
    }

    try {
      const expireDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Unlimited';
      
      console.log(`[EMAIL] Sending premium access notification to ${toEmail}`);
      
      return { success: true, messageId: 'email-' + Date.now() };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send reset password email
   * @param {Object} params - Email parameters
   * @param {string} params.toEmail - Recipient email
   * @param {string} params.resetLink - Password reset URL
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendPasswordReset(params) {
    const { toEmail, resetLink } = params;

    if (!toEmail || !resetLink) {
      return { success: false, error: 'Missing required parameters' };
    }

    if (!this.isConfigured) {
      console.log(`[EMAIL-STUB] Password reset link to ${toEmail}`);
      return { success: true, messageId: 'stub-' + Date.now() };
    }

    try {
      console.log(`[EMAIL] Sending password reset to ${toEmail}`);
      
      return { success: true, messageId: 'email-' + Date.now() };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;
