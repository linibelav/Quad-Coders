const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/users', (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, name, age, avatar_color, created_at FROM users').all();
  res.json(users);
});

router.get('/users/:id', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, age, avatar_color, preferences, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.post('/users', (req, res) => {
  const db = getDb();
  const { name, age, avatar_color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const result = db.prepare('INSERT INTO users (name, age, avatar_color) VALUES (?, ?, ?)').run(name, age || null, avatar_color || '#6C63FF');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

router.get('/caregivers', (req, res) => {
  const db = getDb();
  const caregivers = db.prepare('SELECT id, name, email, created_at FROM caregivers').all();
  res.json(caregivers);
});

router.post('/caregivers/login', (req, res) => {
  const db = getDb();
  const { email, pin } = req.body;
  const caregiver = db.prepare('SELECT id, name, email FROM caregivers WHERE email = ? AND pin = ?').get(email, pin);
  if (!caregiver) return res.status(401).json({ error: 'Invalid credentials' });

  const users = db.prepare(`
    SELECT u.id, u.name, u.age, u.avatar_color FROM users u
    JOIN caregiver_users cu ON u.id = cu.user_id
    WHERE cu.caregiver_id = ?
  `).all(caregiver.id);

  res.json({ ...caregiver, users });
});

router.post('/caregivers', (req, res) => {
  const db = getDb();
  const { name, email, pin } = req.body;
  if (!name || !email || !pin) return res.status(400).json({ error: 'Name, email, and pin are required' });

  try {
    const result = db.prepare('INSERT INTO caregivers (name, email, pin) VALUES (?, ?, ?)').run(name, email, pin);
    res.status(201).json({ id: result.lastInsertRowid, name, email });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    throw e;
  }
});

router.post('/caregivers/:id/assign', (req, res) => {
  const db = getDb();
  const { userId } = req.body;
  try {
    db.prepare('INSERT INTO caregiver_users (caregiver_id, user_id) VALUES (?, ?)').run(req.params.id, userId);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Assignment failed' });
  }
});

module.exports = router;
