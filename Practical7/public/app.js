/**
 * Practical 7: Task Management Frontend Application
 * 
 * Features:
 *  - User Registration & Login with Bcrypt & JWT
 *  - 401 Interceptor with Auto-Redirect to Login (Supplementary Problem 2)
 *  - Client-side Logout & Storage Clear (Supplementary Problem 3)
 *  - /me Endpoint Modal Inspector (Supplementary Problem 1)
 *  - Live JWT Token Expiration Countdown
 *  - Real-time Pre-DB Input Validation Sandbox
 *  - Full Task CRUD & Filters
 */

// ========================================================
// State Management
// ========================================================
const state = {
  token: localStorage.getItem('p7_token') || null,
  user: JSON.parse(localStorage.getItem('p7_user') || 'null'),
  tasks: [],
  editingTaskId: null,
  tokenTimerInterval: null,
  jwtExpiryTimestamp: null
};

// ========================================================
// DOM Element References
// ========================================================
const authView = document.getElementById('authView');
const dashboardView = document.getElementById('dashboardView');
const userProfileWidget = document.getElementById('userProfileWidget');
const headerUserName = document.getElementById('headerUserName');
const userAvatarBadge = document.getElementById('userAvatarBadge');
const tokenTimer = document.getElementById('tokenTimer');
const jwtCountdownPill = document.getElementById('jwtCountdownPill');
const logoutBtn = document.getElementById('logoutBtn');
const inspectMeBtn = document.getElementById('inspectMeBtn');

// Auth Forms
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Dashboard Elements
const taskForm = document.getElementById('taskForm');
const formTitle = document.getElementById('formTitle');
const formModeBadge = document.getElementById('formModeBadge');
const taskIdInput = document.getElementById('taskId');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescInput = document.getElementById('taskDescription');
const completedGroup = document.getElementById('completedGroup');
const taskCompletedInput = document.getElementById('taskCompleted');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const titleCharCounter = document.getElementById('titleCharCounter');
const descCharCounter = document.getElementById('descCharCounter');

// JWT Inspector Card
const jwtUserId = document.getElementById('jwtUserId');
const jwtUserEmail = document.getElementById('jwtUserEmail');
const jwtCountdownBadge = document.getElementById('jwtCountdownBadge');
const btnInspectMe = document.getElementById('btnInspectMe');
const btnSimulateExpire = document.getElementById('btnSimulateExpire');

// Sandbox Tester
const testMissingTitleBtn = document.getElementById('testMissingTitleBtn');
const testShortTitleBtn = document.getElementById('testShortTitleBtn');
const testBadPriorityBtn = document.getElementById('testBadPriorityBtn');
const testNoTokenBtn = document.getElementById('testNoTokenBtn');
const testerOutputWrapper = document.getElementById('testerOutputWrapper');
const testerStatusBadge = document.getElementById('testerStatusBadge');
const testerTime = document.getElementById('testerTime');
const testerResponseContent = document.getElementById('testerResponseContent');

// Task Filters & List
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterCompleted = document.getElementById('filterCompleted');
const filterPriority = document.getElementById('filterPriority');
const filterSort = document.getElementById('filterSort');
const refreshTasksBtn = document.getElementById('refreshTasksBtn');
const tasksListContainer = document.getElementById('tasksListContainer');

// Stats
const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statCompleted = document.getElementById('statCompleted');
const statHigh = document.getElementById('statHigh');

// Modal Elements
const meModal = document.getElementById('meModal');
const closeMeModalBtn = document.getElementById('closeMeModalBtn');
const closeMeModalBtn2 = document.getElementById('closeMeModalBtn2');
const meModalUserDetails = document.getElementById('meModalUserDetails');
const meModalJsonOutput = document.getElementById('meModalJsonOutput');

// Health Status
const dbStatusPill = document.getElementById('dbStatusPill');
const statusDot = document.getElementById('statusDot');
const dbStatusText = document.getElementById('dbStatusText');

// ========================================================
// Supplementary Problem 2: 401 Interceptor API Wrapper
// ========================================================
/**
 * Custom fetch wrapper that automatically:
 *  1. Attaches `Authorization: Bearer <token>`
 *  2. Catches HTTP 401 responses (expired/invalid token)
 *  3. Clears client token and auto-redirects to Login view
 */
