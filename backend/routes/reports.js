const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { generateBehavioralSummary } = require('../services/anomalyDetector');
const { generateWeeklySummary } = require('../services/companionAI');
const { getDeliveryStats } = require('../services/nudgeScheduler');

router.get('/weekly/:userId', (req, res) => {
  const db = getDb();
  const userId = parseInt(req.params.userId);

  const existing = db.prepare(`
    SELECT * FROM behavioral_summaries
    WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 5
  `).all(userId);

  res.json(existing);
});

router.post('/weekly/:userId/generate', (req, res) => {
  const userId = parseInt(req.params.userId);
  const summary = generateBehavioralSummary(userId);

  if (!summary) return res.status(404).json({ error: 'User not found' });

  const textSummary = generateWeeklySummary({
    userName: summary.userName,
    totalConversations: summary.totalConversations,
    avgMood: summary.avgMoodScore,
    medAdherence: summary.medicationAdherence,
    anomaliesCount: summary.anomaliesCount
  });

  res.json({ ...summary, narrativeSummary: textSummary });
});

router.get('/dashboard/:userId', (req, res) => {
  const db = getDb();
  const userId = parseInt(req.params.userId);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const recentSessions = db.prepare(`
    SELECT id, started_at, ended_at, duration_seconds, mood_score
    FROM conversation_sessions
    WHERE user_id = ?
    ORDER BY started_at DESC LIMIT 10
  `).all(userId);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayNudges = db.prepare(`
    SELECT nl.*, hs.type, hs.name
    FROM nudge_logs nl
    JOIN health_schedules hs ON nl.schedule_id = hs.id
    WHERE nl.user_id = ? AND nl.scheduled_for >= ?
    ORDER BY nl.scheduled_for DESC
  `).all(userId, todayStart.toISOString());

  const unresolvedAnomalies = db.prepare(`
    SELECT * FROM anomaly_logs
    WHERE user_id = ? AND resolved = 0
    ORDER BY detected_at DESC
  `).all(userId);

  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const nudgeStats = getDeliveryStats(userId, weekStart, new Date().toISOString());

  const moodTrend = db.prepare(`
    SELECT DATE(started_at) as date, AVG(mood_score) as avg_mood, COUNT(*) as sessions
    FROM conversation_sessions
    WHERE user_id = ? AND started_at > datetime('now', '-30 days')
    GROUP BY DATE(started_at)
    ORDER BY date ASC
  `).all(userId);

  const schedules = db.prepare(`
    SELECT * FROM health_schedules WHERE user_id = ? AND active = 1
    ORDER BY scheduled_time ASC
  `).all(userId);

  res.json({
    user,
    recentSessions,
    todayNudges,
    unresolvedAnomalies,
    nudgeStats,
    moodTrend,
    schedules
  });
});

module.exports = router;
