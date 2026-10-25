// Practical 5 Client Application Logic

const API_BASE = '/tasks';
const HEALTH_URL = '/api/health';

// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskIdInput = document.getElementById('taskId');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescInput = document.getElementById('taskDescription');
const taskPrioritySelect = document.getElementById('taskPriority');
const taskCompletedCheckbox = document.getElementById('taskCompleted');
const submitBtnText = document.getElementById('submitBtnText');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const formModeBadge = document.getElementById('formModeBadge');

const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const filterPriority = document.getElementById('filterPriority');
const refreshBtn = document.getElementById('refreshBtn');

const dbStatusPill = document.getElementById('dbStatusPill');
const statusDot = document.getElementById('statusDot');
const dbStatusText = document.getElementById('dbStatusText');

const responseStatusBadge = document.getElementById('responseStatusBadge');
const responseJson = document.getElementById('responseJson');

// Test suite buttons
const testMissingTitleBtn = document.getElementById('testMissingTitleBtn');
const testInvalidPriorityBtn = document.getElementById('testInvalidPriorityBtn');
const testPreSaveTrimBtn = document.getElementById('testPreSaveTrimBtn');
const testNotFoundBtn = document.getElementById('testNotFoundBtn');
const testCastErrorBtn = document.getElementById('testCastErrorBtn');
const testHealthBtn = document.getElementById('testHealthBtn');

let tasksData = [];

// ==========================================
// 1. Database Health Check
// ==========================================
async function checkHealth() {
  try {
    const res = await fetch(HEALTH_URL);
    const data = await res.json();

    if (data.success && data.database.status === 'Connected') {
      statusDot.className = 'status-dot connected';
      dbStatusText.textContent = `MongoDB Connected (${data.database.name})`;
    } else {
      statusDot.className = 'status-dot';
      dbStatusText.textContent = `DB: ${data.database.status}`;
    }
    return data;
  } catch (err) {
    statusDot.className = 'status-dot';
    dbStatusText.textContent = 'Server / DB Offline';
    return null;
  }
}

