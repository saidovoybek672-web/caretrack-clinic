const { token, user } = readSession();
if (!token || !user) {
  clearSession();
  window.location.href = '/login';
}

const DEFAULT_DOCTOR_IMG = '/images/avatars/default-doctor.svg';
const statusCharts = {};
let severityCounts = { mild: 0, moderate: 0, severe: 0 };

const isAdmin = user.role === 'administrator';
const isClinician = user.role === 'clinician';
const isReceptionist = user.role === 'receptionist';

const canManageDoctors = isAdmin;
const canRegisterPatients = isAdmin || isReceptionist;
const canViewPatients = isAdmin || isClinician || isReceptionist;
const canEditPatients = isAdmin || isClinician;
const canDeletePatients = isAdmin;
const canManageDiagnoses = isAdmin || isClinician;
const canDeleteDiagnoses = isAdmin;
const canEditClinic = isAdmin;

const ROLE_PERM_KEYS = {
  administrator: ['permAdmin1', 'permAdmin2', 'permAdmin3', 'permAdmin4', 'permAdmin5'],
  clinician: ['permClin1', 'permClin2', 'permClin3', 'permClin4'],
  receptionist: ['permRecep1', 'permRecep2', 'permRecep3', 'permRecep4'],
};

let currentProfileData = null;

function roleLabel(role) {
  const map = {
    administrator: t('roleAdmin'),
    clinician: t('roleClinician'),
    receptionist: t('roleReception'),
  };
  return map[role] || role;
}

function severityLabels() {
  return [t('severityMild'), t('severityModerate'), t('severitySevere')];
}

function severityBadge(sev) {
  const labels = { mild: t('severityMild'), moderate: t('severityModerate'), severe: t('severitySevere') };
  return `<span class="severity-badge severity-${sev}">${labels[sev] || sev}</span>`;
}

