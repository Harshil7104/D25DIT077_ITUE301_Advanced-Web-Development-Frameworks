// Request Logging Middleware
// Logs details of every incoming request to the server console.
const logger = (req, res, next) => {
  const method = req.method;
  const url = req.url;
  // Get current timestamp formatted as YYYY-MM-DDTHH:mm:ss
  const timestamp = new Date().toISOString().substring(0, 19);

  console.log(`${method} ${url} - ${timestamp}`);
  next(); // Pass control to the next middleware/route handler
};

module.exports = logger;
