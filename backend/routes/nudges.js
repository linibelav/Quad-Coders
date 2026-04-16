const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { acknowledgeNudge, getPendingNudges, getDeliveryStats, triggerNudgeNow } = require('../services/nudgeScheduler');

router.get('/pending/:userId', (req, res) => {
  const nudges = getPendingNudges(parseInt(req.params.userId));
  res.json(nudges);
});

router.post('/acknowledge/:nudgeLogId', (req, res) => {
  try {
    acknowledgeNudge(parseInt(req.params.nudgeLogId));
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Failed to acknowledge nudge' });
  }
});

router.post('/trigger/:scheduleId', (req, res) => {
  const success = triggerNudgeNow(parseInt(req.params.scheduleId));
  if (success) {
    res.json({ success: true, message: 'Nudge triggered' });
  } else {
    res.status(404).json({ error: 'Schedule not found' });
  }
});

router.get('/history/:userId', (req, res) => {
  const db = getDb();
  const { limit = 50, status } = req.query;

  let query = `
    SELECT nl.*, hs.type, hs.name, hs.scheduled_time
    FROM nudge_logs nl
    JOIN health_schedules hs ON nl.schedule_id = hs.id
    WHERE nl.user_id = ?
  `;
  const params = [req.params.userId];

  if (status) {
    query += ' AND nl.status = ?';
    params.push(status);
  }

  query += ' ORDER BY nl.scheduled_for DESC LIMIT ?';
  params.push(parseInt(limit));

  const nudges = db.prepare(query).all(...params);
  res.json(nudges);
});

router.get('/stats/:userId', (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate || new Date().toISOString();

  const stats = getDeliveryStats(parseInt(req.params.userId), start, end);
  res.json(stats);
});

module.exports = router;
