import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function Header({ theme, toggleTheme, activeDelay, setActiveDelay }) {
  const handleDelayChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setActiveDelay(val);
    if (typeof window !== 'undefined') {
      window.__ACTIVE_FALLBACK_DELAY = val;
    }
  };

  return (
    <header className="main-header">
      <div className="header-container">
        {/* Brand / Logo */}
        <div className="brand-wrapper">
          <div className="brand-icon">⚡</div>
          <div className="brand-text">
            <h1>Task & Project Hub</h1>
            <div className="brand-tag">D25DIT077 &bull; Practical 8: React Performance</div>
          </div>
        </div>

        {/* Route Navigation Menu */}
        <nav aria-label="Main Navigation">
          <ul className="nav-menu">
            <li>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Projects</span>
                <span className="chunk-badge">lazy chunk</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Analytics</span>
                <span className="chunk-badge">chart.js</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Contact</span>
                <span className="chunk-badge">lazy chunk</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/profiler-demo" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Profiler Audit</span>
                <span className="chunk-badge" style={{ background: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)' }}>demo</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Supplementary Controls */}
        <div className="header-actions">
          {/* Anti-Flicker Delay Controller for Supplementary Problem 2 */}
          <div className="delay-simulator" title="Supplementary Problem 2: Minimum-Delay Fallback Selector">
            <label htmlFor="delaySelect" className="delay-label">
              <span>⏱️ Min-Delay:</span>
            </label>
            <select
              id="delaySelect"
              className="delay-select"
              value={activeDelay}
              onChange={handleDelayChange}
            >
              <option value="0">0ms (No Delay)</option>
              <option value="300">300ms (Anti-Flicker)</option>
              <option value="800">800ms (Slow 3G Simulation)</option>
            </select>
          </div>

          {/* Dark/Light Theme Toggle */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle Dark/Light Mode"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
