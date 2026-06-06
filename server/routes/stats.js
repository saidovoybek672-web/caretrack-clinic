const express = require('express');
const { getDb } = require('../services/dataStore');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/public', async (req, res, next) => {
  try {
    const db = await getDb();
    res.json({
      patientsCount: db.patients.length,
      doctorsCount: db.doctors.length,
      departments: [...new Set(db.doctors.map((d) => d.department))],
    });
  } catch (err) {
    next(err);
  }
});

router.get('/severity', authenticate, async (req, res, next) => {
  try {
    const db = await getDb();
    const counts = { mild: 0, moderate: 0, severe: 0 };
    db.diagnoses.forEach((dx) => {
      if (counts[dx.severity] !== undefined) counts[dx.severity] += 1;
    });
    res.json({ counts, total: db.diagnoses.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
