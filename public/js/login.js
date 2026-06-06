if (hasValidSession()) {
  window.location.href = '/dashboard';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');

  if (typeof axios === 'undefined') {
    errEl.textContent = t('networkError');
    errEl.classList.remove('hidden');
    return;
  }

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const { data } = await AuthAPI.login(username, password);
    saveSession(data.token, data.user);
    window.location.href = '/dashboard';
  } catch (err) {
    if (!err.response) {
      errEl.textContent = t('networkError');
    } else {
      errEl.textContent = err.response?.data?.error || t('loginError');
    }
    errEl.classList.remove('hidden');
  }
});
