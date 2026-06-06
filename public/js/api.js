/* Axios API client — JWT Bearer */
if (typeof axios === 'undefined') {
  console.error('axios yuklanmadi — server ishlayotganini va npm install bajarilganini tekshiring.');
}

const api = typeof axios !== 'undefined' ? axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
}) : null;

api?.interceptors.request.use((config) => {
  const token = localStorage.getItem('caretrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api?.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('login')) {
      clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

const AuthAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
};

const DoctorsAPI = {
  list: (params) => api.get('/doctors', { params }),
  get: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  remove: (id) => api.delete(`/doctors/${id}`),
};

const PatientsAPI = {
  list: (params) => api.get('/patients', { params }),
  profile: (id) => api.get(`/patients/${id}/profile`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  remove: (id) => api.delete(`/patients/${id}`),
};

const DiagnosesAPI = {
  list: (params) => api.get('/diagnoses', { params }),
  create: (data) => api.post('/diagnoses', data),
  update: (id, data) => api.put(`/diagnoses/${id}`, data),
  remove: (id) => api.delete(`/diagnoses/${id}`),
};

const StatsAPI = {
  severity: () => api.get('/stats/severity'),
};

const ClinicAPI = {
  get: () => api.get('/clinic'),
  update: (data) => api.put('/clinic', data),
};

const PublicAPI = {
  services: () => axios.get('/api/services'),
  stats: () => axios.get('/api/stats/public'),
  newsletter: (email) => axios.post('/api/newsletter/subscribe', { email }),
  searchDoctors: (q, location) =>
    axios.get('/api/doctors', { params: { q: q || undefined, department: location || undefined } }),
};
