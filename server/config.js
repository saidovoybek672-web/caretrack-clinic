const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'caretrack-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  dataPath: path.join(__dirname, 'data', 'db.json'),
};
