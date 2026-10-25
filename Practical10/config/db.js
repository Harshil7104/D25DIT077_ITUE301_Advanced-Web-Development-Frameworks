const mongoose = require('mongoose');

let mongoMemoryServerInstance = null;

/**
 * Connect to MongoDB instance using Mongoose.
 * 
 * Supports:
 *  1. Local MongoDB (e.g. mongodb://127.0.0.1:27017/taskmanager_practical10)
 *  2. MongoDB Atlas Cloud Database (via MONGO_URI in .env)
 *  3. In-memory MongoDB Server fallback (mongodb-memory-server) for zero-config execution.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager_practical10';

  try {
    // Attempt standard connection with 3-second server selection timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Primary MongoDB unavailable at ${uri}: ${error.message}`);

    // Fallback: Try initializing mongodb-memory-server
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      console.log('🔄 Initializing in-memory MongoDB instance for zero-config execution...');

      mongoMemoryServerInstance = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServerInstance.getUri();

      const conn = await mongoose.connect(memoryUri);
      console.log(`✅ MongoDB In-Memory Server Connected: ${conn.connection.host}/${conn.connection.name}`);
      console.log(`💡 Memory Database URI: ${memoryUri}`);
      return conn;
    } catch (fallbackError) {
      console.error(`❌ MongoDB Connection Failed.`);
      console.error('👉 Option 1: Start local MongoDB service via "net start MongoDB"');
      console.error('👉 Option 2: Provide your MongoDB Atlas URI in .env: MONGO_URI=mongodb+srv://...');
      throw fallbackError;
    }
  }
};

/**
 * Graceful database disconnect (useful during testing teardown)
 */
const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
  }
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
