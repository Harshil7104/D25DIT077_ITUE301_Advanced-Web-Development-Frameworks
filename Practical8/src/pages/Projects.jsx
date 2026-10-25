import React, { useState, useEffect } from 'react';

// Default mock repositories in case of GitHub rate limiting (HTTP 403)
const DEFAULT_PROJECTS = [
  {
    id: 1,
    name: 'D25DIT077_ITUE301_Advanced-Web-Development-Frameworks',
    description: 'Practical coursework repository containing React code-splitting, REST APIs, JWT authentication, and Express middleware.',
    stargazers_count: 5,
    language: 'JavaScript',
    html_url: 'https://github.com/Harshil7104/D25DIT077_ITUE301_Advanced-Web-Development-Frameworks',
    topics: ['react', 'vite', 'express', 'mongodb', 'performance']
  },
  {
    id: 2,
    name: 'Task-Management-System-MERN',
    description: 'Production-ready Task Management application featuring JWT authentication, Bcrypt password hashing, and role-based access.',
    stargazers_count: 12,
    language: 'JavaScript',
    html_url: 'https://github.com/Harshil7104',
    topics: ['mern', 'jwt', 'mongoose', 'rest-api']
  },
  {
    id: 3,
    name: 'React-Performance-Profiler-Toolkit',
    description: 'Benchmarking tools and React DevTools Profiler audit demonstrations for identifying memoization leaks and re-renders.',
    stargazers_count: 8,
    language: 'TypeScript',
    html_url: 'https://github.com/Harshil7104',
    topics: ['profiler', 'react-memo', 'use-callback', 'code-splitting']
  },
  {
    id: 4,
    name: 'Student-Portfolio-Vite',
    description: 'Modern developer portfolio with dynamic routing, dark/light themes, and responsive design systems.',
    stargazers_count: 3,
    language: 'CSS / React',
    html_url: 'https://github.com/Harshil7104',
    topics: ['react-router', 'responsive-design', 'glassmorphism']
  }
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState('All');

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://api.github.com/users/Harshil7104/repos');
      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status} (Rate limited). Using cached projects.`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setProjects(data);
      } else {
        setProjects(DEFAULT_PROJECTS);
      }
    } catch (err) {
      console.warn('[Projects Page]', err.message);
      // Seamless fallback to rich default projects
      setProjects(DEFAULT_PROJECTS);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTech = selectedTech === 'All' || (project.language && project.language.toLowerCase() === selectedTech.toLowerCase());
    return matchesSearch && matchesTech;
  });

  return (
    <div className="page-projects">
      {/* Route Header Banner */}
      <div className="page-header">
        <span className="page-badge" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.1)' }}>
          📦 Lazy Loaded Chunk &bull; Projects Route (assets/Projects-[hash].js)
        </span>
        <h2 className="page-title">Project Repositories &amp; Modules</h2>
        <p className="page-subtitle">
          This component was fetched over the network on-demand using <code>React.lazy()</code> and wrapped
          in a <code>&lt;Suspense&gt;</code> boundary with our custom anti-flicker delay.
        </p>
      </div>

      {/* Chunk Diagnostics Card */}
      <div className="card-panel" style={{ padding: '1.2rem 1.6rem', marginBottom: '1.5rem', background: 'rgba(6, 182, 212, 0.05)', borderColor: 'rgba(6, 182, 212, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.2rem' }}>⚡</span>
            <div>
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>Code-Splitting Verification:</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Inspect the <strong>Browser DevTools &rarr; Network Tab</strong> to verify that this route loaded its own independent <code>.js</code> chunk.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchRepositories}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            🔄 Re-fetch Repos
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flex: '1', minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search repositories by name or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label htmlFor="techFilter" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Language:</label>
            <select
              id="techFilter"
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="delay-select"
              style={{ padding: '0.5rem 0.8rem' }}
            >
              <option value="All">All Languages</option>
              <option value="JavaScript">JavaScript</option>
              <option value="TypeScript">TypeScript</option>
              <option value="CSS / React">CSS / React</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <span className="pulsing-dot" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
          Fetching live repositories from GitHub...
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="items-grid">
          {filteredProjects.map((repo) => (
            <div key={repo.id} className="task-item-card">
              <div className="task-top">
                <span className="priority-badge priority-low" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                  {repo.language || 'Code Repository'}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--accent-amber)', fontWeight: '600' }}>
                  ⭐ {repo.stargazers_count}
                </span>
              </div>

              <div>
                <h3 className="task-title" style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {repo.name}
                </h3>
                <p className="task-desc">
                  {repo.description || 'Comprehensive web development repository containing practical exercises.'}
                </p>
              </div>

              <div className="task-meta">
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Author: Harshil7104
                </span>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                >
                  View Code &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No projects found matching "{searchTerm}".</p>
          <button type="button" onClick={() => { setSearchTerm(''); setSelectedTech('All'); }} className="btn btn-secondary">
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
