const mongoose = require('mongoose');

/**
 * Task Schema Definition for Practical 10
 * 
 * Fields:
 *  - title (String, required): Task title. Min 3, max 100 characters. Trimmed.
 *  - description (String): Optional task description. Max 500 characters.
 *  - assignedUser (String, required): Username or email of the assigned user.
 *  - completed (Boolean, default false): Completion status.
 *  - priority (String, enum: ['low', 'medium', 'high'], default 'medium').
 *  - createdAt, updatedAt: Timestamps automatically managed.
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
    assignedUser: {
      type: String,
      required: [true, 'Assigned user is required for background notifications'],
      trim: true,
      default: 'Harshil (D25DIT077)'
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
  if (this.assignedUser && typeof this.assignedUser === 'string') {
    this.assignedUser = this.assignedUser.trim();
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
