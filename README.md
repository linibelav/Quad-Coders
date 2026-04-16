# ElderCare Companion

**Conversational AI for Elderly Companionship & Health Nudging**

A voice-first conversational AI companion designed for elderly users that holds meaningful daily conversations, sends gentle health nudges (medication, hydration, exercise), and flags behavioral anomalies to caregivers via a monitoring dashboard.

---

## Features

### Elderly Companion (Voice-First Interface)
- **Voice Input/Output** — Speak naturally using browser speech recognition; hear empathetic responses via browser text-to-speech
- **Empathetic AI Conversations** — Context-aware mock LLM that responds to greetings, health topics, reminiscence, loneliness, and more
- **Health Nudge Alerts** — Gentle in-app reminders for medications, meals, hydration, and exercise
- **Large, Accessible UI** — Designed for elderly users with big buttons, clear text, and warm colors

### Caregiver Dashboard
- **Real-Time Overview** — Mood trends, nudge adherence rates, active anomaly flags
- **Health Schedule Management** — Create, edit, and delete medication/meal/exercise/hydration schedules
- **Anomaly Detection** — Flags missed medications, unusual silence periods, mood drops, missed meals
- **Conversation History** — Review past sessions with mood scores and full transcripts
- **Weekly Behavioral Reports** — AI-generated narrative summaries with adherence charts

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Backend     | Node.js, Express                                 |
| Database    | SQLite (via better-sqlite3)                      |
| Scheduling  | node-cron                                        |
| Frontend    | React 18, Vite                                   |
| Charts      | Recharts                                         |
| Icons       | Lucide React                                     |
| Voice Input | Web Speech API (SpeechRecognition)               |
| Voice Output| Web Speech API (SpeechSynthesis)                 |
| AI          | Mock LLM (no API key needed)                     |

---

## Project Structure

```
RR/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── database.js            # SQLite schema & connection
│   ├── seed.js                # Seed script with demo data
│   ├── routes/
│   │   ├── auth.js            # Users & caregiver auth
│   │   ├── conversations.js   # Chat sessions & messages
│   │   ├── schedules.js       # Health schedule CRUD
│   │   ├── nudges.js          # Nudge delivery & acknowledgment
│   │   ├── anomalies.js       # Anomaly flags & resolution
│   │   └── reports.js         # Dashboard data & weekly reports
│   └── services/
│       ├── companionAI.js     # Mock LLM with empathetic responses
│       ├── nudgeScheduler.js  # Cron-based nudge delivery
│       └── anomalyDetector.js # Anomaly detection & behavioral summaries
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            # Router setup
│       ├── App.css            # All styles
│       ├── api.js             # API service layer
│       ├── hooks/
│       │   ├── useSpeechRecognition.js
│       │   └── useSpeechSynthesis.js
│       └── pages/
│           ├── Login.jsx              # Role selection & login
│           ├── ElderlyCompanion.jsx   # Voice companion interface
│           └── CaregiverDashboard.jsx # Full monitoring dashboard
└── README.md
```

---

## Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Seed the Database

```bash
cd backend
npm run seed
```

This creates the SQLite database with demo data:
- **3 elderly users**: Margaret Johnson (78), Robert Chen (82), Dorothy Williams (75)
- **2 caregivers**: Sarah Johnson, Dr. Michael Park
- **18 health schedules** (medications, meals, exercise, hydration)
- **7 conversation sessions** with realistic messages
- **7 days of nudge history** with varied acknowledgment rates
- **4 anomaly flags** (missed medication, mood change, unusual silence, missed meal)

### 3. Start the Backend

```bash
cd backend
npm start
```

Backend runs on **http://localhost:3001**

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Usage

### Demo Credentials

| Role      | Email               | PIN  |
|-----------|---------------------|------|
| Caregiver | sarah@example.com   | 1234 |
| Caregiver | michael@example.com | 5678 |

### As an Elderly User
1. Open http://localhost:5173
2. Click **"I'm an Elder User"**
3. Select a name (e.g., Margaret Johnson)
4. Use the **microphone button** to speak, or type in the text box
5. The AI companion responds with empathetic, context-aware messages
6. Health nudges appear as cards above the chat when scheduled

### As a Caregiver
1. Open http://localhost:5173
2. Click **"I'm a Caregiver"**
3. Login with demo credentials (sarah@example.com / 1234)
4. Use the sidebar to switch between monitored users
5. Navigate tabs: Overview, Health Schedules, Anomaly Flags, Conversations, Weekly Reports

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/auth/users` | List all elderly users |
| POST   | `/api/auth/caregivers/login` | Caregiver login |
| POST   | `/api/conversations/sessions` | Start new chat session |
| POST   | `/api/conversations/sessions/:id/message` | Send message, get AI response |
| POST   | `/api/conversations/sessions/:id/end` | End chat session |
| GET    | `/api/schedules/user/:userId` | Get health schedules |
| POST   | `/api/schedules` | Create health schedule |
| GET    | `/api/nudges/pending/:userId` | Get pending nudges |
| POST   | `/api/nudges/acknowledge/:id` | Acknowledge a nudge |
| GET    | `/api/anomalies/user/:userId` | Get anomaly flags |
| POST   | `/api/anomalies/:id/resolve` | Resolve an anomaly |
| GET    | `/api/reports/dashboard/:userId` | Get dashboard overview data |
| POST   | `/api/reports/weekly/:userId/generate` | Generate weekly behavioral report |

---

## Evaluation Metrics

### 1. Conversation Coherence & Empathy (Human-Judged, 1–5)
- The mock LLM uses intent detection and sentiment analysis to generate context-appropriate responses
- Responses are categorized by: greetings, loneliness, health concerns, reminiscence, anxiety, family, and more
- Empathy is built into every response template with warm, encouraging language

### 2. Health Nudge Delivery Accuracy
- Nudges are scheduled via `node-cron` and delivered at exact times
- Delivery status tracked: `pending` → `delivered` → `acknowledged` or `missed`
- Dashboard shows adherence rates per category with visual charts

### 3. Anomaly Flag Precision
- Detects: missed medications, unusual silence (24h+), mood drops, missed meals
- Caregivers can confirm or mark as false positive
- Severity levels: low, medium, high

---

## Voice Features Note

Voice input (Speech-to-Text) and voice output (Text-to-Speech) use the **Web Speech API** built into modern browsers. For best results:
- Use **Google Chrome** (best speech recognition support)
- Allow microphone permissions when prompted
- Text input is always available as a fallback
