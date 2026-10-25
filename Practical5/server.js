const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// 1. Load environment variables
dotenv.config();

// 2. Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Connect to Database (Mongoose)
connectDB();

// 4. Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 5. Serve Static Frontend Web UI & Live Tester
app.use(express.static(path.join(__dirname, 'public')));

// 6. API Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStates = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const stateCode = mongoose.connection.readyState;

  res.status(200).json({
    success: true,
    status: 'Server is healthy and operational',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStates[stateCode] || 'Unknown',
      readyState: stateCode,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A'
    }
  });
});

// 7. Mount REST API Routes
app.use('/tasks', taskRoutes);

// 8. 404 and Global Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// 9. Start Server
const server = app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🚀 Practical 5: Task Management Backend (Mongoose/MongoDB)`);
  console.log(`📡 Port:               ${PORT}`);
  console.log(`🌐 Live Dashboard:     http://localhost:${PORT}`);
  console.log(`🔗 REST API Root:      http://localhost:${PORT}/tasks`);
  console.log(`🏥 Health Check:       http://localhost:${PORT}/api/health`);
  console.log(`========================================================`);
});

// Graceful unhandled rejection handler
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
});

module.exports = app;
