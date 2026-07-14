import { useState } from "react";

function Navbar({ themeColor }) {
  const [active, setActive] = useState("home");

  return (
    <nav className="navbar">
      <h2 className="logo" style={{ color: themeColor }}>
        Harshil Patel
      </h2>

      <ul className="nav-links">
        <li>
          <a
            href="#home"
            className={active === "home" ? "active" : ""}
            onClick={() => setActive("home")}
          >
            Home
          </a>
        </li>

        <li>
          <a
            href="#about"
            className={active === "about" ? "active" : ""}
            onClick={() => setActive("about")}
          >
            About
          </a>
        </li>

        <li>
          <a
            href="#skills"
            className={active === "skills" ? "active" : ""}
            onClick={() => setActive("skills")}
          >
            Skills
          </a>
        </li>

        <li>
          <a
            href="#footer"
            className={active === "contact" ? "active" : ""}
            onClick={() => setActive("contact")}
          >
            Contact
          </a>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;