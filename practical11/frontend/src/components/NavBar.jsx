import { NavLink } from 'react-router-dom';

function NavBar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <ul className="nav-list">
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Home</NavLink>
        </li>
        <li>
          <NavLink to="/tasks" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Tasks Management</NavLink>
        </li>
        <li>
          <NavLink to="/projects" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Projects</NavLink>
        </li>
        <li>
          <NavLink to="/auth" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            {user ? `Account (${user.name})` : "Login / Register"}
          </NavLink>
        </li>
        <li>
          <NavLink to="/contact" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Contact</NavLink>
        </li>
        {user && (
          <li>
            <button onClick={onLogout} className="nav-logout-btn" title="Logout from account">
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default NavBar;
