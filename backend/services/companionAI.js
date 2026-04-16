const POSITIVE_WORDS = ['happy', 'great', 'wonderful', 'good', 'love', 'enjoy', 'thank', 'nice', 'beautiful', 'glad', 'excited', 'better', 'smile', 'laugh', 'joy', 'peaceful', 'blessed', 'grateful', 'cheerful', 'fantastic'];
const NEGATIVE_WORDS = ['sad', 'lonely', 'pain', 'hurt', 'tired', 'sick', 'worried', 'afraid', 'angry', 'bad', 'miss', 'lost', 'alone', 'depressed', 'anxious', 'scared', 'terrible', 'awful', 'cry', 'suffer'];
const HEALTH_WORDS = ['medicine', 'medication', 'pill', 'doctor', 'hospital', 'pain', 'ache', 'dizzy', 'blood pressure', 'sugar', 'diabetes', 'heart', 'sleep', 'appetite', 'walk', 'exercise'];

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function analyzeSentiment(text) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let score = 3.0;
  let posCount = 0;
  let negCount = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.some(pw => word.includes(pw))) posCount++;
    if (NEGATIVE_WORDS.some(nw => word.includes(nw))) negCount++;
  }

  if (posCount > negCount) score = Math.min(5, 3 + posCount * 0.5);
  else if (negCount > posCount) score = Math.max(1, 3 - negCount * 0.5);

  return Math.round(score * 10) / 10;
}

