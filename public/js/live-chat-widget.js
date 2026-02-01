// Live Chat Widget
class LiveChatWidget {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.userName = localStorage.getItem('chatUserName') || '';
    this.userEmail = localStorage.getItem('chatUserEmail') || '';
    this.init();
  }

  init() {
    this.createWidget();
    this.attachEventListeners();
    this.loadPreviousMessages();
  }

  createWidget() {
    const widget = document.createElement('div');
    widget.id = 'liveChatWidget';
    widget.innerHTML = `
      <style>
        #liveChatWidget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .chat-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .chat-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        
        .chat-button-icon {
          font-size: 28px;
        }
        
        .chat-window {
          display: none;
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          flex-direction: column;
          overflow: hidden;
        }
        
        .chat-window.open {
          display: flex;
        }
        
        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .chat-header h3 {
          margin: 0;
          font-size: 18px;
        }
        
        .chat-status {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 4px;
        }
        
        .chat-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f5f5f5;
        }
        
        .chat-message {
          margin-bottom: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          max-width: 80%;
          word-wrap: break-word;
        }
        
        .chat-message.user {
          background: #667eea;
          color: white;
          margin-left: auto;
          border-bottom-right-radius: 4px;
        }
        
        .chat-message.admin {
          background: white;
          color: #333;
          border-bottom-left-radius: 4px;
        }
        
        .chat-message-time {
          font-size: 10px;
          opacity: 0.7;
          margin-top: 4px;
        }
        
        .chat-input-container {
          padding: 16px;
          background: white;
          border-top: 1px solid #e0e0e0;
        }
        
        .chat-user-form {
          padding: 16px;
        }
        
        .chat-user-form input {
          width: 100%;
          padding: 10px;
          margin-bottom: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .chat-user-form button {
          width: 100%;
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        
        .chat-input-wrapper {
          display: flex;
          gap: 8px;
        }
        
        .chat-input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 20px;
          font-size: 14px;
        }
        
        .chat-send-btn {
          background: #667eea;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 18px;
          transition: background 0.3s;
        }
        
        .chat-send-btn:hover {
          background: #5568d3;
        }
        
        .chat-send-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .typing-indicator {
          display: none;
          padding: 10px;
          color: #666;
          font-size: 12px;
          font-style: italic;
        }
        
        .typing-indicator.active {
          display: block;
        }
      </style>
      
      <button class="chat-button" id="chatToggle">
        <span class="chat-button-icon">💬</span>
      </button>
      
      <div class="chat-window" id="chatWindow">
        <div class="chat-header">
          <div>
            <h3>SmartInvest Support</h3>
            <div class="chat-status">We typically reply within minutes</div>
          </div>
          <button class="chat-close" id="chatClose">×</button>
        </div>
        
        <div id="chatUserForm" class="chat-user-form" style="display: none;">
          <h4 style="margin-top: 0;">Start a conversation</h4>
          <input type="text" id="chatUserName" placeholder="Your name" required>
          <input type="email" id="chatUserEmail" placeholder="Your email" required>
          <button id="startChat">Start Chat</button>
        </div>
        
        <div id="chatContent" style="display: none; flex: 1; display: flex; flex-direction: column;">
          <div class="chat-messages" id="chatMessages"></div>
          <div class="typing-indicator" id="typingIndicator">Admin is typing...</div>
          <div class="chat-input-container">
            <div class="chat-input-wrapper">
              <input 
                type="text" 
                class="chat-input" 
                id="chatInput" 
                placeholder="Type your message..."
                maxlength="500"
              >
              <button class="chat-send-btn" id="chatSend">➤</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
  }

  attachEventListeners() {
    document.getElementById('chatToggle').addEventListener('click', () => this.toggleChat());
    document.getElementById('chatClose').addEventListener('click', () => this.closeChat());
    document.getElementById('startChat').addEventListener('click', () => this.startChat());
    document.getElementById('chatSend').addEventListener('click', () => this.sendMessage());
    
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    const chatWindow = document.getElementById('chatWindow');
    
    if (this.isOpen) {
      chatWindow.classList.add('open');
      
      if (!this.userName || !this.userEmail) {
        document.getElementById('chatUserForm').style.display = 'block';
        document.getElementById('chatContent').style.display = 'none';
      } else {
        document.getElementById('chatUserForm').style.display = 'none';
        document.getElementById('chatContent').style.display = 'flex';
        this.scrollToBottom();
      }
    } else {
      chatWindow.classList.remove('open');
    }
  }

  closeChat() {
    this.isOpen = false;
    document.getElementById('chatWindow').classList.remove('open');
  }

  startChat() {
    const nameInput = document.getElementById('chatUserName');
    const emailInput = document.getElementById('chatUserEmail');
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    
    if (!name || !email) {
      alert('Please enter your name and email');
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    this.userName = name;
    this.userEmail = email;
    
    localStorage.setItem('chatUserName', name);
    localStorage.setItem('chatUserEmail', email);
    
    document.getElementById('chatUserForm').style.display = 'none';
    document.getElementById('chatContent').style.display = 'flex';
    
    // Send welcome message
    this.addMessage('admin', `Hi ${name}! 👋 How can we help you today?`, true);
    this.scrollToBottom();
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    this.addMessage('user', message);
    input.value = '';
    
    // Save message
    this.saveMessage('user', message);
    
    // Notify admin via email
    try {
      await fetch('/api/email/chat-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userName: this.userName,
          userEmail: this.userEmail,
          message
        })
      });
    } catch (error) {
      console.error('Failed to notify admin:', error);
    }
    
    // Auto-reply with contact info
    setTimeout(() => {
      this.addMessage('admin', 
        `Thank you for your message! Our team will review it and get back to you soon.\n\n` +
        `For urgent matters, you can also reach us at:\n` +
        `📧 smartinvestsi254@gmail.com\n` +
        `📞 0731856995 / 0114383762\n` +
        `👤 Contact: ELIJAH DANIEL`,
        true
      );
      this.scrollToBottom();
    }, 1000);
  }

  addMessage(sender, text, skipSave = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div>${text.replace(/\n/g, '<br>')}</div>
      <div class="chat-message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
    
    if (!skipSave) {
      this.saveMessage(sender, text);
    }
  }

  saveMessage(sender, text) {
    const message = {
      sender,
      text,
      timestamp: new Date().toISOString(),
      userName: this.userName,
      userEmail: this.userEmail
    };
    
    this.messages.push(message);
    
    // Save to localStorage
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.push(message);
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory.slice(-50))); // Keep last 50 messages
  }

  loadPreviousMessages() {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.forEach(msg => {
      if (msg.userEmail === this.userEmail) {
        this.addMessage(msg.sender, msg.text, true);
      }
    });
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Initialize chat widget when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.liveChatWidget = new LiveChatWidget();
  });
} else {
  window.liveChatWidget = new LiveChatWidget();
}
