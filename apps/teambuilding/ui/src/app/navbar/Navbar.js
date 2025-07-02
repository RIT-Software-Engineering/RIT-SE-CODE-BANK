'use client';
import React from "react";
import { useRouter } from "next/navigation";
import "./navbar.css"; // Import the CSS file

export default function Navbar() {
  const router = useRouter();
  let role = "";
  if (typeof window !== "undefined") {
    role = localStorage.getItem("role") || "";
  }

  if (role === "GUEST") {
    return null;
  }

  const navLinks = [
    ...(role === "ADMIN" ? [{ label: "Admin", path: "/admin" }] : []),
    ...(role === "ADMIN" || role === "MANAGER"
      ? [{ label: "Manager", path: "/manager" }]
      : []),
    { label: "User", path: "/user" },
  ];

  // Sign out handler
  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("role", "GUEST");
      localStorage.removeItem("username");
      router.push("/"); // Go to login page at "/"
    }
  };

  return (
    <nav className="navbar">
      <ul className="navbar-list">
        {navLinks.map((link) => (
          <li key={link.path} className="navbar-item">
            <button
              className="navbar-link"
              onClick={() => router.push(link.path)}
            >
              {link.label}
            </button>
          </li>
        ))}
        <li className="navbar-item navbar-signout">
          <button
            className="navbar-link navbar-signout-btn"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </li>
      </ul>
    </nav>
  );
}