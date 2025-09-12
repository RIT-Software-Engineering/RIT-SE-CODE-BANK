import { Outlet } from "react-router-dom";
import SiteNav from "./components/SiteNav.jsx";

export default function App() {
  return (
    <div>
      <SiteNav />
      <main style={{ padding: "24px" }}>
        <Outlet />
      </main>
    </div>
  );
}