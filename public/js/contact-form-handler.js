// Enhanced Contact Form Handler
class ContactFormHandler {
  constructor(formId) {
    this.form = document.getElementById(formId);
    if (this.form) {
      this.init();
    }
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async handleSubmit(event) {
    event.preventDefault();

    const formData = {
      name: this.form.querySelector('[name="name"]').value.trim(),
      email: this.form.querySelector('[name="email"]').value.trim(),
      phone: this.form.querySelector('[name="phone"]')?.value.trim() || '',
      subject: this.form.querySelector('[name="subject"]').value.trim(),
      message: this.form.querySelector('[name="message"]').value.trim()
    };

    // Validate
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      this.showMessage('Please fill in all required fields', 'error');
      return;
    }

    // Disable submit button
    const submitBtn = this.form.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch('/api/email/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        this.showMessage('Thank you! Your message has been sent successfully. We\'ll get back to you soon.', 'success');
        this.form.reset();
      } else {
        this.showMessage(data.error || 'Failed to send message. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      this.showMessage('An error occurred. Please try again or contact us directly at smartinvest254@gmail.com', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  showMessage(message, type) {
    // Remove existing messages
    const existingMsg = this.form.querySelector('.form-message');
    if (existingMsg) {
      existingMsg.remove();
    }

    // Create message element
    const msgDiv = document.createElement('div');
    msgDiv.className = `form-message ${type}`;
    msgDiv.style.cssText = `
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: 6px;
      font-size: 14px;
      ${type === 'success' 
        ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' 
        : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
    `;
    msgDiv.textContent = message;

    this.form.insertBefore(msgDiv, this.form.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      msgDiv.remove();
    }, 5000);
  }
}

// Initialize contact forms
document.addEventListener('DOMContentLoaded', () => {
  const contactFormIds = ['contactForm', 'contact-form', 'supportForm'];
  contactFormIds.forEach(id => {
    new ContactFormHandler(id);
  });
});

window.ContactFormHandler = ContactFormHandler;
