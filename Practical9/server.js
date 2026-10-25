const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { getCurrentTTL } = require('./config/cache');
const cacheService = require('./services/cacheService');
const Task = require('./models/Task');
const taskRoutes = require('./routes/taskRoutes');
const cacheRoutes = require('./routes/cacheRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// 1. Load environment variables
dotenv.config();

// 2. Initialize Express Application
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Connect to Database (Local MongoDB / Atlas / In-Memory Fallback)
const initPromise = connectDB().then(async () => {
  // Auto-seed initial demo tasks if database is empty
  try {
    const taskCount = await Task.countDocuments();
    if (taskCount === 0) {
      console.log('🌱 Seeding initial tasks for benchmark testing...');
      await Task.insertMany([
        {
          title: 'Implement in-memory caching with node-cache',
          description: 'Add node-cache layer to Task Management backend for 60s TTL',
          completed: true,
          priority: 'high'
        },
        {
          title: 'Benchmark API response times with Postman',
          description: 'Record cached vs uncached response times across 3+ sample iterations',
          completed: false,
          priority: 'high'
        },
        {
          title: 'Verify cache invalidation on write ops',
          description: 'Ensure POST, PUT, DELETE write operations clear stale cache data',
          completed: false,
          priority: 'medium'
        },
        {
          title: 'Implement single-task cache isolation',
          description: 'Cache GET /tasks/:id independently from all-tasks endpoint',
          completed: true,
          priority: 'medium'
        },
        {
          title: 'Expose cache hit/miss debug statistics',
          description: 'Provide live counters, hit ratio, and active key monitoring',
          completed: true,
          priority: 'low'
        },
        {
          title: 'Document TTL trade-offs and performance analysis',
          description: 'Analyze staleness vs speed trade-offs with 5s, 30s, 60s, and 300s TTLs',
          completed: false,
          priority: 'medium'
        }
      ]);
      console.log('✅ Seeded 6 sample tasks into database');
    }
  } catch (seedErr) {
    console.warn('⚠️ Seeding check error:', seedErr.message);
  }
});

// 4. Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 5. Serve Static Frontend Web UI & Benchmark Dashboard
app.use(express.static(path.join(__dirname, 'public')));

// 6. API Health & Status Endpoint
app.get('/api/health', (req, res) => {
  const dbStates = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const stateCode = mongoose.connection.readyState;
  const stats = cacheService.getStats();

  res.status(200).json({
    success: true,
    status: 'Practical 9 Caching Backend is operational',
    timestamp: new Date().toISOString(),
    practical: 'Practical 9: In-Memory Caching using node-cache',
    author: 'D25DIT077',
    features: [
      'In-memory caching of GET /tasks with configurable TTL (default: 60s)',
      'Single-task GET /tasks/:id endpoint cached independently',
      'Automatic cache invalidation on write operations (POST, PUT, DELETE)',
      'Live cache-hit / cache-miss counters and debug endpoint',
      'Dynamic TTL configuration for performance vs staleness experimentation',
      'High-resolution response time headers (X-Response-Time, X-Cache)'
    ],
    cache: {
      defaultTTL: stats.summary.defaultTTL,
      currentTTL: stats.summary.currentTTL,
      hits: stats.summary.hits,
      misses: stats.summary.misses,
      hitRatio: stats.summary.hitRatio,
      activeKeys: stats.summary.currentActiveKeys
    },
    database: {
      status: dbStates[stateCode] || 'Unknown',
      readyState: stateCode,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A'
    }
  });
});

// 7. Mount REST API Routes
// Task Endpoints (/tasks and /api/tasks alias)
app.use('/tasks', taskRoutes);
app.use('/api/tasks', taskRoutes);

// Cache Debug & Control Endpoints (/api/cache and /cache alias)
app.use('/api/cache', cacheRoutes);
app.use('/cache', cacheRoutes);

// 8. 404 Not Found and Centralized Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// 9. Start Server only when executed directly
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 Practical 9: In-Memory Caching Backend (node-cache)`);
    console.log(`📡 Port:               ${PORT}`);
    console.log(`🌐 Live Dashboard:     http://localhost:${PORT}`);
    console.log(`📝 Task API:           http://localhost:${PORT}/tasks`);
    console.log(`📊 Cache Stats:        http://localhost:${PORT}/api/cache/stats`);
    console.log(`🔑 Cache Keys:         http://localhost:${PORT}/api/cache/keys`);
    console.log(`🏥 Health Check:       http://localhost:${PORT}/api/health`);
    console.log(`⏱️ Default TTL:        ${getCurrentTTL()} seconds`);
    console.log(`================================================================`);
  });
}

// Graceful unhandled rejection handler
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
});

// Export initPromise so tests can await full DB connection & seeding
module.exports = app;
module.exports.initPromise = initPromise;
