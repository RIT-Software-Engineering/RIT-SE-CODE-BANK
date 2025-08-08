// src/components/auth/SignUpForm.js

"use client";

import React, { useState } from "react";

/**
 * A form for creating a new user account.
 * @param {object} props - The component props.
 * @param {function} props.onSignUpSubmit - Callback for when the user submits the form.
 * @param {function} props.onSwitchToLogin - Callback to switch the view back to the login form.
 * @param {object[]} props.allUsers - The list of all existing users for validation.
 */
export default function SignUpForm({
  onSignUpSubmit = () => {},
  onSwitchToLogin = () => {},
  allUsers = [],
}) {
  const [error, setError] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "CANDIDATE",
  });

  // Event handler for creating a new user
  const handleCreateAndContinue = () => {
    // Validate input
    const trimmedUsername = newUser.username.trim();
    if (!trimmedUsername || !newUser.password.trim() || !newUser.role) {
      setError("Please fill in all fields to create a new user.");
      return;
    }

    // Check for username existence
    const usernameExists = allUsers.some(
      (user) => user.username.toLowerCase() === trimmedUsername.toLowerCase()
    );
    if (usernameExists) {
      setError("This username is already taken. Please choose another one.");
      return;
    }

    setError(null);
    onSignUpSubmit(newUser, 'signup'); // Pass data and action to parent
  };

  return (
    <div className="bg-rit-light-gray h-screen rounded-lg p-5 m-10 justify-center items-center flex flex-col">
      <div className="text-center text-3xl w-1/2">
        Welcome to the RIT Teaching Assistant Portal
        <br />
        <br />
        Create a New Account
      </div>

      {/* User Creation Form */}
      <div className="mt-6 w-64 space-y-4">
        <div>
          <label htmlFor="new-username" className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            id="new-username"
            maxLength="7"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm"
            placeholder="Enter username (i.e. xyz1234)"
          />
        </div>
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="new-password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm"
            placeholder="Enter password"
          />
        </div>
        <div>
          <label htmlFor="new-user-role" className="block text-sm font-medium text-gray-700">I am a...</label>
          <select
            id="new-user-role"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm"
          >
            <option value="CANDIDATE">Candidate</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="EMPLOYER">Employer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <button
        className="bg-rit-orange text-white w-64 rounded-lg p-3 text-lg mt-10 hover:bg-orange-600"
        onClick={handleCreateAndContinue}
      >
        Create and Continue
      </button>
      
      <button
        onClick={onSwitchToLogin}
        className="mt-4 text-sm text-black underline hover:text-rit-orange transition-colors duration-200 cursor-pointer"
      >
        Already have an account? Sign In
      </button>
    </div>
  );
}