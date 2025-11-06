import "./dev-silence-resizeobserver.js";
import "./setup-resize-observer.js";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import TeamBuilderPage from "./pages/TeamBuilderPage.jsx";
import CalPage from "./pages/CalPage.jsx";
import CoursePage from "./pages/CoursePage.jsx";
import DevLogin from "./pages/DevLogin.jsx";
import "./styles/global.css";
import "./styles/index.css";
import AuthProvider from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";

console.log("pages seen:", require.context("./pages", false, /\.jsx$/).keys());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public route: login */}
          <Route path="/login" element={<DevLogin />} />

          {/* Protected routes: must be logged in */}
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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

