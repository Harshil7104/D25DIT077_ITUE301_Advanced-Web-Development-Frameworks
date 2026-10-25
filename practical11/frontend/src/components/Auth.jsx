import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ErrorMessage from "./ErrorMessage";
import Toast from "./Toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Auth({ onAuthChange, onLogout }) {
  const [isLogin, setIsLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch logged in user details from /me using decoded JWT
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Session expired or invalid");
          }
          return res.json();
        })
        .then((data) => {
          setCurrentUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          if (onAuthChange) {
            onAuthChange(data.user);
          }
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setCurrentUser(null);
          if (onAuthChange) {
            onAuthChange(null);
          }
        });
    } else {
      setCurrentUser(null);
    }
  }, [onAuthChange]);

  const triggerToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      triggerToast("Registration successful! Please login with your credentials.", "success");
      setIsLogin(true);
      setPassword("");
    } catch (err) {
      setError(err.message || "Something went wrong during registration.");
      triggerToast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save token and user info to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setCurrentUser(data.user);

      if (onAuthChange) {
        onAuthChange(data.user);
      }

      triggerToast(`Welcome back, ${data.user.name}!`, "success");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Invalid credentials.");
      triggerToast(err.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAction = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    if (onLogout) {
      onLogout();
    } else if (onAuthChange) {
      onAuthChange(null);
    }
    triggerToast("Logged out successfully. Token cleared.", "success");
  };

  return (
    <section className="section auth-section-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {currentUser ? (
        <div className="auth-profile-wrapper">
          <div className="auth-profile-header">
            <div className="auth-avatar-large">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <h2>User Profile</h2>
            <p className="auth-profile-subtitle">Details fetched from <code>GET /me</code> endpoint</p>
          </div>

          <div className="auth-profile-details">
            <div className="profile-detail-row">
              <span className="profile-label">User ID:</span>
              <span className="profile-value">{currentUser.id || currentUser._id}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-label">Full Name:</span>
              <span className="profile-value">{currentUser.name}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-label">Email Address:</span>
              <span className="profile-value">{currentUser.email}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-label">Auth Status:</span>
              <span className="profile-badge-active">● Active (JWT Token Valid)</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-label">Token Expiration:</span>
              <span className="profile-value">1 Hour from login</span>
            </div>
          </div>

          <div className="auth-profile-actions">
            <Link to="/tasks" className="btn-primary auth-btn-manage">
              Go to Task Management →
            </Link>
            <button onClick={handleLogoutAction} className="btn-action btn-delete btn-logout-full">
              Logout (Clear Token)
            </button>
          </div>
        </div>
      ) : (
        <div className="auth-card-container">
          <div className="auth-header-block">
            <div className="auth-icon-badge">🔐</div>
            <h2>{isLogin ? "Welcome Back" : "Create an Account"}</h2>
            <p className="auth-header-desc">
              {isLogin
                ? "Sign in with your email and password to manage tasks"
                : "Register a new student account with secure password hashing"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tab-switch">
            <button
              type="button"
              className={`auth-tab-btn ${isLogin ? "active" : ""}`}
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${!isLogin ? "active" : ""}`}
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
            >
              Register
            </button>
          </div>

          {error && <ErrorMessage message={error} />}

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="auth-form-body">
            {!isLogin && (
              <div className="form-group auth-input-group">
                <label htmlFor="auth-name">Full Name *</label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Harshil Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            )}

            <div className="form-group auth-input-group">
              <label htmlFor="auth-email">Email Address *</label>
              <input
                id="auth-email"
                type="email"
                placeholder="e.g. harshil@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group auth-input-group">
              <label htmlFor="auth-password">Password *</label>
              <div className="password-input-wrapper">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? (
                <span>Processing...</span>
              ) : isLogin ? (
                "Sign In to Account"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Quick Toggle Footer */}
          <div className="auth-footer-prompt">
            {isLogin ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => {
                    setIsLogin(false);
                    setError(null);
                  }}
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => {
                    setIsLogin(true);
                    setError(null);
                  }}
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>

          <div className="auth-security-notice">
            <span>🛡️ Secured with bcrypt password hashing & JWT token verification</span>
          </div>
        </div>
      )}
    </section>
  );
}

export default Auth;
