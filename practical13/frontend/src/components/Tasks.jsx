import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import Spinner from "./Spinner";
import ErrorMessage from "./ErrorMessage";
import Toast from "./Toast";
import ConfirmModal from "./ConfirmModal";
import DelayedFallback from "./DelayedFallback";

// Lazy-load heavy third-party Chart.js component only when requested
const TaskChart = lazy(() => import("./TaskChart"));

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/tasks`;
const AI_API_URL = `${API_BASE}/api/ai/generate-description`;

function Tasks({ onUnauthorized }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const navigate = useNavigate();

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Delete confirmation dialog state
  const [taskToDelete, setTaskToDelete] = useState(null);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // AI Description Generation state & rate limiting
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiCooldown, setAiCooldown] = useState(0);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  // Edit task state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editCompleted, setEditCompleted] = useState(false);

  // Helper to get authorization headers with JWT
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  // Helper to show toast notifications
  const triggerToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Central 401 token expiry handler
  const handle401 = () => {
    setIsUnauthorized(true);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (onUnauthorized) {
      onUnauthorized();
    }
    triggerToast("Session expired or invalid. Please sign in.", "error");
    navigate("/auth");
  };

  // Fetch tasks from Express + MongoDB backend (Protected Route)
  const fetchTasks = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsUnauthorized(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsUnauthorized(false);

    fetch(API_URL, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (res.status === 401) {
          handle401();
          throw new Error("Please login to access tasks.");
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch tasks (Status: ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setTasks(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load tasks from server.");
        if (err.message !== "Please login to access tasks.") {
          triggerToast("Failed to load tasks from server", "error");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 1-minute rate limit cooldown countdown timer for AI requests
  useEffect(() => {
    let timer;
    if (aiCooldown > 0) {
      timer = setTimeout(() => {
        setAiCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [aiCooldown]);

  // AI-Powered Task Description Generator (POST /api/ai/generate-description)
  const handleGenerateAiDescription = async () => {
    if (!newTitle.trim()) {
      setAiError("Please enter a task title first before generating a description.");
      return;
    }

    if (aiCooldown > 0) {
      setAiError(`Rate limit active: Please wait ${aiCooldown}s before generating another description.`);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      handle401();
      return;
    }

    setGeneratingAi(true);
    setAiError(null);

    try {
      const res = await fetch(AI_API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newTitle.trim(),
        }),
      });

      if (res.status === 401) {
        handle401();
        throw new Error("Session expired. Please login again.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to generate a description right now. Please try again or enter the description manually.");
      }

      if (data.description) {
        setNewDescription(data.description);
        setIsAiGenerated(true);
        setAiCooldown(60); // Enforce 1-minute cooldown per request
        triggerToast("AI description generated! Please review before saving.", "success");
      }
    } catch (err) {
      setAiError(err.message || "Unable to generate a description right now. Please try again or enter the description manually.");
    } finally {
      setGeneratingAi(false);
    }
  };

  // OPTIMISTIC UI TASK CREATION (POST /tasks with JWT Auth)
  const handleCreateTask = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      handle401();
      return;
    }

    if (!newTitle.trim()) {
      setFormError("Task title is required.");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    const tempId = `temp_${Date.now()}`;
    const optimisticTask = {
      _id: tempId,
      title: newTitle.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      completed: false,
      createdAt: new Date().toISOString(),
      isOptimistic: true, // Marker for temporary UI state
    };

    // 1. Optimistic Update: Immediately add task to list and clear form
    setTasks((prevTasks) => [optimisticTask, ...prevTasks]);
    setNewTitle("");
    setNewDescription("");
    setNewPriority("medium");
    setIsAiGenerated(false);

    // 2. Server Request
    fetch(API_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: optimisticTask.title,
        description: optimisticTask.description,
        priority: optimisticTask.priority,
        completed: false,
      }),
    })
      .then(async (res) => {
        if (res.status === 401) {
          handle401();
          throw new Error("Session expired. Please login again.");
        }
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Server returned status ${res.status}`);
        }
        return data;
      })
      .then((createdTask) => {
        // Swap temporary task with server-confirmed task
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t._id === tempId ? createdTask : t))
        );
        triggerToast(`Task "${createdTask.title}" created successfully!`, "success");
      })
      .catch((err) => {
        // Rollback optimistic task on failure
        setTasks((prevTasks) => prevTasks.filter((t) => t._id !== tempId));
        setFormError(`Failed to create task: ${err.message}`);
        triggerToast(`Failed to create task: ${err.message}`, "error");
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  // Handle task completion toggle (PUT /tasks/:id with JWT Auth)
  const handleToggleComplete = (task) => {
    if (task.completed) {
      return;
    }

    fetch(`${API_URL}/${task._id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        priority: task.priority,
        completed: true,
      }),
    })
      .then((res) => {
        if (res.status === 401) {
          handle401();
          throw new Error("Session expired. Please login again.");
        }
        if (!res.ok) {
          throw new Error("Failed to update status");
        }
        return res.json();
      })
      .then((updatedTask) => {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t))
        );
        triggerToast(`Task "${updatedTask.title}" marked as completed!`, "success");
      })
      .catch((err) => {
        triggerToast(`Error updating task: ${err.message}`, "error");
      });
  };

  // Start editing a task (only allowed if task is not completed)
  const startEditing = (task) => {
    if (task.completed) {
      return;
    }
    setEditingId(task._id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority || "medium");
    setEditCompleted(task.completed || false);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
  };

  // Handle task update submit (PUT /tasks/:id with JWT Auth)
  const handleUpdateTask = (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      alert("Title is required");
      return;
    }

    fetch(`${API_URL}/${editingId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        completed: editCompleted,
      }),
    })
      .then(async (res) => {
        if (res.status === 401) {
          handle401();
          throw new Error("Session expired. Please login again.");
        }
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update task");
        }
        return data;
      })
      .then((updatedTask) => {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t))
        );
        setEditingId(null);
        triggerToast(`Task "${updatedTask.title}" updated successfully!`, "success");
      })
      .catch((err) => {
        triggerToast(`Error updating task: ${err.message}`, "error");
      });
  };

  // Request deletion confirmation dialog
  const promptDeleteTask = (task) => {
    setTaskToDelete(task);
  };

  // Confirmed Task Deletion (DELETE /tasks/:id with JWT Auth)
  const confirmDeleteTask = () => {
    if (!taskToDelete) return;
    const { _id, title } = taskToDelete;

    fetch(`${API_URL}/${_id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
      .then(async (res) => {
        if (res.status === 401) {
          handle401();
          throw new Error("Session expired. Please login again.");
        }
        if (!res.ok) {
          throw new Error("Failed to delete task");
        }
        return res.json();
      })
      .then(() => {
        setTasks((prevTasks) => prevTasks.filter((t) => t._id !== _id));
        triggerToast(`Task "${title}" deleted successfully!`, "success");
      })
      .catch((err) => {
        triggerToast(`Error deleting task: ${err.message}`, "error");
      })
      .finally(() => {
        setTaskToDelete(null);
      });
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <section className="section">
      {/* Toast Notification Banner */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Confirm Delete Task"
        message={
          taskToDelete
            ? `Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.`
            : ""
        }
        onConfirm={confirmDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />

      <h2>Task Management System</h2>
      <p className="section-subtitle">
        Protected Express + MongoDB REST API Backend with JWT Authentication
      </p>

      {/* Task Analytics & Heavy Third-Party Component (Chart.js) */}
      <div className="task-analytics-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 20px 0", padding: "16px 20px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #cbd5e1", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
        <div>
          <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" }}>📊 Task Analytics (Chart.js)</span>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>
            Heavy third-party charting library lazy-loaded via <code>React.lazy()</code> on button click.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowChart((prev) => !prev)}
          className="btn-action"
          style={{
            background: showChart ? "#64748b" : "#4f46e5",
            color: "#ffffff",
            padding: "9px 20px",
            borderRadius: "7px",
            cursor: "pointer",
            border: "none",
            fontWeight: "700",
            fontSize: "0.95rem",
            boxShadow: "0 2px 5px rgba(37,99,235,0.25)",
            transition: "all 0.2s ease"
          }}
        >
          {showChart ? "Hide Chart" : "Show Analytics Chart"}
        </button>
      </div>

      {showChart && (
        <Suspense fallback={<DelayedFallback message="Loading Chart.js library..." delay={300} />}>
          <TaskChart tasks={tasks} />
        </Suspense>
      )}

      {/* Unauthorized State Banner */}
      {isUnauthorized && (
        <div className="auth-alert-box">
          <p className="auth-alert-text">🔒 Please login to access tasks.</p>
          <Link to="/auth" className="btn-primary auth-alert-btn">
            Go to Login / Register
          </Link>
        </div>
      )}

      {/* Form to Add New Task */}
      {!isUnauthorized && (
        <div className="task-form-container">
          <h3>Create New Task</h3>
          {formError && <ErrorMessage message={formError} />}
          <form onSubmit={handleCreateTask} className="task-form">
            <div className="form-group">
              <label htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                type="text"
                placeholder="e.g. Implement JWT Authentication"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (aiError) setAiError(null);
                }}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label htmlFor="task-desc" style={{ margin: 0 }}>Description</label>
                <button
                  type="button"
                  id="btn-generate-description"
                  onClick={handleGenerateAiDescription}
                  disabled={generatingAi || submitting || aiCooldown > 0}
                  className="btn-action"
                  style={{
                    background: generatingAi ? "#94a3b8" : aiCooldown > 0 ? "#64748b" : "#4f46e5",
                    color: "#ffffff",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontWeight: "600",
                    fontSize: "0.82rem",
                    cursor: (generatingAi || aiCooldown > 0) ? "not-allowed" : "pointer",
                    border: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    transition: "all 0.2s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  title={aiCooldown > 0 ? `Rate limit: Please wait ${aiCooldown}s` : "Generate task description using Gemini AI based on the entered title"}
                >
                  {generatingAi ? "⏳ Generating..." : aiCooldown > 0 ? `⏳ Wait (${aiCooldown}s)` : "✨ Generate Description"}
                </button>
              </div>

              {/* Dedicated AI Generation Loading Indicator */}
              {generatingAi && (
                <div className="ai-loading-container">
                  <div className="ai-spinner" />
                  <span><strong>AI is generating description...</strong> Drafting a concise suggestion for <em>"{newTitle}"</em>. Please wait.</span>
                </div>
              )}

              {aiError && (
                <div style={{ marginBottom: "8px" }}>
                  <ErrorMessage message={aiError} />
                </div>
              )}

              {/* AI Generated Suggestion Badge */}
              {isAiGenerated && !generatingAi && (
                <div className="ai-suggestion-badge">
                  <span>✨ AI Suggestion Loaded — You can review and edit below</span>
                </div>
              )}

              <textarea
                id="task-desc"
                placeholder="e.g. Add auth middleware, validate tokens, hash passwords (or click Generate Description)"
                value={newDescription}
                onChange={(e) => {
                  setNewDescription(e.target.value);
                  if (aiError) setAiError(null);
                }}
                disabled={submitting || generatingAi}
                rows="3"
              />

              {/* Clear AI Disclaimer */}
              <div className="ai-disclaimer-box">
                <span style={{ fontSize: "1rem", lineHeight: 1 }}>⚠️</span>
                <div>
                  <strong>AI Disclaimer:</strong> Descriptions generated by AI are automated suggestions. Please review, edit, and ensure accuracy before saving your task.
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                disabled={submitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? "Creating Task..." : "Add Task"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List Section */}
      <div className="task-list-container">
        <div className="task-list-header">
          <h3>All Tasks ({tasks.length})</h3>

          {/* Search bar */}
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            disabled={isUnauthorized}
          />
        </div>

        {loading && <Spinner />}

        {error && !isUnauthorized && <ErrorMessage message={error} />}

        {!loading && !isUnauthorized && (
          <div className="projects-grid">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className={`project-card ${task.completed ? "task-completed-card" : ""} ${task.isOptimistic ? "task-optimistic-card" : ""}`}
                >
                  {/* Inline Edit Form */}
                  {editingId === task._id ? (
                    <form onSubmit={handleUpdateTask} className="task-edit-form">
                      <div className="form-group">
                        <label>Title *</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows="2"
                        />
                      </div>

                      <div className="form-group">
                        <label>Priority</label>
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value)}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div className="edit-buttons">
                        <button type="submit" className="btn-action btn-save">
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="btn-action btn-cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Normal Task View */}
                      <div className="task-card-header">
                        <h4 className={`project-title ${task.completed ? "text-strikethrough" : ""}`}>
                          {task.title}
                          {task.isOptimistic && (
                            <span className="optimistic-badge">Saving...</span>
                          )}
                        </h4>
                        <span className={`priority-badge priority-${task.priority || "medium"}`}>
                          {task.priority || "medium"}
                        </span>
                      </div>

                      <p className="task-description">
                        {task.description || "No description provided."}
                      </p>

                      <div className="task-footer">
                        <span className="project-tech">
                          Created:{" "}
                          {task.createdAt
                            ? new Date(task.createdAt).toLocaleString()
                            : "N/A"}
                        </span>

                        <div className="action-buttons">
                          {!task.completed ? (
                            <>
                              <button
                                onClick={() => handleToggleComplete(task)}
                                className="btn-action btn-complete"
                                title="Mark task as completed"
                                disabled={task.isOptimistic}
                              >
                                Mark Complete
                              </button>
                              <button
                                onClick={() => startEditing(task)}
                                className="btn-action btn-edit"
                                title="Edit task"
                                disabled={task.isOptimistic}
                              >
                                Edit
                              </button>
                            </>
                          ) : (
                            <span className="task-done-label">
                              Completed
                            </span>
                          )}
                          <button
                            onClick={() => promptDeleteTask(task)}
                            className="btn-action btn-delete"
                            title="Delete task"
                            disabled={task.isOptimistic}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="no-results">
                {searchQuery
                  ? `No tasks found matching "${searchQuery}"`
                  : "No tasks found in database. Create one using the form above!"}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default Tasks;
