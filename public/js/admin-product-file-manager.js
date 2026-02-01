// Admin Product File Manager Component
class AdminProductFileManager {
  constructor(containerId, productId) {
    this.container = document.getElementById(containerId);
    this.productId = productId;
    this.files = [];
    this.init();
  }

  async init() {
    await this.loadFiles();
    this.render();
    this.attachEventListeners();
  }

  async loadFiles() {
    try {
      const auth = btoa(`${localStorage.getItem('adminUser')}:${localStorage.getItem('adminPass')}`);
      const response = await fetch(`/api/admin/product-files/product/${this.productId}`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      const data = await response.json();
      this.files = data.files || [];
    } catch (error) {
      console.error('Failed to load files:', error);
      this.files = [];
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="product-file-manager">
        <div class="file-upload-controls" style="margin-bottom: 20px; display: flex; gap: 10px;">
          <label class="btn-upload" style="flex: 1; cursor: pointer;">
            <input type="file" id="fileInput" multiple style="display: none;">
            <span style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; background: #4CAF50; color: white; border-radius: 6px;">
              📤 Upload Files
            </span>
          </label>
          <button id="createFolderBtn" style="padding: 12px 24px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer;">
            📁 New Folder
          </button>
        </div>

        <div id="uploadProgress" style="display: none; margin-bottom: 15px;">
          <div style="background: #f0f0f0; border-radius: 4px; overflow: hidden;">
            <div id="progressBar" style="height: 8px; background: #4CAF50; width: 0%; transition: width 0.3s;"></div>
          </div>
          <p id="progressText" style="margin-top: 5px; font-size: 14px; color: #666;"></p>
        </div>

        <div class="files-list" style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${this.files.length === 0 ? `
            <div style="padding: 40px; text-align: center; color: #999;">
              <p style="font-size: 18px; margin-bottom: 10px;">📦</p>
              <p>No files uploaded yet</p>
            </div>
          ` : `
            <div style="divide-y divide-gray-200;">
              ${this.files.map(file => this.renderFileItem(file)).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  renderFileItem(file) {
    const icon = file.isFolder ? '📁' : '📄';
    const size = file.isFolder ? '' : this.formatFileSize(file.fileSize);
    const date = new Date(file.uploadedAt).toLocaleDateString();
    const assignedCount = file.assignedUsers.length;

    return `
      <div class="file-item" data-file-id="${file.id}" style="padding: 16px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; transition: background 0.2s;">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <span style="font-size: 24px;">${icon}</span>
          <div>
            <h4 style="margin: 0 0 4px 0; font-weight: 600;">${file.originalName}</h4>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${size ? size + ' • ' : ''}${date}
              ${assignedCount > 0 ? ` • <span style="color: #4CAF50;">Assigned to ${assignedCount} user(s)</span>` : ''}
            </p>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-assign" data-file-id="${file.id}" style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
            📤 Assign
          </button>
          <button class="btn-delete" data-file-id="${file.id}" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  attachEventListeners() {
    // File upload
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // Create folder
    const createFolderBtn = document.getElementById('createFolderBtn');
    if (createFolderBtn) {
      createFolderBtn.addEventListener('click', () => this.handleCreateFolder());
    }

    // Assign buttons
    document.querySelectorAll('.btn-assign').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileId = e.target.dataset.fileId;
        this.handleAssignFile(fileId);
      });
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileId = e.target.dataset.fileId;
        this.handleDeleteFile(fileId);
      });
    });
  }

  async handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('productId', this.productId);

    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    uploadProgress.style.display = 'block';
    progressText.textContent = 'Uploading...';

    try {
      const auth = btoa(`${localStorage.getItem('adminUser')}:${localStorage.getItem('adminPass')}`);
      const response = await fetch('/api/admin/product-files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`
        },
        body: formData
      });

      if (response.ok) {
        progressBar.style.width = '100%';
        progressText.textContent = 'Upload complete!';
        setTimeout(async () => {
          uploadProgress.style.display = 'none';
          progressBar.style.width = '0%';
          await this.loadFiles();
          this.render();
          this.attachEventListeners();
        }, 1000);
      } else {
        alert('Upload failed');
        uploadProgress.style.display = 'none';
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
      uploadProgress.style.display = 'none';
    }

    event.target.value = '';
  }

  async handleCreateFolder() {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      const auth = btoa(`${localStorage.getItem('adminUser')}:${localStorage.getItem('adminPass')}`);
      const response = await fetch('/api/admin/product-files/create-folder', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: this.productId,
          folderName
        })
      });

      if (response.ok) {
        await this.loadFiles();
        this.render();
        this.attachEventListeners();
      } else {
        alert('Failed to create folder');
      }
    } catch (error) {
      console.error('Create folder error:', error);
      alert('Failed to create folder');
    }
  }

  handleAssignFile(fileId) {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return;

    // Open user search modal
    window.openUserSearchModal(fileId, file.originalName);
  }

  async handleDeleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const auth = btoa(`${localStorage.getItem('adminUser')}:${localStorage.getItem('adminPass')}`);
      const response = await fetch(`/api/admin/product-files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (response.ok) {
        await this.loadFiles();
        this.render();
        this.attachEventListeners();
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  }
}

// Make it globally accessible
window.AdminProductFileManager = AdminProductFileManager;
