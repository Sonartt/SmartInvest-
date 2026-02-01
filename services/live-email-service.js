const nodemailer = require('nodemailer');

// Email configuration
const ADMIN_EMAIL = 'delijah5415@gmail.com';
const WEBSITE_EMAIL = 'smartinvestsi254@gmail.com';
const SUPPORT_PHONES = ['0731856995', '0114383762'];

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || WEBSITE_EMAIL,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendContactEmail(data) {
    const { name, email, subject, message, phone } = data;

    const mailOptions = {
      from: WEBSITE_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">New Contact Form Submission</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border: 1px solid #ddd; margin: 15px 0;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px;">
            This message was sent from SmartInvest contact form at ${new Date().toLocaleString()}
          </p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendChatNotification(chatData) {
    const { userName, userEmail, message, timestamp } = chatData;

    const mailOptions = {
      from: WEBSITE_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Chat Message from ${userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2196F3;">New Chat Message</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>User:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
            <hr style="border: 1px solid #ddd; margin: 15px 0;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 4px;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px;">
            Reply to this chat at: <a href="mailto:${userEmail}">${userEmail}</a>
          </p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Chat notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(userData) {
    const { name, email } = userData;

    const mailOptions = {
      from: WEBSITE_EMAIL,
      to: email,
      subject: 'Welcome to SmartInvest Africa!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to SmartInvest Africa!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p>Dear ${name},</p>
            <p>Thank you for joining SmartInvest Africa! We're excited to help you on your investment journey.</p>
            
            <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2196F3; margin-top: 0;">Get Started:</h3>
              <ul style="line-height: 1.8;">
                <li>Explore our free investment calculators</li>
                <li>Read educational content and insights</li>
                <li>Upgrade to Premium for advanced tools</li>
                <li>Connect with our community</li>
              </ul>
            </div>

            <p><strong>Need Help?</strong></p>
            <p>Our support team is here for you:</p>
            <ul>
              <li>Email: ${WEBSITE_EMAIL}</li>
              <li>Phone: ${SUPPORT_PHONES.join(' / ')}</li>
              <li>Live Chat on our website</li>
            </ul>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.BASE_URL || 'https://smartinvest.vercel.app'}" 
                 style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Visit Dashboard
              </a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>SmartInvest Africa - Democratizing Investment Opportunities</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }
  }

  getContactInfo() {
    return {
      adminEmail: ADMIN_EMAIL,
      supportEmail: WEBSITE_EMAIL,
      phones: SUPPORT_PHONES
    };
  }
}

module.exports = new EmailService();
