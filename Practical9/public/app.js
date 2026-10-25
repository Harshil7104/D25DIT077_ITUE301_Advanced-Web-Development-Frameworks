/**
 * ============================================================================
 * PRACTICAL 9: FRONTEND CLIENT & TELEMETRY CONTROLLER
 * Author: D25DIT077 • ITUE301 Advanced Web Development Frameworks
 * Features:
 *  - Real-time cache telemetry (Hit, Miss, Hit Ratio)
 *  - 5-sample API response time benchmark runner
 *  - Dynamic TTL configuration & trade-off analyzer (Supplementary 3)
 *  - Task CRUD operations with instant cache invalidation visualization
 *  - Real-time cache keys inspector with TTL countdowns
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // DOM ELEMENT SELECTIONS
  // --------------------------------------------------------------------------
  const healthStatusText = document.getElementById('healthStatusText');
  const statHits = document.getElementById('statHits');
  const statMisses = document.getElementById('statMisses');
  const statHitRatio = document.getElementById('statHitRatio');
  const statHitRatioBar = document.getElementById('statHitRatioBar');
  const statHitRatioBadge = document.getElementById('statHitRatioBadge');
  const statTotalRequests = document.getElementById('statTotalRequests');
  const statActiveKeys = document.getElementById('statActiveKeys');
  const statTtlBadge = document.getElementById('statTtlBadge');
  const statMemoryUsage = document.getElementById('statMemoryUsage');

  // Benchmark Elements
  const btnRunBenchmark = document.getElementById('btnRunBenchmark');
  const btnRunBenchmarkTop = document.getElementById('btnRunBenchmarkTop');
  const benchUncachedAvg = document.getElementById('benchUncachedAvg');
  const benchCachedAvg = document.getElementById('benchCachedAvg');
  const benchUncachedSamples = document.getElementById('benchUncachedSamples');
  const benchCachedSamples = document.getElementById('benchCachedSamples');
  const benchSpeedupFactor = document.getElementById('benchSpeedupFactor');
  const benchLatencyReduction = document.getElementById('benchLatencyReduction');
  const benchVisualizerContainer = document.getElementById('benchVisualizerContainer');
  const visUncachedBar = document.getElementById('visUncachedBar');
  const visCachedBar = document.getElementById('visCachedBar');
  const visUncachedTime = document.getElementById('visUncachedTime');
  const visCachedTime = document.getElementById('visCachedTime');

  // TTL Controls
  const activeTtlDisplay = document.getElementById('activeTtlDisplay');
  const ttlPresetBtns = document.querySelectorAll('.btn-ttl-preset');
  const customTtlForm = document.getElementById('customTtlForm');
  const customTtlInput = document.getElementById('customTtlInput');
  const ttlAnalysisBox = document.getElementById('ttlAnalysisBox');

  // Keys Table & Events
  const keysTableBody = document.getElementById('keysTableBody');
  const btnRefreshKeys = document.getElementById('btnRefreshKeys');
  const eventsLogContainer = document.getElementById('eventsLogContainer');
  const btnClearLogs = document.getElementById('btnClearLogs');
  const btnFlushCache = document.getElementById('btnFlushCache');

  // Task Management Elements
  const createTaskForm = document.getElementById('createTaskForm');
  const taskTitleInput = document.getElementById('taskTitleInput');
  const taskDescInput = document.getElementById('taskDescInput');
  const taskPriorityInput = document.getElementById('taskPriorityInput');
  const tasksListContainer = document.getElementById('tasksListContainer');
  const invalidationBanner = document.getElementById('invalidationBanner');
  const invalidationBannerText = document.getElementById('invalidationBannerText');
  const taskSearchInput = document.getElementById('taskSearchInput');
  const taskFilterPills = document.querySelectorAll('.filter-pill');
  const btnTestFetchMiss = document.getElementById('btnTestFetchMiss');
  const btnTestFetchCached = document.getElementById('btnTestFetchCached');

  // Task Counts
  const countAll = document.getElementById('countAll');
  const countPending = document.getElementById('countPending');
  const countCompleted = document.getElementById('countCompleted');
  const countHigh = document.getElementById('countHigh');

  // State
  let currentTasks = [];
  let currentFilter = 'all';
  let currentSearchQuery = '';
  let activeTTL = 60;

  // --------------------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // --------------------------------------------------------------------------
  const showToast = (message, type = 'info') => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚡';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  };

  // --------------------------------------------------------------------------
  // REAL-TIME EVENT LOGGER
  // --------------------------------------------------------------------------
  const logEventToUI = (tag, message, tagClass = 'tag-ready') => {
    const time = new Date().toLocaleTimeString();
    const row = document.createElement('div');
    row.className = 'event-row';
    row.innerHTML = `
      <span class="event-time">${time}</span>
      <span class="event-tag ${tagClass}">${tag}</span>
      <span class="event-msg">${message}</span>
    `;
    eventsLogContainer.prepend(row);

    while (eventsLogContainer.children.length > 25) {
      eventsLogContainer.lastElementChild.remove();
    }
  };

  btnClearLogs.addEventListener('click', () => {
    eventsLogContainer.innerHTML = '';
    logEventToUI('CLEARED', 'Event stream cleared by user', 'tag-ready');
  });

  // --------------------------------------------------------------------------
  // HEALTH & TELEMETRY FETCHING
  // --------------------------------------------------------------------------
  const fetchHealthAndStats = async () => {
    try {
      const res = await fetch('/api/cache/stats');
      if (!res.ok) throw new Error('Stats fetch failed');
      const stats = await res.json();

      // Update counters
      const hits = stats.summary.hits;
      const misses = stats.summary.misses;
      const total = stats.summary.totalRequests;
      const hitRatio = stats.summary.hitRatio;
      const hitRatioNumeric = stats.summary.hitRatioNumeric;
      const activeKeys = stats.summary.currentActiveKeys;
      activeTTL = stats.summary.currentTTL;

      statHits.textContent = hits;
      statMisses.textContent = misses;
      statHitRatio.textContent = hitRatio;
      statHitRatioBar.style.width = `${Math.min(hitRatioNumeric, 100)}%`;
      statHitRatioBadge.textContent = hitRatio;
      statTotalRequests.textContent = `${total} total requests handled`;
      statActiveKeys.innerHTML = `${activeKeys} <span class="unit">keys</span>`;
      statTtlBadge.textContent = `${activeTTL}s TTL`;
      activeTtlDisplay.textContent = `Active: ${activeTTL}s`;
      statMemoryUsage.textContent = `stdTTL: ${activeTTL}s • checkperiod: 120s`;

      healthStatusText.textContent = 'Server Operational (node-cache active)';

      // Sync active preset button
      ttlPresetBtns.forEach((btn) => {
        if (parseInt(btn.getAttribute('data-ttl'), 10) === activeTTL) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    } catch (err) {
      healthStatusText.textContent = 'Backend Offline';
      console.warn('Stats fetch error:', err.message);
    }
  };

  // --------------------------------------------------------------------------
  // ACTIVE CACHE KEYS INSPECTION
  // --------------------------------------------------------------------------
  const fetchActiveKeys = async () => {
    try {
      const res = await fetch('/api/cache/keys');
      if (!res.ok) return;
      const data = await res.json();

      keysTableBody.innerHTML = '';

      if (!data.keys || data.keys.length === 0) {
        keysTableBody.innerHTML = `
          <tr>
            <td colspan="4" class="empty-state">No active keys in cache. Fetch tasks to populate.</td>
          </tr>
        `;
        return;
      }

      data.keys.forEach((k) => {
        const tr = document.createElement('tr');
        const catClass = k.category === 'all-tasks' ? 'cat-all' : 'cat-single';

        tr.innerHTML = `
          <td><span class="key-mono">${k.key}</span></td>
          <td><span class="key-category-badge ${catClass}">${k.category}</span></td>
          <td><span class="key-ttl-pill">${k.ttlRemainingSeconds}s remaining</span></td>
          <td>
            <button class="btn btn-sm btn-ghost btn-inv-key" data-key="${k.key}" title="Invalidate this specific key">
              ❌ Purge
            </button>
          </td>
        `;
        keysTableBody.appendChild(tr);
      });

      // Attach single purge listeners
      document.querySelectorAll('.btn-inv-key').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const keyToDel = e.currentTarget.getAttribute('data-key');
          await fetch(`/api/cache?key=${encodeURIComponent(keyToDel)}`, { method: 'DELETE' });
          showToast(`Key '${keyToDel}' purged`, 'warning');
          logEventToUI('PURGE_KEY', `User purged key '${keyToDel}'`, 'tag-inv');
          fetchActiveKeys();
          fetchHealthAndStats();
        });
      });
    } catch (err) {
      console.warn('Keys fetch error:', err);
    }
  };

  btnRefreshKeys.addEventListener('click', () => {
    fetchActiveKeys();
    fetchHealthAndStats();
    showToast('Cache keys refreshed', 'info');
  });

  // --------------------------------------------------------------------------
  // FLUSH CACHE
  // --------------------------------------------------------------------------
  btnFlushCache.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/cache/flush', { method: 'POST' });
      if (res.ok) {
        showToast('All in-memory cache keys flushed!', 'warning');
        logEventToUI('FLUSH', 'Flushed all cache entries', 'tag-inv');
        fetchActiveKeys();
        fetchHealthAndStats();
      }
    } catch (err) {
      showToast('Error flushing cache: ' + err.message, 'error');
    }
  });

  // --------------------------------------------------------------------------
  // DYNAMIC TTL EXPERIMENTER (Supplementary Problem 3)
  // --------------------------------------------------------------------------
  const updateTTL = async (newTTL) => {
    try {
      const res = await fetch('/api/cache/ttl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: newTTL })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update TTL');

      activeTTL = newTTL;
      activeTtlDisplay.textContent = `Active: ${newTTL}s`;
      statTtlBadge.textContent = `${newTTL}s TTL`;
      showToast(`Cache TTL updated to ${newTTL} seconds`, 'success');
      logEventToUI('TTL_UPDATE', `Default TTL set to ${newTTL}s`, 'tag-ready');

      // Update Analysis text
      updateTtlAnalysisText(newTTL);
      fetchHealthAndStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updateTtlAnalysisText = (ttl) => {
    if (ttl <= 10) {
      ttlAnalysisBox.innerHTML = `
        <strong>💡 Ultra-Short TTL Analysis (${ttl}s):</strong>
        <p>Very low data staleness window (max ${ttl}s), ideal for fast-moving collaborative data. Redundant DB queries are reduced only during bursts; longer request gaps will frequently miss cache.</p>
      `;
    } else if (ttl <= 45) {
      ttlAnalysisBox.innerHTML = `
        <strong>💡 Short TTL Analysis (${ttl}s):</strong>
        <p>Balanced for active team workflows. Tasks remain fresh while database is protected during active user interaction bursts (~70-85% hit ratio).</p>
      `;
    } else if (ttl <= 90) {
      ttlAnalysisBox.innerHTML = `
        <strong>💡 Standard TTL Analysis (${ttl}s - Default):</strong>
        <p>Optimal default for Task Management. Combined with active write-invalidation on POST, PUT, and DELETE, users enjoy near-instant sub-millisecond cached responses with zero risk of stale data.</p>
      `;
    } else {
      ttlAnalysisBox.innerHTML = `
        <strong>💡 Long TTL Analysis (${ttl}s):</strong>
        <p>Maximum database query offloading (~98%+ reduction). Perfect for mostly read-only scenarios. Requires robust invalidation to prevent stale reads if mutations occur outside this backend.</p>
      `;
    }
  };

  ttlPresetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const ttl = parseInt(btn.getAttribute('data-ttl'), 10);
      updateTTL(ttl);
    });
  });

  customTtlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ttl = parseInt(customTtlInput.value, 10);
    if (ttl > 0) {
      updateTTL(ttl);
      customTtlInput.value = '';
    }
  });

  // --------------------------------------------------------------------------
  // RESPONSE TIME BENCHMARK RUNNER (Requirement 4 & 5)
  // --------------------------------------------------------------------------
  const runBenchmark = async () => {
    btnRunBenchmark.disabled = true;
    btnRunBenchmarkTop.disabled = true;
    btnRunBenchmark.innerHTML = '<span class="status-dot pulsing"></span> Running 5 Samples...';

    const SAMPLES = 5;
    const uncachedReadings = [];
    const cachedReadings = [];

    showToast('Starting 5-sample API latency benchmark...', 'info');
    logEventToUI('BENCH_START', `Collecting ${SAMPLES} sample readings for uncached vs cached...`, 'tag-ready');

    try {
      // 1. Collect Uncached Readings (using cache bypass header/param)
      for (let i = 1; i <= SAMPLES; i++) {
        const start = performance.now();
        const res = await fetch('/tasks?cache=false', {
          headers: { 'X-No-Cache': 'true' }
        });
        const duration = (performance.now() - start);
        const data = await res.json();
        const serverTime = data.responseTimeMs !== undefined ? data.responseTimeMs : duration;
        uncachedReadings.push(parseFloat(serverTime.toFixed(3)));
        await new Promise((r) => setTimeout(r, 60));
      }

      // Pre-warm cache
      await fetch('/tasks');

      // 2. Collect Cached Readings (Cache HIT from node-cache)
      for (let i = 1; i <= SAMPLES; i++) {
        const start = performance.now();
        const res = await fetch('/tasks');
        const duration = (performance.now() - start);
        const data = await res.json();
        const serverTime = data.responseTimeMs !== undefined ? data.responseTimeMs : duration;
        cachedReadings.push(parseFloat(serverTime.toFixed(3)));
        await new Promise((r) => setTimeout(r, 60));
      }

      // Calculate Averages
      const uncachedAvg = parseFloat((uncachedReadings.reduce((a, b) => a + b, 0) / SAMPLES).toFixed(3));
      const cachedAvg = parseFloat((cachedReadings.reduce((a, b) => a + b, 0) / SAMPLES).toFixed(3));
      const speedup = parseFloat((uncachedAvg / Math.max(cachedAvg, 0.01)).toFixed(2));
      const reduction = parseFloat((((uncachedAvg - cachedAvg) / uncachedAvg) * 100).toFixed(2));

      // Render readings to UI
      benchUncachedAvg.textContent = `${uncachedAvg} ms`;
      benchCachedAvg.textContent = `${cachedAvg} ms`;
      benchSpeedupFactor.textContent = `${speedup}x`;
      benchLatencyReduction.textContent = `${reduction}% Latency Reduction`;

      // Render sample chips
      benchUncachedSamples.innerHTML = uncachedReadings
        .map((r, i) => `<span class="sample-chip uncached-chip">#${i + 1}: ${r}ms</span>`)
        .join('');

      benchCachedSamples.innerHTML = cachedReadings
        .map((r, i) => `<span class="sample-chip cached-chip">#${i + 1}: ${r}ms</span>`)
        .join('');

      // Update Visualizer Bars
      benchVisualizerContainer.style.display = 'flex';
      visUncachedTime.textContent = `${uncachedAvg} ms`;
      visCachedTime.textContent = `${cachedAvg} ms`;

      const maxTime = Math.max(uncachedAvg, cachedAvg);
      visUncachedBar.style.width = '100%';
      visCachedBar.style.width = `${Math.max(5, (cachedAvg / maxTime) * 100)}%`;

      showToast(`Benchmark complete! In-memory cache is ~${speedup}x faster`, 'success');
      logEventToUI('BENCH_DONE', `Uncached: ${uncachedAvg}ms | Cached: ${cachedAvg}ms (${reduction}% faster)`, 'tag-hit');

      fetchHealthAndStats();
      fetchActiveKeys();
    } catch (err) {
      showToast('Benchmark error: ' + err.message, 'error');
    } finally {
      btnRunBenchmark.disabled = false;
      btnRunBenchmarkTop.disabled = false;
      btnRunBenchmark.innerHTML = '<span class="btn-icon">⚡</span> Run 5-Sample Benchmark';
    }
  };

  btnRunBenchmark.addEventListener('click', runBenchmark);
  btnRunBenchmarkTop.addEventListener('click', runBenchmark);

  // --------------------------------------------------------------------------
  // TASK CRUD & CACHE INVALIDATION
  // --------------------------------------------------------------------------
  const fetchTasks = async (forceBypass = false) => {
    try {
      const url = forceBypass ? '/tasks?cache=false' : '/tasks';
      const start = performance.now();
      const res = await fetch(url, {
        headers: forceBypass ? { 'X-No-Cache': 'true' } : {}
      });
      const duration = (performance.now() - start).toFixed(2);
      const data = await res.json();

      currentTasks = data.data || [];
      renderTasks();
      updateFilterCounts();

      const cacheHeader = res.headers.get('X-Cache') || data.cacheStatus;
      const tagClass = cacheHeader === 'HIT' ? 'tag-hit' : 'tag-miss';
      logEventToUI(cacheHeader, `GET /tasks [${duration}ms, ${currentTasks.length} tasks]`, tagClass);

      fetchHealthAndStats();
      fetchActiveKeys();
    } catch (err) {
      tasksListContainer.innerHTML = `<div class="empty-state">Error loading tasks: ${err.message}</div>`;
    }
  };

  const renderTasks = () => {
    let filtered = [...currentTasks];

    // Filter by completed status / priority
    if (currentFilter === 'pending') {
      filtered = filtered.filter((t) => !t.completed);
    } else if (currentFilter === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    } else if (currentFilter === 'high') {
      filtered = filtered.filter((t) => t.priority === 'high');
    }

    // Search query
    if (currentSearchQuery.trim()) {
      const q = currentSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      tasksListContainer.innerHTML = '<div class="empty-state">No tasks match the active filter.</div>';
      return;
    }

    tasksListContainer.innerHTML = filtered
      .map((t) => {
        const isComp = t.completed ? 'completed' : '';
        const priorityClass = `priority-${t.priority || 'medium'}`;

        return `
          <div class="task-item-card ${isComp}" data-id="${t._id}">
            <div class="task-left">
              <input type="checkbox" class="task-checkbox-custom" data-id="${t._id}" ${t.completed ? 'checked' : ''}>
              <div class="task-details">
                <span class="task-title">${escapeHtml(t.title)}</span>
                ${t.description ? `<span class="task-desc">${escapeHtml(t.description)}</span>` : ''}
                <div class="task-meta">
                  <span class="priority-badge ${priorityClass}">${t.priority || 'medium'}</span>
                  <span class="task-id-mono">ID: ${t._id.slice(-6)}</span>
                </div>
              </div>
            </div>
            <div class="task-actions">
              <button class="btn-icon-action btn-inspect" data-id="${t._id}" title="Inspect Single Task Cache (GET /tasks/:id)">
                🔍 Inspect
              </button>
              <button class="btn-icon-action btn-delete" data-id="${t._id}" title="Delete Task (Invalidates Cache)">
                🗑️
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    // Attach Toggle Completion Listeners
    document.querySelectorAll('.task-checkbox-custom').forEach((chk) => {
      chk.addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-id');
        const completed = e.target.checked;
        await updateTask(id, { completed });
      });
    });

    // Attach Delete Listeners
    document.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Delete task? This will invalidate all-tasks and single-task cache.')) {
          await deleteTask(id);
        }
      });
    });

    // Attach Inspect Single Task Listeners (Supplementary 1)
    document.querySelectorAll('.btn-inspect').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        await inspectSingleTask(id);
      });
    });
  };

  const updateFilterCounts = () => {
    countAll.textContent = currentTasks.length;
    countPending.textContent = currentTasks.filter((t) => !t.completed).length;
    countCompleted.textContent = currentTasks.filter((t) => t.completed).length;
    countHigh.textContent = currentTasks.filter((t) => t.priority === 'high').length;
  };

  const showInvalidationAlert = (msg) => {
    invalidationBannerText.textContent = msg;
    invalidationBanner.style.display = 'flex';
    setTimeout(() => {
      invalidationBanner.style.display = 'none';
    }, 4500);
  };

  // 1. Create Task (POST /tasks)
  createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    const description = taskDescInput.value.trim();
    const priority = taskPriorityInput.value;

    if (!title) return;

    try {
      const res = await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Create task failed');

      showToast(`Task created! All-tasks cache invalidated.`, 'success');
      showInvalidationAlert(`POST /tasks: Cache key 'tasks:all*' cleared. Stale data prevented.`);
      logEventToUI('INVALIDATE', `POST /tasks cleared all-tasks cache`, 'tag-inv');

      taskTitleInput.value = '';
      taskDescInput.value = '';

      // Immediately fetch fresh tasks
      await fetchTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // 2. Update Task (PUT /tasks/:id)
  const updateTask = async (id, updates) => {
    try {
      const res = await fetch(`/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');

      showToast(`Task updated! Invalidation triggered.`, 'info');
      showInvalidationAlert(`PUT /tasks/${id.slice(-6)}: Both 'tasks:all*' and 'task:${id.slice(-6)}' purged.`);
      logEventToUI('INVALIDATE', `PUT /tasks/${id.slice(-6)} invalidated single & all caches`, 'tag-inv');

      await fetchTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 3. Delete Task (DELETE /tasks/:id)
  const deleteTask = async (id) => {
    try {
      const res = await fetch(`/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');

      showToast('Task deleted! Cache wiped.', 'warning');
      showInvalidationAlert(`DELETE /tasks/${id.slice(-6)}: Purged from cache and database.`);
      logEventToUI('INVALIDATE', `DELETE /tasks/${id.slice(-6)} cleared single & all caches`, 'tag-inv');

      await fetchTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 4. Inspect Single Task (Supplementary 1: GET /tasks/:id)
  const inspectSingleTask = async (id) => {
    try {
      const start = performance.now();
      const res = await fetch(`/tasks/${id}`);
      const duration = (performance.now() - start).toFixed(2);
      const data = await res.json();

      const cacheHeader = res.headers.get('X-Cache') || data.cacheStatus;
      const ttlRemaining = data.ttlRemainingSeconds;

      showToast(
        `Single Task GET: ${cacheHeader} [${duration}ms, TTL: ${ttlRemaining || activeTTL}s]`,
        cacheHeader === 'HIT' ? 'success' : 'info'
      );
      logEventToUI(
        cacheHeader,
        `GET /tasks/${id.slice(-6)} [${duration}ms, key: task:${id.slice(-6)}]`,
        cacheHeader === 'HIT' ? 'tag-hit' : 'tag-miss'
      );

      fetchHealthAndStats();
      fetchActiveKeys();
    } catch (err) {
      showToast('Error inspecting task: ' + err.message, 'error');
    }
  };

  // --------------------------------------------------------------------------
  // TEST BUTTONS & SEARCH / FILTERS
  // --------------------------------------------------------------------------
  btnTestFetchMiss.addEventListener('click', () => {
    fetchTasks(true);
    showToast('Direct MongoDB fetch requested (Bypass Cache)', 'warning');
  });

  btnTestFetchCached.addEventListener('click', () => {
    fetchTasks(false);
    showToast('Fetched tasks (Served from cache if available)', 'info');
  });

  taskFilterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      taskFilterPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter');
      renderTasks();
    });
  });

  taskSearchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    renderTasks();
  });

  const escapeHtml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------
  fetchHealthAndStats();
  fetchActiveKeys();
  fetchTasks();

  // Periodic status update every 4 seconds
  setInterval(() => {
    fetchHealthAndStats();
    fetchActiveKeys();
  }, 4000);
});