function renderPatientStatusChart(canvasId, counts) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  const values = [counts.mild, counts.moderate, counts.severe];
  const total = values.reduce((a, b) => a + b, 0);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#e2e8f0' : '#334155';

  if (statusCharts[canvasId]) {
    statusCharts[canvasId].destroy();
    delete statusCharts[canvasId];
  }

  statusCharts[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: severityLabels(),
      datasets: [{
        data: total ? values : [1, 0, 0],
        backgroundColor: total ? ['#22c55e', '#f59e0b', '#ef4444'] : ['#cbd5e1', '#cbd5e1', '#cbd5e1'],
        borderWidth: 2,
        borderColor: isDark ? '#1e293b' : '#ffffff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor, padding: 14, font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label(ctx) {
              if (!total) return t('chartNoData');
              const pct = Math.round((ctx.raw / total) * 100);
              return `${ctx.label}: ${ctx.raw} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

function renderRolePermissions() {
  const list = document.getElementById('role-permissions-list');
  if (!list) return;
  const keys = ROLE_PERM_KEYS[user.role] || [];
  list.innerHTML = keys.map((k) => `<li>${t(k)}</li>`).join('');
}

function applyRolePermissions() {
  const badge = document.getElementById('role-badge');
  if (badge) {
    badge.className = 'role-badge';
    if (isAdmin) badge.classList.add('role-badge--admin');
    else if (isClinician) badge.classList.add('role-badge--clinician');
    else if (isReceptionist) badge.classList.add('role-badge--reception');
  }

  document.getElementById('btn-add-doctor')?.classList.toggle('hidden', !canManageDoctors);
  document.getElementById('btn-add-diagnosis')?.classList.toggle('hidden', !canManageDiagnoses);
  document.getElementById('btn-add-patient')?.classList.toggle('hidden', !canRegisterPatients);
  document.getElementById('btn-edit-clinic')?.classList.toggle('hidden', !canEditClinic);
  document.getElementById('btn-print-report')?.classList.toggle('hidden', !canViewPatients);

  document.getElementById('nav-diagnoses')?.classList.toggle('hidden', isReceptionist);
  document.getElementById('mobile-nav-diagnoses')?.classList.toggle('hidden', isReceptionist);
  document.getElementById('stat-diagnoses-card')?.classList.toggle('hidden', isReceptionist);

  document.querySelectorAll('.panel-chart-section').forEach((el) => {
    el.classList.toggle('hidden', isReceptionist);
  });

  const doctorsHint = document.getElementById('doctors-role-hint');
  if (doctorsHint) {
    doctorsHint.textContent = canManageDoctors ? t('hintDoctorsAdmin') : t('hintDoctorsView');
  }
  const patientsHint = document.getElementById('patients-role-hint');
  if (patientsHint) {
    if (isReceptionist) patientsHint.textContent = t('hintPatientsRecep');
    else if (isClinician) patientsHint.textContent = t('hintPatientsClin');
    else patientsHint.textContent = t('hintPatientsAdmin');
  }
}

function refreshDashboardLocale() {
  applyI18n();
  document.getElementById('user-greeting').textContent = `${t('greeting')}, ${user.name}`;
  document.getElementById('role-badge').textContent = roleLabel(user.role);
  const overviewKeys = {
    administrator: 'dashOverviewAdmin',
    clinician: 'dashOverviewClinician',
    receptionist: 'dashOverviewReception',
  };
  const key = overviewKeys[user.role];
  if (key) document.getElementById('overview-text').textContent = t(key);
  renderRolePermissions();
  applyRolePermissions();
  renderPatientStatusChart('overview-status-chart', severityCounts);
  renderPatientStatusChart('patients-status-chart', severityCounts);
  renderPatientStatusChart('diagnoses-status-chart', severityCounts);
}

applyRolePermissions();
refreshDashboardLocale();
window.addEventListener('caretrack:langchange', refreshDashboardLocale);
window.addEventListener('caretrack:themechange', refreshDashboardLocale);

function logout() {
  clearSession();
  window.location.href = '/login';
}

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('dash-mobile-logout')?.addEventListener('click', logout);

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function showTab(name) {
  ['overview', 'doctors', 'patients', 'diagnoses', 'profile'].forEach((tab) => {
    const el = document.getElementById(`tab-${tab}`);
    if (el) el.classList.toggle('hidden', tab !== name);
  });
  document.querySelectorAll('.sidebar nav a, .dash-mobile-nav a').forEach((a) => {
    const tab = a.dataset.tab;
    if (!tab) return;
    a.classList.toggle('active', tab === name && name !== 'profile');
  });
}

function onNavClick(e) {
  e.preventDefault();
  const a = e.currentTarget;
  if (a.classList.contains('hidden')) return;
  const tab = a.dataset.tab;
  if (!tab) return;
  showTab(tab);
  if (tab === 'doctors') loadDoctors();
  if (tab === 'patients') loadPatients();
  if (tab === 'diagnoses') loadDiagnoses();
}

document.querySelectorAll('.sidebar nav a, .dash-mobile-nav a').forEach((a) => {
  a.addEventListener('click', onNavClick);
});

document.getElementById('back-from-profile').addEventListener('click', () => showTab('patients'));

const modal = document.getElementById('modal');
document.getElementById('modal-cancel').addEventListener('click', () => modal.classList.remove('open'));

function openModal(title, fieldsHtml, onSubmit) {
  document.getElementById('modal-title').textContent = title;
  const form = document.getElementById('modal-form');
  form.innerHTML = fieldsHtml;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    await onSubmit(data);
    modal.classList.remove('open');
  };
  modal.classList.add('open');
}

async function loadSeverityStats() {
  try {
    const { data } = await StatsAPI.severity();
    severityCounts = data.counts || { mild: 0, moderate: 0, severe: 0 };
  } catch {
    severityCounts = { mild: 0, moderate: 0, severe: 0 };
  }
}

async function loadClinicInfo() {
  try {
    const { data } = await ClinicAPI.get();
    const el = document.getElementById('clinic-info-body');
    if (!el) return;
    el.innerHTML = `
      <p><strong>${data.name}</strong></p>
      <p>${data.description || ''}</p>
      <ul class="clinic-info-list">
        <li><span>📍</span> ${data.address || '—'}</li>
        <li><span>📞</span> ${data.phone || '—'}</li>
        <li><span>🚨</span> ${t('clinicEmergency')}: ${data.emergencyPhone || '—'}</li>
        <li><span>✉️</span> ${data.email || '—'}</li>
        <li><span>🕐</span> ${data.hours || '—'}</li>
      </ul>`;
  } catch { /* ignore */ }
}

function clinicFormFields(c = {}) {
  return `
    <div class="form-group"><label>${t('clinicName')}</label><input name="name" required value="${c.name || ''}" /></div>
    <div class="form-group"><label>${t('clinicAddress')}</label><input name="address" value="${c.address || ''}" /></div>
    <div class="form-group"><label>${t('clinicPhone')}</label><input name="phone" value="${c.phone || ''}" /></div>
    <div class="form-group"><label>${t('clinicEmergency')}</label><input name="emergencyPhone" value="${c.emergencyPhone || ''}" /></div>
    <div class="form-group"><label>Email</label><input name="email" type="email" value="${c.email || ''}" /></div>
    <div class="form-group"><label>${t('clinicHours')}</label><input name="hours" value="${c.hours || ''}" /></div>
    <div class="form-group"><label>${t('clinicDesc')}</label><textarea name="description" rows="3">${c.description || ''}</textarea></div>`;
}

document.getElementById('btn-edit-clinic')?.addEventListener('click', async () => {
  const { data } = await ClinicAPI.get();
  openModal(t('clinicEdit'), clinicFormFields(data), async (formData) => {
    await ClinicAPI.update(formData);
    toast('Saqlandi');
    loadClinicInfo();
  });
});

async function loadOverview() {
  refreshDashboardLocale();
  loadClinicInfo();
  try {
    const [patients, doctors, severity] = await Promise.all([
      PatientsAPI.list().catch(() => ({ data: [] })),
      DoctorsAPI.list(),
      canManageDiagnoses
        ? StatsAPI.severity().catch(() => ({ data: { counts: { mild: 0, moderate: 0, severe: 0 }, total: 0 } }))
        : Promise.resolve({ data: { counts: { mild: 0, moderate: 0, severe: 0 }, total: 0 } }),
    ]);
    severityCounts = severity.data?.counts || { mild: 0, moderate: 0, severe: 0 };
    document.getElementById('dash-patients').textContent = patients.data?.length ?? 0;
    document.getElementById('dash-doctors').textContent = doctors.data?.length ?? 0;
    document.getElementById('dash-diagnoses').textContent = severity.data?.total ?? 0;
    renderPatientStatusChart('overview-status-chart', severityCounts);
    renderPatientStatusChart('patients-status-chart', severityCounts);
    renderPatientStatusChart('diagnoses-status-chart', severityCounts);
  } catch { /* ignore */ }
}

function doctorImageUrl(d) {
  return d.image || DEFAULT_DOCTOR_IMG;
}

function renderDoctorCards(doctors) {
  const grid = document.getElementById('doctor-cards');
  if (!grid) return;
  grid.innerHTML = doctors.length
    ? doctors.map((d) => `
    <article class="doctor-card">
      <img src="${doctorImageUrl(d)}" alt="${d.name}" loading="lazy" />
      <div class="doctor-card-info">
        <strong>${d.name}</strong>
        <span>${d.specialty}</span>
        <small>${d.department}</small>
      </div>
    </article>`).join('')
    : `<p class="empty-hint">${t('noDoctors')}</p>`;
}

async function loadDoctors() {
  const q = document.getElementById('filter-doctors')?.value || '';
  const department = document.getElementById('filter-doctor-department')?.value || '';
  const { data } = await DoctorsAPI.list({ q, department });
  renderDoctorCards(data);
  const tbody = document.getElementById('doctors-tbody');
  tbody.innerHTML = data.map((d) => `
    <tr>
      <td class="cell-with-avatar">
        <img class="table-avatar" src="${doctorImageUrl(d)}" alt="" />
        ${d.name}
      </td>
      <td>${d.specialty}</td>
      <td>${d.department}</td>
      <td>${d.contact}</td>
      <td class="actions">
        ${canManageDoctors
          ? `<button class="btn btn-ghost" data-edit-doctor="${d.id}">Tahrir</button>
             <button class="btn btn-ghost" data-del-doctor="${d.id}">O'chirish</button>`
          : '<span class="read-only-tag">Ko\'rish</span>'}
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-edit-doctor]').forEach((btn) => {
    btn.addEventListener('click', () => editDoctor(btn.dataset.editDoctor, data));
  });
  tbody.querySelectorAll('[data-del-doctor]').forEach((btn) => {
    btn.addEventListener('click', () => deleteDoctor(btn.dataset.delDoctor));
  });
}

