const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const requestLogger = require('./middleware/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const doctorsRoutes = require('./routes/doctors');
const patientsRoutes = require('./routes/patients');
const diagnosesRoutes = require('./routes/diagnoses');
const servicesRoutes = require('./routes/services');
const newsletterRoutes = require('./routes/newsletter');
const statsRoutes = require('./routes/stats');
const clinicRoutes = require('./routes/clinic');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/diagnoses', diagnosesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/clinic', clinicRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/vendor/axios', express.static(path.join(__dirname, '..', 'node_modules', 'axios', 'dist')));
app.use('/vendor/chart.js', express.static(path.join(__dirname, '..', 'node_modules', 'chart.js', 'dist')));

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`CareTrack Clinic TYBT: http://localhost:${config.port}`);
});
