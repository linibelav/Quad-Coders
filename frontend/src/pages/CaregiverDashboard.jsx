import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Users, AlertTriangle, Calendar, BarChart3, Activity,
  Clock, Pill, Droplets, Utensils, Dumbbell, ChevronDown,
  Plus, Trash2, CheckCircle, XCircle, RefreshCw, FileText, Bell
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../api';

const TYPE_ICONS = { medication: Pill, hydration: Droplets, meal: Utensils, exercise: Dumbbell };
const TYPE_COLORS = { medication: '#6C63FF', hydration: '#00B4D8', meal: '#FF6B6B', exercise: '#51CF66' };
const SEVERITY_COLORS = { low: '#ffd43b', medium: '#ff922b', high: '#ff6b6b' };
const PIE_COLORS = ['#6C63FF', '#00B4D8', '#FF6B6B', '#51CF66'];

export default function CaregiverDashboard() {
  const navigate = useNavigate();
  const [caregiver, setCaregiver] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  const [schedules, setSchedules] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    type: 'medication', name: '', description: '', scheduledTime: '08:00',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  });

  useEffect(() => {
    const stored = localStorage.getItem('caregiver');
    if (!stored) { navigate('/'); return; }
    setCaregiver(JSON.parse(stored));
  }, [navigate]);

  useEffect(() => {
    if (caregiver?.users?.length && !selectedUser) {
      setSelectedUser(caregiver.users[0]);
    }
  }, [caregiver, selectedUser]);

  const loadDashboard = useCallback(async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const [dash, scheds, anoms, sess] = await Promise.all([
        api.getDashboard(selectedUser.id),
        api.getSchedules(selectedUser.id),
        api.getAnomalies(selectedUser.id),
        api.getUserSessions(selectedUser.id)
      ]);
      setDashboard(dash);
      setSchedules(scheds);
      setAnomalies(anoms);
      setSessions(sess);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      setLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleLogout = () => {
    localStorage.removeItem('caregiver');
    navigate('/');
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.createSchedule({
        userId: selectedUser.id,
        ...scheduleForm,
        createdBy: caregiver.id
      });
      setShowScheduleForm(false);
      setScheduleForm({ type: 'medication', name: '', description: '', scheduledTime: '08:00', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] });
      loadDashboard();
    } catch (e) {
      alert('Failed to create schedule: ' + e.message);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!confirm('Delete this schedule?')) return;
    await api.deleteSchedule(id);
    loadDashboard();
  };

  const handleResolveAnomaly = async (id, confirmed) => {
    const notes = prompt('Add notes (optional):') || '';
    await api.resolveAnomaly(id, { notes, confirmed });
    loadDashboard();
  };

  const handleGenerateReport = async () => {
    try {
      const report = await api.generateReport(selectedUser.id);
      setWeeklyReport(report);
    } catch (e) {
      alert('Failed to generate report: ' + e.message);
    }
  };

  const handleViewSession = async (session) => {
    setSelectedSession(session);
    const msgs = await api.getSessionMessages(session.id);
    setSessionMessages(msgs);
  };

  const handleTriggerNudge = async (scheduleId) => {
    try {
      await api.triggerNudge(scheduleId);
      alert('Nudge sent!');
    } catch {
      alert('Failed to send nudge');
    }
  };

  const toggleDay = (day) => {
    setScheduleForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  if (!caregiver) return null;

  const unresolvedCount = anomalies.filter(a => !a.resolved).length;

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>ElderCare</h2>
          <p className="sidebar-subtitle">Caregiver Portal</p>
        </div>

        <div className="sidebar-user-select">
          <label>Monitoring</label>
          <div className="user-select-list">
            {caregiver.users?.map(u => (
              <button
                key={u.id}
                className={`sidebar-user-btn ${selectedUser?.id === u.id ? 'active' : ''}`}
                onClick={() => setSelectedUser(u)}
              >
                <div className="user-avatar-xs" style={{ background: u.avatar_color }}>{u.name.charAt(0)}</div>
                <span>{u.name}</span>
              </button>
            ))}
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'overview', icon: BarChart3, label: 'Overview' },
            { id: 'schedules', icon: Calendar, label: 'Health Schedules' },
            { id: 'anomalies', icon: AlertTriangle, label: 'Anomaly Flags', badge: unresolvedCount },
            { id: 'conversations', icon: Users, label: 'Conversations' },
            { id: 'reports', icon: FileText, label: 'Weekly Reports' },
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="caregiver-info">
            <span>{caregiver.name}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>{selectedUser ? `${selectedUser.name}'s Dashboard` : 'Dashboard'}</h1>
            <p className="header-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button className="btn-refresh" onClick={loadDashboard} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </header>

        {loading && !dashboard ? (
          <div className="loading-state">Loading dashboard data...</div>
        ) : (
          <div className="dashboard-content">
            {activeTab === 'overview' && dashboard && <OverviewTab dashboard={dashboard} />}
            {activeTab === 'schedules' && (
              <SchedulesTab
                schedules={schedules}
                showForm={showScheduleForm}
                setShowForm={setShowScheduleForm}
                form={scheduleForm}
                setForm={setScheduleForm}
                toggleDay={toggleDay}
                onCreate={handleCreateSchedule}
                onDelete={handleDeleteSchedule}
                onTrigger={handleTriggerNudge}
              />
            )}
            {activeTab === 'anomalies' && (
              <AnomaliesTab anomalies={anomalies} onResolve={handleResolveAnomaly} onDetect={async () => { await api.runDetection(); loadDashboard(); }} />
            )}
            {activeTab === 'conversations' && (
              <ConversationsTab
                sessions={sessions}
                selectedSession={selectedSession}
                messages={sessionMessages}
                onSelect={handleViewSession}
                userName={selectedUser?.name}
              />
            )}
            {activeTab === 'reports' && (
              <ReportsTab report={weeklyReport} onGenerate={handleGenerateReport} userName={selectedUser?.name} dashboard={dashboard} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function OverviewTab({ dashboard }) {
  const { user, recentSessions, todayNudges, unresolvedAnomalies, nudgeStats, moodTrend } = dashboard;

  const totalNudges = nudgeStats?.overall?.total || 0;
  const ackNudges = nudgeStats?.overall?.acknowledged || 0;
  const adherenceRate = totalNudges > 0 ? Math.round((ackNudges / totalNudges) * 100) : 100;

  const avgMood = recentSessions.length > 0
    ? (recentSessions.reduce((s, r) => s + r.mood_score, 0) / recentSessions.length).toFixed(1)
    : 'N/A';

  const pieData = nudgeStats?.byType?.map(t => ({
    name: t.type.charAt(0).toUpperCase() + t.type.slice(1),
    value: t.acknowledged,
    total: t.total
  })) || [];

  return (
    <div className="tab-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8e7ff' }}><Activity size={24} color="#6C63FF" /></div>
          <div className="stat-info">
            <span className="stat-value">{recentSessions.length}</span>
            <span className="stat-label">Recent Conversations</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e3fafc' }}><Clock size={24} color="#00B4D8" /></div>
          <div className="stat-info">
            <span className="stat-value">{avgMood}</span>
            <span className="stat-label">Avg Mood Score</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e6fcf5' }}><CheckCircle size={24} color="#51CF66" /></div>
          <div className="stat-info">
            <span className="stat-value">{adherenceRate}%</span>
            <span className="stat-label">Nudge Adherence</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff3e0' }}><AlertTriangle size={24} color="#ff922b" /></div>
          <div className="stat-info">
            <span className="stat-value">{unresolvedAnomalies.length}</span>
            <span className="stat-label">Active Anomalies</span>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Mood Trend (Last 30 Days)</h3>
          {moodTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={moodTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avg_mood" name="Mood" stroke="#6C63FF" strokeWidth={2.5} dot={{ fill: '#6C63FF', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="no-data">No mood data available yet</p>}
        </div>

        <div className="chart-card">
          <h3>Nudge Adherence by Type</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value, total }) => `${name}: ${total > 0 ? Math.round((value / total) * 100) : 0}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="no-data">No nudge data available yet</p>}
        </div>
      </div>

      {unresolvedAnomalies.length > 0 && (
        <div className="alert-section">
          <h3><AlertTriangle size={18} /> Active Anomaly Flags</h3>
          {unresolvedAnomalies.map(a => (
            <div key={a.id} className={`anomaly-item severity-${a.severity}`}>
              <div className="anomaly-severity" style={{ background: SEVERITY_COLORS[a.severity] }}>{a.severity.toUpperCase()}</div>
              <div className="anomaly-details">
                <strong>{a.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong>
                <p>{a.description}</p>
                <span className="anomaly-time">{new Date(a.detected_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {todayNudges.length > 0 && (
        <div className="today-nudges">
          <h3><Bell size={18} /> Today's Health Nudges</h3>
          <div className="nudge-timeline">
            {todayNudges.map(n => {
              const Icon = TYPE_ICONS[n.type] || Pill;
              return (
                <div key={n.id} className={`timeline-item status-${n.status}`}>
                  <div className="timeline-icon" style={{ background: TYPE_COLORS[n.type] }}><Icon size={16} color="#fff" /></div>
                  <div className="timeline-info">
                    <strong>{n.name}</strong>
                    <span>{new Date(n.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className={`status-badge ${n.status}`}>{n.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SchedulesTab({ schedules, showForm, setShowForm, form, setForm, toggleDay, onCreate, onDelete, onTrigger }) {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Health Schedules</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Add Schedule
        </button>
      </div>

      {showForm && (
        <form className="schedule-form card" onSubmit={onCreate}>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="medication">Medication</option>
                <option value="meal">Meal</option>
                <option value="exercise">Exercise</option>
                <option value="hydration">Hydration</option>
              </select>
            </div>
            <div className="form-group">
              <label>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Blood Pressure Pill" required />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" value={form.scheduledTime} onChange={e => setForm({ ...form, scheduledTime: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
          </div>
          <div className="form-group">
            <label>Days</label>
            <div className="day-selector">
              {DAYS.map(d => (
                <button key={d} type="button" className={`day-btn ${form.daysOfWeek.includes(d) ? 'selected' : ''}`} onClick={() => toggleDay(d)}>{d}</button>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Create Schedule</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="schedules-grid">
        {['medication', 'meal', 'exercise', 'hydration'].map(type => {
          const items = schedules.filter(s => s.type === type);
          if (items.length === 0) return null;
          const Icon = TYPE_ICONS[type];
          return (
            <div key={type} className="schedule-group">
              <h3 style={{ color: TYPE_COLORS[type] }}><Icon size={18} /> {type.charAt(0).toUpperCase() + type.slice(1)}s</h3>
              {items.map(s => (
                <div key={s.id} className="schedule-item card">
                  <div className="schedule-info">
                    <strong>{s.name}</strong>
                    <span className="schedule-time">{s.scheduled_time}</span>
                    {s.description && <p className="schedule-desc">{s.description}</p>}
                    <span className="schedule-days">{JSON.parse(s.days_of_week).join(', ')}</span>
                  </div>
                  <div className="schedule-actions">
                    <button className="btn-sm btn-nudge" onClick={() => onTrigger(s.id)} title="Send nudge now"><Bell size={14} /></button>
                    <button className="btn-sm btn-danger" onClick={() => onDelete(s.id)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnomaliesTab({ anomalies, onResolve, onDetect }) {
  const unresolved = anomalies.filter(a => !a.resolved);
  const resolved = anomalies.filter(a => a.resolved);

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Anomaly Flags</h2>
        <button className="btn-secondary" onClick={onDetect}><RefreshCw size={16} /> Run Detection</button>
      </div>

      {unresolved.length === 0 && <div className="empty-state"><CheckCircle size={48} color="#51CF66" /><p>No active anomalies. Everything looks good!</p></div>}

      {unresolved.map(a => (
        <div key={a.id} className={`anomaly-card severity-${a.severity}`}>
          <div className="anomaly-header">
            <span className="anomaly-badge" style={{ background: SEVERITY_COLORS[a.severity] }}>{a.severity.toUpperCase()}</span>
            <span className="anomaly-type">{a.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
            <span className="anomaly-time">{new Date(a.detected_at).toLocaleString()}</span>
          </div>
          <p className="anomaly-description">{a.description}</p>
          <div className="anomaly-actions">
            <button className="btn-sm btn-confirm" onClick={() => onResolve(a.id, true)}><CheckCircle size={14} /> Confirm & Resolve</button>
            <button className="btn-sm btn-dismiss-anomaly" onClick={() => onResolve(a.id, false)}><XCircle size={14} /> False Positive</button>
          </div>
        </div>
      ))}

      {resolved.length > 0 && (
        <>
          <h3 className="resolved-heading">Resolved ({resolved.length})</h3>
          {resolved.map(a => (
            <div key={a.id} className="anomaly-card resolved">
              <div className="anomaly-header">
                <span className="anomaly-badge resolved-badge">RESOLVED</span>
                <span className="anomaly-type">{a.type.replace(/_/g, ' ')}</span>
                <span className="anomaly-time">{new Date(a.detected_at).toLocaleString()}</span>
              </div>
              <p className="anomaly-description">{a.description}</p>
              {a.caregiver_notes && <p className="caregiver-notes">Notes: {a.caregiver_notes}</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function ConversationsTab({ sessions, selectedSession, messages, onSelect, userName }) {
  return (
    <div className="tab-content conversations-tab">
      <h2>Conversation History</h2>
      <div className="conversations-layout">
        <div className="sessions-list">
          {sessions.length === 0 && <p className="no-data">No conversations yet</p>}
          {sessions.map(s => (
            <button
              key={s.id}
              className={`session-item ${selectedSession?.id === s.id ? 'active' : ''}`}
              onClick={() => onSelect(s)}
            >
              <div className="session-date">{new Date(s.started_at).toLocaleDateString()}</div>
              <div className="session-meta">
                <span>Mood: {s.mood_score?.toFixed(1)}/5</span>
                <span>{s.duration_seconds ? `${Math.round(s.duration_seconds / 60)}min` : 'Active'}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="session-detail">
          {selectedSession ? (
            <>
              <div className="session-detail-header">
                <h3>{new Date(selectedSession.started_at).toLocaleDateString()} — Mood: {selectedSession.mood_score?.toFixed(1)}/5</h3>
              </div>
              <div className="session-messages">
                {messages.map((m, i) => (
                  <div key={i} className={`message-row ${m.role}`}>
                    <span className="message-role">{m.role === 'user' ? userName?.split(' ')[0] : 'Companion'}</span>
                    <p>{m.content}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state"><Users size={48} color="#ccc" /><p>Select a conversation to view details</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportsTab({ report, onGenerate, userName, dashboard }) {
  const moodData = dashboard?.moodTrend || [];
  const nudgeStats = dashboard?.nudgeStats;

  const adherenceData = nudgeStats?.byType?.map(t => ({
    name: t.type.charAt(0).toUpperCase() + t.type.slice(1),
    adherence: t.total > 0 ? Math.round((t.acknowledged / t.total) * 100) : 100,
    missed: t.total > 0 ? Math.round((t.missed / t.total) * 100) : 0
  })) || [];

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Weekly Behavioral Report</h2>
        <button className="btn-primary" onClick={onGenerate}><FileText size={16} /> Generate Report</button>
      </div>

      {report && (
        <div className="report-content">
          <div className="report-header card">
            <h3>Report for {report.userName}</h3>
            <p className="report-period">{report.weekStart} to {report.weekEnd}</p>
          </div>

          <div className="report-stats">
            <div className="report-stat card">
              <span className="stat-number">{report.totalConversations}</span>
              <span className="stat-desc">Conversations</span>
            </div>
            <div className="report-stat card">
              <span className="stat-number">{report.avgMoodScore?.toFixed(1)}</span>
              <span className="stat-desc">Avg Mood</span>
            </div>
            <div className="report-stat card">
              <span className="stat-number">{Math.round((report.medicationAdherence || 0) * 100)}%</span>
              <span className="stat-desc">Med Adherence</span>
            </div>
            <div className="report-stat card">
              <span className="stat-number">{report.anomaliesCount}</span>
              <span className="stat-desc">Anomalies</span>
            </div>
          </div>

          {report.narrativeSummary && (
            <div className="report-narrative card">
              <h4>AI-Generated Summary</h4>
              <pre className="narrative-text">{report.narrativeSummary}</pre>
            </div>
          )}
        </div>
      )}

      <div className="charts-row">
        {adherenceData.length > 0 && (
          <div className="chart-card">
            <h3>Adherence by Category (%)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={adherenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="adherence" name="Adherence %" fill="#51CF66" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" name="Missed %" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {moodData.length > 0 && (
          <div className="chart-card">
            <h3>30-Day Mood Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avg_mood" name="Mood" stroke="#6C63FF" strokeWidth={2} dot={{ fill: '#6C63FF' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {!report && (
        <div className="empty-state">
          <FileText size={48} color="#ccc" />
          <p>Click "Generate Report" to create a weekly behavioral summary for {userName}</p>
        </div>
      )}
    </div>
  );
}
