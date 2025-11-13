import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { UserCircle } from "lucide-react"; // already in deps
import { useAuth } from "../auth/AuthProvider"; // the hook we created
import "../styles/NavBar.css";

export default function SiteNav() {
  const { me } = useAuth(); // { name, email } from /api/me
  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <div className="site-nav__brand">
          <h1 className="site-nav__title">Course Management Tool</h1>
          <p className="site-nav__subtitle">RIT Department of Software Engineering</p>
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
            </ul>
          </nav>

          <ProfileMenu me={me} />
        </div>
      </div>
    </header>
  );
}

function ProfileMenu({ me }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // close on outside click / ESC
  useEffect(() => {
    function onDoc(e) {
      if (e.type === "keydown" && e.key === "Escape") setOpen(false);
      if (e.type === "mousedown" && ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onDoc);
    };
  }, []);

  async function logout() {
    try {
      await fetch("/dev/logout", { method: "POST", credentials: "include" });
    } catch {}
    // hard redirect so auth context resets cleanly
    navigate("/login", { replace: true });
    window.location.assign("/login");
  }

  const displayName = me?.name || "Signed in";
  const email = me?.email || "";

  return (
    <div className="profile" ref={ref}>
      <button
        className="profile__btn"
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
        onClick={() => setOpen((v) => !v)}
        title={email || "Profile"}
      >
        <UserCircle className="profile__icon" aria-hidden="true" />
      </button>

      {open && (
        <div className="profile__menu" role="menu">
          <div className="profile__identity">
            <div className="profile__name">{displayName}</div>
            {email && <div className="profile__email">{email}</div>}
          </div>
          <button className="profile__logout" role="menuitem" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

