const express = require('express');
const router = express.Router();
const multer = require('multer');
const productFileService = require('../services/product-file-service');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload files (admin only)
router.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { productId } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const uploadedBy = req.adminUser || 'admin'; // From admin auth middleware
    const uploadedFiles = [];

    for (const file of files) {
      const productFile = await productFileService.uploadFile(
        productId,
        file,
        uploadedBy
      );
      uploadedFiles.push(productFile);
    }

    res.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Create folder (admin only)
router.post('/create-folder', async (req, res) => {
  try {
    const { productId, folderName, parentId } = req.body;

    if (!productId || !folderName) {
      return res.status(400).json({ error: 'Product ID and folder name are required' });
    }

    const createdBy = req.adminUser || 'admin';
    const folder = await productFileService.createFolder(
      productId,
      folderName,
      createdBy,
      parentId
    );

    res.json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Assign file to user (admin only)
router.post('/assign-file', async (req, res) => {
  try {
    const { fileId, userId, expiresInDays } = req.body;

    if (!fileId || !userId) {
      return res.status(400).json({ error: 'File ID and User ID are required' });
    }

    // Verify user is premium
    const usersPath = require('path').join(__dirname, '../data/users.json');
    const usersData = await fs.readFile(usersPath, 'utf-8');
    const users = JSON.parse(usersData);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscriptionTier || user.subscriptionTier === 'free') {
      return res.status(403).json({ error: 'User must have a premium subscription' });
    }

    const grantedBy = req.adminUser || 'admin';
    const access = await productFileService.assignFileToUser(
      fileId,
      userId,
      grantedBy,
      expiresInDays
    );

    res.json({
      success: true,
      message: 'File assigned successfully',
      access
    });
  } catch (error) {
    console.error('Assign file error:', error);
    res.status(500).json({ error: 'Failed to assign file' });
  }
});

// Remove file assignment (admin only)
router.delete('/assign-file', async (req, res) => {
  try {
    const { fileId, userId } = req.body;

    if (!fileId || !userId) {
      return res.status(400).json({ error: 'File ID and User ID are required' });
    }

    await productFileService.removeFileAssignment(fileId, userId);

    res.json({
      success: true,
      message: 'File assignment removed'
    });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

// Get product files (admin only)
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const files = await productFileService.getProductFiles(productId);

    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Get product files error:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

// Get user's accessible files (authenticated user)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const files = await productFileService.getUserAccessibleFiles(userId);

    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

// Delete file (admin only)
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    await productFileService.deleteFile(fileId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Download file (authenticated user with access)
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId || req.query.userId;

    const file = await productFileService.getFileById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user has access
    if (!file.assignedUsers.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fsSync = require('fs');
    if (!fsSync.existsSync(file.filepath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(file.filepath, file.originalName);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

module.exports = router;
