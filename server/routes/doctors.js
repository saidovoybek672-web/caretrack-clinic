const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, updateDb } = require('../services/dataStore');
const { authenticate } = require('../middleware/auth');
const { adminOnly, staffOnly } = require('../middleware/roles');

const router = express.Router();

function filterDoctors(doctors, query) {
  const q = (query.q || '').toLowerCase().trim();
  const department = (query.department || '').toLowerCase().trim();
  const specialty = (query.specialty || '').toLowerCase().trim();
  return doctors.filter((d) => {
    if (department && !(d.department || '').toLowerCase().includes(department)) return false;
    if (specialty && !(d.specialty || '').toLowerCase().includes(specialty)) return false;
    if (q) {
      const hay = `${d.name} ${d.specialty} ${d.department} ${d.contact}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const list = filterDoctors(db.doctors, req.query);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const doctor = db.doctors.find((d) => d.id === req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Shifokor topilmadi' });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name, specialty, department, contact, image } = req.body;
    if (!name || !specialty || !department) {
      return res.status(400).json({ error: 'Ism, mutaxassislik va bo\'lim majburiy' });
    }
    const doctor = {
      id: `doc-${uuidv4().slice(0, 8)}`,
      name,
      specialty,
      department,
      contact: contact || '',
      image: image || '',
    };
    await updateDb((db) => db.doctors.push(doctor));
    res.status(201).json(doctor);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    let updated = null;
    await updateDb((db) => {
      const idx = db.doctors.findIndex((d) => d.id === req.params.id);
      if (idx === -1) return;
      db.doctors[idx] = { ...db.doctors[idx], ...req.body, id: req.params.id };
      updated = db.doctors[idx];
    });
    if (!updated) return res.status(404).json({ error: 'Shifokor topilmadi' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const db = await getDb();
    const hasPatients = db.patients.some((p) => p.doctorId === req.params.id);
    if (hasPatients) {
      return res.status(400).json({ error: 'Bemorlari bor shifokorni o\'chirib bo\'lmaydi' });
    }
    let removed = false;
    await updateDb((db) => {
      const before = db.doctors.length;
      db.doctors = db.doctors.filter((d) => d.id !== req.params.id);
      removed = db.doctors.length < before;
    });
    if (!removed) return res.status(404).json({ error: 'Shifokor topilmadi' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
