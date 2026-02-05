/**
 * Email Service for SmartInvest
 * Handles email communications for all user types:
 * - New user registration with Terms & Conditions
 * - Premium user upgrade
 * - Subscription confirmations
 * - User notifications
 */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize email transporter with Gmail or SMTP settings
   * @param {object} config - Configuration with email and password
   */
  async initialize(config = {}) {
    try {
      // Priority: Use provided config, then environment variables
      const smtpUser = config.email || process.env.SMTP_USER;
      const smtpPass = config.password || process.env.SMTP_PASS;
      const smtpHost = config.host || process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = config.port || process.env.SMTP_PORT || 587;
      const smtpSecure = config.secure || process.env.SMTP_SECURE === 'true' || false;

      if (!smtpUser || !smtpPass) {
        console.warn('⚠️  Email service not fully configured. Using test transporter.');
        // Fall back to test transporter if credentials not provided
        return this.initializeTestTransporter();
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
      console.log(`   Sender: ${smtpUser}`);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      // Fall back to test transporter
      return this.initializeTestTransporter();
    }
  }

  /**
   * Initialize test transporter for development
   */
  async initializeTestTransporter() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      console.log('✅ Test email transporter initialized (Ethereal)');
      console.log('   User:', testAccount.user);
      console.log('   Pass:', testAccount.pass);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Test transporter initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Send welcome email to newly registered user
   * @param {string} email - User email
   * @param {object} userData - User data object
   */
  async sendWelcomeEmail(email, userData = {}) {
    if (!this.transporter) {
      console.warn('Email transporter not initialized');
      return false;
    }

    const fullName = userData.fullName || email.split('@')[0];
    const userType = this.getUserType(userData);

    try {
      const htmlContent = this.generateWelcomeEmailHTML(fullName, userType, userData);
      
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'SmartInvest <smartinvestsi254@gmail.com>',
        to: email,
        subject: `Welcome to SmartInvest Africa, ${fullName}!`,
        html: htmlContent,
        text: this.generateWelcomeEmailText(fullName, userType)
      });

      console.log(`✅ Welcome email sent to ${email}`);
      this.logPreviewURL(info);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Send terms and conditions email to user
   * @param {string} email - User email
   * @param {object} userData - User data
   */
  async sendTermsAndConditionsEmail(email, userData = {}) {
    if (!this.transporter) {
      console.warn('Email transporter not initialized');
      return false;
    }

    const fullName = userData.fullName || email.split('@')[0];

    try {
      const htmlContent = this.generateTermsEmailHTML(fullName);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'SmartInvest <smartinvestsi254@gmail.com>',
        to: email,
        subject: 'SmartInvest - Terms, Conditions, Rules and Regulations',
        html: htmlContent,
        text: this.generateTermsEmailText()
      });

      console.log(`✅ Terms & Conditions email sent to ${email}`);
      this.logPreviewURL(info);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send T&C email to ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Send premium upgrade email
   * @param {string} email - User email
   * @param {object} userData - User data
   */
  async sendPremiumUpgradeEmail(email, userData = {}) {
    if (!this.transporter) {
      console.warn('Email transporter not initialized');
      return false;
    }

    const fullName = userData.fullName || email.split('@')[0];

    try {
      const htmlContent = this.generatePremiumUpgradeEmailHTML(fullName, userData);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'SmartInvest <smartinvestsi254@gmail.com>',
        to: email,
        subject: '🎉 Welcome to SmartInvest Premium!',
        html: htmlContent,
        text: this.generatePremiumUpgradeEmailText(fullName)
      });

      console.log(`✅ Premium upgrade email sent to ${email}`);
      this.logPreviewURL(info);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send premium email to ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Send subscription confirmation email
   * @param {string} email - User email
   * @param {object} subscriptionData - Subscription details
   */
  async sendSubscriptionConfirmationEmail(email, subscriptionData = {}) {
    if (!this.transporter) {
      console.warn('Email transporter not initialized');
      return false;
    }

    const fullName = subscriptionData.fullName || email.split('@')[0];

    try {
      const htmlContent = this.generateSubscriptionEmailHTML(fullName, subscriptionData);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'SmartInvest <smartinvestsi254@gmail.com>',
        to: email,
        subject: 'Subscription Confirmation - SmartInvest',
        html: htmlContent,
        text: this.generateSubscriptionEmailText(fullName, subscriptionData)
      });

      console.log(`✅ Subscription confirmation email sent to ${email}`);
      this.logPreviewURL(info);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send subscription email to ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Send bulk welcome emails to multiple users
   * @param {array} users - Array of user objects
   */
  async sendBulkWelcomeEmails(users = []) {
    console.log(`📧 Sending welcome emails to ${users.length} users...`);
    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
      const sent = await this.sendWelcomeEmail(user.email, user);
      if (sent) successCount++;
      else failureCount++;
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Bulk email results: ${successCount} sent, ${failureCount} failed`);
    return { successCount, failureCount };
  }

  /**
   * Helper: Determine user type
   */
  getUserType(userData) {
    if (userData.isPremium) return 'Premium';
    if (userData.isSubscribed) return 'Subscriber';
    return 'Registered';
  }

  /**
   * HTML Template: Welcome Email
   */
  generateWelcomeEmailHTML(fullName, userType, userData = {}) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; }
        .section { margin: 20px 0; }
        .section h3 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to SmartInvest Africa!</h1>
          <p>Your Financial Success Starts Here</p>
        </div>
        
        <div class="content">
          <p>Hello <strong>${fullName}</strong>,</p>
          
          <p>Thank you for registering with <strong>SmartInvest Africa</strong>! We're excited to help you achieve your financial goals.</p>
          
          <div class="section">
            <h3>Your Account Information</h3>
            <p><strong>User Type:</strong> ${userType}</p>
            <p><strong>Email:</strong> ${userData.email || 'Your registered email'}</p>
            <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h3>What You Can Do Now</h3>
            <ul>
              <li>Access free financial calculators</li>
              <li>Learn about investments and financial planning</li>
              <li>Explore our investment tools</li>
              <li>Connect with our community</li>
              ${userType === 'Premium' ? '<li>✨ Enjoy premium features and advanced tools</li>' : '<li>💡 Upgrade to Premium for advanced features</li>'}
            </ul>
          </div>

          <div class="section">
            <h3>Important Next Steps</h3>
            <p>1. <strong>Review our Terms & Conditions:</strong> Please read our complete Terms, Conditions, Rules and Regulations (sent separately)</p>
            <p>2. <strong>Complete Your Profile:</strong> Add your personal and financial information for better personalized recommendations</p>
            <p>3. <strong>Verify Your Email:</strong> Click below to confirm your email address</p>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" class="button">Access Your Dashboard</a>
          </div>

          <div class="section">
            <h3>Need Help?</h3>
            <p>Our support team is here to help! Contact us at: <strong>smartinvestsi254@gmail.com</strong></p>
          </div>

          <p style="color: #666; font-size: 13px; margin-top: 30px;">
            If you did not create this account, please contact us immediately.
          </p>
        </div>
        
        <div class="footer">
          <p>&copy; 2026 SmartInvest Africa. All rights reserved.</p>
          <p>This email was sent because you registered with SmartInvest Africa</p>
          <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/terms.html" style="color: #667eea;">View Terms & Conditions</a></p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * HTML Template: Terms and Conditions Email
   */
  generateTermsEmailHTML(fullName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: #d32f2f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; max-height: 500px; overflow-y: auto; }
        .section { margin: 15px 0; }
        .section h3 { color: #d32f2f; font-size: 14px; margin-top: 15px; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 11px; border-radius: 0 0 8px 8px; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 5px 0; font-size: 13px; }
        p { margin: 8px 0; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚖️ Terms, Conditions & Regulations</h1>
          <p>SmartInvest Africa - User Agreement</p>
        </div>
        
        <div class="content">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Please review the following Terms, Conditions, Rules and Regulations for using SmartInvest Africa:</p>

          <div class="section">
            <h3>1. SERVICE AGREEMENT & DISCLAIMER</h3>
            <p>SmartInvest Africa provides financial tools and calculators for educational purposes only. We are not licensed financial advisors and do not provide personalized investment advice. All users must consult licensed professionals before making financial decisions.</p>
          </div>

          <div class="section">
            <h3>2. USER RESPONSIBILITIES</h3>
            <ul>
              <li>You agree to provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must be 18+ years old to use our services</li>
              <li>You agree not to use our service for illegal activities</li>
              <li>You will not attempt to breach security or access unauthorized areas</li>
            </ul>
          </div>

          <div class="section">
            <h3>3. DATA PRIVACY & PROTECTION</h3>
            <ul>
              <li>Your data is encrypted and stored securely</li>
              <li>We comply with international data protection standards</li>
              <li>We will never sell or share your personal information without consent</li>
              <li>We use cookies and analytics for service improvement only</li>
            </ul>
          </div>

          <div class="section">
            <h3>4. PAYMENT & SUBSCRIPTION TERMS</h3>
            <ul>
              <li>All prices are clearly stated before payment</li>
              <li>Premium subscriptions auto-renew unless cancelled</li>
              <li>Refunds are available within 14 days of purchase (conditions apply)</li>
              <li>We accept M-Pesa, PayPal, and bank transfers</li>
            </ul>
          </div>

          <div class="section">
            <h3>5. LIABILITY LIMITATIONS</h3>
            <p>SmartInvest Africa is provided "as-is". We are not liable for:</p>
            <ul>
              <li>Financial losses resulting from calculator use</li>
              <li>Service interruptions or technical errors</li>
              <li>Third-party content or links</li>
              <li>Unauthorized account access (if you disclosed credentials)</li>
            </ul>
          </div>

          <div class="section">
            <h3>6. INTELLECTUAL PROPERTY</h3>
            <p>All content, tools, and materials on SmartInvest are protected by copyright. Users may use them for personal, non-commercial purposes only.</p>
          </div>

          <div class="section">
            <h3>7. PROHIBITED ACTIVITIES</h3>
            <ul>
              <li>Hacking, phishing, or malware distribution</li>
              <li>Spam, harassment, or abusive behavior</li>
              <li>Illegal financial activities or money laundering</li>
              <li>Selling/sharing account access</li>
            </ul>
          </div>

          <div class="section">
            <h3>8. COMPLIANCE & REGULATIONS</h3>
            <p>SmartInvest complies with:</p>
            <ul>
              <li>Kenya Monetary Authority (KMA) guidelines</li>
              <li>Central Bank of Kenya regulations</li>
              <li>Consumer Protection Act of Kenya</li>
              <li>International financial reporting standards</li>
              <li>GDPR and international privacy laws</li>
            </ul>
          </div>

          <div class="section">
            <h3>9. ACCOUNT TERMINATION</h3>
            <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.</p>
          </div>

          <div class="section">
            <h3>10. CONTACT & SUPPORT</h3>
            <p><strong>Email:</strong> smartinvestsi254@gmail.com</p>
            <p><strong>Website:</strong> ${process.env.APP_URL || 'http://localhost:3000'}</p>
          </div>

          <p style="margin-top: 20px; color: #d32f2f; font-weight: bold;">
            ✓ By using SmartInvest, you acknowledge that you have read and agree to these terms and conditions.
          </p>
        </div>
        
        <div class="footer">
          <p>&copy; 2026 SmartInvest Africa. All rights reserved.</p>
          <p>Effective Date: January 1, 2026 | Last Updated: January 30, 2026</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * HTML Template: Premium Upgrade Email
   */
  generatePremiumUpgradeEmailHTML(fullName, userData = {}) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #333; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; }
        .section { margin: 20px 0; }
        .section h3 { color: #ffd700; border-bottom: 2px solid #ffd700; padding-bottom: 10px; }
        .feature-list { background: #fffacd; padding: 15px; border-radius: 5px; }
        .feature-list li { margin: 8px 0; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #ffd700; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌟 Welcome to Premium!</h1>
          <p>You now have access to exclusive features</p>
        </div>
        
        <div class="content">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Congratulations! Your account has been upgraded to <strong>SmartInvest Premium</strong>.</p>
          
          <div class="section">
            <h3>✨ Your New Premium Benefits</h3>
            <div class="feature-list">
              <ul>
                <li>✅ 50+ Advanced Financial Calculators</li>
                <li>✅ Actuarial & Insurance Analysis Tools</li>
                <li>✅ Advanced Portfolio Optimization</li>
                <li>✅ Real-time Market Analysis</li>
                <li>✅ Priority Email Support</li>
                <li>✅ Monthly Financial Reports</li>
                <li>✅ Exclusive Webinars & Training</li>
                <li>✅ Custom Scenario Planning</li>
                <li>✅ Tax Planning Tools</li>
                <li>✅ Investment Strategy Recommendations</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <h3>Getting Started with Premium</h3>
            <p>1. Log into your account</p>
            <p>2. Go to Premium Dashboard</p>
            <p>3. Explore new calculators and tools</p>
            <p>4. Start planning your financial future</p>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard?tab=premium" class="button">Access Premium Dashboard</a>
          </div>

          <div class="section">
            <h3>Need Help?</h3>
            <p>Our premium support team is available to assist you. Email us at: <strong>smartinvestsi254@gmail.com</strong></p>
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; 2026 SmartInvest Africa. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * HTML Template: Subscription Confirmation Email
   */
  generateSubscriptionEmailHTML(fullName, subscriptionData = {}) {
    const subscriptionDate = new Date().toLocaleDateString();
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: #4caf50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; }
        .section { margin: 20px 0; }
        .section h3 { color: #4caf50; }
        .details-box { background: #f0f7f0; padding: 15px; border-left: 4px solid #4caf50; border-radius: 4px; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Subscription Confirmed!</h1>
          <p>Thank you for subscribing</p>
        </div>
        
        <div class="content">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Your subscription to SmartInvest has been successfully confirmed!</p>
          
          <div class="section">
            <h3>Subscription Details</h3>
            <div class="details-box">
              <p><strong>Subscription Type:</strong> ${subscriptionData.type || 'Premium Monthly'}</p>
              <p><strong>Start Date:</strong> ${subscriptionDate}</p>
              <p><strong>Next Billing Date:</strong> ${subscriptionData.nextBillingDate || 'Coming soon'}</p>
              <p><strong>Amount:</strong> ${subscriptionData.amount || 'As per plan'}</p>
            </div>
          </div>

          <div class="section">
            <h3>What's Included</h3>
            <ul>
              <li>Full access to all premium features</li>
              <li>Priority customer support</li>
              <li>Monthly updates and new tools</li>
              <li>Exclusive financial resources</li>
            </ul>
          </div>

          <div class="section">
            <h3>Managing Your Subscription</h3>
            <p>You can manage your subscription anytime from your account settings. To cancel or modify, please visit your dashboard or contact support.</p>
          </div>

          <p style="color: #666; font-size: 13px; margin-top: 20px;">
            This is an automated confirmation email. Please do not reply directly. For support, email smartinvestsi254@gmail.com
          </p>
        </div>
        
        <div class="footer">
          <p>&copy; 2026 SmartInvest Africa. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Text version of welcome email
   */
  generateWelcomeEmailText(fullName, userType) {
    return `
Welcome to SmartInvest Africa!

Hello ${fullName},

Thank you for registering with SmartInvest Africa! We're excited to help you achieve your financial goals.

Your Account Information:
- User Type: ${userType}
- Registration Date: ${new Date().toLocaleDateString()}

What You Can Do Now:
- Access free financial calculators
- Learn about investments and financial planning
- Explore our investment tools
- Connect with our community
${userType === 'Premium' ? '- Enjoy premium features and advanced tools' : '- Upgrade to Premium for advanced features'}

Important Next Steps:
1. Review our Terms & Conditions (sent separately)
2. Complete your profile with personal and financial information
3. Verify your email address

Need Help?
Contact us at: smartinvestsi254@gmail.com

© 2026 SmartInvest Africa. All rights reserved.
    `;
  }

  /**
   * Text version of terms email
   */
  generateTermsEmailText() {
    return `
SMARTINVEST AFRICA - TERMS, CONDITIONS & REGULATIONS

1. SERVICE AGREEMENT & DISCLAIMER
SmartInvest provides financial tools for educational purposes. Consult licensed professionals before making financial decisions.

2. USER RESPONSIBILITIES
- Provide accurate information
- Maintain account security
- Must be 18+ years old
- No illegal activities
- No security breaches

3. DATA PRIVACY & PROTECTION
- Data is encrypted and secure
- We comply with international standards
- We don't sell personal information
- We use analytics for improvement

4. PAYMENT & SUBSCRIPTION TERMS
- Prices clearly stated before payment
- Auto-renewal unless cancelled
- 14-day refund policy available
- Multiple payment methods accepted

5. LIABILITY LIMITATIONS
SmartInvest is not liable for financial losses, service interruptions, or unauthorized access.

6. INTELLECTUAL PROPERTY
All content is protected by copyright. For personal, non-commercial use only.

7. PROHIBITED ACTIVITIES
- Hacking or phishing
- Spam or harassment
- Illegal financial activities
- Sharing account access

8. COMPLIANCE & REGULATIONS
- Kenya Monetary Authority guidelines
- Central Bank of Kenya regulations
- Consumer Protection Act
- International financial standards
- GDPR compliance

9. ACCOUNT TERMINATION
We reserve the right to suspend accounts violating these terms.

10. CONTACT & SUPPORT
Email: smartinvestsi254@gmail.com

By using SmartInvest, you agree to these terms.

© 2026 SmartInvest Africa. All rights reserved.
    `;
  }

  /**
   * Text version of premium email
   */
  generatePremiumUpgradeEmailText(fullName) {
    return `
Welcome to SmartInvest Premium!

Hello ${fullName},

Congratulations! Your account has been upgraded to Premium.

Your Premium Benefits:
- 50+ Advanced Financial Calculators
- Actuarial & Insurance Analysis Tools
- Advanced Portfolio Optimization
- Real-time Market Analysis
- Priority Email Support
- Monthly Financial Reports
- Exclusive Webinars & Training
- Custom Scenario Planning
- Tax Planning Tools
- Investment Strategy Recommendations

Getting Started:
1. Log into your account
2. Go to Premium Dashboard
3. Explore new calculators
4. Start planning your financial future

Need Help?
Email: smartinvestsi254@gmail.com

© 2026 SmartInvest Africa.
    `;
  }

  /**
   * Text version of subscription email
   */
  generateSubscriptionEmailText(fullName, subscriptionData = {}) {
    return `
Subscription Confirmed!

Hello ${fullName},

Your subscription to SmartInvest has been successfully confirmed!

Subscription Details:
- Type: ${subscriptionData.type || 'Premium Monthly'}
- Start Date: ${new Date().toLocaleDateString()}
- Next Billing: ${subscriptionData.nextBillingDate || 'Coming soon'}
- Amount: ${subscriptionData.amount || 'As per plan'}

What's Included:
- Full access to premium features
- Priority support
- Monthly updates
- Exclusive resources

Managing Your Subscription:
You can manage your subscription from your account settings anytime.

For support, email: smartinvestsi254@gmail.com

© 2026 SmartInvest Africa.
    `;
  }

  /**
   * Log preview URL for test emails
   */
  logPreviewURL(info) {
    try {
      if (info.response && info.response.includes('250')) {
        console.log('✓ Email accepted by server');
      }
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        console.log('📧 Preview URL:', preview);
      }
    } catch (e) {
      // Ignore
    }
  }
}

// Export for use in server.js
module.exports = EmailService;