async function apiFetch(url, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach token if present
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });

    // Supplementary Problem 2: 401 Token Expiry Interceptor
    if (res.status === 401) {
      console.warn('⚠️ HTTP 401 Unauthorized encountered. Interceptor handling token expiry.');
      
      const errorJson = await res.json().catch(() => ({}));
      const reason = errorJson.message || 'Session expired. Please log in again.';

      // Clear token from client
      handleClientLogout(false);

      showToast(`🔒 ${reason}`, 'warning');
      throw new Error(`Unauthorized (401): ${reason}`);
    }

    return res;
  } catch (err) {
    throw err;
  }
}

// ========================================================
// Authentication & Session Management
// ========================================================
function setAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('p7_token', token);
  localStorage.setItem('p7_user', JSON.stringify(user));

  // Decode JWT payload for expiration countdown
  parseJwtPayload(token);
  renderApp();
}

/**
 * Supplementary Problem 3: Client Logout Mechanism
 * Clears token, resets interval, and switches view
 */
function handleClientLogout(notifyServer = true) {
  if (notifyServer && state.token) {
    // Notify server asynchronously
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }

  // Clear client storage
  state.token = null;
  state.user = null;
  state.tasks = [];
  state.editingTaskId = null;
  localStorage.removeItem('p7_token');
  localStorage.removeItem('p7_user');

  if (state.tokenTimerInterval) {
    clearInterval(state.tokenTimerInterval);
    state.tokenTimerInterval = null;
  }

  renderApp();
}

/**
 * Parse JWT to retrieve expiration timestamp
 */
function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    state.jwtExpiryTimestamp = decoded.exp * 1000;
    startTokenCountdown();
  } catch (e) {
    console.error('Failed to parse JWT payload', e);
    state.jwtExpiryTimestamp = null;
  }
}

/**
 * Live JWT Expiry Countdown Timer
 */
function startTokenCountdown() {
  if (state.tokenTimerInterval) {
    clearInterval(state.tokenTimerInterval);
  }

  const updateTimer = () => {
    if (!state.jwtExpiryTimestamp) {
      tokenTimer.textContent = '--:--';
      return;
    }

    const now = Date.now();
    const remainingMs = state.jwtExpiryTimestamp - now;

    if (remainingMs <= 0) {
      tokenTimer.textContent = 'Expired';
      jwtCountdownPill.className = 'jwt-countdown-pill critical';
      if (jwtCountdownBadge) jwtCountdownBadge.textContent = 'Expired';
      clearInterval(state.tokenTimerInterval);
      
      // Auto-trigger token expiry handling
      showToast('⚠️ Session expired. Redirecting to login...', 'warning');
      handleClientLogout(false);
      return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeFormatted = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;

    tokenTimer.textContent = timeFormatted;
    if (jwtCountdownBadge) jwtCountdownBadge.textContent = timeFormatted;

    // Visual indicators
    if (totalSeconds < 120) {
      jwtCountdownPill.className = 'jwt-countdown-pill critical';
    } else if (totalSeconds < 600) {
      jwtCountdownPill.className = 'jwt-countdown-pill expiring';
    } else {
      jwtCountdownPill.className = 'jwt-countdown-pill';
    }
  };

  updateTimer();
  state.tokenTimerInterval = setInterval(updateTimer, 1000);
}

// ========================================================
// View Rendering
// ========================================================
function renderApp() {
  if (state.token && state.user) {
    // Logged in: Show Dashboard
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    userProfileWidget.classList.remove('hidden');

    headerUserName.textContent = state.user.name || 'User';
    userAvatarBadge.textContent = (state.user.name || 'U').charAt(0).toUpperCase();

    // Populate JWT Card
    if (jwtUserId) jwtUserId.textContent = state.user.id || state.user._id || 'N/A';
    if (jwtUserEmail) jwtUserEmail.textContent = state.user.email || 'N/A';

    fetchTasks();
  } else {
    // Logged out: Show Auth Gateway
    authView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    userProfileWidget.classList.add('hidden');
  }
}

// Switch between Login and Register tabs
tabLoginBtn.addEventListener('click', () => {
  tabLoginBtn.classList.add('active');
  tabRegisterBtn.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
});

tabRegisterBtn.addEventListener('click', () => {
  tabRegisterBtn.classList.add('active');
  tabLoginBtn.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

// Show/Hide Password Toggle
document.querySelectorAll('.btn-toggle-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🔒';
    } else {
      input.type = 'password';
      btn.textContent = '👁️';
    }
  });
});

