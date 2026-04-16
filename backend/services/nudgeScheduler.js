const cron = require('node-cron');
const { getDb } = require('../database');
const { generateNudgeMessage } = require('./companionAI');

const activeJobs = new Map();
let pendingNudges = [];

function getPendingNudges(userId) {
  const userNudges = pendingNudges.filter(n => n.userId === userId);
  pendingNudges = pendingNudges.filter(n => n.userId !== userId);
  return userNudges;
}

function createNudgeLog(scheduleId, userId, scheduledFor) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO nudge_logs (schedule_id, user_id, scheduled_for, status)
    VALUES (?, ?, ?, 'pending')
  `).run(scheduleId, userId, scheduledFor);
}

function deliverNudge(schedule) {
  const db = getDb();
  const now = new Date().toISOString();

  const logResult = createNudgeLog(schedule.id, schedule.user_id, now);

  const message = generateNudgeMessage(schedule.type, schedule.name, schedule.scheduled_time);

  db.prepare(`
    UPDATE nudge_logs SET status = 'delivered', delivered_at = ? WHERE id = ?
  `).run(now, logResult.lastInsertRowid);

  pendingNudges.push({
    nudgeLogId: logResult.lastInsertRowid,
    userId: schedule.user_id,
    scheduleId: schedule.id,
    type: schedule.type,
    name: schedule.name,
    message,
    deliveredAt: now
  });

  console.log(`[Nudge] Delivered: ${schedule.type} - ${schedule.name} for user ${schedule.user_id}`);
}

function acknowledgeNudge(nudgeLogId) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE nudge_logs SET status = 'acknowledged', acknowledged_at = ? WHERE id = ?
  `).run(now, nudgeLogId);
}

function checkMissedNudges() {
  const db = getDb();
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const missed = db.prepare(`
    UPDATE nudge_logs SET status = 'missed'
    WHERE status = 'delivered' AND delivered_at < ? AND acknowledged_at IS NULL
  `).run(thirtyMinAgo);

  return missed.changes;
}

function getDayAbbrev() {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
}

function scheduleAllNudges() {
  for (const [key, job] of activeJobs) {
    job.stop();
  }
  activeJobs.clear();

  const db = getDb();
  const schedules = db.prepare(`
    SELECT * FROM health_schedules WHERE active = 1
  `).all();

  for (const schedule of schedules) {
    const [hours, minutes] = schedule.scheduled_time.split(':');
    const cronExpr = `${parseInt(minutes)} ${parseInt(hours)} * * *`;

    const job = cron.schedule(cronExpr, () => {
      const today = getDayAbbrev();
      const days = JSON.parse(schedule.days_of_week);
      if (days.includes(today)) {
        deliverNudge(schedule);
      }
    });

    activeJobs.set(`schedule_${schedule.id}`, job);
  }

  cron.schedule('*/30 * * * *', () => {
    const count = checkMissedNudges();
    if (count > 0) {
      console.log(`[Nudge] Marked ${count} nudges as missed`);
    }
  });

  console.log(`[Nudge] Scheduled ${schedules.length} health nudges`);
}

function getDeliveryStats(userId, startDate, endDate) {
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'acknowledged' THEN 1 ELSE 0 END) as acknowledged,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
    FROM nudge_logs
    WHERE user_id = ? AND scheduled_for BETWEEN ? AND ?
  `).get(userId, startDate, endDate);

  const byType = db.prepare(`
    SELECT
      hs.type,
      COUNT(*) as total,
      SUM(CASE WHEN nl.status = 'acknowledged' THEN 1 ELSE 0 END) as acknowledged,
      SUM(CASE WHEN nl.status = 'missed' THEN 1 ELSE 0 END) as missed
    FROM nudge_logs nl
    JOIN health_schedules hs ON nl.schedule_id = hs.id
    WHERE nl.user_id = ? AND nl.scheduled_for BETWEEN ? AND ?
    GROUP BY hs.type
  `).all(userId, startDate, endDate);

  return { overall: stats, byType };
}

function triggerNudgeNow(scheduleId) {
  const db = getDb();
  const schedule = db.prepare('SELECT * FROM health_schedules WHERE id = ?').get(scheduleId);
  if (schedule) {
    deliverNudge(schedule);
    return true;
  }
  return false;
}

module.exports = {
  scheduleAllNudges,
  acknowledgeNudge,
  getPendingNudges,
  getDeliveryStats,
  triggerNudgeNow,
  checkMissedNudges
};
