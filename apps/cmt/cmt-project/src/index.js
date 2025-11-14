import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import TeamBuilderPage from "./pages/TeamBuilderPage.jsx";
import CalPage from "./pages/CalPage.jsx";
import CoursePage from "./pages/CoursePage.jsx";
import CreateTemplatePage from "./pages/CreateTemplatePage.jsx";
import DevLoginPage from "./pages/DevLoginPage.jsx";   // <-- ADD THIS LINE
import "./styles/global.css";
import "./styles/index.css";
import "bootstrap/dist/css/bootstrap.min.css";

console.log("pages seen:", require.context("./pages", false, /\.jsx$/).keys());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename="/cmt">
      <Routes>

        {/* ---------- DEV LOGIN PAGE ROUTE ---------- */}
        <Route path="/dev-login" element={<DevLoginPage />} />
        {/* ------------------------------------------- */}

        <Route path="/" element={<App />}>
          <Route path="teambuilder" element={<TeamBuilderPage />} />
          <Route path="calendar" element={<CalPage />} />
          <Route path="coursebuilder" element={<CoursePage />} />
          <Route path="createtemplate" element={<CreateTemplatePage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
