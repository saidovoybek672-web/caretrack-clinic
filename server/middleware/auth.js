const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autentifikatsiya talab qilinadi' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Yaroqsiz yoki muddati o\'tgan token' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, config.jwtSecret);
  } catch {
    /* ignore */
  }
  next();
}

module.exports = { authenticate, optionalAuth };
