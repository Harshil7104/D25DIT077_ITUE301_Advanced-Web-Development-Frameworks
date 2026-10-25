const EventEmitter = require('events');

// Create a custom EventEmitter instance for task events
class TaskEventEmitter extends EventEmitter {}
const taskEvents = new TaskEventEmitter();

/**
 * 1. Error Event Listener
 * Catches and logs any errors emitted by event handlers, preventing uncaught exceptions.
 */
taskEvents.on('error', (err) => {
  console.error(`[EVENT ERROR] Handled error in EventEmitter: ${err.message}`);
});

/**
 * 2. Task-Created Event Listener
 * Simulates a slow background notification handler (e.g., 2000ms delay) such as sending emails.
 * Proves that the HTTP API responds immediately without waiting 2 seconds for this handler to finish.
 */
taskEvents.on('task-created', (data) => {
  setTimeout(() => {
    try {
      const handlerStartTime = new Date().toISOString();
      console.log(`[EVENT] Slow notification handler started at: ${handlerStartTime} (simulated 2s background job)`);

      // Test trigger for demonstrating the error event listener
      if (data.title === 'TRIGGER_ERROR_TEST') {
        throw new Error('Simulated failure inside task-created notification handler');
      }

      // Log the background notification
      console.log(
        `[NOTIFICATION] Task created: "${data.title}" | User: ${data.user} | Time: ${data.timestamp}`
      );

      const handlerEndTime = new Date().toISOString();
      console.log(`[EVENT] Notification completed at: ${handlerEndTime}`);
    } catch (err) {
      // Catch any error thrown inside this handler and route to the 'error' listener
      taskEvents.emit('error', err);
    }
  }, 2000); // 2000ms (2 seconds) simulation delay
});

/**
 * 3. Task-Deleted Event Listener (Second Event)
 * Asynchronously handles task deletion notifications.
 */
taskEvents.on('task-deleted', (data) => {
  setImmediate(() => {
    try {
      const handlerStartTime = new Date().toISOString();
      console.log(`[EVENT] Task-deleted notification handler started at: ${handlerStartTime}`);

      // Log a distinct deletion notification
      console.log(
        `[NOTIFICATION] [TASK DELETED] Task "${data.title}" (ID: ${data.id}) was permanently deleted | User: ${data.user} | Time: ${data.timestamp}`
      );

      const handlerEndTime = new Date().toISOString();
      console.log(`[EVENT] Task-deleted notification completed at: ${handlerEndTime}`);
    } catch (err) {
      taskEvents.emit('error', err);
    }
  });
});

module.exports = taskEvents;
