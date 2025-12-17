import { Outlet } from "react-router-dom";
import SiteNav from "./components/SiteNav.jsx";

export default function App() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <SiteNav />
      <main style={{ padding: "24px" }}>
        <div style={{ 
          maxWidth: "1200px", 
          margin: "0 auto",
          textAlign: "center",
          paddingTop: "40px"
        }}>
          <h1 style={{ 
            fontSize: "2.5rem", 
            fontWeight: "700",
            marginBottom: "16px",
            color: "#1a202c"
          }}>
            Welcome to the Course Management Tool
          </h1>
          <p style={{ 
            fontSize: "1.125rem", 
            color: "#4a5568",
            marginBottom: "32px"
          }}>
            Manage your courses, events, and academic schedule all in one place
          </p>
        </div>
        <Outlet />
      </main>
    </div>
  );
}