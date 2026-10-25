import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';

// ============================================================================
// BASELINE UNOPTIMIZED IMPLEMENTATION
// All routes & heavy dependencies statically imported into one monolithic bundle!
// ============================================================================
import Projects from './pages/Projects';
import Analytics from './pages/AnalyticsUnoptimized';
import Contact from './pages/Contact';
import ProfilerDemo from './pages/ProfilerDemo';

export default function AppUnoptimized() {
  const [theme, setTheme] = useState('dark');
  const [activeDelay, setActiveDelay] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-layout">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        activeDelay={activeDelay}
        setActiveDelay={setActiveDelay}
      />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profiler-demo" element={<ProfilerDemo />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
