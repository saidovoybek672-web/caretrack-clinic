const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, updateDb } = require('../services/dataStore');
const { authenticate } = require('../middleware/auth');
const { adminOnly, canManageDiagnoses } = require('../middleware/roles');

const router = express.Router();

const SEVERITIES = ['mild', 'moderate', 'severe'];

function filterDiagnoses(list, query) {
  const q = (query.q || '').toLowerCase().trim();
  const patientId = query.patientId;
  const severity = (query.severity || '').toLowerCase();
  const icd = (query.icdCode || '').toLowerCase();
  return list.filter((dx) => {
    if (patientId && dx.patientId !== patientId) return false;
    if (severity && dx.severity !== severity) return false;
    if (icd && !(dx.icdCode || '').toLowerCase().includes(icd)) return false;
    if (q) {
      const hay = `${dx.icdCode} ${dx.description} ${dx.severity}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

router.get('/', authenticate, canManageDiagnoses, async (req, res, next) => {
  try {
    const db = await getDb();
    const list = filterDiagnoses(db.diagnoses, req.query).map((dx) => {
      const patient = db.patients.find((p) => p.id === dx.patientId);
      return { ...dx, patient: patient ? { id: patient.id, firstName: patient.firstName, lastName: patient.lastName } : null };
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, canManageDiagnoses, async (req, res, next) => {
  try {
    const db = await getDb();
    const dx = db.diagnoses.find((d) => d.id === req.params.id);
    if (!dx) return res.status(404).json({ error: 'Tashxis topilmadi' });
    const patient = db.patients.find((p) => p.id === dx.patientId);
    res.json({ ...dx, patient });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, canManageDiagnoses, async (req, res, next) => {
  try {
    const { icdCode, description, severity, patientId } = req.body;
    if (!icdCode || !description || !patientId) {
      return res.status(400).json({ error: 'ICD kodi, tavsif va bemor majburiy' });
    }
    const sev = severity || 'mild';
    if (!SEVERITIES.includes(sev)) {
      return res.status(400).json({ error: `Og'irlik: ${SEVERITIES.join(', ')}` });
    }
    const db = await getDb();
    if (!db.patients.some((p) => p.id === patientId)) {
      return res.status(400).json({ error: 'Bemor mavjud emas' });
    }
    const diagnosis = {
      id: `dx-${uuidv4().slice(0, 8)}`,
      icdCode,
      description,
      severity: sev,
      patientId,
    };
    await updateDb((db) => db.diagnoses.push(diagnosis));
    res.status(201).json(diagnosis);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, canManageDiagnoses, async (req, res, next) => {
  try {
    if (req.body.severity && !SEVERITIES.includes(req.body.severity)) {
      return res.status(400).json({ error: `Og'irlik: ${SEVERITIES.join(', ')}` });
    }
    let updated = null;
    await updateDb((db) => {
      const idx = db.diagnoses.findIndex((d) => d.id === req.params.id);
      if (idx === -1) return;
      db.diagnoses[idx] = { ...db.diagnoses[idx], ...req.body, id: req.params.id };
      updated = db.diagnoses[idx];
    });
    if (!updated) return res.status(404).json({ error: 'Tashxis topilmadi' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    let removed = false;
    await updateDb((db) => {
      const before = db.diagnoses.length;
      db.diagnoses = db.diagnoses.filter((d) => d.id !== req.params.id);
      removed = db.diagnoses.length < before;
    });
    if (!removed) return res.status(404).json({ error: 'Tashxis topilmadi' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
