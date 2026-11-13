"use client";

import { useState } from "react";
import { createUser } from "./api/managerApi";
import "./styles/CreateUserForm.css";

export default function CreateUserForm({ onUserCreated }) {
  const [newUser, setNewUser] = useState("");

  const handleCreateUser = async () => {
    if (!newUser.trim()) return;
    try {
      const res = await createUser(newUser, "USER");
      const data = await res.json();
      if (!res.ok) {
        console.log("Failed to create user:", data.error);
      } else {
        onUserCreated(data.user);
        setNewUser("");
      }
    } catch {
      console.log("Server error creating user");
    }
  };

  return (
    <div>
      <h2 className="create-user-title">Create User</h2>
      <div className="create-user-controls">
        <input
          className="create-user-input"
          type="text"
          placeholder="Enter username"
          value={newUser}
          onChange={(e) => setNewUser(e.target.value)}
        />
        <button className="create-user-button" onClick={handleCreateUser}>Create User</button>
      </div>
    </div>
  );
}
