const { getDb } = require('../database');

const SILENCE_THRESHOLD_HOURS = 24;
const LOW_MOOD_THRESHOLD = 2.0;
const MISSED_MED_THRESHOLD = 2;

function detectAnomalies() {
  const db = getDb();
  const users = db.prepare('SELECT * FROM users').all();
  const anomalies = [];

  for (const user of users) {
    anomalies.push(...detectSilence(db, user));
    anomalies.push(...detectMissedMedications(db, user));
    anomalies.push(...detectMoodDrop(db, user));
    anomalies.push(...detectMissedMeals(db, user));
  }

  for (const anomaly of anomalies) {
    const existing = db.prepare(`
      SELECT id FROM anomaly_logs
      WHERE user_id = ? AND type = ? AND resolved = 0
      AND detected_at > datetime('now', '-24 hours')
    `).get(anomaly.userId, anomaly.type);

    if (!existing) {
      db.prepare(`
        INSERT INTO anomaly_logs (user_id, type, severity, description)
        VALUES (?, ?, ?, ?)
      `).run(anomaly.userId, anomaly.type, anomaly.severity, anomaly.description);
    }
  }

  return anomalies;
}

function detectSilence(db, user) {
  const lastSession = db.prepare(`
    SELECT started_at FROM conversation_sessions
    WHERE user_id = ? ORDER BY started_at DESC LIMIT 1
  `).get(user.id);

  if (!lastSession) {
    return [{
      userId: user.id,
      type: 'unusual_silence',
      severity: 'medium',
      description: `${user.name} has not had any conversations yet. Consider checking in.`
    }];
  }

  const hoursSince = (Date.now() - new Date(lastSession.started_at).getTime()) / (1000 * 60 * 60);

  if (hoursSince > SILENCE_THRESHOLD_HOURS * 2) {
    return [{
      userId: user.id,
      type: 'unusual_silence',
      severity: 'high',
      description: `${user.name} has been silent for over ${Math.round(hoursSince)} hours. This is significantly longer than usual.`
    }];
  } else if (hoursSince > SILENCE_THRESHOLD_HOURS) {
    return [{
      userId: user.id,
      type: 'unusual_silence',
      severity: 'medium',
      description: `${user.name} hasn't had a conversation in ${Math.round(hoursSince)} hours.`
    }];
  }

  return [];
}

function detectMissedMedications(db, user) {
  const missed = db.prepare(`
    SELECT COUNT(*) as count FROM nudge_logs nl
    JOIN health_schedules hs ON nl.schedule_id = hs.id
    WHERE nl.user_id = ? AND nl.status = 'missed' AND hs.type = 'medication'
    AND nl.scheduled_for > datetime('now', '-24 hours')
  `).get(user.id);

  if (missed.count >= MISSED_MED_THRESHOLD) {
    return [{
      userId: user.id,
      type: 'missed_medication',
      severity: 'high',
      description: `${user.name} has missed ${missed.count} medication dose(s) in the last 24 hours.`
    }];
  } else if (missed.count === 1) {
    return [{
      userId: user.id,
      type: 'missed_medication',
      severity: 'medium',
      description: `${user.name} missed a medication dose in the last 24 hours.`
    }];
  }

  return [];
}

function detectMoodDrop(db, user) {
  const recentSessions = db.prepare(`
    SELECT mood_score FROM conversation_sessions
    WHERE user_id = ? AND started_at > datetime('now', '-7 days')
    ORDER BY started_at DESC LIMIT 5
  `).all(user.id);

  if (recentSessions.length < 2) return [];

  const avgMood = recentSessions.reduce((sum, s) => sum + s.mood_score, 0) / recentSessions.length;

  if (avgMood <= LOW_MOOD_THRESHOLD) {
    return [{
      userId: user.id,
      type: 'mood_change',
      severity: 'medium',
      description: `${user.name}'s average mood score has dropped to ${avgMood.toFixed(1)}/5 over recent conversations. May indicate increased sadness or distress.`
    }];
  }

  if (recentSessions.length >= 3) {
    const latest = recentSessions.slice(0, 2).reduce((s, r) => s + r.mood_score, 0) / 2;
    const older = recentSessions.slice(2).reduce((s, r) => s + r.mood_score, 0) / (recentSessions.length - 2);
    if (older - latest > 1.5) {
      return [{
        userId: user.id,
        type: 'mood_change',
        severity: 'high',
        description: `${user.name}'s mood has significantly declined from ${older.toFixed(1)} to ${latest.toFixed(1)} in recent conversations.`
      }];
    }
  }

  return [];
}

