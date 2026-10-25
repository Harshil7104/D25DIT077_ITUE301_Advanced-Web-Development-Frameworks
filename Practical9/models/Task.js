const mongoose = require('mongoose');

/**
 * Task Schema Definition for Practical 9
 * 
 * Fields:
 *  - title (String, required): Task title. Min 3, max 100 characters. Trimmed.
 *  - description (String): Optional task description. Max 500 characters.
 *  - completed (Boolean, default false): Completion status.
 *  - priority (String, enum: ['low', 'medium', 'high'], default 'medium').
 *  - createdAt (Date, default Date.now).
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required and cannot be empty'],
      minlength: [3, 'Task title must be at least 3 characters long'],
      maxlength: [100, 'Task title cannot exceed 100 characters'],
      trim: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '`{VALUE}` is not a valid priority. Allowed: low, medium, high'
      },
      default: 'medium',
      lowercase: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Pre-save hook: Ensure whitespace is cleanly trimmed
taskSchema.pre('save', function (next) {
  if (this.title && typeof this.title === 'string') {
    this.title = this.title.trim();
  }
  if (this.description && typeof this.description === 'string') {
    this.description = this.description.trim();
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
