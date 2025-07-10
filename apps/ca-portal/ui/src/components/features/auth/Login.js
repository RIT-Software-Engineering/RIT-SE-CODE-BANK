// This directive marks the component as a "Client Component" in Next.js.
// This is necessary because it uses hooks like useState and useEffect, which only run in the browser.
"use client";

import React, { useState, useEffect } from "react";
// Import API utility functions. Using a path alias like `@/services/api` is recommended for robustness.
import { getAllUsers, getUserProfile } from "../../../services/api";

/**
 * A component that renders a login interface.
 * It allows a user to be selected from a dropdown and "signed in".
 * @param {object} props - The component props.
 * @param {function} props.onLoginSuccess - A callback function that is executed upon successful login, passing the user's profile.
 */
export default function Login({ onLoginSuccess = () => {} }) {
  // --- STATE MANAGEMENT ---
  // Holds the list of users fetched from the API for the dropdown.
  const [users, setUsers] = useState([]);
  // Tracks whether the initial user list is being fetched.
  const [isLoading, setIsLoading] = useState(true);
  // Tracks whether the sign-in process is currently active after the user clicks the button.
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // Stores any error messages that occur during fetching or logging in.
  const [error, setError] = useState(null);
  // Stores the user object currently selected in the dropdown.
  const [selectedUser, setSelectedUser] = useState(null);

  // --- DATA FETCHING ---
  // This effect runs once when the component first mounts, thanks to the empty dependency array [].
  useEffect(() => {
    // An async function to fetch the list of all users for the dropdown.
    async function fetchUsers() {
      try {
        const data = await getAllUsers(); // Call the API service function.
        setUsers(data); // Store the fetched users in state.

        // If users are found, pre-select the first one in the dropdown.
        if (data && data.length > 0) {
          setSelectedUser(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch open Users:", err);
        setError(err.message); // Store the error message to display to the user.
      } finally {
        // This always runs, regardless of success or failure.
        setIsLoading(false); // Mark initial loading as complete.
      }
    }

    fetchUsers();
  }, []); // Empty dependency array means this effect runs only on component mount.

  // --- EVENT HANDLERS ---
  // This function is triggered when the "Sign In" button is clicked.
  const handleSignIn = async () => {
    // Basic validation to ensure a user has been selected.
    if (!selectedUser) {
      setError("Please select a user.");
      return;
    }

    // Set loading state for the sign-in process and clear previous errors.
    setIsLoggingIn(true);
    setError(null);

    try {
      // Fetch the full, detailed profile for the selected user.
      const fullUserProfile = await getUserProfile(selectedUser.uid);

      // Call the callback function passed in props to notify the parent component of the successful login.
      onLoginSuccess(fullUserProfile);
      console.log(`${fullUserProfile.role} signed in`);
    } catch (err) {
      console.error("Sign in failed:", err);
      setError("Failed to sign in. Could not retrieve user profile.");
    } finally {
      // This always runs, marking the sign-in attempt as complete.
      setIsLoggingIn(false);
    }
  };

  // --- RENDER LOGIC ---
  // Display a loading message while the initial user list is being fetched.
  if (isLoading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  // Render the main login form once the initial loading is complete.
  return (
    <>
      <div className="bg-white">
        <div className="bg-rit-light-gray h-screen rounded-lg p-5 m-10 justify-center items-center flex flex-col">
          {/* Welcome Header */}
          <div className="text-center text-3xl w-1/2">
            Welcome to the RIT Course Assistant Portal
            <br />
            <br />
            Sign in with your RIT Account
          </div>

          {/* User Selection Dropdown */}
          <div className="mt-6">
            <label
              htmlFor="user_select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select User
            </label>
            <select
              id="user_select"
              value={selectedUser ? selectedUser.uid : ""}
              onChange={(e) => {
                // Find the full user object from the users array based on the selected UID.
                const user = users.find(
                  (u) => u.uid === Number(e.target.value)
                );
                setSelectedUser(user); // Update the state with the selected user.
                console.log(`Selected user: ${user.name} (${user.role})`);
              }}
              className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-rit-orange focus:ring focus:ring-rit-orange focus:ring-opacity-50 p-2"
            >
              {/* Map over the users array to create an <option> for each user. */}
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          {/* Error Display */}
          {error && <p className="text-red-500 mt-4">{error}</p>}

          {/* Sign In Button */}
          <button
            className="bg-black text-white w-40 rounded-lg p-3 text-lg mt-10 hover:bg-gray-800 disabled:bg-gray-400"
            onClick={handleSignIn}
            disabled={isLoggingIn} // Disable the button during the sign-in process.
          >
            {isLoggingIn ? "Signing In..." : "Sign In"}
          </button>
        </div>
      </div>
    </>
  );
}
