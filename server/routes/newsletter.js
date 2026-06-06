const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { updateDb } = require('../services/dataStore');

const router = express.Router();

router.post('/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Yaroqli email kiriting' });
    }
    let duplicate = false;
    await updateDb((db) => {
      if (!db.newsletters) db.newsletters = [];
      if (db.newsletters.some((n) => n.email === email.toLowerCase())) {
        duplicate = true;
        return;
      }
      db.newsletters.push({
        id: uuidv4(),
        email: email.toLowerCase(),
        subscribedAt: new Date().toISOString(),
      });
    });
    if (duplicate) {
      return res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }
    res.status(201).json({ message: 'Muvaffaqiyatli obuna bo\'ldingiz' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
