import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { User } from "lucide-react";
import "../styles/NavBar.css";
import { getUserFromCookie, logout } from "../utils/auth";

export default function SiteNav() {
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Load user on mount
  useEffect(() => {
    setUser(getUserFromCookie());
  }, []);

  // Close dropdown on outside click / Escape
  useEffect(() => {
    if (!profileOpen) return;

    const onMouseDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  // If user disappears (logged out), ensure dropdown closes
  useEffect(() => {
    if (!user) setProfileOpen(false);
  }, [user]);

  return (
    <div className="site-nav">
      <div className="site-nav__inner">
        <div className="site-nav__brand">
          <h1 className="site-nav__title">Course Management Tool</h1>
          <p className="site-nav__subtitle">RIT Department of Software Engineering</p>
        </div>

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

          {user && (
            <div className="site-nav__profile" ref={profileRef}>
              <div className="site-nav__profile-wrapper">
                <button
                  type="button"
                  className="site-nav__profile-button"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen ? "true" : "false"}
                  onClick={() => setProfileOpen((o) => !o)}
                >
                  <User size={22} />
                </button>

                {profileOpen && (
                  <div className="site-nav__profile-dropdown" role="menu">
                    <div className="site-nav__profile-info">
                      <strong>{user.name || "User"}</strong>
                      <div className="site-nav__profile-email">{user.email}</div>
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
    </div>
  );
}
