/** Til va mavzu — barcha sahifalarda [data-preferences-mount] ichiga joylanadi */
function preferencesMarkup() {
  return `
    <div class="site-preferences" role="group" aria-label="Sozlamalar">
      <div class="pref-inline">
        <label class="pref-label" data-i18n="langLabel">Til</label>
        <select class="pref-select lang-select" aria-label="Til">
          <option value="uz">Oʻzbek</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
        </select>
      </div>
      <button type="button" class="theme-toggle" aria-label="Mavzu">🌙</button>
    </div>
  `;
}

function syncLangSelects(lang) {
  document.querySelectorAll('.lang-select').forEach((sel) => {
    sel.value = lang;
  });
}

function mountSitePreferences() {
  document.querySelectorAll('[data-preferences-mount]').forEach((mount) => {
    if (mount.dataset.preferencesMounted === '1') return;
    mount.dataset.preferencesMounted = '1';
    mount.innerHTML = preferencesMarkup();

    const select = mount.querySelector('.lang-select');
    select.value = getLang();
    select.addEventListener('change', (e) => {
      const lang = e.target.value;
      setLang(lang);
      syncLangSelects(lang);
      applyI18n();
      window.dispatchEvent(new CustomEvent('caretrack:langchange', { detail: { lang } }));
    });
  });

  syncLangSelects(getLang());
  document.documentElement.lang = getLang();
  applyI18n();
  if (typeof updateThemeToggleIcon === 'function') updateThemeToggleIcon();
}

function initSitePreferences() {
  mountSitePreferences();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSitePreferences);
} else {
  initSitePreferences();
}
