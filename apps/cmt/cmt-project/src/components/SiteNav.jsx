import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { User } from "lucide-react";
import "../styles/NavBar.css";
import { getUserFromCookie, logout } from "../utils/auth";

export default function SiteNav() {
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setUser(getUserFromCookie());
  }, []);

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        {/* Brand / title */}
        <div className="site-nav__brand">
          <h1 className="site-nav__title">Course Management Tool</h1>
          <p className="site-nav__subtitle">
            RIT Department of Software Engineering
          </p>
        </div>

        {/* Right side: tabs + profile */}
        <div className="site-nav__right">
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
                  to="/createtemplate"
                  className={({ isActive }) =>
                    "site-nav__tab" + (isActive ? " is-active" : "")
                  }
                >
                  Create Template
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Profile icon only (no login link) */}
          {user && (
            <div className="site-nav__profile">
              <div className="site-nav__profile-wrapper">
                <button
                  type="button"
                  className="site-nav__profile-button"
                  onClick={() => setProfileOpen((o) => !o)}
                >
                  <User size={22} />
                </button>

                {profileOpen && (
                  <div className="site-nav__profile-dropdown">
                    <div className="site-nav__profile-info">
                      <strong>{user.name || "User"}</strong>
                      <div className="site-nav__profile-email">
                        {user.email}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="site-nav__logout-button"
                      onClick={logout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

