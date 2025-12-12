import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import TeamBuilderPage from "./pages/TeamBuilderPage.jsx";
import CalPage from "./pages/CalPage.jsx";
import CoursePage from "./pages/CoursePage.jsx";
import CreateTemplatePage from "./pages/CreateTemplatePage.jsx";
import DevLoginPage from "./pages/DevLoginPage.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import "./styles/global.css";
import "./styles/index.css";
import "bootstrap/dist/css/bootstrap.min.css";



/* ------------------------------------------------------------------
   Suppress noisy ResizeObserver errors in development
   (Does NOT affect production behavior)
   ------------------------------------------------------------------ */
if (process.env.NODE_ENV === "development") {
  const _error = console.error;
  console.error = (...args) => {
    const msg = args?.[0]?.toString?.() || "";
    if (
      msg.includes("ResizeObserver loop limit exceeded") ||
      msg.includes("ResizeObserver loop completed with undelivered notifications")
    ) {
      return; // ignore
    }
    _error(...args);
  };
}

console.log("pages seen:", require.context("./pages", false, /\.jsx$/).keys());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename="/cmt">
      <Routes>
        {/* Public route: login page */}
        <Route path="/login" element={<DevLoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <App />
            </RequireAuth>
          }
        >
          <Route path="teambuilder" element={<TeamBuilderPage />} />
          <Route path="calendar" element={<CalPage />} />
          <Route path="coursebuilder" element={<CoursePage />} />
          <Route path="createtemplate" element={<CreateTemplatePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
