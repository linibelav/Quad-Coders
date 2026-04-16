const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const { getDb } = require('./database');

const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');
const scheduleRoutes = require('./routes/schedules');
const nudgeRoutes = require('./routes/nudges');
const anomalyRoutes = require('./routes/anomalies');
const reportRoutes = require('./routes/reports');

const { scheduleAllNudges, checkMissedNudges } = require('./services/nudgeScheduler');
const { detectAnomalies } = require('./services/anomalyDetector');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/nudges', nudgeRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  }
});

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

getDb();
console.log('[DB] Database initialized');

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);

  scheduleAllNudges();

  cron.schedule('0 * * * *', () => {
    console.log('[Cron] Running anomaly detection...');
    detectAnomalies();
  });

  cron.schedule('*/15 * * * *', () => {
    checkMissedNudges();
  });
});
