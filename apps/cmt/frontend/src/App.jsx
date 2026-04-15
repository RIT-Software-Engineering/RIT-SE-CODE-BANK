import { Outlet } from "react-router-dom";
import SiteNav from "./components/SiteNav.jsx";
import React from "react";

export default function App() {
  return (
    <div className="min-h-full">
      <SiteNav />
      <main>
          <Outlet />
      </main>
    </div>
  );
}
