import { NavLink } from "react-router-dom";
import "../styles/NavBar.css";

export default function SiteNav() {
  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <div className="site-nav__brand">
          <h1 className="site-nav__title">Course Management Tool</h1>
          <p className="site-nav__subtitle">RIT Department of Software Engineering</p>
        </div>

        <nav aria-label="Primary" className="site-nav__nav">
          <ul className="site-nav__tabs" role="list">
            <li>
              <NavLink
                to="/teambuilder"
                className={({ isActive }) =>
                  "site-nav__tab" + (isActive ? " is-active" : "")
                }
              >
                Team Builder
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/calendar"
                className={({ isActive }) =>
                  "site-nav__tab" + (isActive ? " is-active" : "")
                }
              >
                Calendar
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/coursebuilder"
                className={({ isActive }) =>
                  "site-nav__tab" + (isActive ? " is-active" : "")
                }
              >
                Course Builder
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/Workflows"
                className={({ isActive }) =>
                  "site-nav__tab" + (isActive ? " is-active" : "")
                }
              >
                Workflows
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

