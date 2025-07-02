'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Set role to guest on first load
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("role")) {
      localStorage.setItem("role", "GUEST");
    }
  }, []);

  // Store user info in localStorage for the rest of the UI to use
  const storeUser = (username, role) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("username", username);
      localStorage.setItem("role", role);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username) {
      setError("Please enter a username.");
      return;
    }
    setError("");
    try {
      // Adjusted API path to match your new API location
      const res = await fetch("http://localhost:3000/api/user-role?username=" + encodeURIComponent(username));
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      storeUser(username, data.role);
      // Redirect based on role
      if (data.role === "MANAGER") {
        router.push("/manager");
      } else if (data.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/user");
      }
    } catch {
      setError("Server error.");
    }
  };

  // DEV login handler
  const devLogin = (role) => {
    setError("");
    storeUser(username || role, role.toUpperCase());
    if (role === "manager") {
      router.push("/manager");
    } else if (role === "user") {
      router.push("/user");
    } else if (role === "admin") {
      router.push("/admin");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form className="login-form" onSubmit={handleLogin}>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        {error && <div className="login-error">{error}</div>}
        <button type="submit">Login</button>
      </form>
      <div className="dev-login-buttons">
        <button type="button" onClick={() => devLogin("admin")}>Dev Login as Admin</button>
        <button type="button" onClick={() => devLogin("manager")}>Dev Login as Manager</button>
        <button type="button" onClick={() => devLogin("user")}>Dev Login as User</button>
      </div>
    </div>
  );
}