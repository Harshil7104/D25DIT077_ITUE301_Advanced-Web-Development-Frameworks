import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import NavBar from "./components/NavBar";
import Home from "./components/Home";
import Auth from "./components/Auth";
import Footer from "./components/Footer";
import Spinner from "./components/Spinner";
import DelayedFallback from "./components/DelayedFallback";
import "./App.css";

// Helper to ensure Suspense fallback UI is clearly visible during demonstrations
const lazyWithDelay = (importFn, delay = 800) => {
  return lazy(() =>
    Promise.all([
      importFn(),
      new Promise((resolve) => setTimeout(resolve, delay)),
    ]).then(([module]) => module)
  );
};

// Route-based code splitting using React.lazy() and dynamic import()
const Tasks = lazyWithDelay(() => import("./components/Tasks"), 800);
const Projects = Tasks; // Maps to Projects route (/projects)
const Contact = lazyWithDelay(() => import("./components/Contact"), 800);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Validate token with /me endpoint on app startup
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Token invalid or expired");
          }
          return res.json();
        })
        .then((data) => {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        })
        .catch(() => {
          // Token expired or invalid - clear client-side auth data
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, []);

  const handleAuthChange = (newUser) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/auth");
  };

  const skillList = [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Node.js",
    "Express.js",
    "MongoDB",
    "Mongoose",
    "JWT Authentication",
    "bcrypt",
    "REST API Middleware",
  ];

  return (
    <div className="container">
      <Header name="Harshil Patel" roll="Roll No: 77 (D25DIT077)" />
      <NavBar user={user} onLogout={handleLogout} />

      <Suspense key={location.pathname} fallback={<DelayedFallback message="Loading page..." delay={300} />}>
        <Routes location={location}>
          <Route path="/" element={<Home skillList={skillList} />} />
          <Route path="/tasks" element={<Tasks onUnauthorized={handleLogout} />} />
          <Route path="/projects" element={<Projects onUnauthorized={handleLogout} />} />
          <Route
            path="/auth"
            element={<Auth onAuthChange={handleAuthChange} onLogout={handleLogout} />}
          />
          <Route
            path="/login"
            element={<Auth onAuthChange={handleAuthChange} onLogout={handleLogout} />}
          />
          <Route
            path="/register"
            element={<Auth onAuthChange={handleAuthChange} onLogout={handleLogout} />}
          />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>

      <Footer />
    </div>
  );
}

export default App;
