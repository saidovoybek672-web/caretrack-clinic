/** Mobil menyu — bosh sahifa va login */
function initMobileNav() {
  const toggle = document.getElementById('menu-toggle');
  const overlay = document.getElementById('nav-overlay');
  const panel = document.getElementById('site-nav-panel');
  if (!toggle || !panel) return;

  const isMobile = () => window.matchMedia('(max-width: 991px)').matches;

  const syncPanelA11y = (opened) => {
    if (!isMobile()) {
      panel.removeAttribute('aria-hidden');
      return;
    }
    panel.setAttribute('aria-hidden', opened ? 'false' : 'true');
  };

  const close = () => {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    syncPanelA11y(false);
  };

  const open = () => {
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    syncPanelA11y(true);
  };

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (document.body.classList.contains('nav-open')) close();
    else open();
  });

  overlay?.addEventListener('click', close);

  document.querySelectorAll('.header-right a, .header-right button').forEach((el) => {
    el.addEventListener('click', () => {
      const href = el.getAttribute('href');
      if (!href || href.startsWith('#') || href === '/') close();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  window.addEventListener('resize', () => {
    if (!isMobile()) close();
  });

  syncPanelA11y(false);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  initMobileNav();
}
