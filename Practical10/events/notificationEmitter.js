const { EventEmitter } = require('events');

/**
 * TaskNotificationEmitter
 * 
 * Extends Node.js built-in EventEmitter to provide:
 * 1. Asynchronous non-blocking background notifications for 'task-created'
 * 2. Asynchronous background notifications for 'task-deleted'
 * 3. Graceful error handling via dedicated 'error' listener
 * 4. Configurable simulated slow notification delay (default: 2000ms)
 * 5. In-memory notification audit log for API verification & live frontend display
 */
class TaskNotificationEmitter extends EventEmitter {
  constructor() {
    super();

    // Default simulated slow notification delay in milliseconds (Supplementary 3)
    this.simulatedDelayMs = parseInt(process.env.SIMULATED_NOTIFICATION_DELAY_MS, 10) || 2000;

    // In-memory telemetry log of background events for inspection & reporting
    this.auditLogs = [];
    this.errorLogs = [];

    // Register event listeners
    this.registerListeners();
  }

  /**
   * Set the simulated slow notification delay dynamically
   * @param {number} ms 
   */
  setSimulatedDelay(ms) {
    this.simulatedDelayMs = Math.max(0, parseInt(ms, 10) || 0);
  }

  /**
   * Register core and supplementary event listeners
   */
  registerListeners() {
    // -------------------------------------------------------------------------
    // 1. PRIMARY EVENT: 'task-created'
    // -------------------------------------------------------------------------
    this.on('task-created', (payload) => {
      const handlerReceivedAt = new Date();
      const delay = payload.delayMs !== undefined ? payload.delayMs : this.simulatedDelayMs;

      // Check if caller specifically requested synchronous mode demonstration
      if (payload.isSync) {
        // SYNCHRONOUS BLOCKING DEMONSTRATION
        console.log(`\n⏳ [SYNC EVENT HANDLER] Blocking thread synchronously for ${delay}ms...`);
        const blockUntil = Date.now() + delay;
        while (Date.now() < blockUntil) {
          // Synchronously blocks the single Node.js event loop thread
        }
        const handlerExecutedAt = new Date();
        const logEntry = this._createLogEntry('task-created', payload, handlerReceivedAt, handlerExecutedAt, delay, true);
        this._printConsoleNotice('task-created (SYNCHRONOUS)', logEntry);
        this.auditLogs.unshift(logEntry);
        return;
      }

      // ASYNCHRONOUS NON-BLOCKING EXECUTION (Default & Primary requirement)
      // Node.js will schedule this execution in the timer phase of the libuv event loop.
      // The calling API endpoint finishes and responds to the client immediately!
      setTimeout(() => {
        try {
          // Supplementary Problem 2: Error simulation trigger
          if (payload.simulateError) {
            throw new Error(`Simulated dispatch failure for task "${payload.task.title}": Push service timeout / worker error`);
          }

          const handlerExecutedAt = new Date();
          const logEntry = this._createLogEntry('task-created', payload, handlerReceivedAt, handlerExecutedAt, delay, false);

          this._printConsoleNotice('task-created (ASYNCHRONOUS BACKGROUND)', logEntry);
          this.auditLogs.unshift(logEntry);

          // Emit notification-completed for optional SSE / reactive listeners
          this.emit('notification-completed', logEntry);
        } catch (err) {
          // Hand off to the registered 'error' listener without crashing the process
          this.emit('error', err, payload);
        }
      }, delay);
    });

    // -------------------------------------------------------------------------
    // 2. SUPPLEMENTARY EVENT 1: 'task-deleted'
    // -------------------------------------------------------------------------
    this.on('task-deleted', (payload) => {
      const handlerReceivedAt = new Date();
      const delay = Math.min(this.simulatedDelayMs, 1000); // Fast background dispatch

      setTimeout(() => {
        try {
          const handlerExecutedAt = new Date();
          const apiTimeMs = payload.apiResponseTime ? new Date(payload.apiResponseTime).getTime() : handlerReceivedAt.getTime();
          const execTimeMs = handlerExecutedAt.getTime();
          const deltaMs = execTimeMs - apiTimeMs;

          const logEntry = {
            id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            eventType: 'task-deleted',
            taskId: payload.task._id || payload.task.id,
            taskTitle: payload.task.title,
            assignedUser: payload.task.assignedUser || 'Unassigned',
            emittedAt: payload.emittedAt,
            apiResponseTime: payload.apiResponseTime,
            handlerReceivedAt: handlerReceivedAt.toISOString(),
            handlerExecutedAt: handlerExecutedAt.toISOString(),
            delayMs: delay,
            deltaMs: deltaMs,
            isSync: false,
            message: `🗑️ [TASK REMOVAL] Task "${payload.task.title}" (ID: ${payload.task._id || payload.task.id}) was permanently deleted by ${payload.deletedBy || 'System'}.`,
            status: 'SUCCESS'
          };

          this._printConsoleNotice('task-deleted (ASYNCHRONOUS BACKGROUND)', logEntry);
          this.auditLogs.unshift(logEntry);

          this.emit('notification-completed', logEntry);
        } catch (err) {
          this.emit('error', err, payload);
        }
      }, delay);
    });

    // -------------------------------------------------------------------------
    // 3. SUPPLEMENTARY EVENT 2: 'error'
    // -------------------------------------------------------------------------
    // In Node.js, an EventEmitter throws an unhandled exception if an 'error' event
    // is emitted and has no listeners. By registering this listener, we safely catch
    // and log errors thrown inside event handlers without halting the server.
    this.on('error', (err, payload) => {
      const errorEntry = {
        id: `err-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        eventType: 'error',
        errorMessage: err.message,
        taskTitle: payload && payload.task ? payload.task.title : 'N/A',
        assignedUser: payload && payload.task ? payload.task.assignedUser : 'N/A',
        timestamp: new Date().toISOString(),
        stack: err.stack
      };

      console.error(`\n======================================================`);
      console.error(`🚨 [EVENT EMITTER 'error' LISTENER TRIGGERED]`);
      console.error(`❌ Error Message : ${errorEntry.errorMessage}`);
      console.error(`📋 Task Context  : "${errorEntry.taskTitle}" (Assigned to: ${errorEntry.assignedUser})`);
      console.error(`⏰ Timestamp     : ${errorEntry.timestamp}`);
      console.error(`🛡️ Process State : Server protected from crash via 'error' listener`);
      console.error(`======================================================\n`);

      this.errorLogs.unshift(errorEntry);
    });
  }

  /**
   * Internal helper to format log entry with detailed timing differences
   */
  _createLogEntry(eventType, payload, receivedAt, executedAt, delayMs, isSync) {
    const apiTimeMs = payload.apiResponseTime ? new Date(payload.apiResponseTime).getTime() : receivedAt.getTime();
    const execTimeMs = executedAt.getTime();
    const backgroundDelayDelta = execTimeMs - apiTimeMs;

    return {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType,
      taskId: payload.task._id || payload.task.id,
      taskTitle: payload.task.title,
      assignedUser: payload.task.assignedUser || 'Unassigned',
      emittedAt: payload.emittedAt,
      apiResponseTime: payload.apiResponseTime || receivedAt.toISOString(),
      handlerReceivedAt: receivedAt.toISOString(),
      handlerExecutedAt: executedAt.toISOString(),
      delayMs,
      isSync: !!isSync,
      deltaMs: backgroundDelayDelta,
      message: `🔔 [NOTIFICATION] Task "${payload.task.title}" assigned to "${payload.task.assignedUser}" was processed in background!`,
      status: 'SUCCESS'
    };
  }

  /**
   * Internal helper to print eye-catching console log
   */
  _printConsoleNotice(eventName, logEntry) {
    console.log(`\n======================================================`);
    console.log(`📢 [EVENT NOTIFICATION - ${eventName}]`);
    console.log(`📋 Task Title      : ${logEntry.taskTitle}`);
    console.log(`👤 Assigned User   : ${logEntry.assignedUser}`);
    console.log(`🆔 Task ID         : ${logEntry.taskId}`);
    console.log(`⚡ API Response At : ${logEntry.apiResponseTime}`);
    console.log(`🚀 Handler Exec At : ${logEntry.handlerExecutedAt}`);
    console.log(`⏱️ Elapsed Delta   : +${logEntry.deltaMs} ms (Handler completed after response)`);
    console.log(`⚙️ Mode            : ${logEntry.isSync ? 'Synchronous (Blocked API)' : 'Asynchronous (Non-Blocking)'}`);
    console.log(`======================================================\n`);
  }
}

// Export singleton instance
const notificationEmitter = new TaskNotificationEmitter();

module.exports = notificationEmitter;
