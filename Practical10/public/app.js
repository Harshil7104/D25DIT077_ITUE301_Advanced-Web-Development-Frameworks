/**
 * Practical 10 - Frontend Controller & Event Stream Visualizer
 * Author: Harshil (D25DIT077) • ITUE301 Advanced Web Development Frameworks
 */

document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------------------------
  // DOM REFERENCES
  // ---------------------------------------------------------------------------
  const healthDot = document.getElementById('healthDot');
  const healthStatusText = document.getElementById('healthStatusText');
  const statApiResponseTime = document.getElementById('statApiResponseTime');
  const statConfiguredDelay = document.getElementById('statConfiguredDelay');
  const statTotalEvents = document.getElementById('statTotalEvents');
  const statShieldStatus = document.getElementById('statShieldStatus');

  // Form Elements
  const createTaskForm = document.getElementById('createTaskForm');
  const taskTitle = document.getElementById('taskTitle');
  const taskAssignedUser = document.getElementById('taskAssignedUser');
  const taskPriority = document.getElementById('taskPriority');
  const executionMode = document.getElementById('executionMode');
  const taskDescription = document.getElementById('taskDescription');
  const btnSubmitTask = document.getElementById('btnSubmitTask');

  // Delay Slider
  const delaySlider = document.getElementById('delaySlider');
  const currentDelayLabel = document.getElementById('currentDelayLabel');

  // Action Buttons
  const btnTriggerError = document.getElementById('btnTriggerError');
  const btnRunBenchmark = document.getElementById('btnRunBenchmark');
  const btnHeaderBenchmark = document.getElementById('btnHeaderBenchmark');
  const btnClearLogs = document.getElementById('btnClearLogs');
  const btnRefreshData = document.getElementById('btnRefreshData');

  // Timeline Visualizer
  const nodeTimeReq = document.getElementById('nodeTimeReq');
  const nodeTimeRes = document.getElementById('nodeTimeRes');
  const nodeTimeHandler = document.getElementById('nodeTimeHandler');
  const connectorElapsedApi = document.getElementById('connectorElapsedApi');
  const connectorElapsedBackground = document.getElementById('connectorElapsedBackground');
  const proofApiMs = document.getElementById('proofApiMs');
  const proofDeltaMs = document.getElementById('proofDeltaMs');
  const lastDispatchModeBadge = document.getElementById('lastDispatchModeBadge');

  // Streams & Lists
  const eventsStreamList = document.getElementById('eventsStreamList');
  const tasksListContainer = document.getElementById('tasksListContainer');
  const tasksCountBadge = document.getElementById('tasksCountBadge');

  // Filter Pills & Counts
  const filterPills = document.querySelectorAll('.filter-pill');
  const countFilterAll = document.getElementById('countFilterAll');
  const countFilterCreated = document.getElementById('countFilterCreated');
  const countFilterDeleted = document.getElementById('countFilterDeleted');
  const countFilterError = document.getElementById('countFilterError');

  // Benchmark Modal
  const benchmarkModal = document.getElementById('benchmarkModal');
  const benchmarkModalBody = document.getElementById('benchmarkModalBody');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCloseModalBtn = document.getElementById('btnCloseModalBtn');
  const btnRerunBenchmark = document.getElementById('btnRerunBenchmark');

  // State
  let currentFilter = 'all';
  let cachedTelemetry = { auditLogs: [], errorLogs: [] };
  let sliderDebounceTimer = null;

  // ---------------------------------------------------------------------------
  // 1. HEALTH & METRICS POLLING
  // ---------------------------------------------------------------------------
  async function checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        healthStatusText.textContent = 'ONLINE (Port 5001)';
        healthDot.className = 'status-dot pulsing';
        healthDot.style.backgroundColor = 'var(--accent-emerald)';
      } else {
        throw new Error('Health check non-200');
      }
    } catch (err) {
      healthStatusText.textContent = 'DISCONNECTED';
      healthDot.className = 'status-dot';
      healthDot.style.backgroundColor = 'var(--accent-rose)';
    }
  }

  // ---------------------------------------------------------------------------
  // 2. FETCH TELEMETRY & AUDIT LOGS
  // ---------------------------------------------------------------------------
  async function fetchTelemetry() {
    try {
      const res = await fetch('/api/events/telemetry');
      if (!res.ok) return;

      const data = await res.json();
      cachedTelemetry = data;

      // Update counters
      const totalCount = (data.auditLogs?.length || 0) + (data.errorLogs?.length || 0);
      statTotalEvents.textContent = totalCount;
      statConfiguredDelay.textContent = `${data.config?.simulatedDelayMs || 2000} ms`;

      // Update filter counts
      const createdCount = data.auditLogs.filter(l => l.eventType === 'task-created').length;
      const deletedCount = data.auditLogs.filter(l => l.eventType === 'task-deleted').length;
      const errorCount = data.errorLogs.length;

      countFilterAll.textContent = totalCount;
      countFilterCreated.textContent = createdCount;
      countFilterDeleted.textContent = deletedCount;
      countFilterError.textContent = errorCount;

      renderEventsStream();
    } catch (err) {
      console.warn('Error fetching telemetry:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. RENDER EVENTS STREAM
  // ---------------------------------------------------------------------------
  function renderEventsStream() {
    let combined = [];

    // Map audit logs
    if (cachedTelemetry.auditLogs) {
      combined = combined.concat(cachedTelemetry.auditLogs);
    }

    // Map error logs into same stream shape
    if (cachedTelemetry.errorLogs) {
      const formattedErrors = cachedTelemetry.errorLogs.map(e => ({
        id: e.id,
        eventType: 'error',
        taskTitle: e.taskTitle,
        assignedUser: e.assignedUser,
        handlerExecutedAt: e.timestamp,
        apiResponseTime: 'N/A (Error Caught by Listener)',
        deltaMs: 'N/A',
        message: `🚨 [CAUGHT ERROR] ${e.errorMessage}`,
        isSync: false
      }));
      combined = combined.concat(formattedErrors);
    }

    // Sort by execution timestamp descending
    combined.sort((a, b) => new Date(b.handlerExecutedAt || 0) - new Date(a.handlerExecutedAt || 0));

    // Apply Filter
    let filtered = combined;
    if (currentFilter !== 'all') {
      filtered = combined.filter(item => item.eventType === currentFilter);
    }

    if (filtered.length === 0) {
      eventsStreamList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⏳</span>
          <p class="empty-title">No events for filter: "${currentFilter}"</p>
          <p class="empty-subtitle">Trigger actions from the left panel to generate background events.</p>
        </div>
      `;
      return;
    }

    eventsStreamList.innerHTML = filtered.map(item => {
      const isCreated = item.eventType === 'task-created';
      const isDeleted = item.eventType === 'task-deleted';
      const isError = item.eventType === 'error';

      const badgeClass = isCreated ? 'badge-emerald' : (isDeleted ? 'badge-rose' : 'badge-amber');
      const cardTypeClass = isCreated ? 'event-task-created' : (isDeleted ? 'event-task-deleted' : 'event-error');
      const deltaText = item.deltaMs !== 'N/A' && item.deltaMs !== undefined ? `+${item.deltaMs}ms later` : 'Caught in Handler';

      return `
        <div class="event-card ${cardTypeClass}">
          <div class="event-card-header">
            <div class="event-meta-left">
              <span class="badge ${badgeClass}">${item.eventType}</span>
              <span class="event-title">${escapeHtml(item.taskTitle || 'Task Event')}</span>
            </div>
            <span class="event-delta-pill">⏱️ ${deltaText}</span>
          </div>

          <div class="event-timestamps-grid">
            <div class="timestamp-item">
              <span class="timestamp-label">API Response Point (T1)</span>
              <span class="timestamp-value">${item.apiResponseTime ? formatTime(item.apiResponseTime) : 'N/A'}</span>
            </div>
            <div class="timestamp-item">
              <span class="timestamp-label">Handler Execution Point (T2)</span>
              <span class="timestamp-value highlight-indigo">${item.handlerExecutedAt ? formatTime(item.handlerExecutedAt) : 'N/A'}</span>
            </div>
          </div>

          <div class="event-message">
            <span>👤 Assigned: <strong>${escapeHtml(item.assignedUser || 'N/A')}</strong></span> • 
            <span>${escapeHtml(item.message)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // 4. FETCH & RENDER TASKS INVENTORY
  // ---------------------------------------------------------------------------
  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) return;

      const data = await res.json();
      const tasks = data.tasks || [];
      tasksCountBadge.textContent = `${tasks.length} Active`;

      if (tasks.length === 0) {
        tasksListContainer.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">📂</span>
            <p class="empty-title">No Active Tasks</p>
            <p class="empty-subtitle">Use the task creator to add tasks.</p>
          </div>
        `;
        return;
      }

      tasksListContainer.innerHTML = tasks.map(task => {
        const priorityBadge = task.priority === 'high' ? 'badge-rose' : (task.priority === 'medium' ? 'badge-amber' : 'badge-emerald');
        return `
          <div class="task-card" data-id="${task._id}">
            <div class="task-card-top">
              <span class="task-card-title">${escapeHtml(task.title)}</span>
              <span class="badge ${priorityBadge}">${task.priority.toUpperCase()}</span>
            </div>
            ${task.description ? `<p class="task-card-desc">${escapeHtml(task.description)}</p>` : ''}
            <div class="task-card-meta">
              <span>👤 ${escapeHtml(task.assignedUser || 'Unassigned')}</span>
              <button class="btn-task-delete" data-id="${task._id}" data-title="${escapeHtml(task.title)}">
                <span>🗑️ Delete</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Attach Delete Listeners
      document.querySelectorAll('.btn-task-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const taskId = btn.dataset.id;
          const title = btn.dataset.title;
          await deleteTask(taskId, title);
        });
      });
    } catch (err) {
      console.warn('Error fetching tasks:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. DELETE TASK (Supplementary 1: task-deleted)
  // ---------------------------------------------------------------------------
  async function deleteTask(taskId, title) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: 'Harshil (D25DIT077)' })
      });

      if (res.ok) {
        // Refresh immediately
        await fetchTasks();
        // Give background handler 1s to execute and then update telemetry
        setTimeout(fetchTelemetry, 1100);
      }
    } catch (err) {
      alert(`Failed to delete task: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. CREATE TASK FORM SUBMISSION (Async / Sync Demonstration)
  // ---------------------------------------------------------------------------
  createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = taskTitle.value.trim();
    const assignedUser = taskAssignedUser.value.trim();
    const priority = taskPriority.value;
    const mode = executionMode.value;
    const description = taskDescription.value.trim();

    if (!title) return;

    btnSubmitTask.disabled = true;
    btnSubmitTask.innerHTML = `<span>⏳ Dispatching Event...</span>`;

    const clientReqStart = Date.now();
    const clientReqIso = new Date().toISOString();

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          assignedUser,
          priority,
          description,
          mode
        })
      });

      const clientResEnd = Date.now();
      const elapsedRoundtripMs = clientResEnd - clientReqStart;
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      // Update Live Timeline Visualizer
      nodeTimeReq.textContent = formatTime(data.timing?.requestReceivedAt || clientReqIso);
      nodeTimeRes.textContent = formatTime(data.timing?.apiResponseTime || new Date().toISOString());
      connectorElapsedApi.textContent = `+${data.timing?.elapsedApiDurationMs || elapsedRoundtripMs} ms`;
      statApiResponseTime.textContent = `~${data.timing?.elapsedApiDurationMs || elapsedRoundtripMs} ms`;

      if (mode === 'sync') {
        lastDispatchModeBadge.className = 'badge badge-amber';
        lastDispatchModeBadge.textContent = 'Sync Mode (Blocked)';
        connectorElapsedBackground.textContent = '0 ms (Executed inline)';
        nodeTimeHandler.textContent = formatTime(data.timing?.apiResponseTime);
        proofApiMs.textContent = `${elapsedRoundtripMs}ms (BLOCKED!)`;
        proofDeltaMs.textContent = '0ms (Blocked thread)';
      } else {
        lastDispatchModeBadge.className = 'badge badge-emerald';
        lastDispatchModeBadge.textContent = 'Async Mode (Non-Blocking)';
        const delay = data.simulatedDelayMs || parseInt(delaySlider.value, 10);
        connectorElapsedBackground.textContent = `+${delay} ms background delay`;
        nodeTimeHandler.textContent = `Executing in ~${(delay / 1000).toFixed(1)}s...`;
        proofApiMs.textContent = `${data.timing?.elapsedApiDurationMs || elapsedRoundtripMs}ms`;
        proofDeltaMs.textContent = `+${delay}ms later in background`;

        // Wait for background execution to complete and update nodeTimeHandler
        setTimeout(async () => {
          await fetchTelemetry();
          const latest = cachedTelemetry.auditLogs.find(l => l.taskId === data.task._id);
          if (latest) {
            nodeTimeHandler.textContent = formatTime(latest.handlerExecutedAt);
          }
        }, delay + 200);
      }

      // Reset Form fields
      taskTitle.value = '';
      taskDescription.value = '';

      // Refresh tasks inventory immediately
      await fetchTasks();
      fetchTelemetry();
    } catch (err) {
      alert(`Error creating task: ${err.message}`);
    } finally {
      btnSubmitTask.disabled = false;
      btnSubmitTask.innerHTML = `<span>🚀 Dispatch Task & Emit Event</span>`;
    }
  });

  // ---------------------------------------------------------------------------
  // 7. PRESET BUTTONS
  // ---------------------------------------------------------------------------
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      if (preset === '1') {
        taskTitle.value = 'Deploy microservices to Kubernetes cluster';
        taskDescription.value = 'Rolling release v2.4 to production with automated health checks.';
        taskPriority.value = 'high';
        taskAssignedUser.value = 'Harshil (D25DIT077)';
      } else if (preset === '2') {
        taskTitle.value = 'Comprehensive Node.js Security & Header Audit';
        taskDescription.value = 'Audit helmet headers, rate limiting, and event listener memory leaks.';
        taskPriority.value = 'medium';
        taskAssignedUser.value = 'Security Lead (D25DIT077)';
      } else if (preset === '3') {
        taskTitle.value = 'MongoDB Replica Set Schema Migration';
        taskDescription.value = 'Index optimizations and sharding key re-alignment.';
        taskPriority.value = 'low';
        taskAssignedUser.value = 'Database Admin';
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 8. SIMULATED DELAY SLIDER (Supplementary 3)
  // ---------------------------------------------------------------------------
  delaySlider.addEventListener('input', () => {
    const val = delaySlider.value;
    currentDelayLabel.textContent = `${val} ms`;

    clearTimeout(sliderDebounceTimer);
    sliderDebounceTimer = setTimeout(async () => {
      try {
        await fetch('/api/events/delay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delayMs: parseInt(val, 10) })
        });
        statConfiguredDelay.textContent = `${val} ms`;
      } catch (err) {
        console.error('Failed to update delay:', err);
      }
    }, 300);
  });

  // ---------------------------------------------------------------------------
  // 9. SIMULATE HANDLER ERROR (Supplementary 2)
  // ---------------------------------------------------------------------------
  btnTriggerError.addEventListener('click', async () => {
    btnTriggerError.disabled = true;
    try {
      const res = await fetch('/api/events/test-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Intentional Fault Injection (Verify error listener)'
        })
      });

      if (res.ok) {
        // Wait 300ms for handler and error listener to process
        setTimeout(async () => {
          await fetchTelemetry();
          btnTriggerError.disabled = false;
        }, 350);
      }
    } catch (err) {
      alert(`Error trigger failed: ${err.message}`);
      btnTriggerError.disabled = false;
    }
  });

  // ---------------------------------------------------------------------------
  // 10. CLEAR LOGS & REFRESH
  // ---------------------------------------------------------------------------
  btnClearLogs.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear background telemetry audit logs?')) return;
    try {
      await fetch('/api/events/clear', { method: 'POST' });
      await fetchTelemetry();
    } catch (err) {
      console.error(err);
    }
  });

  btnRefreshData.addEventListener('click', async () => {
    await fetchTasks();
    await fetchTelemetry();
  });

  // ---------------------------------------------------------------------------
  // 11. FILTER PILLS
  // ---------------------------------------------------------------------------
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderEventsStream();
    });
  });

  // ---------------------------------------------------------------------------
  // 12. BENCHMARK MODAL RUNNER
  // ---------------------------------------------------------------------------
  const openBenchmarkModal = async () => {
    benchmarkModal.style.display = 'flex';
    benchmarkModalBody.innerHTML = `
      <div class="benchmark-loading">
        <div class="spinner"></div>
        <p>Running in-engine Synchronous vs Asynchronous benchmark...</p>
      </div>
    `;

    try {
      const res = await fetch('/api/events/benchmark');
      const data = await res.json();

      if (data.success) {
        const syncTime = data.comparison.synchronous.apiBlockedTimeMs;
        const asyncTime = data.comparison.asynchronous.apiBlockedTimeMs;

        benchmarkModalBody.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Benchmark evaluated with a simulated <strong>${data.testDelayMs}ms</strong> notification workload:
            </p>

            <table class="benchmark-table">
              <thead>
                <tr>
                  <th>Execution Mode</th>
                  <th>Caller Blocked Time</th>
                  <th>Behavior & Impact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Synchronous Handling</strong></td>
                  <td class="highlight-amber mono">${syncTime} ms</td>
                  <td style="font-size: 0.75rem;">Calling thread was frozen until handler returned.</td>
                  <td><span class="badge badge-rose">Blocks Event Loop</span></td>
                </tr>
                <tr>
                  <td><strong>Asynchronous (EventEmitter)</strong></td>
                  <td class="highlight-emerald mono">${asyncTime} ms</td>
                  <td style="font-size: 0.75rem;">Immediate return; handler scheduled via timer/nextTick.</td>
                  <td><span class="badge badge-emerald">Instant Response</span></td>
                </tr>
              </tbody>
            </table>

            <div class="proof-banner">
              <span class="proof-icon">⚡</span>
              <div class="proof-text">
                <strong>Performance Speedup:</strong> Asynchronous handling responded <strong>${data.comparison.speedupFactor}</strong> while the background handler executed independently!
              </div>
            </div>
          </div>
        `;
      }
    } catch (err) {
      benchmarkModalBody.innerHTML = `<p style="color: var(--accent-rose);">Benchmark failed: ${err.message}</p>`;
    }
  };

  btnRunBenchmark.addEventListener('click', openBenchmarkModal);
  btnHeaderBenchmark.addEventListener('click', openBenchmarkModal);
  btnRerunBenchmark.addEventListener('click', openBenchmarkModal);

  btnCloseModal.addEventListener('click', () => { benchmarkModal.style.display = 'none'; });
  btnCloseModalBtn.addEventListener('click', () => { benchmarkModal.style.display = 'none'; });

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  function formatTime(isoString) {
    if (!isoString) return '--:--:--';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });
    } catch {
      return isoString;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------
  checkHealth();
  fetchTasks();
  fetchTelemetry();

  // Periodic polling for background telemetry updates
  setInterval(fetchTelemetry, 2500);
  setInterval(checkHealth, 10000);
});