function doctorFormFields(d = {}) {
  return `
    <div class="form-group"><label>Ism</label><input name="name" required value="${d.name || ''}" /></div>
    <div class="form-group"><label>Mutaxassislik</label><input name="specialty" required value="${d.specialty || ''}" /></div>
    <div class="form-group"><label>Bo'lim</label><input name="department" required value="${d.department || ''}" /></div>
    <div class="form-group"><label>Aloqa</label><input name="contact" value="${d.contact || ''}" /></div>
    <div class="form-group"><label>Rasm URL</label><input name="image" value="${d.image || ''}" /></div>`;
}

function editDoctor(id, list) {
  openModal('Shifokorni tahrirlash', doctorFormFields(list.find((x) => x.id === id)), async (data) => {
    await DoctorsAPI.update(id, data);
    toast('Saqlandi');
    loadDoctors();
  });
}

async function deleteDoctor(id) {
  if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
  try {
    await DoctorsAPI.remove(id);
    toast('O\'chirildi');
    loadDoctors();
  } catch (e) {
    toast(e.response?.data?.error || 'Xatolik');
  }
}

document.getElementById('btn-add-doctor')?.addEventListener('click', () => {
  openModal('Yangi shifokor', doctorFormFields(), async (data) => {
    await DoctorsAPI.create(data);
    toast('Qo\'shildi');
    loadDoctors();
    loadOverview();
  });
});

