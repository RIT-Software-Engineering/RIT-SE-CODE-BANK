import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import RoleHome from "./components/RoleHome.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { INSTRUCTOR_ROLES } from "./utils/roles.js";
import StudentCoursesPage from "./pages/student/StudentCoursesPage.jsx";
import StudentTeamsPage from "./pages/student/StudentTeamsPage.jsx";
import TeachingSectionsPage from "./pages/teaching/TeachingSectionsPage.jsx";
import TeachingSectionPage from "./pages/teaching/TeachingSectionPage.jsx";
import TeamBuilderPage from "./pages/TeamBuilderPage.jsx";
import DevLoginPage from "./pages/DevLoginPage.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import CourseWebsitePage from "./pages/CourseWebsitePage.jsx";
import "./styles/global.css";
import "./styles/index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { CourseOverview } from "./pages/course/CourseOverview.jsx";
import { CourseDashboard } from "./pages/course/CourseDashboard.jsx";
import { BuilderPageAdmin } from "./pages/WorkflowBuilderPage.jsx";
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename="/cmt">
      <AuthProvider>
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
          <Route index element={<RoleHome />} />
          <Route path="student/courses" element={<RequireAuth learning><StudentCoursesPage /></RequireAuth>} />
          <Route path="student/teams" element={<RequireAuth learning><StudentTeamsPage /></RequireAuth>} />
          <Route path="teaching" element={<RequireAuth teaching><TeachingSectionsPage /></RequireAuth>} />
          <Route path="teaching/:id" element={<RequireAuth teaching><TeachingSectionPage /></RequireAuth>} />

          {/* Professor-only routes */}
          <Route 
            path="teambuilder" 
            element={
              <RequireAuth teachingInstructor>
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
            element={<RequireAuth teachingInstructor><CourseOverview /></RequireAuth>}
          />
          <Route 
            path="courses/:id" 
            element={<RequireAuth teachingInstructor><CourseDashboard /></RequireAuth>}
          />
          <Route 
            path="workflowbuilder" 
            element={<RequireAuth roles={INSTRUCTOR_ROLES}><BuilderPageAdmin isAdmin={false}/></RequireAuth>}
          />
          <Route 
            path="workflowbuilder-admin" 
            element={
              <RequireAuth roles={['instructor', 'professor']}>
                <BuilderPageAdmin isAdmin={true}/>
              </RequireAuth>
            } 
          />
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