// ==========================================
// 2. Fetch Tasks (GET /tasks)
// ==========================================
async function fetchTasks() {
  try {
    const queryParams = new URLSearchParams();

    // Status filter
    const statusVal = filterStatus.value;
    if (statusVal === 'completed') queryParams.append('completed', 'true');
    if (statusVal === 'pending') queryParams.append('completed', 'false');

    // Priority filter (Supplementary 1)
    const priorityVal = filterPriority.value;
    if (priorityVal !== 'all') queryParams.append('priority', priorityVal);

    // Search query
    const searchVal = searchInput.value.trim();
    if (searchVal) queryParams.append('search', searchVal);

    const url = `${API_BASE}?${queryParams.toString()}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      tasksData = data.data || [];
      renderTasks(tasksData);
      taskCount.textContent = tasksData.length;
    } else {
      showResponse(res.status, data);
    }
  } catch (err) {
    taskList.innerHTML = `
      <div class="empty-state">
        <p>⚠️ Error connecting to API: ${err.message}</p>
      </div>
    `;
  }
}

// ==========================================
// 3. Render Tasks List
// ==========================================
function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <p>🍃 No tasks found. Create one or clear filters!</p>
      </div>
    `;
    return;
  }

  taskList.innerHTML = tasks.map(task => {
    const formattedDate = new Date(task.createdAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const priority = (task.priority || 'medium').toLowerCase();

    return `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task._id}">
        <div class="task-left">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            ${task.completed ? 'checked' : ''} 
            onchange="toggleTaskStatus('${task._id}', ${!task.completed})"
            title="Toggle completed"
          />
          <div class="task-details">
            <div class="task-title-row">
              <span class="task-title">${escapeHtml(task.title)}</span>
              <span class="badge-priority ${priority}">
                ${priority === 'high' ? '🔴 High' : priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
              </span>
            </div>
            ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
            <div class="task-meta">
              <span>📅 ${formattedDate}</span>
              <span class="id-pill" onclick="copyId('${task._id}')" title="Click to copy ObjectId">
                ID: ${task._id}
              </span>
            </div>
          </div>
        </div>

        <div class="task-actions">
          <button class="btn-action" onclick="startEditTask('${task._id}')" title="Edit Task">
            ✏️ Edit
          </button>
          <button class="btn-action delete" onclick="deleteTask('${task._id}')" title="Delete Task">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 4. Form Submit (POST /tasks or PUT /tasks/:id)
// ==========================================
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = taskIdInput.value;
  const payload = {
    title: taskTitleInput.value,
    description: taskDescInput.value,
    priority: taskPrioritySelect.value,
    completed: taskCompletedCheckbox.checked
  };

  const isEdit = Boolean(id);
  const url = isEdit ? `${API_BASE}/${id}` : API_BASE;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    showResponse(res.status, data);

    if (res.ok && data.success) {
      resetForm();
      fetchTasks();
    }
  } catch (err) {
    showResponse(500, { success: false, error: 'Network Error', message: err.message });
  }
});

// ==========================================
// 5. Toggle Completed Status (PUT /tasks/:id)
// ==========================================
window.toggleTaskStatus = async (id, newStatus) => {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: newStatus })
    });
    const data = await res.json();
    showResponse(res.status, data);
    fetchTasks();
  } catch (err) {
    showResponse(500, { success: false, error: 'Error toggling task', message: err.message });
  }
};

// ==========================================
// 6. Delete Task (DELETE /tasks/:id)
// ==========================================
window.deleteTask = async (id) => {
  if (!confirm('Are you sure you want to delete this task from MongoDB?')) return;

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    showResponse(res.status, data);

    if (res.ok) {
      fetchTasks();
    }
  } catch (err) {
    showResponse(500, { success: false, error: 'Error deleting task', message: err.message });
  }
};

// ==========================================
// 7. Edit Mode
// ==========================================
window.startEditTask = (id) => {
  const task = tasksData.find(t => t._id === id);
  if (!task) return;

  taskIdInput.value = task._id;
  taskTitleInput.value = task.title;
  taskDescInput.value = task.description || '';
  taskPrioritySelect.value = task.priority || 'medium';
  taskCompletedCheckbox.checked = Boolean(task.completed);

  formTitle.textContent = 'Edit Task';
  formModeBadge.textContent = `PUT /tasks/${task._id.substring(0, 8)}...`;
  formModeBadge.className = 'badge badge-purple';
  submitBtnText.textContent = 'Update Task';
  cancelBtn.style.display = 'inline-flex';

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  taskIdInput.value = '';
  taskForm.reset();
  formTitle.textContent = 'Create New Task';
  formModeBadge.textContent = 'POST /tasks';
  formModeBadge.className = 'badge badge-info';
  submitBtnText.textContent = 'Create Task';
  cancelBtn.style.display = 'none';
}

// Copy ID helper
window.copyId = (id) => {
  navigator.clipboard.writeText(id).then(() => {
    alert(`Copied MongoDB ObjectId to clipboard:\n${id}`);
  });
};

// Helper: Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Display structured response in inspector
function showResponse(status, json) {
  responseStatusBadge.textContent = `Status: ${status} ${status === 200 || status === 201 ? 'OK' : 'Error'}`;
  responseStatusBadge.className = `badge ${status < 300 ? 'badge-info' : 'badge-priority high'}`;
  responseJson.innerHTML = `<code>${JSON.stringify(json, null, 2)}</code>`;
}

// ==========================================
// 8. Interactive Test Suite Triggers
// ==========================================

// Test 1: Missing Title Validation (Expects 400)
testMissingTitleBtn.addEventListener('click', async () => {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Attempting to create a task without the required title'
    })
  });
  const data = await res.json();
  showResponse(res.status, data);
});

// Test 2: Invalid Priority Enum (Supplementary 1 - Expects 400)
testInvalidPriorityBtn.addEventListener('click', async () => {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Fix High Priority Production Issue',
      priority: 'critical' // 'critical' is NOT in ['low', 'medium', 'high']
    })
  });
  const data = await res.json();
  showResponse(res.status, data);
});

// Test 3: Pre-Save Whitespace Trimming Hook (Supplementary 2 - Expects 201)
testPreSaveTrimBtn.addEventListener('click', async () => {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '     Mongoose Pre-Save Trim Hook Verified     ',
      description: '   Leading and trailing whitespace will be removed automatically   ',
      priority: 'medium'
    })
  });
  const data = await res.json();
  showResponse(res.status, data);
  fetchTasks();
});

// Test 4: Non-Existent Task ID 404 (Supplementary 3 - Expects 404)
testNotFoundBtn.addEventListener('click', async () => {
  const dummyId = '507f1f77bcf86cd799439011';
  const res = await fetch(`${API_BASE}/${dummyId}`);
  const data = await res.json();
  showResponse(res.status, data);
});

// Test 5: CastError Malformed ObjectId (Expects 400)
testCastErrorBtn.addEventListener('click', async () => {
  const res = await fetch(`${API_BASE}/invalid-id-format-12345`);
  const data = await res.json();
  showResponse(res.status, data);
});

// Test 6: DB Health Status (Expects 200)
testHealthBtn.addEventListener('click', async () => {
  const res = await fetch(HEALTH_URL);
  const data = await res.json();
  showResponse(res.status, data);
});

// Search & Filter Listeners
let searchDebounce;
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(fetchTasks, 300);
});

filterStatus.addEventListener('change', fetchTasks);
filterPriority.addEventListener('change', fetchTasks);
refreshBtn.addEventListener('click', () => {
  checkHealth();
  fetchTasks();
});

// Initial boot
(async () => {
  await checkHealth();
  await fetchTasks();
})();