// ========================================================
// Authentication Forms Submissions
// ========================================================
// 1. LOGIN
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showToast('Please provide both email and password', 'warning');
    return;
  }

  const submitBtn = document.getElementById('loginSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Authenticating...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Login failed', 'error');
      return;
    }

    setAuth(data.token, data.user);
    showToast(`Welcome back, ${data.user.name}! (1h JWT issued)`, 'success');
  } catch (err) {
    showToast('Failed to connect to authentication server', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '🔐 Sign In with JWT';
  }
});

// 2. REGISTER
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!name || !email || !password) {
    showToast('Please fill out all registration fields', 'warning');
    return;
  }

  const submitBtn = document.getElementById('registerSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating Account...';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Registration failed', 'error');
      return;
    }

    setAuth(data.token, data.user);
    showToast(`Account created! Bcrypt password hashed & JWT issued.`, 'success');
  } catch (err) {
    showToast('Registration server connection error', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '✨ Register & Generate JWT';
  }
});

// Logout Event
logoutBtn.addEventListener('click', () => {
  handleClientLogout(true);
  showToast('Logged out successfully. Token discarded from client.', 'info');
});

// ========================================================
// Supplementary Problem 1: /me Endpoint Inspector
// ========================================================
async function inspectMeEndpoint() {
  if (!state.token) return;

  try {
    const res = await apiFetch('/api/auth/me');
    const data = await res.json();

    if (data.success) {
      meModalUserDetails.innerHTML = `
        <div><strong>Full Name:</strong> ${data.data.name}</div>
        <div><strong>Email:</strong> ${data.data.email}</div>
        <div><strong>User ID:</strong> <code>${data.data.id}</code></div>
        <div><strong>Created At:</strong> ${new Date(data.data.createdAt).toLocaleString()}</div>
        <div><strong>JWT Issued At:</strong> ${new Date(data.tokenDetails.issuedAt).toLocaleString()}</div>
        <div><strong>JWT Expires At:</strong> ${new Date(data.tokenDetails.expiresAt).toLocaleString()}</div>
        <div><strong>Lifespan Remaining:</strong> ${Math.floor(data.tokenDetails.expiresInSeconds / 60)} minutes</div>
      `;
      meModalJsonOutput.textContent = JSON.stringify(data, null, 2);
      meModal.classList.remove('hidden');
    }
  } catch (err) {
    // Handled by apiFetch interceptor
  }
}

inspectMeBtn.addEventListener('click', inspectMeEndpoint);
if (btnInspectMe) btnInspectMe.addEventListener('click', inspectMeEndpoint);

closeMeModalBtn.addEventListener('click', () => meModal.classList.add('hidden'));
closeMeModalBtn2.addEventListener('click', () => meModal.classList.add('hidden'));

// ========================================================
// Simulate Expired Token (Demonstrates 401 Interceptor)
// ========================================================
if (btnSimulateExpire) {
  btnSimulateExpire.addEventListener('click', async () => {
    // Deliberately set state.token to a malformed/expired token
    state.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsImV4cCI6MTYwMDAwMDAwMH0.invalid_signature';
    localStorage.setItem('p7_token', state.token);

    showToast('Simulated invalid/expired token applied. Now attempting protected request...', 'warning');

    // Trigger protected route to verify 401 interceptor
    setTimeout(async () => {
      try {
        await apiFetch('/tasks');
      } catch (err) {
        // Interceptor already triggered
      }
    }, 500);
  });
}

// ========================================================
// Live Pre-DB Validation Sandbox
// ========================================================
async function runSandboxTest(endpoint, method, payload, removeToken = false) {
  testerOutputWrapper.classList.remove('hidden');
  testerResponseContent.innerHTML = '<code>Sending request...</code>';

  const startTime = performance.now();
  const headers = { 'Content-Type': 'application/json' };
  if (!removeToken && state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  try {
    const res = await fetch(endpoint, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined
    });

    const elapsed = Math.round(performance.now() - startTime);
    const data = await res.json().catch(() => ({}));

    testerStatusBadge.textContent = `HTTP ${res.status}`;
    testerStatusBadge.className = res.status >= 400 ? 'badge badge-warning' : 'badge badge-success';
    testerTime.textContent = `${elapsed} ms`;

    testerResponseContent.innerHTML = `<code>${JSON.stringify(data, null, 2)}</code>`;
  } catch (err) {
    testerStatusBadge.textContent = 'Error';
    testerStatusBadge.className = 'badge badge-warning';
    testerResponseContent.innerHTML = `<code>${err.message}</code>`;
  }
}

