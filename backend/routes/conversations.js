const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { generateResponse, analyzeSentiment } = require('../services/companionAI');

router.post('/sessions', (req, res) => {
  const db = getDb();
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const sessionId = uuidv4();
  db.prepare('INSERT INTO conversation_sessions (id, user_id) VALUES (?, ?)').run(sessionId, userId);

  res.status(201).json({ sessionId, startedAt: new Date().toISOString() });
});

router.post('/sessions/:sessionId/message', (req, res) => {
  const db = getDb();
  const { sessionId } = req.params;
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: 'message is required' });

  const session = db.prepare('SELECT * FROM conversation_sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const history = db.prepare(`
    SELECT role, content FROM conversation_messages
    WHERE session_id = ? ORDER BY timestamp DESC LIMIT 10
  `).all(sessionId).reverse();

  const userSentiment = analyzeSentiment(message);
  db.prepare(`
    INSERT INTO conversation_messages (session_id, role, content, sentiment_score)
    VALUES (?, 'user', ?, ?)
  `).run(sessionId, message, userSentiment);

  const aiResult = generateResponse(message, history);

  db.prepare(`
    INSERT INTO conversation_messages (session_id, role, content, sentiment_score)
    VALUES (?, 'companion', ?, ?)
  `).run(sessionId, aiResult.response, aiResult.sentiment);

  const sessionMood = (session.mood_score + userSentiment) / 2;
  db.prepare('UPDATE conversation_sessions SET mood_score = ? WHERE id = ?').run(
    Math.round(sessionMood * 10) / 10, sessionId
  );

  res.json({
    response: aiResult.response,
    sentiment: userSentiment,
    mood: aiResult.mood,
    intent: aiResult.intent
  });
});

router.post('/sessions/:sessionId/end', (req, res) => {
  const db = getDb();
  const { sessionId } = req.params;

  const session = db.prepare('SELECT * FROM conversation_sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const now = new Date();
  const startedAt = new Date(session.started_at);
  const durationSeconds = Math.round((now - startedAt) / 1000);

  const messages = db.prepare(`
    SELECT sentiment_score FROM conversation_messages
    WHERE session_id = ? AND role = 'user'
  `).all(sessionId);

  const avgMood = messages.length > 0
    ? messages.reduce((s, m) => s + m.sentiment_score, 0) / messages.length
    : 3.0;

  db.prepare(`
    UPDATE conversation_sessions
    SET ended_at = ?, duration_seconds = ?, mood_score = ?
    WHERE id = ?
  `).run(now.toISOString(), durationSeconds, Math.round(avgMood * 10) / 10, sessionId);

  res.json({ sessionId, durationSeconds, avgMood: Math.round(avgMood * 10) / 10 });
});

router.get('/sessions/user/:userId', (req, res) => {
  const db = getDb();
  const { limit = 20, offset = 0 } = req.query;

  const sessions = db.prepare(`
    SELECT * FROM conversation_sessions
    WHERE user_id = ?
    ORDER BY started_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.userId, parseInt(limit), parseInt(offset));

  res.json(sessions);
});

router.get('/sessions/:sessionId/messages', (req, res) => {
  const db = getDb();
  const messages = db.prepare(`
    SELECT * FROM conversation_messages
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `).all(req.params.sessionId);

  res.json(messages);
});

module.exports = router;
