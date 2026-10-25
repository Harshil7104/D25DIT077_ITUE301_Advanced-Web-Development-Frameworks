import React from 'react';

/**
 * lazyWithMinDelay - Supplementary Problem 2 Implementation
 * 
 * Enforces a minimum delay before resolving dynamic imports to avoid
 * jarring loading state flickers on ultra-fast network connections.
 * 
 * @param {Function} importFactory - Dynamic import function, e.g. () => import('./Component')
 * @param {number} defaultDelayMs - Default minimum delay duration in ms (default: 300ms)
 * @returns {React.LazyExoticComponent} Lazy-loaded component with anti-flicker delay
 */
export function lazyWithMinDelay(importFactory, defaultDelayMs = 300) {
  return React.lazy(() => {
    // Check if the user selected a custom delay via the UI selector
    const runtimeDelay = typeof window !== 'undefined' && window.__ACTIVE_FALLBACK_DELAY !== undefined
      ? window.__ACTIVE_FALLBACK_DELAY
      : defaultDelayMs;

    const startTime = performance.now();

    return Promise.all([
      importFactory(),
      new Promise((resolve) => setTimeout(resolve, runtimeDelay))
    ]).then(([moduleExports]) => {
      const duration = (performance.now() - startTime).toFixed(1);
      console.log(`[Code-Splitting] Loaded chunk in ${duration}ms (Min-delay configured: ${runtimeDelay}ms)`);
      return moduleExports;
    });
  });
}
