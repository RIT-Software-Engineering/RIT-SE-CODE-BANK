"use client";

import React, { useState, useEffect } from "react";
// getUserProfile is still needed for the sign-in action.
import { getUserProfile } from "../../services/db-apis";

/**
 * A component that renders a login interface.
 * @param {object} props - The component props.
 * @param {function} props.onLoginSuccess - A callback function for login/signup.
 * @param {object[]} props.allUsers - The list of all users, passed from a parent component.
 */
export default function Login({ onLoginSuccess = () => {}, allUsers = [] }) {
  // --- STATE MANAGEMENT ---
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "CANDIDATE" });

  // --- DATA SYNCING ---
  // This useEffect now only sets the default selected user when the component first receives the list.
  useEffect(() => {
    if (allUsers && allUsers.length > 0 && !selectedUser) {
      setSelectedUser(allUsers[0]);
    }
    // The dependency on `selectedUser` is removed to prevent it from re-running unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers]);

  // --- EVENT HANDLERS ---
  const handleSelectChange = (e) => {
    const { value } = e.target;
    if (value === "new-user") {
      setIsCreatingUser(true);
      setSelectedUser(null);
      setError(null);
    } else {
      const user = allUsers.find((u) => u.uid.toString() === value);
      setSelectedUser(user);
    }
  };

  // Event handler for signing in
  const handleSignIn = async () => {
    if (!selectedUser) {
      setError("Please select a user.");
      return;
    }
    setIsLoggingIn(true);
    setError(null);
    try {
      const fullUserProfile = await getUserProfile(selectedUser.uid);
      onLoginSuccess(fullUserProfile, 'login');
      console.log(`${fullUserProfile.role} signed in`);
    } catch (err) {
      console.error("Sign in failed:", err);
      setError("Failed to sign in. Could not retrieve user profile.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Event handler for creating a new user
  const handleCreateAndContinue = () => {
    // Validate input
    const trimmedUsername = newUser.username.trim();
    if (!trimmedUsername || !newUser.password.trim() || !newUser.role) {
      setError("Please fill in all fields to create a new user.");
      return;
    }

    // Check for username existence directly against the 'allUsers' prop.
    const usernameExists = allUsers.some(user => user.username.toLowerCase() === trimmedUsername.toLowerCase());
    if (usernameExists) {
      setError("This username is already taken. Please choose another one.");
      return;
    }

    setError(null);
    onLoginSuccess(newUser, 'signup');
  };

  return (
    <>
      <div className="bg-white">
        <div className="bg-rit-light-gray h-screen rounded-lg p-5 m-10 justify-center items-center flex flex-col">
          <div className="text-center text-3xl w-1/2">
            Welcome to the RIT Teaching Assistant Portal
            <br />
            <br />
            {isCreatingUser ? "Create a New Account" : "Sign in with your RIT Account"}
          </div>

          <div className="mt-6">
            <label htmlFor="user_select" className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              id="user_select"
              value={isCreatingUser ? "new-user" : (selectedUser ? selectedUser.uid : "")}
              onChange={handleSelectChange}
              className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-rit-orange focus:ring focus:ring-rit-orange focus:ring-opacity-50 p-2"
            >
              <option value="new-user">-- Create New User --</option>
              {allUsers.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.fname} {user.lname} ({user.role})
                </option>
              ))}
            </select>
          </div>

          {/* User Creation Form */}
          {isCreatingUser && (
            <div className="mt-6 w-64 space-y-4">
              <div>
                <label htmlFor="new-user-username" className="block text-sm font-medium text-gray-700">Username</label>
                <input type="text" id="new-username" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" placeholder="Enter username (i.e. xyz1234)"/>
              </div>
              <div>
                <label htmlFor="new-user-password" className="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" id="new-password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" placeholder="Enter password"/>
              </div>
              <div>
                <label htmlFor="new-user-role" className="block text-sm font-medium text-gray-700">I am a...</label>
                <select id="new-user-role" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm">
                  <option value="CANDIDATE">Candidate</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 mt-4">{error}</p>}

          {/* Conditional Buttons */}
          {isCreatingUser ? (
            <button
              className="bg-rit-orange text-white w-64 rounded-lg p-3 text-lg mt-10 hover:bg-orange-600"
              onClick={handleCreateAndContinue}
            >
              Create and Continue
            </button>
          ) : (
            <button
              className="bg-black text-white w-40 rounded-lg p-3 text-lg mt-10 hover:bg-gray-800 disabled:bg-gray-400"
              onClick={handleSignIn}
              disabled={!selectedUser || isLoggingIn}
            >
              {isLoggingIn ? "Signing In..." : "Sign In"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}