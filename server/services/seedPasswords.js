/**
 * Run once to hash demo passwords: admin123, clinician123, reception123
 * node server/services/seedPasswords.js
 */
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const passwords = {
  admin: 'admin123',
  clinician: 'clinician123',
  reception: 'reception123',
};

async function main() {
  const dbPath = path.join(__dirname, '..', 'data', 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const map = { admin: 'admin', clinician: 'clinician', reception: 'reception' };
  for (const user of db.users) {
    const key = map[user.username];
    if (key) {
      user.passwordHash = await bcrypt.hash(passwords[key], 10);
    }
  }
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('Passwords hashed successfully.');
}

main().catch(console.error);
