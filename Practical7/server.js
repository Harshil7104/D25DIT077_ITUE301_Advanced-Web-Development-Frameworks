const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// 1. Load environment variables
dotenv.config();

// 2. Initialize Express Application
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Connect to Database (Local MongoDB / Atlas / In-Memory Fallback)
connectDB();

// 4. Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 5. Serve Static Frontend Web UI & Interactive Tester
app.use(express.static(path.join(__dirname, 'public')));

// 6. API Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStates = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const stateCode = mongoose.connection.readyState;

  res.status(200).json({
    success: true,
    status: 'Practical 7 API Server is operational',
    timestamp: new Date().toISOString(),
    features: [
      'User Registration & Login with Bcrypt Hashing',
      'JWT Authentication & Verification (1h expiry)',
      'Protected Task CRUD Routes',
      'Pre-database Request Validation',
      '/me Current User Details Endpoint',
      '401 Auto-Redirect Client Expiry Handling & Logout'
    ],
    database: {
      status: dbStates[stateCode] || 'Unknown',
      readyState: stateCode,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A'
    }
  });
});

// 7. Mount REST API Routes
// Auth endpoints: /api/auth and /auth alias
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Protected Task endpoints: /tasks and /api/tasks alias
app.use('/tasks', taskRoutes);
app.use('/api/tasks', taskRoutes);

// 8. 404 Not Found and Centralized Error Handler
app.use(notFound);
app.use(errorHandler);

// 9. Start Server only when run directly
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 Practical 7: JWT Authentication & Bcrypt Task Manager`);
    console.log(`📡 Port:               ${PORT}`);
    console.log(`🌐 Live Dashboard:     http://localhost:${PORT}`);
    console.log(`🔐 Auth API:           http://localhost:${PORT}/api/auth`);
    console.log(`📝 Protected Tasks:    http://localhost:${PORT}/tasks`);
    console.log(`🏥 Health Check:       http://localhost:${PORT}/api/health`);
    console.log(`================================================================`);
  });
}

// Graceful unhandled rejection handler
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
});

module.exports = app;
