import { NavLink } from "react-router-dom";
import "../styles/NavBar.css";

export default function SiteNav() {
  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="navbar-org">
          <h1 className="navbar-title">Course Management Tool</h1>
          <p>RIT Department of Software Engineering</p>
        </div>
        <nav>
          <ul className="navbar-links">
            <li><NavLink to="/teambuilder">Team Builder</NavLink></li>
            <li><NavLink to="/calendar">Calendar</NavLink></li>
            <li><NavLink to="/coursebuilder">Course Builder</NavLink></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
