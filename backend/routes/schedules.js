const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/user/:userId', (req, res) => {
  const db = getDb();
  const schedules = db.prepare(`
    SELECT hs.*, c.name as caregiver_name FROM health_schedules hs
    LEFT JOIN caregivers c ON hs.created_by = c.id
    WHERE hs.user_id = ?
    ORDER BY hs.scheduled_time ASC
  `).all(req.params.userId);

  res.json(schedules);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { userId, type, name, description, scheduledTime, daysOfWeek, createdBy } = req.body;

  if (!userId || !type || !name || !scheduledTime) {
    return res.status(400).json({ error: 'userId, type, name, and scheduledTime are required' });
  }

  const validTypes = ['medication', 'meal', 'exercise', 'hydration'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
  }

  const result = db.prepare(`
    INSERT INTO health_schedules (user_id, type, name, description, scheduled_time, days_of_week, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, type, name, description || '',
    scheduledTime,
    JSON.stringify(daysOfWeek || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    createdBy || null
  );

  const schedule = db.prepare('SELECT * FROM health_schedules WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(schedule);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { type, name, description, scheduledTime, daysOfWeek, active } = req.body;

  const existing = db.prepare('SELECT * FROM health_schedules WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Schedule not found' });

  db.prepare(`
    UPDATE health_schedules SET
      type = COALESCE(?, type),
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      scheduled_time = COALESCE(?, scheduled_time),
      days_of_week = COALESCE(?, days_of_week),
      active = COALESCE(?, active)
    WHERE id = ?
  `).run(
    type || null, name || null, description !== undefined ? description : null,
    scheduledTime || null,
    daysOfWeek ? JSON.stringify(daysOfWeek) : null,
    active !== undefined ? (active ? 1 : 0) : null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM health_schedules WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM health_schedules WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Schedule not found' });
  res.json({ success: true });
});

module.exports = router;
