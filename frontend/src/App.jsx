import React, { useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navigation from "./components/Navigation";
import AuthProvider from "./components/AuthProvider";
import RoleInitializer from "./components/RoleInitializer";
import Dashboard from "./pages/Dashboard";
import PatientAllocation from "./pages/PatientAllocation";
import TherapyPlans from "./pages/TherapyPlans";
import Sessions from "./pages/Sessions";
import ProgressReports from "./pages/ProgressReports";
import Evaluations from "./pages/Evaluations";
import Analytics from "./pages/Analytics";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import "./App.css";
import "./styles/common.css";
import "./styles/enhanced.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  const [selectedRole, setSelectedRole] = useState('therapist');
  const roles = [
    { key: 'patient', label: 'Patient', icon: '🧍' },
    { key: 'therapist', label: 'Therapist', icon: '💬' },
    { key: 'doctor', label: 'Doctor', icon: '🩺' },
    { key: 'admin', label: 'Admin', icon: '👑' },
  ];

  const handleTileMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = (y - 0.5) * -10;
    const ry = (x - 0.5) * 12;
    el.style.setProperty('--rx', `${rx}deg`);
    el.style.setProperty('--ry', `${ry}deg`);
    el.style.setProperty('--px', `${x * 100}%`);
    el.style.setProperty('--py', `${y * 100}%`);
  };
  const handleTileLeave = (e) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', `0deg`);
    el.style.setProperty('--ry', `0deg`);
    el.style.setProperty('--px', `50%`);
    el.style.setProperty('--py', `50%`);
  };
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          <SignedOut>
            <div className="auth-container">
              <div className="auth-background">
                <div className="auth-shapes">
                  <div className="shape shape-1"></div>
                  <div className="shape shape-2"></div>
                  <div className="shape shape-3"></div>
                </div>
              </div>
              <div className="auth-card">
                <div className="auth-header">
                  <div className="auth-logo">
                    <div className="logo-icon">🏥</div>
                    <div className="logo-text">
                      <h1>Therapy CMS</h1>
                      <p className="logo-subtitle">Professional Case Management System</p>
                    </div>
                  </div>
                </div>
                
                <div className="auth-content">
                  <div className="welcome-message">
                    <h2>Welcome</h2>
                    <p>Select your account type to continue.</p>
                  </div>

                  <div className="role-selector">
                    {roles.map(r => (
                      <button
                        key={r.key}
                        className={`role-card tilt-3d ${selectedRole === r.key ? 'selected' : ''}`}
                        onMouseMove={handleTileMove}
                        onMouseLeave={handleTileLeave}
                        onClick={() => setSelectedRole(r.key)}
                        type="button"
                      >
                        <span className="role-icon">{r.icon}</span>
                        <span className="role-label">{r.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="auth-buttons">
                    <SignInButton mode="modal" afterSignInUrl={`/dashboard?intendedRole=${selectedRole}`} afterSignUpUrl={`/dashboard?setRole=${selectedRole}`}>
                      <button className="btn btn-primary btn-lg auth-button">
                        <span className="button-icon">🔑</span>
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal" afterSignInUrl={`/dashboard?intendedRole=${selectedRole}`} afterSignUpUrl={`/dashboard?setRole=${selectedRole}`}>
                      <button className="btn btn-secondary btn-lg auth-button">
                        <span className="button-icon">👤</span>
                        Create Account
                      </button>
                    </SignUpButton>
                  </div>

                  <div className="auth-features">
                    <div className="feature-item"><span className="feature-icon">📊</span><span>Analytics</span></div>
                    <div className="feature-item"><span className="feature-icon">🔒</span><span>Secure</span></div>
                    <div className="feature-item"><span className="feature-icon">⚡</span><span>Real-time</span></div>
                  </div>
                </div>
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            <AuthProvider>
              <RoleInitializer />
              <div className="app-layout">
                <Navigation />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/patient-allocation" element={<PatientAllocation />} />
                    <Route path="/therapy-plans" element={<TherapyPlans />} />
                    <Route path="/sessions" element={<Sessions />} />
                    <Route path="/progress-reports" element={<ProgressReports />} />
                    <Route path="/evaluations" element={<Evaluations />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/user-management" element={<UserManagement />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </main>
              </div>
            </AuthProvider>
          </SignedIn>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
