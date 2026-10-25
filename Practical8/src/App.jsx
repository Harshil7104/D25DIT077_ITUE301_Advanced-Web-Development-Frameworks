import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import RouteFallback from './components/RouteFallback';
import Dashboard from './pages/Dashboard';
import { lazyWithMinDelay } from './utils/lazyWithDelay';

// ============================================================================
// Core Requirement: Apply React.lazy() and Suspense to route-based components
// Supplementary Problem 2: Enforce 300ms minimum delay fallback to prevent flickers
// ============================================================================

// 1. Lazy loaded Projects Route Chunk
const Projects = lazyWithMinDelay(
  () => import('./pages/Projects'),
  300
);

// 2. Lazy loaded Analytics Route Chunk (Contains heavy Chart.js)
const Analytics = lazyWithMinDelay(
  () => import('./pages/Analytics'),
  300
);

// 3. Lazy loaded Contact Route Chunk
const Contact = lazyWithMinDelay(
  () => import('./pages/Contact'),
  300
);

// 4. Lazy loaded Profiler Demo Route Chunk
const ProfilerDemo = lazyWithMinDelay(
  () => import('./pages/ProfilerDemo'),
  300
);

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeDelay, setActiveDelay] = useState(300);

  // Sync theme with document attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-layout">
      {/* Navigation Header */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        activeDelay={activeDelay}
        setActiveDelay={setActiveDelay}
      />

      {/* Main Page Area with Route-Based Suspense Boundaries */}
      <main className="main-content">
        <Routes>
          {/* Static Immediate Entry Route */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* Lazy Loaded Projects Route */}
          <Route
            path="/projects"
            element={
              <Suspense fallback={<RouteFallback routeName="Projects" chunkName="Projects.js" />}>
                <Projects />
              </Suspense>
            }
          />

          {/* Lazy Loaded Analytics & Heavy Chart Route */}
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<RouteFallback routeName="Analytics & Chart.js Engine" chunkName="Analytics.js + vendor-chartjs.js" />}>
                <Analytics />
              </Suspense>
            }
          />

          {/* Lazy Loaded Contact Route */}
          <Route
            path="/contact"
            element={
              <Suspense fallback={<RouteFallback routeName="Contact & Feedback" chunkName="Contact.js" />}>
                <Contact />
              </Suspense>
            }
          />

          {/* Lazy Loaded Profiler Audit Demo Route */}
          <Route
            path="/profiler-demo"
            element={
              <Suspense fallback={<RouteFallback routeName="Profiler Audit Lab" chunkName="ProfilerDemo.js" />}>
                <ProfilerDemo />
              </Suspense>
            }
          />
        </Routes>
      </main>

      {/* Persistent Academic Footer */}
      <Footer />
    </div>
  );
}
