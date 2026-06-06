const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../services/dataStore');
const config = require('../config');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Login va parol kiritilishi shart' });
    }
    const db = await getDb();
    const user = db.users.find((u) => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, name: user.name },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
