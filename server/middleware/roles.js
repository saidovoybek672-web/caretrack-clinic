const ROLES = {
  ADMIN: 'administrator',
  CLINICIAN: 'clinician',
  RECEPTIONIST: 'receptionist',
};

function requireRoles(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Kirish talab qilinadi' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Ushbu amal uchun ruxsat yo\'q' });
    }
    next();
  };
}

const adminOnly = requireRoles(ROLES.ADMIN);
const staffOnly = requireRoles(ROLES.ADMIN, ROLES.CLINICIAN, ROLES.RECEPTIONIST);
const canViewPatients = staffOnly;
const canCreatePatients = requireRoles(ROLES.ADMIN, ROLES.RECEPTIONIST);
const canUpdatePatients = requireRoles(ROLES.ADMIN, ROLES.CLINICIAN);
const canManageDiagnoses = requireRoles(ROLES.ADMIN, ROLES.CLINICIAN);

module.exports = {
  ROLES,
  requireRoles,
  adminOnly,
  staffOnly,
  canViewPatients,
  canCreatePatients,
  canUpdatePatients,
  canManageDiagnoses,
};
