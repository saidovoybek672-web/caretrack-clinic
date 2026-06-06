const express = require('express');
const { getDb, updateDb } = require('../services/dataStore');
const { authenticate } = require('../middleware/auth');
const { adminOnly, staffOnly } = require('../middleware/roles');

const router = express.Router();

const DEFAULT_CLINIC = {
  name: 'CareTrack Clinic',
  address: 'Toshkent sh., Mirzo Ulug\'bek tumani, Tibbiyot ko\'chasi 12',
  phone: '+998 71 200 00 00',
  emergencyPhone: '+998 71 200 00 99',
  email: 'info@caretrack.uz',
  hours: 'Dushanba–Juma: 08:00–20:00, Shanba: 09:00–15:00',
  description:
    'Ko\'p ixtisoslashgan xususiy tibbiy markaz — umumiy amaliyot, mutaxassis qabullari, diagnostika va favqulodda yordam.',
};

router.get('/', authenticate, staffOnly, async (req, res, next) => {
  try {
    const db = await getDb();
    res.json(db.clinic || DEFAULT_CLINIC);
  } catch (err) {
    next(err);
  }
});

router.put('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name, address, phone, emergencyPhone, email, hours, description } = req.body;
    let updated = null;
    await updateDb((db) => {
      db.clinic = {
        ...(db.clinic || DEFAULT_CLINIC),
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(emergencyPhone !== undefined && { emergencyPhone }),
        ...(email !== undefined && { email }),
        ...(hours !== undefined && { hours }),
        ...(description !== undefined && { description }),
      };
      updated = db.clinic;
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
