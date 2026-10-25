const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const eventRoutes = require('./routes/eventRoutes');
const errorHandler = require('./middleware/errorHandler');
const Task = require('./models/Task');
const notificationEmitter = require('./events/notificationEmitter');

// 1. Load environment variables
dotenv.config();

// 2. Initialize Express Application
const app = express();
const PORT = process.env.PORT || 5001;

// 3. Connect to Database (Local MongoDB / Atlas / In-Memory Fallback)
const initPromise = connectDB().then(async () => {
  // Auto-seed initial demo tasks if database is empty
  try {
    const count = await Task.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding initial tasks for Practical 10 demonstration...');
      await Task.insertMany([
        {
          title: 'Implement Node.js EventEmitter Notification System',
          description: 'Emit task-created and task-deleted background events with asynchronous non-blocking handlers.',
          assignedUser: 'Harshil (D25DIT077)',
          priority: 'high',
          completed: false
        },
        {
          title: 'Verify Asynchronous Execution Time Delta',
          description: 'Confirm API responds in milliseconds while simulated 2s background handler completes later.',
          assignedUser: 'Prof. Guide (ITUE301)',
          priority: 'medium',
          completed: false
        },
        {
          title: 'Configure EventEmitter Error Listener',
          description: 'Safely catch errors thrown in event handlers without halting the Node.js process.',
          assignedUser: 'Harshil (D25DIT077)',
          priority: 'high',
          completed: false
        }
      ]);
      console.log('✅ Demo tasks seeded successfully.');
    }
  } catch (seedErr) {
    console.warn(`⚠️ Seeding note: ${seedErr.message}`);
  }
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// 4. Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 5. Serve Static Web Assets
app.use(express.static(path.join(__dirname, 'public')));

// 6. Application Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);

// System Health & Diagnostics Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    student: 'Harshil (D25DIT077)',
    practical: 'Practical 10: Node.js EventEmitter Background Notification System',
    timestamp: new Date().toISOString(),
    eventEmitter: {
      registeredEvents: notificationEmitter.eventNames(),
      simulatedDelayMs: notificationEmitter.simulatedDelayMs,
      totalAuditLogs: notificationEmitter.auditLogs.length,
      totalErrorsLogged: notificationEmitter.errorLogs.length
    }
  });
});

// 7. Global Error Handler Middleware
app.use(errorHandler);

// 8. Start HTTP Server
let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 TaskFlow Notification Engine Running!`);
    console.log(`🌐 Local URL  : http://localhost:${PORT}`);
    console.log(`⚙️ Node Mode  : ${process.env.NODE_ENV || 'development'}`);
    console.log(`⚡ EventEmitter: Registered listeners for 'task-created', 'task-deleted', 'error'`);
    console.log(`⏱️ Slow Delay : ${notificationEmitter.simulatedDelayMs}ms simulated background execution`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
module.exports.server = server;
module.exports.initPromise = initPromise;
