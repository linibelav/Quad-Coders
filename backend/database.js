const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'eldercare.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      avatar_color TEXT DEFAULT '#6C63FF',
      preferences TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS caregivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS caregiver_users (
      caregiver_id INTEGER REFERENCES caregivers(id),
      user_id INTEGER REFERENCES users(id),
      PRIMARY KEY (caregiver_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS conversation_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      duration_seconds INTEGER DEFAULT 0,
      mood_score REAL DEFAULT 3.0,
      summary TEXT
    );

    CREATE TABLE IF NOT EXISTS conversation_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT REFERENCES conversation_sessions(id),
      role TEXT CHECK(role IN ('user', 'companion')),
      content TEXT NOT NULL,
      sentiment_score REAL DEFAULT 3.0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS health_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      type TEXT CHECK(type IN ('medication', 'meal', 'exercise', 'hydration')),
      name TEXT NOT NULL,
      description TEXT,
      scheduled_time TEXT NOT NULL,
      days_of_week TEXT DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]',
      active INTEGER DEFAULT 1,
      created_by INTEGER REFERENCES caregivers(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nudge_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER REFERENCES health_schedules(id),
      user_id INTEGER REFERENCES users(id),
      scheduled_for DATETIME NOT NULL,
      delivered_at DATETIME,
      acknowledged_at DATETIME,
      status TEXT CHECK(status IN ('pending', 'delivered', 'acknowledged', 'missed')) DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS anomaly_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      type TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
      description TEXT NOT NULL,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed INTEGER DEFAULT 0,
      caregiver_notes TEXT,
      resolved INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS behavioral_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      week_start DATE NOT NULL,
      week_end DATE NOT NULL,
      total_conversations INTEGER DEFAULT 0,
      avg_conversation_duration REAL DEFAULT 0,
      avg_mood_score REAL DEFAULT 3.0,
      medication_adherence REAL DEFAULT 0,
      hydration_adherence REAL DEFAULT 0,
      exercise_adherence REAL DEFAULT 0,
      meal_adherence REAL DEFAULT 0,
      anomalies_count INTEGER DEFAULT 0,
      summary_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_messages_session ON conversation_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON conversation_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_user ON health_schedules(user_id);
    CREATE INDEX IF NOT EXISTS idx_nudges_user ON nudge_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_anomalies_user ON anomaly_logs(user_id);
  `);
}

module.exports = { getDb };
