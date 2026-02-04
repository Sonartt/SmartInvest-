/**
 * Modern Chat Support System
 * Enhanced user-facing chat with image sharing, typing indicators, read receipts
 */

class ModernChatSystem {
  constructor() {
    this.conversationId = null;
    this.messages = [];
    this.isAdmin = false;
    this.userName = localStorage.getItem('chatUserName') || '';
    this.userEmail = localStorage.getItem('chatUserEmail') || '';
    this.userId = localStorage.getItem('chatUserId') || this.generateUserId();
    this.ws = null;
    this.isTyping = false;
    this.messageListeners = new Map();
    this.init();
  }

  generateUserId() {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chatUserId', id);
    return id;
  }

  async init() {
    await this.checkAdminStatus();
    this.createChatInterface();
    this.attachEventListeners();
    this.initWebSocket();
  }

  async checkAdminStatus() {
    try {
      const response = await fetch('/api/chat/admin-check', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      this.isAdmin = response.ok;
    } catch (e) {
      this.isAdmin = false;
    }
  }

  createChatInterface() {
    if (document.getElementById('modernChatWidget')) return;

    const widget = document.createElement('div');
    widget.id = 'modernChatWidget';
    widget.innerHTML = `
      <style>
        #modernChatWidget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .chat-launcher {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          font-size: 32px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .chat-launcher:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
        }

        .chat-launcher.active {
          display: none;
        }

        .unread-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .chat-container {
          display: none;
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 420px;
          height: 600px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          flex-direction: column;
          z-index: 10000;
          animation: slideUp 0.3s ease;
        }

        .chat-container.active {
          display: flex;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 16px 16px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chat-header-info h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .chat-status {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 4px;
        }

        .chat-status.online::before {
          content: '●';
          color: #10b981;
          margin-right: 6px;
        }

        .chat-status.offline::before {
          content: '●';
          color: #9ca3af;
          margin-right: 6px;
        }

        .chat-header-actions {
          display: flex;
          gap: 10px;
        }

        .chat-header-actions button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s;
        }

        .chat-header-actions button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f9fafb;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        .message-group {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .message-group.user {
          justify-content: flex-end;
        }

        .message-bubble {
          max-width: 75%;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .message-group.user .message-bubble {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message-group.admin .message-bubble {
          background: white;
          color: #1f2937;
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 4px;
        }

        .message-time {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 4px;
        }

        .message-group.user .message-time {
          color: #6b7280;
          text-align: right;
        }

        .message-read-status {
          font-size: 10px;
          margin-top: 2px;
          text-align: right;
          opacity: 0.6;
        }

        .message-image {
          max-width: 100%;
          border-radius: 8px;
          margin: 8px 0;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .message-image:hover {
          transform: scale(1.02);
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          height: 20px;
        }

        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d1d5db;
          animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-10px);
          }
        }

        .chat-input-area {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: white;
          border-radius: 0 0 16px 16px;
        }

        .input-form {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .message-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .message-input-wrapper:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .message-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          resize: none;
          max-height: 80px;
        }

        .attachment-btn {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          transition: all 0.2s;
        }

        .attachment-btn:hover {
          color: #764ba2;
          transform: scale(1.1);
        }

        #imageInput {
          display: none;
        }

        .send-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .image-preview {
          position: relative;
          display: inline-block;
          margin: 8px 0;
          max-width: 100%;
        }

        .image-preview img {
          max-width: 100%;
          max-height: 200px;
          border-radius: 8px;
        }

        .remove-image-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-image-btn:hover {
          background: rgba(0, 0, 0, 0.9);
        }

        .chat-footer-info {
          font-size: 12px;
          color: #9ca3af;
          padding: 8px 0;
          text-align: center;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .chat-container {
            width: calc(100vw - 20px);
            height: 70vh;
            max-height: 600px;
            right: 10px;
            left: 10px;
          }

          .message-bubble {
            max-width: 90%;
          }
        }
      </style>

      <div class="chat-launcher" id="chatLauncher" title="Open chat support">
        <span>💬</span>
        <div class="unread-badge" id="unreadBadge" style="display: none;">0</div>
      </div>

      <div class="chat-container" id="chatContainer">
        <div class="chat-header">
          <div class="chat-header-info">
            <h3>Support Chat</h3>
            <div class="chat-status online" id="chatStatus">Support Team Active</div>
          </div>
          <div class="chat-header-actions">
            <button id="chatSettingsBtn" title="Settings">⚙️</button>
            <button id="chatCloseBtn" title="Close">✕</button>
          </div>
        </div>

        <div class="chat-messages" id="chatMessages"></div>

        <div class="chat-input-area">
          <form class="input-form" id="messageForm">
            <div class="message-input-wrapper">
              <input
                type="text"
                id="messageInput"
                class="message-input"
                placeholder="Type your message..."
                autocomplete="off"
              />
              <label for="imageInput" class="attachment-btn" title="Attach image">
                📎
              </label>
              <input type="file" id="imageInput" accept="image/*" />
              <div class="image-preview" id="imagePreview"></div>
            </div>
            <button type="submit" class="send-btn" id="sendBtn">✈️</button>
          </form>
          <div class="chat-footer-info">
            We typically reply within 2 hours
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
  }

  attachEventListeners() {
    // Launcher button
    document.getElementById('chatLauncher')?.addEventListener('click', () => this.openChat());
    document.getElementById('chatCloseBtn')?.addEventListener('click', () => this.closeChat());

    // Message form
    document.getElementById('messageForm')?.addEventListener('submit', (e) => this.handleMessageSubmit(e));

    // Image attachment
    document.getElementById('imageInput')?.addEventListener('change', (e) => this.handleImageSelect(e));

    // Typing indicator
    document.getElementById('messageInput')?.addEventListener('input', () => this.handleTyping());

    // Auto-scroll to bottom when new message arrives
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      const observer = new MutationObserver(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
      observer.observe(messagesContainer, { childList: true });
    }
  }

  openChat() {
    document.getElementById('chatContainer').classList.add('active');
    document.getElementById('chatLauncher').classList.add('active');
    this.markMessagesAsRead();
  }

  closeChat() {
    document.getElementById('chatContainer').classList.remove('active');
    document.getElementById('chatLauncher').classList.remove('active');
  }

  async handleMessageSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content && !this.selectedImage) return;

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('conversationId', this.conversationId);
      if (this.selectedImage) {
        formData.append('image', this.selectedImage);
      }

      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        this.addMessageToUI(result.message);
        input.value = '';
        this.selectedImage = null;
        document.getElementById('imagePreview').innerHTML = '';
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      sendBtn.disabled = false;
    }
  }

  handleImageSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `
          <div class="image-preview">
            <img src="${event.target.result}" alt="Preview" />
            <button type="button" class="remove-image-btn" onclick="this.closest('.image-preview').remove()">✕</button>
          </div>
        `;
      };
      reader.readAsDataURL(file);
    }
  }

  handleTyping() {
    if (!this.isTyping) {
      this.isTyping = true;
      this.ws?.send(JSON.stringify({
        type: 'typing',
        conversationId: this.conversationId,
        userName: this.userName
      }));

      setTimeout(() => {
        this.isTyping = false;
      }, 3000);
    }
  }

  addMessageToUI(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const isUser = message.role === 'user';
    const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    const messageDiv = document.createElement('div');
    messageDiv.className = `message-group ${isUser ? 'user' : 'admin'}`;
    messageDiv.innerHTML = `
      <div>
        <div class="message-bubble">
          ${message.content}
          ${message.image ? `<img src="${message.image}" alt="Attached image" class="message-image" onclick="window.open(this.src, '_blank')">` : ''}
        </div>
        <div class="message-time">
          ${timeStr}
          ${isUser ? `<div class="message-read-status">${message.read ? '✓✓ Read' : '✓'}</div>` : ''}
        </div>
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  markMessagesAsRead() {
    const unreadMessages = this.messages.filter(m => !m.read && m.role === 'admin');
    if (unreadMessages.length > 0) {
      fetch('/api/chat/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: this.conversationId,
          messageIds: unreadMessages.map(m => m.id)
        })
      });
    }
    const badge = document.getElementById('unreadBadge');
    if (badge) badge.style.display = 'none';
  }

  initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    try {
      this.ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          this.messages.push(data.message);
          if (data.message.role === 'admin' && !document.getElementById('chatContainer').classList.contains('active')) {
            this.showUnreadBadge();
          }
          this.addMessageToUI(data.message);
        } else if (data.type === 'typing') {
          this.showTypingIndicator(data.userName);
        } else if (data.type === 'admin-online') {
          document.getElementById('chatStatus').textContent = 'Support Team Active';
          document.getElementById('chatStatus').classList.remove('offline');
          document.getElementById('chatStatus').classList.add('online');
        } else if (data.type === 'admin-offline') {
          document.getElementById('chatStatus').textContent = 'Support Team Away';
          document.getElementById('chatStatus').classList.remove('online');
          document.getElementById('chatStatus').classList.add('offline');
        }
      };

      this.ws.onclose = () => {
        setTimeout(() => this.initWebSocket(), 3000);
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }
  }

  showTypingIndicator(userName) {
    const messagesContainer = document.getElementById('chatMessages');
    const existingIndicator = messagesContainer.querySelector('.typing-group');
    if (!existingIndicator) {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message-group admin typing-group';
      typingDiv.innerHTML = `
        <div class="message-bubble">
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      `;
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      setTimeout(() => {
        typingDiv.remove();
      }, 3000);
    }
  }

  showUnreadBadge() {
    const badge = document.getElementById('unreadBadge');
    if (badge) {
      const current = parseInt(badge.textContent) || 0;
      badge.textContent = current + 1;
      badge.style.display = 'flex';
    }
  }
}

// Initialize chat system when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.chatSystem = new ModernChatSystem();
  });
} else {
  window.chatSystem = new ModernChatSystem();
}
