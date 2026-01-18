// Script to create an admin user
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const USERS_FILE = './data/users.json';

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeUsers(users) {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Create admin user
const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartinvest.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

const users = readUsers();

// Check if admin already exists
const existing = users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase());

if (existing) {
  console.log(`Admin user ${adminEmail} already exists. Updating role to admin...`);
  existing.role = 'admin';
  writeUsers(users);
} else {
  console.log(`Creating admin user ${adminEmail}...`);
  const hash = bcrypt.hashSync(adminPassword, 10);
  const user = {
    email: adminEmail.toLowerCase(),
    passwordHash: hash,
    role: 'admin',
    createdAt: new Date().toISOString()
  };
  users.push(user);
  writeUsers(users);
}

console.log(`✓ Admin user ready:
  Email: ${adminEmail}
  Password: ${adminPassword}
  
Please change the password after first login in production!`);
