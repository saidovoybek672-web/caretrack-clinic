/** JWT sessiya — localStorage xavfsiz o'qish/yozish */
function readStoredUser() {
  try {
    const raw = localStorage.getItem('caretrack_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && typeof user === 'object' && user.role ? user : null;
  } catch {
    return null;
  }
}

function readSession() {
  return {
    token: localStorage.getItem('caretrack_token'),
    user: readStoredUser(),
  };
}

function saveSession(token, user) {
  localStorage.setItem('caretrack_token', token);
  localStorage.setItem('caretrack_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('caretrack_token');
  localStorage.removeItem('caretrack_user');
}

function hasValidSession() {
  const { token, user } = readSession();
  return Boolean(token && user);
}
