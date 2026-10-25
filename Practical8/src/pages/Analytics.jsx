import React, { useState, Suspense } from 'react';
import { lazyWithMinDelay } from '../utils/lazyWithDelay';

// Supplementary Problem 1:
// Lazy load the heavy third-party Chart.js component ONLY when the user views this page or triggers the analytics report.
const LazyTaskChart = lazyWithMinDelay(() => import('../components/TaskDistributionChart'), 300);

function ChartSkeletonFallback() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', width: '100%' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', height: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="skeleton-shimmer" style={{ height: '24px', width: '60%', margin: '0 auto' }}></div>
        <div className="skeleton-shimmer" style={{ width: '180px', height: '180px', borderRadius: '50%', margin: 'auto' }}></div>
        <div className="skeleton-shimmer" style={{ height: '14px', width: '40%', margin: '0 auto' }}></div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', height: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="skeleton-shimmer" style={{ height: '24px', width: '60%', margin: '0 auto' }}></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '200px' }}>
          <div className="skeleton-shimmer" style={{ width: '32px', height: '40%' }}></div>
          <div className="skeleton-shimmer" style={{ width: '32px', height: '70%' }}></div>
          <div className="skeleton-shimmer" style={{ width: '32px', height: '85%' }}></div>
          <div className="skeleton-shimmer" style={{ width: '32px', height: '60%' }}></div>
          <div className="skeleton-shimmer" style={{ width: '32px', height: '95%' }}></div>
        </div>
        <div className="skeleton-shimmer" style={{ height: '14px', width: '50%', margin: '0 auto' }}></div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [loadChart, setLoadChart] = useState(true);

  return (
    <div className="page-analytics">
      {/* Route Header Banner */}
      <div className="page-header">
        <span className="page-badge" style={{ color: 'var(--accent-indigo)', borderColor: 'rgba(99, 102, 241, 0.3)', background: 'rgba(99, 102, 241, 0.1)' }}>
          📊 Supplementary Problem 1 &bull; Heavy 3rd-Party Library Lazy Loading
        </span>
        <h2 className="page-title">Performance &amp; Velocity Analytics</h2>
        <p className="page-subtitle">
          Demonstrates isolating heavy third-party dependencies (<strong>Chart.js ~182 KB</strong>) into an on-demand chunk
          (<code>vendor-chartjs-[hash].js</code>) instead of bundling it into the main entry bundle.
        </p>
      </div>

      {/* Dependency Isolation Analysis Card */}
      <div className="card-panel" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.04))', borderColor: 'var(--border-highlight)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Heavy Third-Party Code Isolation: <code>chart.js</code>
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Without lazy loading, Chart.js would increase the initial application payload for <strong>all users</strong>, even if they only view the Dashboard!
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setLoadChart(!loadChart)}
          >
            {loadChart ? 'Unmount Chart Engine' : 'Mount & Load Chart Engine'}
          </button>
        </div>

        <div style={{ marginTop: '1.2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Package Size</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-rose)' }}>~182 KB (Minified)</strong>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Initial Bundle Impact</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>0 KB (Deferred)</strong>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Download Trigger</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>Route Mount Only</strong>
          </div>
        </div>
      </div>

      {/* Lazy-Loaded Chart Section */}
      <div className="card-panel">
        <div className="panel-header">
          <div className="panel-title">
            <span>Live Interactive Visualizations</span>
            <span className="chunk-badge">React.lazy() &bull; Suspense</span>
          </div>
        </div>

        {loadChart ? (
          <Suspense fallback={<ChartSkeletonFallback />}>
            <LazyTaskChart />
          </Suspense>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '1rem' }}>Chart component unmounted to illustrate memory & bundle isolation.</p>
            <button type="button" onClick={() => setLoadChart(true)} className="btn btn-primary">
              Load Chart Component
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
