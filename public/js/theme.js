function getTheme() {
  return localStorage.getItem('caretrack_theme') || 'light';
}

function setTheme(theme) {
  localStorage.setItem('caretrack_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggleIcon();
}

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  if (typeof applyI18n === 'function') applyI18n();
}

function updateThemeToggleIcon() {
  const dark = getTheme() === 'dark';
  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    if (typeof t === 'function') {
      const label = dark ? t('themeLight') : t('themeDark');
      btn.setAttribute('aria-label', label);
      btn.title = label;
    }
  });
}

function initThemeEarly() {
  document.documentElement.setAttribute('data-theme', getTheme());
}

initThemeEarly();

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.theme-toggle');
  if (btn) toggleTheme();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateThemeToggleIcon);
} else {
  updateThemeToggleIcon();
}
