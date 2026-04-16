import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Shield, Users, Mic } from 'lucide-react';
import { api } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => {});
  }, []);

  const handleCaregiverLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.loginCaregiver(email, pin);
      localStorage.setItem('caregiver', JSON.stringify(data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <div className="login-page">
        <div className="login-hero">
          <div className="logo-area">
            <div className="logo-icon"><Heart size={40} /></div>
            <h1>ElderCare Companion</h1>
            <p>Your caring AI companion for daily conversations and health wellness</p>
          </div>

          <div className="mode-cards">
            <button className="mode-card elderly-card" onClick={() => setMode('elderly')}>
              <div className="mode-icon"><Mic size={48} /></div>
              <h2>I'm an Elder User</h2>
              <p>Start a voice conversation with your caring companion</p>
              <span className="mode-hint">Tap to begin</span>
            </button>

            <button className="mode-card caregiver-card" onClick={() => setMode('caregiver')}>
              <div className="mode-icon"><Shield size={48} /></div>
              <h2>I'm a Caregiver</h2>
              <p>Access the monitoring dashboard and manage health schedules</p>
              <span className="mode-hint">Tap to login</span>
            </button>
          </div>

          <div className="login-features">
            <div className="feature"><Heart size={18} /> <span>Empathetic Conversations</span></div>
            <div className="feature"><Users size={18} /> <span>Caregiver Dashboard</span></div>
            <div className="feature"><Shield size={18} /> <span>Anomaly Detection</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'elderly') {
    return (
      <div className="login-page">
        <div className="login-hero">
          <button className="back-btn" onClick={() => setMode(null)}>&larr; Back</button>
          <div className="logo-area">
            <div className="logo-icon elderly-icon"><Mic size={40} /></div>
            <h1>Welcome!</h1>
            <p>Choose your name to start chatting</p>
          </div>

          <div className="user-grid">
            {users.map(user => (
              <button
                key={user.id}
                className="user-card"
                style={{ '--accent': user.avatar_color }}
                onClick={() => navigate(`/companion/${user.id}`)}
              >
                <div className="user-avatar" style={{ background: user.avatar_color }}>
                  {user.name.charAt(0)}
                </div>
                <span className="user-name">{user.name}</span>
                {user.age && <span className="user-age">Age {user.age}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-hero">
        <button className="back-btn" onClick={() => setMode(null)}>&larr; Back</button>
        <div className="logo-area">
          <div className="logo-icon caregiver-icon"><Shield size={40} /></div>
          <h1>Caregiver Login</h1>
          <p>Access the monitoring dashboard</p>
        </div>

        <form className="login-form" onSubmit={handleCaregiverLogin}>
          {error && <div className="form-error">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@example.com" required />
          </div>
          <div className="form-group">
            <label>PIN</label>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter your PIN" required maxLength={6} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>
          <p className="demo-hint">Demo: sarah@example.com / 1234</p>
        </form>
      </div>
    </div>
  );
}
