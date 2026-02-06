import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { User, ChevronDown, Menu, X, GraduationCap, Wrench} from "lucide-react";
import "../styles/NavBar.css";
import { getUserFromCookie, logout } from "../utils/auth";

export default function SiteNav() {
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const profileRef = useRef(null);
  const dropdownRefs = useRef({});

  // Load user on mount
  useEffect(() => {
    setUser(getUserFromCookie());
  }, []);

  // Close dropdowns on outside click / Escape
  useEffect(() => {
    const onMouseDown = (e) => {
      // Close profile dropdown
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      
      // Close nav dropdowns
      if (activeDropdown) {
        const dropdownEl = dropdownRefs.current[activeDropdown];
        if (dropdownEl && !dropdownEl.contains(e.target)) {
          setActiveDropdown(null);
        }
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen, activeDropdown]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [window.location.pathname]);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const menuGroups = [
    {
      id: "course",
      label: "Course Management",
      icon: <GraduationCap size={18} />,
      items: [
        { to: "/coursebuilder", label: "Course Builder" },
        { to: "/createtemplate", label: "Create Template" },
        { to: "/coursewebsite", label: "Course Website" },
      ]
    },
    {
      id: "tools",
      label: "Tools",
      icon: <Wrench size={18} />,
      items: [
        { to: "/teambuilder", label: "Team Builder" },
        { to: "/calendar", label: "Calendar" },
        { to: "/onboarding", label: "Student Onboarding" },
      ]
    }
  ];

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        {/* Brand */}
        <div className="site-nav__brand">
          <h1 className="site-nav__title">CMT</h1>
          <p className="site-nav__subtitle">Course Management Tool</p>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="site-nav__mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation */}
        <nav
          className={`site-nav__nav ${mobileMenuOpen ? "is-open" : ""}`}
          aria-label="Primary"
        >
          <ul className="site-nav__menu" role="list">
            {menuGroups.map((group) => (
              <li
                key={group.id}
                className="site-nav__menu-item has-dropdown"
                ref={(el) => (dropdownRefs.current[group.id] = el)}
              >
                <button
                  className={`site-nav__menu-button ${
                    activeDropdown === group.id ? "is-active" : ""
                  }`}
                  onClick={() => toggleDropdown(group.id)}
                  aria-haspopup="true"
                  aria-expanded={activeDropdown === group.id}
                >
                  {group.icon}
                  <span>{group.label}</span>
                  <ChevronDown
                    size={16}
                    className={`site-nav__chevron ${
                      activeDropdown === group.id ? "is-rotated" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                <ul
                  className={`site-nav__dropdown ${
                    activeDropdown === group.id ? "is-visible" : ""
                  }`}
                  role="menu"
                >
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          `site-nav__dropdown-link ${isActive ? "is-active" : ""}`
                        }
                        onClick={() => setActiveDropdown(null)}
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        {/* Profile */}
        {user && (
          <div className="site-nav__profile" ref={profileRef}>
            <button
              className="site-nav__profile-button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <User size={20} />
              <span className="site-nav__profile-name">{user.name?.split(" ")[0] || "User"}</span>
              <ChevronDown
                size={16}
                className={`site-nav__chevron ${profileOpen ? "is-rotated" : ""}`}
              />
            </button>

            {profileOpen && (
              <div className="site-nav__profile-dropdown" role="menu">
                <div className="site-nav__profile-info">
                  <strong>{user.name || "User"}</strong>
                  <div className="site-nav__profile-email">{user.email}</div>
                  {user.roles && (
                    <div className="site-nav__profile-role">
                      {user.roles.join(", ")}
                    </div>
                  )}
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
        )}
      </div>
    </header>
  );
}