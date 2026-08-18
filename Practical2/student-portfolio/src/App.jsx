import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";

function App() {
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "light") {
            root.classList.add("light");
        } else {
            root.classList.remove("light");
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <Routes>
            <Route
                path="/"
                element={<Home theme={theme} toggleTheme={toggleTheme} />}
            />
            <Route
                path="/projects"
                element={<Projects theme={theme} toggleTheme={toggleTheme} />}
            />
            <Route
                path="/contact"
                element={<Contact theme={theme} toggleTheme={toggleTheme} />}
            />
        </Routes>
    );
}

export default App;