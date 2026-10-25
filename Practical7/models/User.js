const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema for Practical 7
 * 
 * Requirements:
 *  - User registration & login fields (name, email, password)
 *  - Unique, validated email address
 *  - Password hashing via bcrypt before saving to MongoDB
 *  - Password comparison helper method
 *  - Safe serialization (strips password from JSON output)
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/**
 * Pre-save Hook: Hash password using bcrypt before saving to MongoDB
 * Runs only if password field is created or modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare entered plaintext password with bcrypt hashed password in database
 * @param {string} enteredPassword - Plain text password from request
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Remove sensitive password field when converting document to JSON
 */
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
