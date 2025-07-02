'use client';
import { useEffect, useState } from "react";
import Navbar from "./navbar/Navbar";
import LoginPage from "./login/login";

function MyApp({ Component, pageProps }) {
  const [showNavbar, setShowNavbar] = useState(false);

  useEffect(() => {
    // Always set role to GUEST on every load (not persistent)
    if (typeof window !== "undefined") {
      localStorage.setItem("role", "GUEST");
      localStorage.removeItem("username");
      setShowNavbar(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("role");
      setShowNavbar(role && role !== "GUEST");
    }
  });

  return (
    <>
      {showNavbar && <Navbar />}
      <LoginPage />
    </>
  );
}

export default MyApp;