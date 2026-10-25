import React, { useState, useEffect } from 'react';

/**
 * RouteFallback - Meaningful Skeleton Fallback UI
 * 
 * Renders a high-fidelity skeleton placeholder while lazy-loaded
 * route chunks are fetched over the network.
 * 
 * @param {string} routeName - Name of the route being loaded (e.g. "Projects", "Contact")
 * @param {string} chunkName - Identifier of the dynamic JavaScript chunk
 */
export default function RouteFallback({ routeName = 'Route Component', chunkName = 'bundle-chunk.js' }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const interval = setInterval(() => {
      setElapsed(Math.round(performance.now() - start));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="route-fallback-container" role="status" aria-live="polite" aria-busy="true">
      {/* Fallback Telemetry Banner */}
      <div className="fallback-header-card">
        <div className="loading-telemetry-banner">
          <div className="telemetry-tag">
            <span className="pulsing-dot"></span>
            <span>Fetching {routeName} Chunk...</span>
          </div>
          <div className="chunk-load-info">
            <span>Asset: <code>{chunkName}</code></span> &bull; <span>Elapsed: {elapsed}ms</span>
          </div>
        </div>

        {/* Shimmering Title & Subtitle */}
        <div className="skeleton-shimmer skeleton-title"></div>
        <div className="skeleton-shimmer skeleton-subtitle"></div>

        {/* Indeterminate Route Loading Progress Bar */}
        <div className="skeleton-bar-progress">
          <div className="skeleton-progress-fill"></div>
        </div>
      </div>

      {/* Grid of Skeleton Cards to maintain layout stability (Prevents CLS) */}
      <div className="skeleton-cards-grid">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div key={idx} className="skeleton-card">
            <div className="skeleton-shimmer skeleton-pill"></div>
            <div className="skeleton-shimmer skeleton-card-title"></div>
            <div className="skeleton-shimmer skeleton-card-body"></div>
            <div className="skeleton-shimmer skeleton-card-body-short"></div>
            <div className="skeleton-footer">
              <div className="skeleton-shimmer skeleton-pill" style={{ width: '60px' }}></div>
              <div className="skeleton-shimmer skeleton-btn"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
