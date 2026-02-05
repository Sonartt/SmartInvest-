// ============================================
// FORM VALIDATION & ACCESSIBILITY UTILITIES
// ============================================

/**
 * Real-time input validation setup
 */
function setupFormValidation() {
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('blur', () => validateNumberInput(input));
    input.addEventListener('input', function() {
      if (this.classList.contains('error')) {
        validateNumberInput(this);
      }
    });
  });
}

/**
 * Validate number inputs with min/max constraints
 */
function validateNumberInput(input) {
  const min = input.getAttribute('min');
  const max = input.getAttribute('max');
  const value = parseFloat(input.value);
  
  if (isNaN(value) && input.value !== '') {
    input.classList.add('error');
    showErrorMessage(input, 'Please enter a valid number');
    return false;
  }

  if (min !== null && value < parseFloat(min)) {
    input.classList.add('error');
    showErrorMessage(input, `Value must be at least ${min}`);
    return false;
  }

  if (max !== null && value > parseFloat(max)) {
    input.classList.add('error');
    showErrorMessage(input, `Value must not exceed ${max}`);
    return false;
  }

  input.classList.remove('error');
  hideErrorMessage(input);
  return true;
}

/**
 * Display error message next to input
 */
function showErrorMessage(input, message) {
  let errorMsg = input.nextElementSibling;
  if (!errorMsg || !errorMsg.classList.contains('error-message')) {
    errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    input.parentElement.appendChild(errorMsg);
  }
  errorMsg.textContent = message;
}

/**
 * Hide error message for input
 */
function hideErrorMessage(input) {
  const errorMsg = input.nextElementSibling;
  if (errorMsg && errorMsg.classList.contains('error-message')) {
    errorMsg.textContent = '';
  }
}

/**
 * Format phone number input with masking
 */
function formatPhoneNumber(value) {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.startsWith('254')) {
    // Format: +254 712 345 678
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 12)}`;
  } else if (cleaned.startsWith('0')) {
    // Format: 0712 345 678
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
  }
  
  return cleaned;
}

/**
 * Format currency input
 */
function formatCurrency(value) {
  const parts = value.replace(/[^0-9.]/g, '').split('.');
  let result = parts[0];
  
  if (parts[1]) {
    result += '.' + parts[1].slice(0, 2);
  }
  
  return result;
}

/**
 * Add accessibility labels to form inputs
 */
function addAccessibilityLabels() {
  document.querySelectorAll('input, select, textarea').forEach(input => {
    if (!input.getAttribute('aria-label')) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        input.setAttribute('aria-label', label.textContent.trim());
      }
    }
  });
}

/**
 * Show toast notification with accessibility support
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.textContent = message;
  
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/**
 * Keyboard navigation for tab interfaces
 */
function setupTabKeyboardNavigation() {
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    
    const activeTab = document.querySelector('[role="tab"]:focus, .tab[data-tab]:focus');
    if (!activeTab) return;

    const tabs = Array.from(document.querySelectorAll('[role="tab"], .tab[data-tab]'));
    const currentIndex = tabs.indexOf(activeTab);
    let nextIndex;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    e.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  });
}

/**
 * Focus trap for modals
 */
function setupFocusTrap(modalElement) {
  const focusableElements = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  modalElement.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  });
}

/**
 * Initialize all form enhancements
 */
function initializeFormEnhancements() {
  setupFormValidation();
  addAccessibilityLabels();
  setupTabKeyboardNavigation();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFormEnhancements);
} else {
  initializeFormEnhancements();
}
