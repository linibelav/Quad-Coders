import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX, LogOut, Send, Bell, Check, X } from 'lucide-react';
import { api } from '../api';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';

export default function ElderlyCompanion() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [nudges, setNudges] = useState([]);
  const chatEndRef = useRef(null);
  const nudgeInterval = useRef(null);

  const { isListening, transcript, startListening, stopListening, resetTranscript, supported } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();

  useEffect(() => {
    api.getUser(userId).then(setUser).catch(() => navigate('/'));
  }, [userId, navigate]);

  useEffect(() => {
    if (user) {
      api.startSession(parseInt(userId)).then(data => {
        setSessionId(data.sessionId);
        const greeting = getGreeting(user.name);
        setMessages([{ role: 'companion', content: greeting }]);
        if (autoSpeak) speak(greeting);
      });
    }
    return () => {
      if (sessionId) api.endSession(sessionId).catch(() => {});
    };
  }, [user]);

  useEffect(() => {
    nudgeInterval.current = setInterval(() => {
      api.getPendingNudges(parseInt(userId)).then(n => {
        if (n.length > 0) setNudges(prev => [...prev, ...n]);
      }).catch(() => {});
    }, 15000);
    return () => clearInterval(nudgeInterval.current);
  }, [userId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isListening && transcript) {
      setInputText(transcript);
    }
  }, [isListening, transcript]);

  function getGreeting(name) {
    const hour = new Date().getHours();
    const first = name.split(' ')[0];
    if (hour < 12) return `Good morning, ${first}! How are you feeling today? I'm so happy to chat with you.`;
    if (hour < 17) return `Good afternoon, ${first}! It's lovely to talk with you. How has your day been so far?`;
    return `Good evening, ${first}! I hope you had a wonderful day. What's on your mind tonight?`;
  }

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !sessionId || isProcessing) return;

    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputText('');
    resetTranscript();
    setIsProcessing(true);

    try {
      const data = await api.sendMessage(sessionId, userMsg);
      setMessages(prev => [...prev, { role: 'companion', content: data.response }]);
      if (autoSpeak) speak(data.response);
    } catch {
      setMessages(prev => [...prev, { role: 'companion', content: "I'm sorry, I didn't quite catch that. Could you try again?" }]);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, isProcessing, autoSpeak, speak, resetTranscript]);

  const handleMicClick = () => {
    if (isSpeaking) stopSpeaking();
    if (isListening) {
      stopListening();
      setTimeout(() => {
        if (transcript) sendMessage(transcript);
      }, 500);
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const handleNudgeAck = async (nudge) => {
    try {
      await api.acknowledgeNudge(nudge.nudgeLogId);
      setNudges(prev => prev.filter(n => n.nudgeLogId !== nudge.nudgeLogId));
      const ackMsg = `Thank you for acknowledging your ${nudge.type} reminder! You're doing wonderfully taking care of yourself.`;
      setMessages(prev => [...prev, { role: 'companion', content: ackMsg }]);
      if (autoSpeak) speak(ackMsg);
    } catch { /* ignore */ }
  };

  const handleNudgeDismiss = (nudge) => {
    setNudges(prev => prev.filter(n => n.nudgeLogId !== nudge.nudgeLogId));
  };

  const handleEndSession = async () => {
    if (sessionId) {
      const farewell = "It was wonderful talking with you! Take care and remember, I'm always here whenever you want to chat. Goodbye!";
      setMessages(prev => [...prev, { role: 'companion', content: farewell }]);
      if (autoSpeak) speak(farewell);
      await api.endSession(sessionId).catch(() => {});
      setTimeout(() => navigate('/'), 4000);
    }
  };

  if (!user) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="companion-page">
      <header className="companion-header">
        <div className="companion-user-info">
          <div className="user-avatar-sm" style={{ background: user.avatar_color }}>
            {user.name.charAt(0)}
          </div>
          <span className="user-greeting">Hello, {user.name.split(' ')[0]}</span>
        </div>
        <div className="companion-actions">
          <button
            className={`icon-btn ${autoSpeak ? 'active' : ''}`}
            onClick={() => { setAutoSpeak(!autoSpeak); if (isSpeaking) stopSpeaking(); }}
            title={autoSpeak ? 'Mute voice' : 'Enable voice'}
          >
            {autoSpeak ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>
          <button className="icon-btn end-btn" onClick={handleEndSession} title="End conversation">
            <LogOut size={22} />
          </button>
        </div>
      </header>

      {nudges.length > 0 && (
        <div className="nudge-overlay">
          {nudges.map((nudge, i) => (
            <div key={nudge.nudgeLogId || i} className={`nudge-card nudge-${nudge.type}`}>
              <Bell size={20} className="nudge-bell" />
              <div className="nudge-content">
                <strong className="nudge-type">{nudge.type.charAt(0).toUpperCase() + nudge.type.slice(1)} Reminder</strong>
                <p>{nudge.message}</p>
              </div>
              <div className="nudge-actions">
                <button className="nudge-ack" onClick={() => handleNudgeAck(nudge)} title="Done!"><Check size={20} /></button>
                <button className="nudge-dismiss" onClick={() => handleNudgeDismiss(nudge)} title="Dismiss"><X size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="chat-area">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.role === 'companion' && <div className="bubble-avatar">EC</div>}
            <div className="bubble-content">
              <p>{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="bubble-avatar user-bubble-avatar" style={{ background: user.avatar_color }}>
                {user.name.charAt(0)}
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="chat-bubble companion">
            <div className="bubble-avatar">EC</div>
            <div className="bubble-content typing">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <div className="voice-section">
          <button
            className={`mic-button ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
            onClick={handleMicClick}
            disabled={isProcessing}
          >
            <div className="mic-ripple"></div>
            <div className="mic-ripple delay"></div>
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          <span className="mic-label">
            {isListening ? 'Listening... Tap to send' : isSpeaking ? 'Speaking...' : 'Tap to speak'}
          </span>
        </div>

        {isListening && transcript && (
          <div className="transcript-preview">{transcript}</div>
        )}

        <div className="text-input-row">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Or type your message here..."
            disabled={isProcessing}
          />
          <button className="send-btn" onClick={() => sendMessage(inputText)} disabled={!inputText.trim() || isProcessing}>
            <Send size={20} />
          </button>
        </div>

        {!supported && (
          <p className="speech-warning">Speech recognition is not supported in this browser. Please use Chrome for voice features.</p>
        )}
      </div>
    </div>
  );
}
