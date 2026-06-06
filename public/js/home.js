function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

const iconMap = {
  health: '⚕️',
  emergency: '🚑',
  satisfaction: '⭐',
  heart: '❤️',
  dental: '🦷',
  diagnostics: '🔬',
};

async function loadStats() {
  try {
    const { data } = await PublicAPI.stats();
    document.getElementById('stat-patients').textContent =
      data.patientsCount >= 1000 ? `${(data.patientsCount / 1000).toFixed(0)}k+` : `${data.patientsCount}+`;
    document.getElementById('stat-doctors').textContent = `${data.doctorsCount}+`;
  } catch {
    document.getElementById('stat-patients').textContent = '10M+';
    document.getElementById('stat-doctors').textContent = '112+';
  }
}

async function loadServices() {
  const grid = document.getElementById('services-grid');
  try {
    const { data } = await PublicAPI.services();
    grid.innerHTML = data
      .map(
        (s) => `
      <article class="service-card">
        <div class="service-icon">${iconMap[s.icon] || '⚕️'}</div>
        <h3>${s.title}</h3>
        <p>${s.description}</p>
      </article>`
      )
      .join('');
  } catch {
    grid.innerHTML = `<p>${t('noServices')}</p>`;
  }
}

async function loadDoctors(params = {}) {
  const grid = document.getElementById('doctors-grid');
  try {
    const { data } = await PublicAPI.searchDoctors(params.q, params.location);
    if (!data.length) {
      grid.innerHTML = `<p>${t('noDoctors')}</p>`;
      return;
    }
    grid.innerHTML = data
      .map(
        (d) => `
      <article class="doctor-card">
        <img src="${d.image || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400'}" alt="${d.name}" />
        <div class="body">
          <h3>${d.name}</h3>
          <p class="specialty">${d.specialty} · ${d.department}</p>
          <a href="tel:${d.contact}" class="phone" title="Qo'ng'iroq">📞</a>
        </div>
      </article>`
      )
      .join('');
  } catch {
    grid.innerHTML = `<p>${t('noDoctors')}</p>`;
  }
}

document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = document.getElementById('search-q').value;
  const location = document.getElementById('search-location').value;
  loadDoctors({ q, location });
  document.getElementById('specialists').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('newsletter-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('newsletter-email').value;
  try {
    await PublicAPI.newsletter(email);
    showToast(t('toastSubscribeOk'));
    e.target.reset();
  } catch (err) {
    showToast(err.response?.data?.error || t('toastError'));
  }
});

loadStats();
loadServices();
loadDoctors();

window.addEventListener('caretrack:langchange', () => {
  applyI18n();
  loadServices();
  loadDoctors();
});
