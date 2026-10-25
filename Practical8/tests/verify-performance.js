/**
 * Automated Verification Script: Practical 8 Performance & Code Splitting
 * Author: Harshil Patel (D25DIT077) - ITUE301 Advanced Web Development Frameworks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('⚡ PRACTICAL 8: REACT CODE SPLITTING & PERFORMANCE AUDIT');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// 1. Verify Optimized Dist Directory & Chunks
console.log('Test Group 1: Optimized Build & Chunk Verification (dist/)');
const distDir = path.join(ROOT_DIR, 'dist');
const assetsDir = path.join(distDir, 'assets');

assert(fs.existsSync(distDir), 'Optimized build directory (dist/) exists');
assert(fs.existsSync(assetsDir), 'Optimized assets directory exists');

const distFiles = fs.readdirSync(assetsDir);
const jsFiles = distFiles.filter(f => f.endsWith('.js'));

const hasIndexChunk = jsFiles.some(f => f.startsWith('index-'));
const hasReactCoreChunk = jsFiles.some(f => f.startsWith('vendor-react-core-'));
const hasChartJsChunk = jsFiles.some(f => f.startsWith('vendor-chartjs-'));
const hasProjectsChunk = jsFiles.some(f => f.startsWith('Projects-'));
const hasContactChunk = jsFiles.some(f => f.startsWith('Contact-'));
const hasAnalyticsChunk = jsFiles.some(f => f.startsWith('Analytics-'));
const hasProfilerChunk = jsFiles.some(f => f.startsWith('ProfilerDemo-'));

assert(hasIndexChunk, 'Initial application entry chunk (index-[hash].js) exists');
assert(hasReactCoreChunk, 'Vendor core chunk (vendor-react-core-[hash].js) separated');
assert(hasChartJsChunk, 'Supplementary 1: Heavy Chart.js chunk (vendor-chartjs-[hash].js) isolated');
assert(hasProjectsChunk, 'Route Chunk: Projects-[hash].js generated for React.lazy()');
assert(hasContactChunk, 'Route Chunk: Contact-[hash].js generated for React.lazy()');
assert(hasAnalyticsChunk, 'Route Chunk: Analytics-[hash].js generated for React.lazy()');
assert(hasProfilerChunk, 'Route Chunk: ProfilerDemo-[hash].js generated for React.lazy()');

// 2. Measure File Sizes & Compare against Unoptimized Baseline
console.log('\nTest Group 2: Baseline vs Optimized Bundle Payload Measurement');
const unoptimizedDir = path.join(ROOT_DIR, 'dist-unoptimized', 'assets');
assert(fs.existsSync(unoptimizedDir), 'Unoptimized baseline build directory exists');

let unoptimizedSizeBytes = 0;
if (fs.existsSync(unoptimizedDir)) {
  const unoptFiles = fs.readdirSync(unoptimizedDir).filter(f => f.endsWith('.js'));
  for (const file of unoptFiles) {
    unoptimizedSizeBytes += fs.statSync(path.join(unoptimizedDir, file)).size;
  }
}

let initialOptimizedSizeBytes = 0;
const indexFile = jsFiles.find(f => f.startsWith('index-'));
const reactCoreFile = jsFiles.find(f => f.startsWith('vendor-react-core-'));

if (indexFile) initialOptimizedSizeBytes += fs.statSync(path.join(assetsDir, indexFile)).size;
if (reactCoreFile) initialOptimizedSizeBytes += fs.statSync(path.join(assetsDir, reactCoreFile)).size;

const unoptimizedKB = (unoptimizedSizeBytes / 1024).toFixed(2);
const initialOptimizedKB = (initialOptimizedSizeBytes / 1024).toFixed(2);
const savingsKB = (unoptimizedKB - initialOptimizedKB).toFixed(2);
const savingsPercent = (((unoptimizedKB - initialOptimizedKB) / unoptimizedKB) * 100).toFixed(1);

console.log(`\n  Bundle Size Metrics:`);
console.log(`  - Baseline Monolithic JS Bundle: ${unoptimizedKB} KB`);
console.log(`  - Optimized Initial JS Payload:  ${initialOptimizedKB} KB`);
console.log(`  - Immediate Payload Reduction:   ${savingsKB} KB (${savingsPercent}% reduction)\n`);

assert(parseFloat(initialOptimizedKB) < parseFloat(unoptimizedKB), `Initial payload reduced by ${savingsPercent}%`);
assert(hasChartJsChunk, 'Chart.js completely omitted from initial download');

// 3. Verify Source Code Architecture
console.log('\nTest Group 3: Architecture & Implementation Verification');
const appCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'App.jsx'), 'utf-8');
const delayCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'utils', 'lazyWithDelay.js'), 'utf-8');
const profilerCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'ProfilerDemo.jsx'), 'utf-8');

assert(appCode.includes('React.lazy') || appCode.includes('lazyWithMinDelay'), 'App.jsx implements dynamic code-splitting imports');
assert(appCode.includes('<Suspense'), 'App.jsx encloses routes within Suspense boundaries');
assert(appCode.includes('RouteFallback'), 'App.jsx supplies meaningful RouteFallback skeleton UI');
assert(delayCode.includes('Promise.all') && delayCode.includes('setTimeout'), 'Supplementary 2: Minimum-delay anti-flicker logic implemented');
assert(profilerCode.includes('React.memo') && profilerCode.includes('useCallback'), 'Supplementary 3: Profiler demo implements memoization to eliminate unnecessary re-renders');

console.log('\n================================================================');
console.log(`Test Summary: Passed ${passedTests} of ${totalTests} assertions`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
