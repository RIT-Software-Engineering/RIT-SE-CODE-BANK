'use client';
import { useState } from "react";
import "./admin.css";

export default function AdminPage() {
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("USER");
    const [message, setMessage] = useState("");

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setMessage("");
        if (!username) {
            setMessage("Please enter a username.");
            return;
        }
        try {
            const res = await fetch("http://localhost:3000/api/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, role }),
            });
            const data = await res.json();
            if (!res.ok) {
                setMessage(data.error || "Failed to create user.");
            } else {
                setMessage(`User "${username}" created as ${role}.`);
                setUsername("");
                setRole("USER");
            }
        } catch {
            setMessage("Server error.");
        }
    };

    return (
        <div className="admin-page-root">
            <h1>Admin Page</h1>
            <form onSubmit={handleCreateUser} className="admin-create-user-form">
                <label>
                    Username:
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="admin-input"
                    />
                </label>
                <label>
                    Role:
                    <select
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        className="admin-select"
                    >
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="USER">User</option>
                    </select>
                </label>
                <button type="submit" className="admin-create-btn">Create User</button>
            </form>
            {message && (
                <div className={`admin-message ${message.includes("created") ? "admin-message-success" : "admin-message-error"}`}>
                    {message}
                </div>
            )}
        </div>
    );
}