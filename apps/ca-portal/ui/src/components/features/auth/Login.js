"use client";

import React, { useState, useEffect } from "react";
// Import API utility functions. Using a path alias like `@/services/api` is recommended for robustness.
import { getAllUsers, getUserProfile } from "../../../services/db-apis";

/**
 * A component that renders a login interface.
 * It allows an existing user to be selected or a new user to be created.
 * @param {object} props - The component props.
 * @param {function} props.onLoginSuccess - A callback function that is executed upon login or user creation, passing the user's data.
 */
export default function Login({ onLoginSuccess = () => {} }) {
  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // New state for the new user creation flow
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ uid: "", name: "", email: "", role: "CANDIDATE" });

  // --- DATA FETCHING ---
  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getAllUsers();
        setUsers(data);
        if (data && data.length > 0) {
          setSelectedUser(data[0]);
        }
      } catch (err)        {
        console.error("Failed to fetch open Users:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // --- EVENT HANDLERS ---
  const handleSelectChange = (e) => {
    const { value } = e.target;
    // Check if the "Create New User" option was selected
    if (value === "new-user") {
      setIsCreatingUser(true);
      setSelectedUser(null);
      setError(null);
    } else {
      setIsCreatingUser(false);
      const user = users.find((u) => u.uid.toString() === value);
      setSelectedUser(user);
    }
  };

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

  // Handler for creating a new user and proceeding to the profile form
  const handleCreateAndContinue = () => {
    if (!newUser.uid.trim() || !newUser.name.trim() || !newUser.email.trim() || !newUser.role) {
      setError("Please fill in all fields, including the User ID, to create a new user.");
      return;
    }

    const uidExists = users.some(user => user.uid.toString() === newUser.uid.trim());
    if (uidExists) {
      setError("This User ID is already taken. Please choose another one.");
      return;
    }
    
    const finalUid = parseInt(newUser.uid.trim(), 10);
    if (isNaN(finalUid)) {
      setError("User ID must be a valid number.");
      return;
    }

    setError(null);
    onLoginSuccess({
      ...newUser,
      uid: finalUid,
    }, 'signup');
  };

  // --- RENDER LOGIC ---
  if (isLoading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  return (
    <>
      <div className="bg-white">
        <div className="bg-rit-light-gray h-screen rounded-lg p-5 m-10 justify-center items-center flex flex-col">
          <div className="text-center text-3xl w-1/2">
            Welcome to the RIT Course Assistant Portal
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
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          {/* New User Creation Form */}
          {isCreatingUser && (
            <div className="mt-6 w-64 space-y-4">
               <div>
                <label htmlFor="new-user-uid" className="block text-sm font-medium text-gray-700">User ID (UID)</label>
                <input 
                  type="text" 
                  id="new-user-uid" 
                  value={newUser.uid} 
                  onChange={(e) => setNewUser({...newUser, uid: e.target.value})} 
                  className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter a unique numeric ID"
                />
              </div>
              <div>
                <label htmlFor="new-user-name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" id="new-user-name" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" placeholder="Enter your full name"/>
              </div>
              <div>
                <label htmlFor="new-user-email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="new-user-email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" placeholder="Enter your email"/>
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