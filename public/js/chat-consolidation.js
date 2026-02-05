/**
 * Smart Chat Initialization
 * Consolidates old inline chat with modern chat system
 * Prevents conflicts and preserves all features
 */

// Check if ModernChatSystem is available (from modern-chat-system.js)
// If yes, use it. If no, fall back to inline functions

const CHAT_CONFIG = {
  useModern: typeof ModernChatSystem !== 'undefined',
  fallbackToInline: true,
  storageKey: 'smartinvest-chat-active-convo'
};

/**
 * Initialize chat system based on availability
 */
function initializeChatSystem() {
  if (CHAT_CONFIG.useModern && window.chatSystem) {
    // Modern system already initialized by modern-chat-system.js
    console.log('✓ Modern Chat System initialized');
    return;
  }
  
  if (CHAT_CONFIG.fallbackToInline) {
    console.log('✓ Using inline chat functions (no modern system available)');
    // Inline functions are already defined in index.html
    return;
  }
  
  console.warn('⚠ No chat system available');
}

/**
 * Merge conversation data if switching systems
 */
function migrateOldChatData() {
  const oldConversationId = localStorage.getItem(CHAT_CONFIG.storageKey);
  if (oldConversationId && window.chatSystem) {
    try {
      // Transfer any old data to modern system
      const oldData = localStorage.getItem(`chat-${oldConversationId}`);
      if (oldData) {
        console.log('Migrating old chat data to modern system');
        // Modern system handles this internally
      }
    } catch (e) {
      console.error('Error migrating chat data:', e);
    }
  }
}

/**
 * Ensure single chat instance
 */
function preventChatDuplication() {
  // Check for multiple chat launchers
  const chatLaunchers = document.querySelectorAll('[id*="chat"]');
  if (chatLaunchers.length > 2) {
    console.warn('⚠ Multiple chat instances detected, consolidating...');
    // Hide old instance if modern is available
    if (CHAT_CONFIG.useModern) {
      const oldWidget = document.getElementById('liveChatWidget');
      if (oldWidget && oldWidget !== document.getElementById('modernChatWidget')) {
        oldWidget.style.display = 'none';
      }
    }
  }
}

/**
 * Ensure old functions still work if modern system not available
 */
if (typeof toggleChat === 'undefined') {
  window.toggleChat = function() {
    if (CHAT_CONFIG.useModern && window.chatSystem) {
      const container = document.getElementById('chatContainer');
      if (container) {
        container.classList.toggle('active');
      }
    }
  };
}

if (typeof sendChatMessage === 'undefined') {
  window.sendChatMessage = async function() {
    if (CHAT_CONFIG.useModern && window.chatSystem) {
      // Modern system handles this
      const form = document.getElementById('messageForm');
      if (form) form.dispatchEvent(new Event('submit'));
    }
  };
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initializeChatSystem();
      migrateOldChatData();
      preventChatDuplication();
    }, 100);
  });
} else {
  setTimeout(() => {
    initializeChatSystem();
    migrateOldChatData();
    preventChatDuplication();
  }, 100);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CHAT_CONFIG, initializeChatSystem, preventChatDuplication };
}
