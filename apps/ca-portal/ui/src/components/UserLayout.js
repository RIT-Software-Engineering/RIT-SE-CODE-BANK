// components/UserLayout.jsx
import { useParams, Outlet, Link } from "react-router";

export default function UserLayout() {
  const { username } = useParams();

  return (
    <div className="p-4">
      <h2>User: {username}</h2>
      <nav className="mb-4">
        <Link to="" className="mr-4">Profile</Link>
        <Link to="messaging">Messaging</Link>
      </nav>
      <Outlet />
    </div>
  );
}
