const express = require('express');
const logger = require('./middleware/logger');
const validateContentType = require('./middleware/validateContentType');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Parse incoming JSON request bodies (Built-in Express middleware)
app.use(express.json());

// 2. Reject POST/PUT requests without application/json Content-Type
app.use(validateContentType);

// 3. Log details of every incoming request (Custom middleware)
app.use(logger);

// 4. Mount task management REST API routes under the /tasks prefix
app.use('/tasks', taskRoutes);

// 5. Default home route (useful for checking if the server is running)
app.get('/', (req, res) => {
  res.status(200).send('Task Management REST API is running. Access endpoints at /tasks');
});

// 6. Handle 404 Not Found for undefined routes (MUST be registered after defined routes)
app.use(notFoundHandler);

// 7. Global Error Handling Middleware (MUST be registered last in the pipeline)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
