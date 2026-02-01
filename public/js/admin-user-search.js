// Admin User Search Component
class AdminUserSearch {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.searchResults = [];
    this.onUserSelect = null;
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="user-search-container">
        <div class="search-box" style="display: flex; gap: 10px; margin-bottom: 20px;">
          <div style="flex: 1; position: relative;">
            <input
              type="text"
              id="userSearchInput"
              placeholder="Search by email or user ID..."
              style="width: 100%; padding: 12px 16px; padding-left: 40px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 16px;"
            />
            <span style="position: absolute; left: 12px; top: 12px; font-size: 18px;">🔍</span>
          </div>
          <button
            id="searchButton"
            style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"
          >
            Search
          </button>
        </div>

        <div id="searchResults"></div>
      </div>
    `;
  }

  attachEventListeners() {
    const searchInput = document.getElementById('userSearchInput');
    const searchButton = document.getElementById('searchButton');

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });
    }

    if (searchButton) {
      searchButton.addEventListener('click', () => this.performSearch());
    }
  }

  async performSearch() {
    const searchInput = document.getElementById('userSearchInput');
    const query = searchInput.value.trim();

    if (!query || query.length < 2) {
      alert('Please enter at least 2 characters');
      return;
    }

    try {
      const auth = btoa(`${localStorage.getItem('adminUser')}:${localStorage.getItem('adminPass')}`);
      const response = await fetch(`/api/admin/users/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      const data = await response.json();
      this.searchResults = data.users || [];
      this.renderResults();
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed');
    }
  }

  renderResults() {
    const resultsContainer = document.getElementById('searchResults');
    
    if (this.searchResults.length === 0) {
      resultsContainer.innerHTML = `
        <div style="padding: 40px; text-align: center; background: #f5f5f5; border-radius: 8px; color: #666;">
          No users found
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = `
      <div style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="padding: 16px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Search Results (${this.searchResults.length})</h3>
        </div>
        ${this.searchResults.map(user => this.renderUserCard(user)).join('')}
      </div>
    `;

    // Attach click listeners
    document.querySelectorAll('.user-card').forEach((card, index) => {
      card.addEventListener('click', () => {
        if (this.onUserSelect) {
          this.onUserSelect(this.searchResults[index]);
        }
      });
    });
  }

  renderUserCard(user) {
    const isPremium = user.subscriptionTier && user.subscriptionTier !== 'free';
    const badgeColor = isPremium ? '#FFD700' : '#999';
    const badgeText = isPremium ? 'Premium' : 'Free';

    return `
      <div class="user-card" style="padding: 16px; border-bottom: 1px solid #e0e0e0; cursor: pointer; transition: background 0.2s;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 4px 0; font-weight: 600;">${user.name}</h4>
            <p style="margin: 0; font-size: 14px; color: #666;">${user.email}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #999;">ID: ${user.id}</p>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; padding: 4px 12px; background: ${badgeColor}; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">
              ${badgeText}
            </span>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">
              Joined: ${new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  setOnUserSelect(callback) {
    this.onUserSelect = callback;
  }
}

// Global function to open user search modal
window.openUserSearchModal = function(fileId, fileName) {
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'userSearchModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 30px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">Assign "${fileName}" to Premium User</h2>
        <button id="closeModal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
      </div>
      <div id="modalUserSearch"></div>
    </div>
  `;

  document.body.appendChild(modal);

  // Initialize user search in modal
  const userSearch = new AdminUserSearch('modalUserSearch');
  userSearch.setOnUserSelect(async (user) => {
    if (!user.subscriptionTier || user.subscriptionTier === 'free') {
      alert('This user must have a premium subscription to receive files.');
      return;
    }

    if (confirm(`Assign this file to ${user.name} (${user.email})?`)) {
      try {
        const auth = btoa(`${localStorage.getItem('adminUser')}:${localStorage.getItem('adminPass')}`);
        const response = await fetch('/api/admin/product-files/assign-file', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileId,
            userId: user.id
          })
        });

        if (response.ok) {
          alert('File assigned successfully!');
          document.body.removeChild(modal);
          location.reload(); // Refresh to show updated assignment
        } else {
          const error = await response.json();
          alert(`Assignment failed: ${error.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Assignment error:', error);
        alert('Assignment failed');
      }
    }
  });

  // Close modal
  document.getElementById('closeModal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
};

// Make it globally accessible
window.AdminUserSearch = AdminUserSearch;