document.getElementById('filter-doctors')?.addEventListener('input', () => loadDoctors());
document.getElementById('filter-doctor-department')?.addEventListener('change', () => loadDoctors());

async function loadDoctorOptions(selectEl) {
  const { data } = await DoctorsAPI.list();
  selectEl.innerHTML =
    '<option value="">Shifokor tanlang</option>' +
    data.map((d) => `<option value="${d.id}">${d.name} — ${d.department}</option>`).join('');
}

async function loadPatients() {
  if (canManageDiagnoses) {
    await loadSeverityStats();
    renderPatientStatusChart('patients-status-chart', severityCounts);
  }
  const q = document.getElementById('filter-patients')?.value || '';
  const doctorId = document.getElementById('filter-patient-doctor')?.value || '';
  const { data } = await PatientsAPI.list({ q, doctorId });
  document.getElementById('patients-tbody').innerHTML = data.map((p) => `
    <tr>
      <td><strong>${p.firstName} ${p.lastName}</strong></td>
      <td>${p.doctor?.name || '—'}</td>
      <td>${p.phone || '—'}</td>
      <td class="actions">
        <button class="btn btn-primary btn-sm" data-profile="${p.id}">Profil</button>
        ${canEditPatients ? `<button class="btn btn-ghost btn-sm" data-edit-patient="${p.id}">Tahrir</button>` : ''}
        ${canDeletePatients ? `<button class="btn btn-ghost btn-sm" data-del-patient="${p.id}">O'chirish</button>` : ''}
      </td>
    </tr>`).join('');

  const tbody = document.getElementById('patients-tbody');
  tbody.querySelectorAll('[data-profile]').forEach((btn) => {
    btn.addEventListener('click', () => showProfile(btn.dataset.profile));
  });
  tbody.querySelectorAll('[data-edit-patient]').forEach((btn) => {
    btn.addEventListener('click', () => editPatient(btn.dataset.editPatient, data));
  });
  tbody.querySelectorAll('[data-del-patient]').forEach((btn) => {
    btn.addEventListener('click', () => deletePatient(btn.dataset.delPatient));
  });
}

function patientFormFields(d = {}, doctorOptions = '') {
  return `
    <div class="form-group"><label>Ism</label><input name="firstName" required value="${d.firstName || ''}" /></div>
    <div class="form-group"><label>Familiya</label><input name="lastName" required value="${d.lastName || ''}" /></div>
    <div class="form-group"><label>Tug'ilgan sana</label><input name="dateOfBirth" type="date" value="${d.dateOfBirth || ''}" /></div>
    <div class="form-group"><label>Telefon</label><input name="phone" value="${d.phone || ''}" /></div>
    <div class="form-group"><label>Email</label><input name="email" type="email" value="${d.email || ''}" /></div>
    <div class="form-group"><label>Manzil</label><input name="address" value="${d.address || ''}" /></div>
    <div class="form-group"><label>Shifokor</label><select name="doctorId" required>${doctorOptions}</select></div>`;
}

async function editPatient(id, list) {
  const p = list.find((x) => x.id === id);
  const sel = document.createElement('select');
  await loadDoctorOptions(sel);
  const opts = sel.innerHTML.replace(`value="${p.doctorId}"`, `value="${p.doctorId}" selected`);
  openModal('Bemorni tahrirlash', patientFormFields(p, opts), async (data) => {
    await PatientsAPI.update(id, data);
    toast('Saqlandi');
    loadPatients();
  });
}

async function deletePatient(id) {
  if (!confirm('Bemor va bog\'liq tashxislarni o\'chirish?')) return;
  try {
    await PatientsAPI.remove(id);
    toast('O\'chirildi');
    loadPatients();
    loadOverview();
  } catch (e) {
    toast(e.response?.data?.error || 'Xatolik');
  }
}

document.getElementById('btn-add-patient').addEventListener('click', async () => {
  const sel = document.createElement('select');
  await loadDoctorOptions(sel);
  openModal('Yangi bemor', patientFormFields({}, sel.innerHTML), async (data) => {
    await PatientsAPI.create(data);
    toast('Ro\'yxatga olindi');
    loadPatients();
    loadOverview();
  });
});

document.getElementById('filter-patients')?.addEventListener('input', () => loadPatients());
document.getElementById('filter-patient-doctor')?.addEventListener('change', () => loadPatients());

function printDiagnosisReport(data) {
  const area = document.getElementById('print-report-area');
  if (!area) return;
  const rows = (data.diagnoses || [])
    .map((dx) => `<tr><td>${dx.icdCode}</td><td>${dx.description}</td><td>${dx.severity}</td></tr>`)
    .join('');
  area.innerHTML = `
    <div class="report-doc">
      <h1>${t('reportTitle')}</h1>
      <p><strong>${data.firstName} ${data.lastName}</strong> · ${data.dateOfBirth || ''}</p>
      <p>${t('labelDoctors')}: ${data.doctor?.name || '—'} (${data.doctor?.specialty || ''})</p>
      <table><thead><tr><th>ICD</th><th>${t('reportDesc')}</th><th>${t('reportSeverity')}</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="3">${t('chartNoData')}</td></tr>`}</tbody></table>
      <p class="report-footer">CareTrack Clinic · ${new Date().toLocaleDateString()}</p>
    </div>`;
  area.classList.remove('hidden');
  window.print();
  area.classList.add('hidden');
}

document.getElementById('btn-print-report')?.addEventListener('click', () => {
  if (currentProfileData) printDiagnosisReport(currentProfileData);
});

async function showProfile(id) {
  const { data } = await PatientsAPI.profile(id);
  currentProfileData = data;
  showTab('profile');
  document.getElementById('profile-name').textContent = `${data.firstName} ${data.lastName}`;
  const docImg = data.doctor?.image || DEFAULT_DOCTOR_IMG;
  document.getElementById('profile-content').innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${data.firstName[0]}${data.lastName[0]}</div>
      <div>
        <p><strong>${t('labelDoctors')}:</strong> ${data.doctor?.name || '—'}</p>
        <p class="text-muted">${data.doctor?.specialty || ''} · ${data.doctor?.department || ''}</p>
      </div>
      ${data.doctor ? `<img class="profile-doctor-img" src="${docImg}" alt="" />` : ''}
    </div>
    <div class="profile-details">
      <p><strong>Telefon:</strong> ${data.phone || '—'}</p>
      <p><strong>Email:</strong> ${data.email || '—'}</p>
      <p><strong>Manzil:</strong> ${data.address || '—'}</p>
      <p><strong>Tug'ilgan sana:</strong> ${data.dateOfBirth || '—'}</p>
    </div>
    <h3 class="profile-section-title">Tashxis tarixi</h3>
    ${data.diagnoses?.length
      ? `<table><thead><tr><th>ICD</th><th>Tavsif</th><th>Og'irlik</th></tr></thead><tbody>
        ${data.diagnoses.map((dx) =>
          `<tr><td>${dx.icdCode}</td><td>${dx.description}</td><td>${severityBadge(dx.severity)}</td></tr>`
        ).join('')}</tbody></table>`
      : `<p class="empty-hint">${t('chartNoData')}</p>`}`;
}

async function loadDiagnoses() {
  if (!canManageDiagnoses) return;
  await loadSeverityStats();
  renderPatientStatusChart('diagnoses-status-chart', severityCounts);
  const q = document.getElementById('filter-diagnoses')?.value || '';
  const severity = document.getElementById('filter-severity')?.value || '';
  const patientId = document.getElementById('filter-diagnosis-patient')?.value || '';
  const { data } = await DiagnosesAPI.list({ q, severity, patientId });
  document.getElementById('diagnoses-tbody').innerHTML = data.map((dx) => `
    <tr>
      <td><code class="icd-code">${dx.icdCode}</code></td>
      <td>${dx.description}</td>
      <td>${severityBadge(dx.severity)}</td>
      <td>${dx.patient ? `${dx.patient.firstName} ${dx.patient.lastName}` : '—'}</td>
      <td class="actions">
        ${canManageDiagnoses ? `<button class="btn btn-ghost btn-sm" data-edit-dx="${dx.id}">Tahrir</button>` : ''}
        ${canDeleteDiagnoses ? `<button class="btn btn-ghost btn-sm" data-del-dx="${dx.id}">O'chirish</button>` : ''}
      </td>
    </tr>`).join('');

  const tbody = document.getElementById('diagnoses-tbody');
  tbody.querySelectorAll('[data-edit-dx]').forEach((btn) => {
    btn.addEventListener('click', () => editDiagnosis(btn.dataset.editDx, data));
  });
  tbody.querySelectorAll('[data-del-dx]').forEach((btn) => {
    btn.addEventListener('click', () => deleteDiagnosis(btn.dataset.delDx));
  });
}

function diagnosisFormFields(d = {}, patientOptions = '') {
  return `
    <div class="form-group"><label>ICD kodi</label><input name="icdCode" required value="${d.icdCode || ''}" /></div>
    <div class="form-group"><label>Tavsif</label><textarea name="description" required rows="3">${d.description || ''}</textarea></div>
    <div class="form-group"><label>Og'irlik</label>
      <select name="severity">
        <option value="mild" ${d.severity === 'mild' ? 'selected' : ''}>${t('severityMild')}</option>
        <option value="moderate" ${d.severity === 'moderate' ? 'selected' : ''}>${t('severityModerate')}</option>
        <option value="severe" ${d.severity === 'severe' ? 'selected' : ''}>${t('severitySevere')}</option>
      </select>
    </div>
    <div class="form-group"><label>Bemor</label><select name="patientId" required>${patientOptions}</select></div>`;
}

async function editDiagnosis(id, list) {
  const dx = list.find((x) => x.id === id);
  const { data: patients } = await PatientsAPI.list();
  const opts = '<option value="">Tanlang</option>' +
    patients.map((p) =>
      `<option value="${p.id}" ${p.id === dx.patientId ? 'selected' : ''}>${p.firstName} ${p.lastName}</option>`
    ).join('');
  openModal('Tashxisni tahrirlash', diagnosisFormFields(dx, opts), async (data) => {
    await DiagnosesAPI.update(id, data);
    toast('Saqlandi');
    loadDiagnoses();
    loadOverview();
  });
}

async function deleteDiagnosis(id) {
  if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
  try {
    await DiagnosesAPI.remove(id);
    toast('O\'chirildi');
    loadDiagnoses();
    loadOverview();
  } catch (e) {
    toast(e.response?.data?.error || 'Xatolik');
  }
}

document.getElementById('btn-add-diagnosis')?.addEventListener('click', async () => {
  const { data: patients } = await PatientsAPI.list();
  const opts = '<option value="">Tanlang</option>' +
    patients.map((p) => `<option value="${p.id}">${p.firstName} ${p.lastName}</option>`).join('');
  openModal('Yangi tashxis', diagnosisFormFields({}, opts), async (data) => {
    await DiagnosesAPI.create(data);
    toast('Qo\'shildi');
    loadDiagnoses();
    loadOverview();
  });
});

document.getElementById('filter-diagnoses')?.addEventListener('input', () => loadDiagnoses());
document.getElementById('filter-severity')?.addEventListener('change', () => loadDiagnoses());
document.getElementById('filter-diagnosis-patient')?.addEventListener('change', () => loadDiagnoses());

(async function init() {
  try {
    const { data: doctors } = await DoctorsAPI.list();
    const docFilter = document.getElementById('filter-patient-doctor');
    if (docFilter) {
      docFilter.innerHTML =
        `<option value="">${t('filterAllDoctors')}</option>` +
        doctors.map((d) => `<option value="${d.id}">${d.name}</option>`).join('');
    }
    const deptFilter = document.getElementById('filter-doctor-department');
    if (deptFilter) {
      const depts = [...new Set(doctors.map((d) => d.department).filter(Boolean))];
      deptFilter.innerHTML =
        `<option value="">${t('filterAllDepts')}</option>` +
        depts.map((d) => `<option value="${d}">${d}</option>`).join('');
    }
    const dxPatientFilter = document.getElementById('filter-diagnosis-patient');
    if (dxPatientFilter && canManageDiagnoses) {
      const { data: patients } = await PatientsAPI.list();
      dxPatientFilter.innerHTML =
        `<option value="">${t('filterAllPatients')}</option>` +
        patients.map((p) => `<option value="${p.id}">${p.firstName} ${p.lastName}</option>`).join('');
    }
    applyRolePermissions();
    loadOverview();
  } catch (err) {
    console.error(err);
    toast(t('loadError'));
  }
})();
