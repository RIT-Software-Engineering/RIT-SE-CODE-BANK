import { Outlet } from "react-router-dom";
import SiteNav from "./components/SiteNav.jsx";

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
