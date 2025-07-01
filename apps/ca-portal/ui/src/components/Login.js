"use client";
import React, { useState, useEffect } from "react";
import { getAllUsers, getUserProfile } from "../services/api"; // Adjust the path as needed

export default function Login({ onLoginSuccess = () => {} }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getAllUsers(); // Call the service function
        setUsers(data);
        if (data && data.length > 0) {
          setSelectedUser(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch open Users:", err);
        setError(err.message); // Store the error message
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Function to handle sign-in and retrieve user profile info
  const handleSignIn = async () => {
    if (!selectedUser) {
      setError("Please select a user.");
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const fullUserProfile = await getUserProfile(selectedUser.uid);

      onLoginSuccess(fullUserProfile);
      console.log(`${fullUserProfile.role} signed in`);

    } catch (err) {
        console.error("Sign in failed:", err);
        setError("Failed to sign in. Could not retrieve user profile.");
    } finally {
        setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Loading users...</div>;
  }

  return (
    <>
      <div className="bg-white">
        <div className="bg-rit-light-gray h-screen rounded-lg p-5 m-10 justify-center items-center flex flex-col">
          <div className="text-center text-3xl w-1/2">
            Welcome to the RIT Course Assistant Portal
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
              value={selectedUser ? selectedUser.uid : ""}
              onChange={e => {
                const user = users.find(u => u.uid === Number(e.target.value));
                setSelectedUser(user);
                console.log(`Selected user: ${user.name} (${user.role})`);
              }}
              className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-rit-orange focus:ring focus:ring-rit-orange focus:ring-opacity-50 p-2"
            >
              {users.map(user => (
                <option key={user.uid} value={user.uid}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          <button
            className="bg-black text-white w-40 rounded-lg p-3 text-lg mt-10 hover:bg-gray-800 disabled:bg-gray-400"
            onClick={handleSignIn}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </div>
    </>
  );
}