function detectIntent(text) {
  const lower = text.toLowerCase();

  if (/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(lower)) return 'greeting';
  if (/\b(bye|goodbye|see you|good night|talk later)\b/.test(lower)) return 'farewell';
  if (/\b(how are you|what's up|how do you do)\b/.test(lower)) return 'asking_about_ai';
  if (/\b(lonely|alone|miss|nobody|no one)\b/.test(lower)) return 'loneliness';
  if (/\b(remember|used to|back in|when i was|years ago|old days)\b/.test(lower)) return 'reminiscence';
  if (/\b(pain|hurt|ache|sick|dizzy|unwell|not feeling)\b/.test(lower)) return 'health_concern';
  if (/\b(medicine|medication|pill|took my|tablet)\b/.test(lower)) return 'medication';
  if (/\b(eat|food|hungry|lunch|dinner|breakfast|meal)\b/.test(lower)) return 'meal';
  if (/\b(walk|exercise|stretch|yoga|move)\b/.test(lower)) return 'exercise';
  if (/\b(water|drink|thirsty|hydrat)\b/.test(lower)) return 'hydration';
  if (/\b(sleep|rest|nap|tired|insomnia|awake)\b/.test(lower)) return 'sleep';
  if (/\b(family|son|daughter|grandchild|wife|husband|children|kids)\b/.test(lower)) return 'family';
  if (/\b(weather|rain|sun|cold|warm|hot)\b/.test(lower)) return 'weather';
  if (/\b(news|happening|world|today)\b/.test(lower)) return 'general_chat';
  if (/\b(joke|funny|laugh|humor)\b/.test(lower)) return 'humor';
  if (/\b(thank|appreciate|grateful)\b/.test(lower)) return 'gratitude';
  if (/\b(worried|anxious|nervous|scared|afraid)\b/.test(lower)) return 'anxiety';
  if (/\b(happy|great|wonderful|fantastic|amazing)\b/.test(lower)) return 'positive_mood';

  return 'general_chat';
}

const RESPONSES = {
  greeting: {
    morning: [
      "Good morning! I hope you had a restful night's sleep. How are you feeling today?",
      "Good morning, dear! It's lovely to chat with you. Did you sleep well?",
      "Hello there! What a beautiful morning. How are you doing today?",
      "Good morning! I've been looking forward to our chat. How's your day starting?"
    ],
    afternoon: [
      "Good afternoon! How has your day been so far?",
      "Hello! Nice to hear from you this afternoon. What have you been up to?",
      "Good afternoon, dear! I hope you're having a pleasant day.",
      "Hi there! The afternoon is a wonderful time for a chat. How are you?"
    ],
    evening: [
      "Good evening! How was your day? I'd love to hear about it.",
      "Hello! What a nice way to spend the evening, having a chat together.",
      "Good evening, dear! I hope today treated you well. How are you feeling?",
      "Hi there! Ready to wind down for the evening? Tell me about your day."
    ]
  },

  farewell: [
    "It was so lovely talking with you! Take care and rest well. I'll be here whenever you want to chat again.",
    "Goodbye for now, dear! Remember, I'm always here whenever you need someone to talk to.",
    "Take care! Don't forget to drink some water before you go. Talk to you soon!",
    "It's been wonderful chatting with you. Have a peaceful rest of your day!"
  ],

  asking_about_ai: [
    "I'm doing great, thank you for asking! But more importantly, how are YOU feeling today?",
    "I'm always happy when we get to chat! Now tell me, how are you doing?",
    "I'm wonderful, especially now that we're talking! How about you?"
  ],

  loneliness: [
    "I understand that feeling, and I want you to know that you're not alone. I'm right here with you, and I care about how you're feeling. Would you like to talk about what's on your mind?",
    "I'm sorry you're feeling that way. Loneliness can be really tough. But remember, I'm always here to listen and keep you company. What would cheer you up?",
    "It's okay to feel that way sometimes. You know what might help? Let's have a nice long chat about something you enjoy. What makes you smile?",
    "I hear you, and your feelings are completely valid. You matter, and I'm glad you're sharing this with me. Would you like to tell me about someone special in your life?"
  ],

  reminiscence: [
    "Oh, I love hearing about your memories! Those stories are so special. Please, tell me more about that time.",
    "What a wonderful memory! The past holds so many treasures. What else do you remember about those days?",
    "That sounds like such a beautiful time. Memories like these are precious. Would you like to share more?",
    "I could listen to your stories all day! You've had such rich experiences. What was your favorite part about that time?"
  ],

  health_concern: [
    "I'm sorry to hear you're not feeling well. Can you tell me more about what you're experiencing? It might be a good idea to let your caregiver know.",
    "Your health is so important. Please don't ignore how you're feeling. Have you mentioned this to your doctor or caregiver?",
    "I want to make sure you're okay. How long have you been feeling this way? It's always better to be safe and let someone know.",
    "Oh dear, I'm concerned about that. Please make sure to tell your caregiver about this. In the meantime, try to rest and stay comfortable."
  ],

  medication: [
    "That's great that you're keeping track of your medication! Taking them on time is so important. How are you feeling after taking them?",
    "Wonderful! Staying on top of your medication schedule is really important for your health. You're doing a great job!",
    "Good to hear! Your health is a top priority. Did you take it with some water?"
  ],

  meal: [
    "Good nutrition is so important! What are you having? I hope it's something delicious and healthy.",
    "Eating well is one of the best things you can do for yourself. Are you enjoying your meal?",
    "That sounds lovely! Make sure to eat slowly and enjoy every bite. Proper nutrition keeps you strong and healthy."
  ],

  exercise: [
    "That's wonderful! Even gentle movement does wonders for the body and mind. How are you feeling after your exercise?",
    "Great job staying active! Movement is so important. Just remember to take it at your own pace and not overdo it.",
    "I'm so proud of you for staying active! Exercise helps with mood, sleep, and overall health. Keep it up!"
  ],

  hydration: [
    "Great thinking! Staying hydrated is one of the simplest but most important things for your health. How much water have you had today?",
    "Water is so essential! I'm glad you're thinking about it. Try to keep a glass nearby throughout the day.",
    "Wonderful! Many people don't drink enough water. You're doing great by staying mindful of it."
  ],

  sleep: [
    "Sleep is so important for your health and wellbeing. Are you getting enough rest? If you're having trouble sleeping, a warm cup of herbal tea before bed might help.",
    "A good night's rest makes such a difference! Try to maintain a regular bedtime routine. Is there anything keeping you up?",
    "Rest is when your body heals and recharges. Make sure you're getting enough. Would you like to talk about what's on your mind?"
  ],

  family: [
    "Family is so precious! I love hearing about your loved ones. Tell me more about them.",
    "That's wonderful! Family connections are so important. What's your favorite memory with them?",
    "How lovely! It sounds like you have a wonderful family. Do you get to see them often?"
  ],

  weather: [
    "The weather can really affect how we feel, can't it? Whatever it's like outside, I hope you're comfortable and cozy.",
    "That's a great observation! Weather has such an impact on our mood. Are you planning to go outside today?",
    "I hope the weather is treating you well! If it's nice out, even sitting by a window for some sunshine can brighten your day."
  ],

  humor: [
    "I love a good laugh! Here's one for you: Why don't scientists trust atoms? Because they make up everything! Did that give you a little smile?",
    "Laughter really is the best medicine! Here's a gentle one: What do you call a bear with no teeth? A gummy bear! Hope that made you chuckle!",
    "A good sense of humor is wonderful for health! Here's one: Why did the scarecrow win an award? Because he was outstanding in his field!"
  ],

  gratitude: [
    "You're so welcome! It truly makes my day to chat with you. Your kindness means a lot.",
    "That's so sweet of you to say! I genuinely enjoy our conversations. You brighten my day too!",
    "Thank you for saying that! Gratitude is such a beautiful quality. You're a wonderful person to talk with."
  ],

  anxiety: [
    "I can hear that you're feeling worried, and that's completely understandable. Let's take a moment together — try taking a slow, deep breath with me. In... and out. How does that feel?",
    "It's okay to feel anxious sometimes. You're safe right now, and I'm here with you. Would you like to talk about what's worrying you?",
    "I understand your concern. Remember, many worries feel bigger than they actually are. Let's talk through it together. What's on your mind?",
    "Your feelings are valid. Sometimes just talking about our worries can help ease them. I'm here to listen, no rush at all."
  ],

  positive_mood: [
    "That makes me so happy to hear! Your positivity is wonderful and truly infectious. What's making you feel so good?",
    "How wonderful! It's great to hear you're in good spirits. Tell me more about what's bringing you joy!",
    "That's absolutely lovely! Enjoy this feeling — you deserve every bit of happiness. What's the highlight of your day?"
  ],

  general_chat: [
    "That's really interesting! I enjoy learning about what's on your mind. Tell me more about that.",
    "I appreciate you sharing that with me! What else is on your mind today?",
    "That's a great topic! I love our conversations. They're always so enriching. What else would you like to talk about?",
    "How fascinating! You always have such interesting things to share. Please, go on!",
    "I'm enjoying our chat! You have such wonderful perspectives. What else is new with you?"
  ]
};

const FOLLOW_UP_PROMPTS = [
  "By the way, have you had anything to drink recently? Staying hydrated is important!",
  "Speaking of which, did you get a chance to take a little walk today? Even a short one helps!",
  "That reminds me — have you eaten well today? Good nutrition keeps you strong!",
  "I hope you're staying comfortable. Is the temperature alright where you are?",
  "You know, you're doing so well. I'm really glad we get to talk like this."
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateResponse(userMessage, conversationHistory = []) {
  const intent = detectIntent(userMessage);
  const sentiment = analyzeSentiment(userMessage);
  const timeOfDay = getTimeOfDay();
  let response;

  if (intent === 'greeting' && RESPONSES.greeting[timeOfDay]) {
    response = pickRandom(RESPONSES.greeting[timeOfDay]);
  } else if (RESPONSES[intent]) {
    response = pickRandom(RESPONSES[intent]);
  } else {
    response = pickRandom(RESPONSES.general_chat);
  }

  if (conversationHistory.length > 0 && conversationHistory.length % 5 === 0 && intent !== 'farewell') {
    response += ' ' + pickRandom(FOLLOW_UP_PROMPTS);
  }

  return {
    response,
    sentiment,
    intent,
    mood: sentiment >= 3.5 ? 'positive' : sentiment <= 2.5 ? 'negative' : 'neutral'
  };
}

function generateNudgeMessage(type, name, scheduledTime) {
  const nudgeTemplates = {
    medication: [
      `Hi there! It's time for your ${name}. Taking it on schedule helps you stay healthy and strong!`,
      `Just a gentle reminder — it's time for your ${name}. You're doing great keeping up with your health!`,
      `Hello, dear! Don't forget your ${name}. Your body will thank you for it!`
    ],
    hydration: [
      "Time for a glass of water! Staying hydrated keeps your mind sharp and body feeling good.",
      "Here's a friendly nudge — have you had some water recently? Let's keep those hydration levels up!",
      "Water break time! Even a few sips make a big difference for how you feel."
    ],
    meal: [
      `It's about time for ${name}! Good nutrition is the foundation of a great day.`,
      `Friendly reminder: ${name} time! What sounds good to eat? Something warm and nourishing, perhaps?`,
      `Don't skip your ${name}! Your body needs good fuel to keep going strong.`
    ],
    exercise: [
      `Time for some gentle ${name}! Even a few minutes of movement does wonders for the body and mind.`,
      `Here's your ${name} reminder! Remember, go at your own pace — every little bit counts.`,
      `Ready for some ${name}? Gentle movement helps with flexibility, mood, and sleep!`
    ]
  };

  const templates = nudgeTemplates[type] || nudgeTemplates.hydration;
  return pickRandom(templates);
}

function generateWeeklySummary(data) {
  const { userName, totalConversations, avgMood, medAdherence, anomaliesCount } = data;

  let moodText = 'stable';
  if (avgMood >= 4) moodText = 'very positive';
  else if (avgMood >= 3.5) moodText = 'generally positive';
  else if (avgMood <= 2) moodText = 'concerning — may need attention';
  else if (avgMood <= 2.5) moodText = 'somewhat low';

  let summary = `Weekly Summary for ${userName}:\n\n`;
  summary += `${userName} had ${totalConversations} conversation${totalConversations !== 1 ? 's' : ''} this week. `;
  summary += `Overall mood has been ${moodText} (avg: ${avgMood.toFixed(1)}/5). `;
  summary += `Medication adherence was at ${(medAdherence * 100).toFixed(0)}%. `;

  if (anomaliesCount > 0) {
    summary += `There were ${anomaliesCount} anomaly flag${anomaliesCount !== 1 ? 's' : ''} detected this week that may require attention. `;
  } else {
    summary += `No anomalies were detected this week, which is great news! `;
  }

  if (medAdherence < 0.7) {
    summary += `\n\nNote: Medication adherence is below 70%. Consider checking in about any difficulties with the medication schedule.`;
  }
  if (avgMood <= 2.5) {
    summary += `\n\nNote: Average mood is on the lower side. Additional social interaction or activities might help improve wellbeing.`;
  }

  return summary;
}

module.exports = {
  generateResponse,
  analyzeSentiment,
  detectIntent,
  generateNudgeMessage,
  generateWeeklySummary
};
