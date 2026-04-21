import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  User,
  ChevronDown,
  GraduationCap,
  Wrench,
} from "lucide-react";
import { getUserFromCookie, logout } from "../utils/auth";
import { Container, Dropdown, Nav, Navbar, NavDropdown, Button } from "react-bootstrap";

export default function SiteNav() {
  const [user, setUser] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const profileRef = useRef(null);

  // Load user on mount
  useEffect(() => {
    setUser(getUserFromCookie());
    setActiveDropdown(window.location.pathname);
  }, []);

  const menuGroups = [
    {
      id: "course",
      label: "Course Management",
      icon: <GraduationCap size={18} />,
      items: [
        { to: "/courses", label: "Courses"},
        { to: "/templates", label: "Templates" },
        { to: "/coursewebsite", label: "Site Generation" },
      ],
    },
    {
      id: "tools",
      label: "Tools",
      icon: <Wrench size={18} />,
      items: [
        { to: "/teambuilder", label: "Team Builder" },
        { to: "/workflowbuilder", label: "Workflow Builder"},
        { to: "/workflowbuilder-admin", label: "Workflow Builder Admin"},
      ]
    }
  ];

  return (
    <Navbar sticky="top" className="bg-[#f97316] px-4" expand="lg">
      <Container className="flex items-center justify-between gap-2">
        {/* Brand */}
        <Navbar.Brand className="flex-1 min-w-16" onClick={() => setActiveDropdown(null)}>
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
                    <span className="flex items-center gap-3 text-white">
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

        <Navbar.Collapse className="justify-end">
        {/* Profile */}
        <Nav ref={profileRef} className="gap-2">
        <div 
          className="gap-1 px-2 py-1 flex items-center border-1 border-solid rounded-lg bg-white bg-opacity-10 text-white"
          style={{ border: "1px solid rgba(255, 255, 255, 0.2)" }}
        >
          <NavDropdown
          title={<span className="flex gap-3 items-center text-white">
                <User size={16} /> {user?.name?.split(" ")[0] || "User"} 
                <div className='transition-transform duration-300 chevron'>
                  <ChevronDown size={16}/>
                </div>
              </span>}
            className="[&>.dropdown-toggle]:after:hidden min-w-full h-full
            [&>.dropdown-toggle.show_.chevron]:rotate-180 focus-within:[&>.dropdown-toggle_.chevron]:rotate-180"
          >
            <Dropdown.Item as="span" className="bg-transparent text-black">
              <div className="w-full pl-3 pr-16 py-2">
                  <div className="text-base font-bold mb-1">{user?.name}</div>
                  <div className="text-sm mb-1 text-[#666]">{user?.email}</div>
                  { user?.roles.map(role => {
                    return <div className="inline-block text-xs mr-2 px-2 py-2 bg-[#f97216] text-white rounded-full font-semibold mt-1">
                      {role.toUpperCase()}
                    </div>
                  })}
                </div>
            </Dropdown.Item>

            <Dropdown.Divider />
            <Dropdown.Item className="bg-transparent" as="div">
              <Button
                variant="danger"
                className="w-full py-2 border-none rounded-lg text-white text-sm font-semibold"
                onClick={logout}>
                Log out
              </Button>
            </Dropdown.Item>
          </NavDropdown>

        </div>
        </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}