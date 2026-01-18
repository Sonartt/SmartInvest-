// Script to create a test user
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

// Create test user
const userEmail = 'user@smartinvest.com';
const userPassword = 'user123';

const users = readUsers();

// Check if user already exists
const existing = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());

if (existing) {
  console.log(`User ${userEmail} already exists.`);
} else {
  console.log(`Creating test user ${userEmail}...`);
  const hash = bcrypt.hashSync(userPassword, 10);
  const user = {
    email: userEmail.toLowerCase(),
    passwordHash: hash,
    role: 'user',
    createdAt: new Date().toISOString()
  };
  users.push(user);
  writeUsers(users);
  console.log(`✓ Test user created:
  Email: ${userEmail}
  Password: ${userPassword}`);
}
