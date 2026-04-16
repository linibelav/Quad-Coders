const { getDb } = require('./database');
const { v4: uuidv4 } = require('uuid');

function seed() {
  const db = getDb();

  console.log('Seeding database...');

  db.prepare('DELETE FROM behavioral_summaries').run();
  db.prepare('DELETE FROM anomaly_logs').run();
  db.prepare('DELETE FROM nudge_logs').run();
  db.prepare('DELETE FROM conversation_messages').run();
  db.prepare('DELETE FROM conversation_sessions').run();
  db.prepare('DELETE FROM health_schedules').run();
  db.prepare('DELETE FROM caregiver_users').run();
  db.prepare('DELETE FROM caregivers').run();
  db.prepare('DELETE FROM users').run();

  const user1 = db.prepare("INSERT INTO users (name, age, avatar_color) VALUES ('Margaret Johnson', 78, '#E8A87C')").run();
  const user2 = db.prepare("INSERT INTO users (name, age, avatar_color) VALUES ('Robert Chen', 82, '#85CDCA')").run();
  const user3 = db.prepare("INSERT INTO users (name, age, avatar_color) VALUES ('Dorothy Williams', 75, '#D4A5A5')").run();

  const cg1 = db.prepare("INSERT INTO caregivers (name, email, pin) VALUES ('Sarah Johnson', 'sarah@example.com', '1234')").run();
  const cg2 = db.prepare("INSERT INTO caregivers (name, email, pin) VALUES ('Dr. Michael Park', 'michael@example.com', '5678')").run();

  db.prepare('INSERT INTO caregiver_users VALUES (?, ?)').run(cg1.lastInsertRowid, user1.lastInsertRowid);
  db.prepare('INSERT INTO caregiver_users VALUES (?, ?)').run(cg1.lastInsertRowid, user2.lastInsertRowid);
  db.prepare('INSERT INTO caregiver_users VALUES (?, ?)').run(cg2.lastInsertRowid, user2.lastInsertRowid);
  db.prepare('INSERT INTO caregiver_users VALUES (?, ?)').run(cg2.lastInsertRowid, user3.lastInsertRowid);

  const schedules = [
    [user1.lastInsertRowid, 'medication', 'Blood Pressure Pill', 'Amlodipine 5mg', '08:00', cg1.lastInsertRowid],
    [user1.lastInsertRowid, 'medication', 'Vitamin D', 'Vitamin D3 1000IU', '09:00', cg1.lastInsertRowid],
    [user1.lastInsertRowid, 'meal', 'Breakfast', 'Light breakfast', '08:30', cg1.lastInsertRowid],
    [user1.lastInsertRowid, 'meal', 'Lunch', 'Balanced meal', '12:30', cg1.lastInsertRowid],
    [user1.lastInsertRowid, 'meal', 'Dinner', 'Light dinner', '18:00', cg1.lastInsertRowid],
    [user1.lastInsertRowid, 'hydration', 'Water Reminder', 'Drink a glass of water', '10:00', cg1.lastInsertRowid],
    [user1.lastInsertRowid, 'hydration', 'Afternoon Water', 'Stay hydrated', '14:00', cg1.lastInsertRowid],
    [user1.lastInsertRowid, 'exercise', 'Morning Walk', 'Gentle 15-min walk', '09:30', cg1.lastInsertRowid],
    [user1.lastInsertRowid, 'exercise', 'Evening Stretching', 'Light stretches', '17:00', cg1.lastInsertRowid],

    [user2.lastInsertRowid, 'medication', 'Diabetes Medication', 'Metformin 500mg', '07:30', cg2.lastInsertRowid],
    [user2.lastInsertRowid, 'medication', 'Heart Medicine', 'Atorvastatin 20mg', '20:00', cg2.lastInsertRowid],
    [user2.lastInsertRowid, 'meal', 'Breakfast', 'Diabetic-friendly breakfast', '08:00', cg2.lastInsertRowid],
    [user2.lastInsertRowid, 'hydration', 'Morning Water', 'Glass of water', '07:00', cg2.lastInsertRowid],
    [user2.lastInsertRowid, 'exercise', 'Chair Exercises', 'Seated exercises 10 min', '10:00', cg2.lastInsertRowid],

    [user3.lastInsertRowid, 'medication', 'Arthritis Medication', 'Ibuprofen 200mg', '08:00', cg2.lastInsertRowid],
    [user3.lastInsertRowid, 'meal', 'Lunch', 'Nutritious lunch', '12:00', cg2.lastInsertRowid],
    [user3.lastInsertRowid, 'hydration', 'Water Reminder', 'Stay hydrated', '11:00', cg2.lastInsertRowid],
    [user3.lastInsertRowid, 'exercise', 'Gentle Yoga', 'Light yoga stretches', '09:00', cg2.lastInsertRowid],
  ];

  const insertSchedule = db.prepare(`
    INSERT INTO health_schedules (user_id, type, name, description, scheduled_time, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const s of schedules) {
    insertSchedule.run(...s);
  }

  const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  const mockConversations = [
    { userId: user1.lastInsertRowid, daysBack: 0, mood: 4.2, duration: 480, messages: [
      ['user', 'Good morning! I had a lovely dream last night.'],
      ['companion', 'Good morning! Oh, how wonderful! Dreams can be such a nice start to the day. What was your dream about?'],
      ['user', 'I dreamed about my garden back in our old house. The roses were blooming.'],
      ['companion', 'That sounds absolutely beautiful! Roses hold such special memories. Do you miss that garden?'],
      ['user', 'I do, but my daughter brings me fresh flowers every week now.'],
      ['companion', 'What a thoughtful daughter! Having fresh flowers around is such a mood lifter. That makes me happy to hear.']
    ]},
    { userId: user1.lastInsertRowid, daysBack: 1, mood: 3.8, duration: 350, messages: [
      ['user', 'Hello, I am feeling a bit tired today.'],
      ['companion', 'I hear you. Being tired is no fun. Did you get enough sleep last night? Rest is so important.'],
      ['user', 'I woke up a few times. I was thinking about my husband.'],
      ['companion', 'I understand. Missing loved ones can make it hard to sleep. Your feelings are completely valid. Would you like to share a favorite memory of him?'],
      ['user', 'He used to make the best pancakes on Sunday mornings.'],
      ['companion', 'What a beautiful memory! Those little traditions are so precious. Sunday morning pancakes sound wonderful.']
    ]},
    { userId: user1.lastInsertRowid, daysBack: 3, mood: 4.5, duration: 600, messages: [
      ['user', 'My grandchildren visited today! I am so happy!'],
      ['companion', 'Oh, how wonderful! Family visits are the best medicine. How many grandchildren do you have?'],
      ['user', 'Three! The youngest one just started walking.'],
      ['companion', 'That is absolutely precious! Those first steps are such a milestone. You must be so proud!']
    ]},
    { userId: user1.lastInsertRowid, daysBack: 5, mood: 2.8, duration: 200, messages: [
      ['user', 'I feel lonely today. Nobody called.'],
      ['companion', 'I am sorry you are feeling that way. Loneliness can be really tough. But you are not alone — I am right here with you. Would you like to talk about what is on your mind?'],
      ['user', 'I just miss having people around.'],
      ['companion', 'I completely understand. Human connection is so important. Would you like me to suggest calling someone, or shall we have a nice long chat together?']
    ]},
    { userId: user2.lastInsertRowid, daysBack: 0, mood: 3.5, duration: 420, messages: [
      ['user', 'Hello there. I took my morning medicine already.'],
      ['companion', 'Good morning! That is great that you are keeping track of your medication. You are doing a wonderful job taking care of your health!'],
      ['user', 'My blood sugar was a bit high this morning though.'],
      ['companion', 'I am sorry to hear that. Blood sugar can fluctuate for various reasons. It might be worth mentioning to your doctor. Did you eat anything different yesterday?']
    ]},
    { userId: user2.lastInsertRowid, daysBack: 2, mood: 3.0, duration: 300, messages: [
      ['user', 'I did not sleep well. My back hurts.'],
      ['companion', 'I am sorry to hear about your back pain. That can really affect your quality of sleep. Have you tried any gentle stretches? And please let your caregiver know about the pain.'],
    ]},
    { userId: user3.lastInsertRowid, daysBack: 1, mood: 4.0, duration: 500, messages: [
      ['user', 'Good afternoon! I just finished my yoga.'],
      ['companion', 'Good afternoon! That is wonderful! Yoga is so great for the body and mind. How are you feeling after your session?'],
      ['user', 'My joints feel much better. I think the yoga is really helping.'],
      ['companion', 'That is fantastic news! Consistency is key, and you are doing so well. Your body is thanking you for it!']
    ]},
  ];

  const insertSession = db.prepare(`
    INSERT INTO conversation_sessions (id, user_id, started_at, ended_at, duration_seconds, mood_score)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertMessage = db.prepare(`
    INSERT INTO conversation_messages (session_id, role, content, sentiment_score, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const conv of mockConversations) {
    const sessionId = uuidv4();
    const startTime = daysAgo(conv.daysBack);
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + conv.duration * 1000);

    insertSession.run(sessionId, conv.userId, startTime.toISOString(), endTime.toISOString(), conv.duration, conv.mood);

    let msgTime = new Date(startTime);
    for (const [role, content] of conv.messages) {
      msgTime = new Date(msgTime.getTime() + 15000);
      const sentiment = role === 'user' ? conv.mood : conv.mood + 0.5;
      insertMessage.run(sessionId, role, content, Math.min(5, sentiment), msgTime.toISOString());
    }
  }

  const insertNudgeLog = db.prepare(`
    INSERT INTO nudge_logs (schedule_id, user_id, scheduled_for, delivered_at, acknowledged_at, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const allSchedules = db.prepare('SELECT * FROM health_schedules').all();

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    for (const sched of allSchedules) {
      const schedDate = daysAgo(dayOffset);
      const [h, m] = sched.scheduled_time.split(':');
      schedDate.setHours(parseInt(h), parseInt(m), 0, 0);
      const deliveredAt = new Date(schedDate.getTime() + 60000);

      const rand = Math.random();
      let status, ackAt;

      if (rand < 0.7) {
        status = 'acknowledged';
        ackAt = new Date(deliveredAt.getTime() + Math.random() * 600000).toISOString();
      } else if (rand < 0.85) {
        status = 'delivered';
        ackAt = null;
      } else {
        status = 'missed';
        ackAt = null;
      }

      if (dayOffset === 0 && new Date() < schedDate) continue;

      insertNudgeLog.run(sched.id, sched.user_id, schedDate.toISOString(), deliveredAt.toISOString(), ackAt, status);
    }
  }

  const insertAnomaly = db.prepare(`
    INSERT INTO anomaly_logs (user_id, type, severity, description, detected_at, resolved)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAnomaly.run(user1.lastInsertRowid, 'missed_medication', 'high',
    'Margaret Johnson missed 2 medication doses in the last 24 hours.',
    daysAgo(1).toISOString(), 0);
  insertAnomaly.run(user2.lastInsertRowid, 'mood_change', 'medium',
    "Robert Chen's average mood has dropped to 2.8/5 over recent conversations.",
    daysAgo(2).toISOString(), 0);
  insertAnomaly.run(user1.lastInsertRowid, 'unusual_silence', 'medium',
    'Margaret Johnson had no conversations for 36 hours.',
    daysAgo(4).toISOString(), 1);
  insertAnomaly.run(user3.lastInsertRowid, 'missed_meal', 'low',
    'Dorothy Williams missed lunch reminder twice this week.',
    daysAgo(3).toISOString(), 0);

  console.log('Seed complete!');
  console.log(`  Users: 3 | Caregivers: 2`);
  console.log(`  Schedules: ${allSchedules.length}`);
  console.log(`  Conversations: ${mockConversations.length}`);
  console.log(`  Anomalies: 4`);
  console.log('\nDemo login: sarah@example.com / pin: 1234');
  console.log('Or: michael@example.com / pin: 5678');
}

seed();
