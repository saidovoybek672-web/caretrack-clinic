const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, updateDb } = require('../services/dataStore');
const { authenticate } = require('../middleware/auth');
const {
  adminOnly,
  canViewPatients,
  canCreatePatients,
  canUpdatePatients,
} = require('../middleware/roles');

const router = express.Router();

function filterPatients(patients, query) {
  const q = (query.q || '').toLowerCase().trim();
  const doctorId = query.doctorId;
  return patients.filter((p) => {
    if (doctorId && p.doctorId !== doctorId) return false;
    if (q) {
      const hay = `${p.firstName} ${p.lastName} ${p.phone} ${p.email} ${p.address}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function enrichPatient(patient, db) {
  const doctor = db.doctors.find((d) => d.id === patient.doctorId) || null;
  const diagnoses = db.diagnoses.filter((dx) => dx.patientId === patient.id);
  return { ...patient, doctor, diagnoses };
}

router.get('/', authenticate, canViewPatients, async (req, res, next) => {
  try {
    const db = await getDb();
    const list = filterPatients(db.patients, req.query).map((p) => enrichPatient(p, db));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/profile', authenticate, canViewPatients, async (req, res, next) => {
  try {
    const db = await getDb();
    const patient = db.patients.find((p) => p.id === req.params.id);
    if (!patient) return res.status(404).json({ error: 'Bemor topilmadi' });
    res.json(enrichPatient(patient, db));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, canViewPatients, async (req, res, next) => {
  try {
    const db = await getDb();
    const patient = db.patients.find((p) => p.id === req.params.id);
    if (!patient) return res.status(404).json({ error: 'Bemor topilmadi' });
    res.json(enrichPatient(patient, db));
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, canCreatePatients, async (req, res, next) => {
  try {
    const { firstName, lastName, dateOfBirth, phone, email, address, doctorId } = req.body;
    if (!firstName || !lastName || !doctorId) {
      return res.status(400).json({ error: 'Ism, familiya va shifokor majburiy' });
    }
    const db = await getDb();
    if (!db.doctors.some((d) => d.id === doctorId)) {
      return res.status(400).json({ error: 'Shifokor mavjud emas' });
    }
    const patient = {
      id: `pat-${uuidv4().slice(0, 8)}`,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      doctorId,
    };
    await updateDb((db) => db.patients.push(patient));
    res.status(201).json(enrichPatient(patient, await getDb()));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, canUpdatePatients, async (req, res, next) => {
  try {
    let updated = null;
    await updateDb((db) => {
      const idx = db.patients.findIndex((p) => p.id === req.params.id);
      if (idx === -1) return;
      if (req.body.doctorId && !db.doctors.some((d) => d.id === req.body.doctorId)) return;
      db.patients[idx] = { ...db.patients[idx], ...req.body, id: req.params.id };
      updated = db.patients[idx];
    });
    if (!updated) return res.status(404).json({ error: 'Bemor topilmadi' });
    res.json(enrichPatient(updated, await getDb()));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    let removed = false;
    await updateDb((db) => {
      const before = db.patients.length;
      db.patients = db.patients.filter((p) => p.id !== req.params.id);
      db.diagnoses = db.diagnoses.filter((dx) => dx.patientId !== req.params.id);
      removed = db.patients.length < before;
    });
    if (!removed) return res.status(404).json({ error: 'Bemor topilmadi' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
