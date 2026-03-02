import React, { useState } from "react";
import "../styles/devLogin.css";
// import { AUTH_BASE } from "../utils/api";

export default function DevLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoggingIn(true);

    try {
      const res = await fetch(`/api/dev/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed (${res.status}): ${text}`);
      }

      window.location.href = "/cmt/";
    } catch (err) {
      console.error(err);
      setError("Login failed. Check email/password or backend logs.");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="dev-login-container">
      <h1 className="dev-login-title">Developer Login</h1>
      <p className="dev-login-subtitle">
        Enter a test account to simulate Shibboleth login.
      </p>

      {error && <p className="dev-login-error">{error}</p>}

      <form className="dev-login-form" onSubmit={handleSubmit}>
        <label className="dev-login-label">
          Email
          <input
            className="dev-login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="dev-login-label">
          Password
          <input
            className="dev-login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button className="dev-login-submit" type="submit" disabled={loggingIn}>
          {loggingIn ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}