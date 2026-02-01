# Data Directory

This directory stores application data in JSON format.

## Contents

- `files.json` - File metadata and references
- `messages.json` - User messages and communications
- `purchases.json` - Transaction and purchase records
- `scenarios.json` - Financial scenario data
- `subscriptions.json` - User subscription information
- `tokens.json` - Authentication tokens
- `user-analytics.json` - User behavior and analytics data
- `users.json` - User account information
- `share-links.json` - Shareable link tracking and analytics
- `product-files.json` - Product file metadata and assignments
- `user-file-access.json` - User file access permissions and tracking
- `content/` - Dynamic content files
- `uploads/` - Uploaded product files and folders (admin only)

## Important Notes

⚠️ **Security**: All JSON files in this directory contain sensitive user data and should NEVER be committed to version control.

⚠️ **Backups**: Regular backups of this directory should be maintained separately.

⚠️ **Permissions**: Ensure proper file permissions are set to restrict access to authorized processes only.

⚠️ **Admin Only**: Product file uploads and assignments are restricted to admin users only.

⚠️ **Premium Access**: Product files can only be assigned to registered premium users.

## New Features

### Share Links
- Generate shareable links for products, referrals, and content
- Track link clicks and expiration dates
- Set maximum usage limits
- Automatic redirect handling

### Product File Management
- Upload files and create folders for products
- Assign files individually to premium users
- Track file assignments and access permissions
- Support for expiring access grants
- Secure file storage with access control

### User Search
- Search users by email, ID, or name
- View user subscription status
- Quick access to premium users
- Integration with file assignment system

## Git Configuration

All `*.json` files and the `uploads/` directory in this directory are excluded from version control via `.gitignore`. Only this README file should be tracked.
