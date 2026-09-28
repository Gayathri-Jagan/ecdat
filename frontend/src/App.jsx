import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Findings from './pages/Findings';
import Recommendations from './pages/Recommendations';
import CBOM from './pages/CBOM';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import Splash from './components/Splash';
import { isAuthenticated, getCurrentUser, logout } from './api';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(getCurrentUser());
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setAuthenticated(false);
    };
    window.addEventListener('ecdat_session_expired', handleExpired);
    return () => window.removeEventListener('ecdat_session_expired', handleExpired);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setAuthenticated(false);
  };

  if (showSplash) return <Splash onDone={() => setShowSplash(false)} />;

  if (!authenticated) return <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E6EBF5]">
      <header className="border-b border-[#22304A] bg-[#111A2B] px-6 py-3 flex items-center justify-between h-16">
        <div>
          <h1 className="text-lg font-bold">ECDAT</h1>
          <p className="text-xs text-[#8A93A6]">Enterprise Cryptographic Discovery and Analysis Tool</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#8A93A6]">
            {user?.username} · <span className="text-[#2BB6A3]">{user?.role}</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1 rounded border border-[#22304A] hover:border-[#F0504A] hover:text-[#F0504A]"
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/"                element={<Dashboard />} />
              <Route path="/findings"        element={<Findings />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/cbom"            element={<CBOM />} />
              <Route path="/settings"        element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}