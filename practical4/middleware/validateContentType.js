// Content-Type Validation Middleware
// Rejects POST and PUT requests that are not application/json.
const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.headers['content-type'];

    // Check if Content-Type is missing or doesn't start with application/json
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type must be application/json'
      });
    }
  }
  next(); // Header is valid, proceed
};

module.exports = validateContentType;