testMissingTitleBtn.addEventListener('click', () => {
  runSandboxTest('/tasks', 'POST', { description: 'Missing required title field' });
});

testShortTitleBtn.addEventListener('click', () => {
  runSandboxTest('/tasks', 'POST', { title: 'ab' });
});

testBadPriorityBtn.addEventListener('click', () => {
  runSandboxTest('/tasks', 'POST', { title: 'Valid Task Title', priority: 'extreme_urgent' });
});

testNoTokenBtn.addEventListener('click', () => {
  runSandboxTest('/tasks', 'GET', null, true);
});

// ========================================================
// Task Management CRUD
// ========================================================
// Priority radio button styling
document.querySelectorAll('input[name="priority"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.priority-option').forEach(opt => opt.classList.remove('active'));
    radio.closest('.priority-option').classList.add('active');
  });
});

// Character counters
taskTitleInput.addEventListener('input', () => {
  titleCharCounter.textContent = `${taskTitleInput.value.length}/100`;
});
taskDescInput.addEventListener('input', () => {
  descCharCounter.textContent = `${taskDescInput.value.length}/500`;
});

// Fetch tasks with filters
async function fetchTasks() {
  if (!state.token) return;

  tasksListContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading your authenticated tasks...</p>
    </div>
  `;

  const queryParams = new URLSearchParams();
  if (searchInput.value.trim()) queryParams.append('search', searchInput.value.trim());
  if (filterCompleted.value !== '') queryParams.append('completed', filterCompleted.value);
  if (filterPriority.value !== '') queryParams.append('priority', filterPriority.value);
  if (filterSort.value !== '') queryParams.append('sort', filterSort.value);

  try {
    const res = await apiFetch(`/tasks?${queryParams.toString()}`);
    const data = await res.json();

    if (data.success) {
      state.tasks = data.data;
      renderTasksList();
      updateStats();
    }
  } catch (err) {
    // Handled by 401 interceptor or network error
  }
}

// Render tasks list
function renderTasksList() {
  if (state.tasks.length === 0) {
    tasksListContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No tasks found</h3>
        <p>Create your first task using the form on the left, or adjust your filter query.</p>
      </div>
    `;
    return;
  }

  tasksListContainer.innerHTML = state.tasks.map(task => {
    const isCompleted = task.completed;
    const priority = task.priority || 'medium';
    const createdDate = new Date(task.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="task-item priority-${priority} ${isCompleted ? 'completed' : ''}" data-id="${task._id}">
        <div class="task-main">
          <button 
            type="button" 
            class="task-checkbox-btn" 
            onclick="toggleTaskCompletion('${task._id}', ${!isCompleted})"
            title="${isCompleted ? 'Mark as incomplete' : 'Mark as complete'}"
          >
            <div class="custom-checkbox ${isCompleted ? 'checked' : ''}">
              ${isCompleted ? '✓' : ''}
            </div>
          </button>
          
          <div class="task-content">
            <div class="task-title-row">
              <span class="task-title">${escapeHtml(task.title)}</span>
              <span class="badge ${priority === 'high' ? 'badge-warning' : priority === 'medium' ? 'badge-info' : 'badge-success'}">
                ${priority.toUpperCase()}
              </span>
            </div>
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            <div class="task-meta">
              <span class="task-meta-time">📅 ${createdDate}</span>
            </div>
          </div>
        </div>

        <div class="task-actions">
          <button 
            type="button" 
            class="action-btn edit-btn" 
            onclick="editTask('${task._id}')"
            title="Edit task"
          >
            ✏️
          </button>
          <button 
            type="button" 
            class="action-btn delete-btn" 
            onclick="deleteTask('${task._id}')"
            title="Delete task"
          >
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Update Dashboard Statistics
function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const high = state.tasks.filter(t => t.priority === 'high').length;

  statTotal.textContent = total;
  statPending.textContent = pending;
  statCompleted.textContent = completed;
  statHigh.textContent = high;
}

// Save or Update Task
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();
  const priorityRadio = document.querySelector('input[name="priority"]:checked');
  const priority = priorityRadio ? priorityRadio.value : 'medium';
  const completed = taskCompletedInput.checked;

  if (!title) {
    showToast('Task title is required (pre-database validation)', 'warning');
    return;
  }

  saveTaskBtn.disabled = true;

  try {
    if (state.editingTaskId) {
      // PUT update
      const res = await apiFetch(`/tasks/${state.editingTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description, priority, completed })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Task updated successfully!', 'success');
        resetTaskForm();
        fetchTasks();
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } else {
      // POST create
      const res = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description, priority })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Task created successfully!', 'success');
        resetTaskForm();
        fetchTasks();
      } else {
        showToast(data.message || 'Creation failed', 'error');
      }
    }
  } catch (err) {
    // Error caught
  } finally {
    saveTaskBtn.disabled = false;
  }
});

// Toggle Task Completion
window.toggleTaskCompletion = async function(id, completed) {
  try {
    const res = await apiFetch(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed })
    });
    if (res.ok) {
      showToast(completed ? 'Task marked as completed! 🎉' : 'Task marked as active', 'info');
      fetchTasks();
    }
  } catch (err) {}
};

// Edit Task
window.editTask = function(id) {
  const task = state.tasks.find(t => t._id === id);
  if (!task) return;

  state.editingTaskId = id;
  taskIdInput.value = task._id;
  taskTitleInput.value = task.title;
  taskDescInput.value = task.description || '';
  taskCompletedInput.checked = task.completed;
  completedGroup.style.display = 'block';

  // Set priority radio
  const radio = document.querySelector(`input[name="priority"][value="${task.priority}"]`);
  if (radio) {
    radio.checked = true;
    document.querySelectorAll('.priority-option').forEach(opt => opt.classList.remove('active'));
    radio.closest('.priority-option').classList.add('active');
  }

  titleCharCounter.textContent = `${task.title.length}/100`;
  descCharCounter.textContent = `${(task.description || '').length}/500`;

  formTitle.textContent = 'Edit Task';
  formModeBadge.textContent = `PUT /tasks/${id}`;
  saveTaskBtn.textContent = '💾 Update Task';
  cancelEditBtn.style.display = 'inline-flex';

  window.scrollTo({ top: taskForm.offsetTop - 80, behavior: 'smooth' });
};

// Reset Task Form
function resetTaskForm() {
  state.editingTaskId = null;
  taskForm.reset();
  taskIdInput.value = '';
  completedGroup.style.display = 'none';
  formTitle.textContent = 'Create New Task';
  formModeBadge.textContent = 'POST /tasks [JWT Protected]';
  saveTaskBtn.textContent = '➕ Create Task';
  cancelEditBtn.style.display = 'none';

  // Reset priority to medium
  const medRadio = document.querySelector('input[name="priority"][value="medium"]');
  if (medRadio) {
    medRadio.checked = true;
    document.querySelectorAll('.priority-option').forEach(opt => opt.classList.remove('active'));
    medRadio.closest('.priority-option').classList.add('active');
  }

  titleCharCounter.textContent = '0/100';
  descCharCounter.textContent = '0/500';
}

cancelEditBtn.addEventListener('click', resetTaskForm);

// Delete Task
window.deleteTask = async function(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const res = await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Task deleted successfully', 'info');
      fetchTasks();
    }
  } catch (err) {}
};

// Search & Filter event handlers
searchInput.addEventListener('input', () => {
  clearSearchBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';
  debounce(fetchTasks, 300)();
});
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  fetchTasks();
});
filterCompleted.addEventListener('change', fetchTasks);
filterPriority.addEventListener('change', fetchTasks);
filterSort.addEventListener('change', fetchTasks);
refreshTasksBtn.addEventListener('click', fetchTasks);

// ========================================================
// Health Check Poller
// ========================================================
async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (res.ok && data.database) {
      statusDot.className = 'status-dot pulsing';
      dbStatusText.textContent = `MongoDB: ${data.database.status}`;
    } else {
      statusDot.className = 'status-dot error';
      dbStatusText.textContent = 'DB Degraded';
    }
  } catch (e) {
    statusDot.className = 'status-dot error';
    dbStatusText.textContent = 'Server Offline';
  }
}

// ========================================================
// Utilities (Toast, Debounce, EscapeHtml)
// ========================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let debounceTimer;
function debounce(fn, delay) {
  return function(...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ========================================================
// Application Initialization
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  checkHealth();
  setInterval(checkHealth, 15000);

  // If token exists in storage, verify and render
  if (state.token) {
    parseJwtPayload(state.token);
  }
  renderApp();
});
