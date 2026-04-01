import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import HomePage from "./pages/Homepage.jsx";
import TeamBuilderPage from "./pages/TeamBuilderPage.jsx";
import DevLoginPage from "./pages/DevLoginPage.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import CourseWebsitePage from "./pages/CourseWebsitePage.jsx";
import "./styles/global.css";
import "./styles/index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { CourseOverview } from "./pages/course/CourseOverview.jsx";
import { CourseDashboard } from "./pages/course/CourseDashboard.jsx";
import { BuilderPage } from "./pages/WorkflowBuilderPage.jsx";
import { TemplateOverview } from "./pages/template/TemplateOverview.jsx";
import { TemplateDashboard } from "./pages/template/TemplateDashboard.jsx";

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
          {/* Landing page - shows welcome message */}
          <Route index element={<HomePage />} />

          {/* Professor-only routes */}
          <Route 
            path="teambuilder" 
            element={
              <RequireAuth roles={['instructor', 'professor']}>
                <TeamBuilderPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="templates" 
            element={
              <RequireAuth roles={['instructor', 'professor']}>
                <TemplateOverview />
              </RequireAuth>
            } 
          />
          <Route 
            path="templates/:id" 
            element={
              <RequireAuth roles={['instructor', 'professor']}>
                <TemplateDashboard />
              </RequireAuth>
            } 
          />
          <Route 
            path="coursewebsite" 
            element={
              <RequireAuth roles={['instructor', 'professor']}>
                <CourseWebsitePage />
              </RequireAuth>
            } 
          />
          <Route 
            path="courses" 
            element={<CourseOverview />} 
          />
          <Route 
            path="courses/:id" 
            element={<CourseDashboard />} 
          />
          <Route 
            path="workflowbuilder" 
            element={<BuilderPage />} 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);