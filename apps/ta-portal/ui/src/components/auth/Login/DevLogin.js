// src/components/auth/Login/DevLogin.js
"use client";

import React, { useState, useEffect } from "react";
import { getUser } from "../../../services/db-apis";

/**
 * A component for the development login system using a dropdown.
 * @param {object} props - The component props.
 * @param {function} props.onLoginSuccess - Callback for a successful login.
 * @param {function} props.onSwitchToSignUp - Callback to switch to the sign-up view.
 * @param {object[]} props.allUsers - The list of all users.
 */
export default function DevLogin({
  onLoginSuccess = () => {},
  onSwitchToSignUp = () => {},
  allUsers = [],
}) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Set a default user from the list when the component loads
  useEffect(() => {
    if (allUsers && allUsers.length > 0 && !selectedUser) {
      setSelectedUser(allUsers[0]);
    }
  }, [allUsers, selectedUser]);

  // Handle changes in the user selection dropdown
  const handleSelectChange = (e) => {
    const { value } = e.target;
    if (value === "new-user") {
      onSwitchToSignUp(); // Trigger the view switch in the parent
    } else {
      const user = allUsers.find((u) => u.username === value);
      setSelectedUser(user);
    }
  };

  // Handle the sign-in action
  const handleSignIn = async () => {
    if (!selectedUser) {
      setError("Please select a user.");
      return;
    }
    setIsLoggingIn(true);
    setError(null);
    try {
      // Fetch the basic user info for the selected user
      const user = await getUser(selectedUser.username);
      onLoginSuccess(user, 'login');
      console.log(`${user.role} signed in using DEV mode.`);
    } catch (err) {
      console.error("Sign in failed:", err);
      setError("Failed to sign in. Could not retrieve user profile.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="bg-rit-light-gray h-screen rounded-lg p-5 m-10 justify-center items-center flex flex-col">
        <div className="text-center text-3xl w-1/2">
          Welcome to the RIT Teaching Assistant Portal (DEV)
          <br />
          <br />
          Sign in with your RIT Account
        </div>

        <div className="mt-6">
          <label htmlFor="user_select" className="block text-sm font-medium text-gray-700 mb-2">
            Select User
          </label>
          <select
            id="user_select"
            value={selectedUser ? selectedUser.username : ""}
            onChange={handleSelectChange}
            className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-rit-orange focus:ring focus:ring-rit-orange focus:ring-opacity-50 p-2"
          >
            <option value="new-user">-- Create New User --</option>
            {allUsers.map((user) => (
              <option key={user.username} value={user.username}>
                {user.fname} {user.lname} ({user.role})
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        <button
          className="bg-black text-white w-40 rounded-lg p-3 text-lg mt-10 hover:bg-gray-800 disabled:bg-gray-400"
          onClick={handleSignIn}
          disabled={!selectedUser || isLoggingIn}
        >
          {isLoggingIn ? "Signing In..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}