function detectMissedMeals(db, user) {
  const missed = db.prepare(`
    SELECT COUNT(*) as count FROM nudge_logs nl
    JOIN health_schedules hs ON nl.schedule_id = hs.id
    WHERE nl.user_id = ? AND nl.status = 'missed' AND hs.type = 'meal'
    AND nl.scheduled_for > datetime('now', '-24 hours')
  `).get(user.id);

  if (missed.count >= 2) {
    return [{
      userId: user.id,
      type: 'missed_meal',
      severity: 'medium',
      description: `${user.name} has missed ${missed.count} meal reminders in the last 24 hours.`
    }];
  }

  return [];
}

function getAnomalies(userId, options = {}) {
  const db = getDb();
  const { resolved = false, limit = 50 } = options;

  if (userId) {
    return db.prepare(`
      SELECT * FROM anomaly_logs
      WHERE user_id = ? AND resolved = ?
      ORDER BY detected_at DESC LIMIT ?
    `).all(userId, resolved ? 1 : 0, limit);
  }

  return db.prepare(`
    SELECT al.*, u.name as user_name FROM anomaly_logs al
    JOIN users u ON al.user_id = u.id
    WHERE al.resolved = ?
    ORDER BY al.detected_at DESC LIMIT ?
  `).all(resolved ? 1 : 0, limit);
}

function resolveAnomaly(anomalyId, caregiverNotes, confirmed) {
  const db = getDb();
  db.prepare(`
    UPDATE anomaly_logs
    SET resolved = 1, confirmed = ?, caregiver_notes = ?
    WHERE id = ?
  `).run(confirmed ? 1 : 0, caregiverNotes, anomalyId);
}

function generateBehavioralSummary(userId) {
  const db = getDb();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return null;

  const sessions = db.prepare(`
    SELECT * FROM conversation_sessions
    WHERE user_id = ? AND started_at > ?
  `).all(userId, weekStart.toISOString());

  const nudgeStats = db.prepare(`
    SELECT
      hs.type,
      COUNT(*) as total,
      SUM(CASE WHEN nl.status = 'acknowledged' THEN 1 ELSE 0 END) as ack
    FROM nudge_logs nl
    JOIN health_schedules hs ON nl.schedule_id = hs.id
    WHERE nl.user_id = ? AND nl.scheduled_for > ?
    GROUP BY hs.type
  `).all(userId, weekStart.toISOString());

  const anomalies = db.prepare(`
    SELECT COUNT(*) as count FROM anomaly_logs
    WHERE user_id = ? AND detected_at > ?
  `).get(userId, weekStart.toISOString());

  const totalConversations = sessions.length;
  const avgDuration = sessions.length > 0
    ? sessions.reduce((s, c) => s + (c.duration_seconds || 0), 0) / sessions.length
    : 0;
  const avgMood = sessions.length > 0
    ? sessions.reduce((s, c) => s + (c.mood_score || 3), 0) / sessions.length
    : 3;

  const adherence = {};
  for (const stat of nudgeStats) {
    adherence[stat.type] = stat.total > 0 ? stat.ack / stat.total : 1;
  }

  const summary = {
    userId,
    userName: user.name,
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: now.toISOString().split('T')[0],
    totalConversations,
    avgConversationDuration: Math.round(avgDuration),
    avgMoodScore: Math.round(avgMood * 10) / 10,
    medicationAdherence: adherence.medication || 1,
    hydrationAdherence: adherence.hydration || 1,
    exerciseAdherence: adherence.exercise || 1,
    mealAdherence: adherence.meal || 1,
    anomaliesCount: anomalies.count
  };

  db.prepare(`
    INSERT INTO behavioral_summaries
    (user_id, week_start, week_end, total_conversations, avg_conversation_duration,
     avg_mood_score, medication_adherence, hydration_adherence, exercise_adherence,
     meal_adherence, anomalies_count, summary_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, summary.weekStart, summary.weekEnd, summary.totalConversations,
    summary.avgConversationDuration, summary.avgMoodScore,
    summary.medicationAdherence, summary.hydrationAdherence,
    summary.exerciseAdherence, summary.mealAdherence,
    summary.anomaliesCount, JSON.stringify(summary)
  );

  return summary;
}

module.exports = {
  detectAnomalies,
  getAnomalies,
  resolveAnomaly,
  generateBehavioralSummary
};
