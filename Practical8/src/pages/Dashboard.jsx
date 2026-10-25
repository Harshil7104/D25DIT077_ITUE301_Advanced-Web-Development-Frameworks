import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const INITIAL_TASKS = [
  {
    id: 't-101',
    title: 'Implement React.lazy() on Route Components',
    description: 'Split Projects and Contact routes into separate network chunks using dynamic imports and Suspense boundaries.',
    priority: 'high',
    completed: true,
    category: 'Optimization',
    dueDate: '2026-10-25'
  },
  {
    id: 't-102',
    title: 'Build Meaningful Skeleton Fallback UI',
    description: 'Provide high-fidelity shimmering skeleton cards and telemetry banners to avoid Cumulative Layout Shift (CLS).',
    priority: 'high',
    completed: true,
    category: 'UI/UX',
    dueDate: '2026-10-25'
  },
  {
    id: 't-103',
    title: 'Lazy Load Heavy Chart.js Component on Demand',
    description: 'Isolate third-party Chart.js library (~180KB) so it only downloads when the Analytics dashboard is requested.',
    priority: 'medium',
    completed: true,
    category: 'Bundle Optimization',
    dueDate: '2026-10-26'
  },
  {
    id: 't-104',
    title: 'Implement 300ms Minimum Delay Anti-Flicker Fallback',
    description: 'Enforce artificial minimum fallback threshold using Promise.all to avoid jarring flashes on fast local connections.',
    priority: 'medium',
    completed: true,
    category: 'User Experience',
    dueDate: '2026-10-26'
  },
  {
    id: 't-105',
    title: 'Audit & Eliminate Unnecessary Re-render with React.memo',
    description: 'Use React DevTools Profiler to catch unmemoized item re-renders and stabilize callbacks with useCallback.',
    priority: 'high',
    completed: false,
    category: 'Profiling',
    dueDate: '2026-10-27'
  },
  {
    id: 't-106',
    title: 'Document Bundle Size & Load Time Comparisons',
    description: 'Compare baseline monolithic bundle size against code-split chunks using Rollup Visualizer and Network DevTools.',
    priority: 'low',
    completed: false,
    category: 'Documentation',
    dueDate: '2026-10-27'
  }
];

export default function Dashboard() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', category: 'General' });

  // Toggle task completed status
  const handleToggle = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Delete task
  const handleDelete = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Add task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const taskObj = {
      id: `t-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || 'No description provided.',
      priority: newTask.priority,
      completed: false,
      category: newTask.category,
      dueDate: new Date().toISOString().split('T')[0]
    };

    setTasks(prev => [taskObj, ...prev]);
    setNewTask({ title: '', description: '', priority: 'medium', category: 'General' });
    setShowAddModal(false);
  };

  // Filtered tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
                          t.description.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'completed') return t.completed;
    if (filter === 'pending') return !t.completed;
    if (filter === 'high') return t.priority === 'high';
    return true;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && !t.completed).length;

  return (
    <div className="page-dashboard">
      {/* Route Header Banner */}
      <div className="page-header">
        <span className="page-badge">
          🚀 Entry Route &bull; Instant Initial Chunk
        </span>
        <h2 className="page-title">Task Management Dashboard</h2>
        <p className="page-subtitle">
          Core productivity hub loaded immediately in the primary bundle. Heavy secondary pages
          (Projects, Analytics, and Contact) are code-split and loaded asynchronously on-demand.
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Tasks</span>
            <span className="stat-icon">📋</span>
          </div>
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-desc">Tracked across 4 categories</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Completed</span>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{completedTasks}</div>
          <div className="stat-desc">{Math.round((completedTasks / (totalTasks || 1)) * 100)}% completion rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Pending</span>
            <span className="stat-icon">⏳</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{pendingTasks}</div>
          <div className="stat-desc">Awaiting execution</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">High Priority</span>
            <span className="stat-icon">🔥</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-rose)' }}>{highPriorityTasks}</div>
          <div className="stat-desc">Requires immediate action</div>
        </div>
      </div>

      {/* Main Task List Panel */}
      <div className="card-panel">
        <div className="panel-header">
          <div className="panel-title">
            <span>Active Sprint Tasks</span>
            <span className="chunk-badge">{filteredTasks.length} shown</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ width: '220px', padding: '0.5rem 0.85rem' }}
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="delay-select"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="completed">Completed Only</option>
              <option value="high">High Priority</option>
            </select>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              + New Task
            </button>
          </div>
        </div>

        {/* Task Cards Grid */}
        <div className="items-grid">
          {filteredTasks.map(task => (
            <div key={task.id} className="task-item-card" style={{ opacity: task.completed ? 0.7 : 1 }}>
              <div className="task-top">
                <span className={`priority-badge priority-${task.priority}`}>
                  {task.priority}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {task.category}
                </span>
              </div>

              <div>
                <h3
                  className="task-title"
                  style={{
                    textDecoration: task.completed ? 'line-through' : 'none',
                    marginBottom: '0.4rem'
                  }}
                >
                  {task.title}
                </h3>
                <p className="task-desc">{task.description}</p>
              </div>

              <div className="task-meta">
                <span>📅 Due: {task.dueDate}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleToggle(task.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    {task.completed ? '↩ Undo' : '✓ Done'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--accent-rose)' }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Splitting Architecture Overview Card */}
      <div className="card-panel" style={{ background: 'linear-gradient(180deg, var(--bg-card), rgba(99, 102, 241, 0.05))' }}>
        <div className="panel-title" style={{ marginBottom: '0.8rem' }}>
          <span>💡 Practical 8 Architecture Overview</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
          This application implements modern React performance techniques:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>1. Route-Based Lazy Loading</h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              <code>Projects</code> and <code>Contact</code> routes are split into separate JavaScript chunks fetched only when the user navigates to them.
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--accent-indigo)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>2. Heavy Third-Party Splitting</h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              The <code>chart.js</code> library (~180KB) is isolated in the <code>Analytics</code> route and loaded dynamically on-demand.
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--accent-emerald)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>3. Anti-Flicker Delay (300ms)</h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              Custom <code>lazyWithMinDelay()</code> wrapper prevents visual flicker of fallback spinners on ultra-fast connections.
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--accent-rose)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>4. Profiler Re-render Audit</h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              Live demonstration contrasting an unmemoized component suffering 50+ unnecessary re-renders against <code>React.memo</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card-panel" style={{ width: '100%', maxWidth: '480px', margin: 0 }}>
            <h3 className="panel-title" style={{ marginBottom: '1.2rem' }}>Create New Sprint Task</h3>
            <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optimize bundle chunking"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Provide context or acceptance criteria..."
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend"
                    value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                    className="input-field"
                  >
                  </input>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
