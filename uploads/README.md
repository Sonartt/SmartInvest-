# Uploads Directory

This directory stores user-uploaded files.

## Purpose

Stores various file uploads from users including:
- Profile images
- Document attachments
- Investment-related files
- User-submitted content

## Important Notes

⚠️ **Security**: 
- Validate all file uploads for type and size
- Scan uploaded files for malware
- Never execute uploaded files
- Implement proper access controls

⚠️ **Storage**:
- Files in this directory are excluded from version control
- Consider implementing cloud storage for production (AWS S3, Azure Blob, etc.)
- Implement file retention and cleanup policies

⚠️ **Permissions**:
- Web server should have write access
- Files should not be directly executable
- Implement proper file serving with security headers

## Git Configuration

All files except `.gitkeep` and this README are excluded from version control via `.gitignore`.
