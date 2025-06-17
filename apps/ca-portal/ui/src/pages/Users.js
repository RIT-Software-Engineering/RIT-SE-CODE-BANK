// pages/Users.jsx
import { Link } from "react-router";

const users = ["av1698", "lc2410", "rhs9168","cjd8115"];

export default function Users() {
  return (
    <div className="p-4">
      <h1>Select a User</h1>
      <ul className="space-y-2">
        {users.map((username) => (
          <li key={username}>
            <Link
              to={`/users/${username}/messaging`}
              className="text-blue-600 hover:underline"
            >
              {username}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
