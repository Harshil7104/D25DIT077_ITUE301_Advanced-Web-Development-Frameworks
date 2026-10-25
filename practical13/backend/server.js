require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./middleware/logger');
const validateContentType = require('./middleware/validateContentType');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskdb';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// 1. Enable CORS for frontend-backend communication
app.use(cors());

// 2. Parse incoming JSON request bodies (Built-in Express middleware)
app.use(express.json());

// 3. Reject POST/PUT requests without application/json Content-Type
app.use(validateContentType);

// 4. Log details of every incoming request (Custom middleware)
app.use(logger);

// 5. Mount authentication routes (/register, /login, /auth/register, /auth/login)
app.use('/auth', authRoutes);
app.use('/', authRoutes);

// 6. Mount task management REST API routes under the /tasks prefix (Protected by JWT)
app.use('/tasks', taskRoutes);

// 7. Mount AI routes under /api/ai and /ai (Protected by JWT)
app.use('/api/ai', aiRoutes);
app.use('/ai', aiRoutes);

// 8. Default home route
app.get('/', (req, res) => {
  res.status(200).send('Task Management REST API with JWT Authentication is running.');
});

// 7. Handle 404 Not Found for undefined routes
app.use(notFoundHandler);

// 8. Global Error Handling Middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

