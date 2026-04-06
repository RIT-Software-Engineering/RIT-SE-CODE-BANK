import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  User,
  ChevronDown,
  Menu,
  X,
  GraduationCap,
  Wrench,
} from "lucide-react";
import "../styles/NavBar.css";
import { getUserFromCookie, logout } from "../utils/auth";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";

export default function SiteNav() {
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const profileRef = useRef(null);

  // Load user on mount
  useEffect(() => {
    setUser(getUserFromCookie());
    setActiveDropdown(window.location.pathname);
  }, []);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const menuGroups = [
    {
      id: "course",
      label: "Course Management",
      icon: <GraduationCap size={18} />,
      items: [
        { to: "/courses", label: "Course Overview" },
        { to: "/createtemplate", label: "Create Template" },
        { to: "/coursewebsite", label: "Course Website" },
      ],
    },
    {
      id: "tools",
      label: "Tools",
      icon: <Wrench size={18} />,
      items: [
        { to: "/teambuilder", label: "Team Builder" },
        { to: "/workflowbuilder", label: "Workflow Builder" },
      ],
    },
  ];

  return (
    <Navbar sticky="top" className="bg-[#f97316]" expand="md">
      <Container className="flex justify-between">
        {/* Brand */}
        <Navbar.Brand className="gap-1 min-w-16" onClick={() => setActiveDropdown(null)}>
          <NavLink to="/" className="no-underline">
            <p className="font-extrabold text-white m-0 text-2xl">CMT</p>
            <p className="text-white text text-xs text-opacity-90">
              COURSE MANAGEMENT TOOL
            </p>
          </NavLink>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        {/* Navigation */}
        <Navbar.Collapse className="justify-center" aria-label="Primary">
          <Nav className="gap-2">
            {menuGroups.map((group) => (
              <div
                className="gap-1 px-2 py-1 flex items-center border-1 border-solid rounded-lg bg-white bg-opacity-10 text-white"
                style={{ border: "1px solid rgba(255, 255, 255, 0.2)" }}
              >
                <NavDropdown
                  title={
                    <span className="group flex items-center gap-3 text-white">
                      <div className="flex items-center gap-2 text-sm font-semibold">{group.icon} {group.label}</div>
                      <div className='transition-transform duration-300 chevron'>
                        <ChevronDown size={16}/>
                    </div>
                    </span>
                  }
                  className="[&>.dropdown-toggle]:after:hidden min-w-full h-full
                  [&>.dropdown-toggle.show_.chevron]:rotate-180 focus-within:[&>.dropdown-toggle_.chevron]:rotate-180"
                >
                  
                  {/* Dropdown Menu */}
                  {group.items.map((item) => (
                    <NavDropdown.Item
                      title={group.label}
                      eventKey={item.label}
                      as={NavLink}
                      to={item.to}
                      onClick={() => setActiveDropdown(item.label)}
                      className={`text-sm font-semibold min-w-full min-h-full no-underline text-black bg-transparent px-2 py-0`}
                      active={(activeDropdown === item.label || activeDropdown?.replace("/cmt", "") === item.to)}
                    >
                      <div to={item.to} className={`no-underline text-black pl-3 pr-16 py-2.5 rounded-lg transition-all duration-150 ease-in-out hover:ml-1 w-full h-full 
                      ${(activeDropdown === item.label || activeDropdown?.replace("/cmt", "") === item.to) ? 'bg-[#f97316] text-white font-semibold' : 'hover:!text-[#f97316] hover:bg-gray-100'}`} >
                        {item.label}
                      </div>
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              </div>
            ))}
          </Nav>
        </Navbar.Collapse>

        {/* Profile */}
        {user && (
          <div className="relative ml-auto" ref={profileRef}>
            <button
              className="site-nav__profile-button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <User size={20} />
              <span className="site-nav__profile-name">
                {user.name?.split(" ")[0] || "User"}
              </span>
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
      </Container>
    </Navbar>
  );
}