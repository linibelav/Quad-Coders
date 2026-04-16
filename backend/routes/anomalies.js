const express = require('express');
const router = express.Router();
const { getAnomalies, resolveAnomaly, detectAnomalies } = require('../services/anomalyDetector');

router.get('/', (req, res) => {
  const { userId, resolved } = req.query;
  const anomalies = getAnomalies(
    userId ? parseInt(userId) : null,
    { resolved: resolved === 'true' }
  );
  res.json(anomalies);
});

router.get('/user/:userId', (req, res) => {
  const { resolved = 'false' } = req.query;
  const anomalies = getAnomalies(parseInt(req.params.userId), { resolved: resolved === 'true' });
  res.json(anomalies);
});

router.post('/:id/resolve', (req, res) => {
  const { notes, confirmed } = req.body;
  try {
    resolveAnomaly(parseInt(req.params.id), notes || '', confirmed || false);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Failed to resolve anomaly' });
  }
});

router.post('/detect', (req, res) => {
  const anomalies = detectAnomalies();
  res.json({ detected: anomalies.length, anomalies });
});

module.exports = router;
