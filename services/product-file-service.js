const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PRODUCT_FILES_FILE = path.join(__dirname, '../data/product-files.json');
const USER_FILE_ACCESS_FILE = path.join(__dirname, '../data/user-file-access.json');
const UPLOADS_DIR = path.join(__dirname, '../data/uploads');

class ProductFileService {
  constructor() {
    this.ensureUploadsDir();
  }

  async ensureUploadsDir() {
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }
  }

  async loadFiles() {
    try {
      const data = await fs.readFile(PRODUCT_FILES_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async saveFiles(files) {
    await fs.writeFile(PRODUCT_FILES_FILE, JSON.stringify(files, null, 2));
  }

  async loadFileAccess() {
    try {
      const data = await fs.readFile(USER_FILE_ACCESS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async saveFileAccess(accesses) {
    await fs.writeFile(USER_FILE_ACCESS_FILE, JSON.stringify(accesses, null, 2));
  }

  async uploadFile(productId, file, uploadedBy, parentId = null) {
    const files = await this.loadFiles();
    const fileId = uuidv4();
    const filename = `${fileId}-${file.originalname}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Save file to disk
    await fs.writeFile(filepath, file.buffer);

    const productFile = {
      id: fileId,
      productId,
      filename,
      originalName: file.originalname,
      filepath: filepath.replace(/\\/g, '/'),
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      assignedUsers: [],
      isFolder: false,
      parentId
    };

    files.push(productFile);
    await this.saveFiles(files);
    return productFile;
  }

  async createFolder(productId, folderName, createdBy, parentId = null) {
    const files = await this.loadFiles();
    const folderId = uuidv4();

    const folder = {
      id: folderId,
      productId,
      filename: folderName,
      originalName: folderName,
      filepath: '',
      fileType: 'folder',
      fileSize: 0,
      uploadedBy: createdBy,
      uploadedAt: new Date().toISOString(),
      assignedUsers: [],
      isFolder: true,
      parentId
    };

    files.push(folder);
    await this.saveFiles(files);
    return folder;
  }

  async assignFileToUser(fileId, userId, grantedBy, expiresInDays = null) {
    const files = await this.loadFiles();
    const file = files.find(f => f.id === fileId);

    if (!file) {
      throw new Error('File not found');
    }

    if (!file.assignedUsers.includes(userId)) {
      file.assignedUsers.push(userId);
      await this.saveFiles(files);
    }

    // Track the access grant
    const accesses = await this.loadFileAccess();
    const access = {
      id: uuidv4(),
      userId,
      fileId,
      grantedBy,
      grantedAt: new Date().toISOString(),
      expiresAt: expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null
    };

    accesses.push(access);
    await this.saveFileAccess(accesses);
    
    return access;
  }

  async removeFileAssignment(fileId, userId) {
    const files = await this.loadFiles();
    const file = files.find(f => f.id === fileId);

    if (file) {
      file.assignedUsers = file.assignedUsers.filter(id => id !== userId);
      await this.saveFiles(files);
    }

    // Remove access records
    const accesses = await this.loadFileAccess();
    const filteredAccesses = accesses.filter(
      a => !(a.fileId === fileId && a.userId === userId)
    );
    await this.saveFileAccess(filteredAccesses);
  }

  async getProductFiles(productId) {
    const files = await this.loadFiles();
    return files.filter(f => f.productId === productId);
  }

  async getUserAccessibleFiles(userId) {
    const files = await this.loadFiles();
    const accesses = await this.loadFileAccess();
    
    // Get active accesses (not expired)
    const activeAccesses = accesses.filter(a => {
      if (a.userId !== userId) return false;
      if (!a.expiresAt) return true;
      return new Date(a.expiresAt) > new Date();
    });

    const accessibleFileIds = activeAccesses.map(a => a.fileId);
    return files.filter(f => accessibleFileIds.includes(f.id));
  }

  async deleteFile(fileId) {
    const files = await this.loadFiles();
    const fileIndex = files.findIndex(f => f.id === fileId);

    if (fileIndex !== -1) {
      const file = files[fileIndex];
      
      // Delete physical file if not a folder
      if (!file.isFolder && fsSync.existsSync(file.filepath)) {
        try {
          await fs.unlink(file.filepath);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }

      files.splice(fileIndex, 1);
      await this.saveFiles(files);

      // Clean up access records
      const accesses = await this.loadFileAccess();
      const filteredAccesses = accesses.filter(a => a.fileId !== fileId);
      await this.saveFileAccess(filteredAccesses);
    }
  }

  async getFileById(fileId) {
    const files = await this.loadFiles();
    return files.find(f => f.id === fileId);
  }
}

module.exports = new ProductFileService();
