import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider"; // import the global auth context
import "../styles/NavBar.css";

export default function SiteNav() {
  const { me, loading, refresh } = useAuth(); // get auth state from context
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await fetch("/dev/logout", { method: "POST", credentials: "include" });
    } catch {}
    await refresh(); //refresh auth context (sets me = null)
    navigate("/login");
  }

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <div className="site-nav__brand">
          <h1 className="site-nav__title">Course Management Tool</h1>
          <p className="site-nav__subtitle">
            RIT Department of Software Engineering
          </p>
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
          </ul>
        </nav>

        {/* Right side: login/logout/profile */}
        <div className="site-nav__profile">
          {loading ? (
            <span className="profile-loading">Loading...</span>
          ) : me ? (
            <div className="profile-info">
              <span className="profile-name">{me.name}</span>
              <span className="profile-email">({me.email})</span>
              <button className="profile-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button
              className="profile-login"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
