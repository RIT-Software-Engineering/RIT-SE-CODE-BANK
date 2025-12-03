import React, { useEffect, useState } from "react";
import "../styles/devLogin.css";

const AUTH_BASE = "http://localhost:5010"; // backend server

export default function DevLoginPage() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState(null);
  const [loggingInId, setLoggingInId] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true);
        setError(null);

        const res = await fetch(`${AUTH_BASE}/dev/users`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to load dev users (${res.status})`);
        }

        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
        setError("Could not load dev users. Check dev backend.");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  const handleLogin = async (id) => {
    try {
      setLoggingInId(id);
      setError(null);

      const res = await fetch(`${AUTH_BASE}/dev/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed (${res.status}): ${text}`);
      }

      // cookie set – now go into the main app
      window.location.href = "/cmt/";
    } catch (err) {
      console.error(err);
      setError("Login failed. Check console / backend logs.");
    } finally {
      setLoggingInId(null);
    }
  };

  return (
    <div className="dev-login-container">
      <h1 className="dev-login-title">Developer Login</h1>
      <p className="dev-login-subtitle">
        Select a test user to simulate Shibboleth login.
      </p>

      {loadingUsers && <p>Loading test users…</p>}
      {error && <p className="dev-login-error">{error}</p>}

      {!loadingUsers && users.length === 0 && !error && (
        <p>No dev users found. Check your JSON file.</p>
      )}

      <div className="dev-login-users">
        {users.map((user) => (
          <button
            key={user.id}
            className={
              loggingInId === user.id
                ? "dev-login-user-btn dev-login-user-btn-disabled"
                : "dev-login-user-btn"
            }
            onClick={() => handleLogin(user.id)}
            disabled={!!loggingInId}
          >
            <div className="dev-login-user-name">
              {user.name || user.email}
            </div>
            <div className="dev-login-user-email">{user.email}</div>
            {user.roles?.length > 0 && (
              <div className="dev-login-user-roles">
                Roles: {user.roles.join(", ")}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
