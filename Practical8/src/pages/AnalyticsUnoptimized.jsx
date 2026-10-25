import React from 'react';
// Direct STATIC import of heavy Chart.js component (No React.lazy, No Suspense)
import TaskDistributionChart from '../components/TaskDistributionChart';

export default function AnalyticsUnoptimized() {
  return (
    <div className="page-analytics">
      <div className="page-header">
        <span className="page-badge" style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.1)' }}>
          ⚠️ Monolithic Static Import &bull; Bloats Initial Bundle
        </span>
        <h2 className="page-title">Analytics (Unoptimized Baseline)</h2>
        <p className="page-subtitle">
          Chart.js is statically imported, forcing every single user to download all charting code (~182 KB)
          immediately on initial page load, degrading First Contentful Paint.
        </p>
      </div>

      <div className="card-panel">
        <TaskDistributionChart />
      </div>
    </div>
  );
}
