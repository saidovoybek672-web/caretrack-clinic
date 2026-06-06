const express = require('express');
const { getDb } = require('../services/dataStore');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    res.json(db.services || []);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
