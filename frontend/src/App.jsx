import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ElderlyCompanion from './pages/ElderlyCompanion';
import CaregiverDashboard from './pages/CaregiverDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/companion/:userId" element={<ElderlyCompanion />} />
      <Route path="/dashboard" element={<CaregiverDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
