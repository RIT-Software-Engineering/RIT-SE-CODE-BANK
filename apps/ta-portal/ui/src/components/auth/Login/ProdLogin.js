// src/components/auth/Login/ProdLogin.js
"use client";

import { authenticateUser, resetPassword } from "@/services/db-apis";
import { useNotification } from "@/contexts/NotificationContext";
import React, { useState } from "react";
import { set } from "react-hook-form";

/**
 * A component for a production username/password login system.
 * @param {object} props - The component props.
 * @param {function} props.onLoginSuccess - Callback for a successful login.
 * @param {function} props.onSwitchToSignUp - Callback to switch to the sign-up view.
 */
export default function ProdLogin({
  onLoginSuccess = () => {},
  onSwitchToSignUp = () => {},
}) {
  const { showNotification } = useNotification();

  const [view, setView] = useState("login");
  const [loginCredentials, setLoginCredentials] = useState({ username: "", password: "" });
  const [resetCredentials, setResetCredentials] = useState({ username: "", newPassword: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetCredentials((prev) => ({ ...prev, [name]: value }));
  };

  // Handle sign-in
  const handleSignIn = async () => {
    const { username, password } = loginCredentials;
    if (!username || !password) {
      showNotification("Please enter both username and password.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const user = await authenticateUser(username, password);
      onLoginSuccess(user, 'login');
    } catch (err) {
      console.error("Login failed:", err);
      showNotification(err.message || "Invalid username or password.", "error");
    } finally {
      setIsLoading(false);
    }
  };


  // Handle password reset
  const handleResetPassword = async () => {
    const { username, newPassword } = resetCredentials;
    if (!username || !newPassword) {
      showNotification("Please provide a username and a new password.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const response = await resetPassword(username, newPassword);
      showNotification(response.message, "success");
      setView('login');
    } catch (err) {
      showNotification(err.message || "An error occurred during password reset.", "error");
    } finally {
      setResetCredentials({ username: "", newPassword: "" });
      setIsLoading(false);
    }
  };

  // Render the login view
  const renderLoginView = () => (
    <>
      <div className="mt-6 w-64 space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
          <input type="text" id="username" maxLength="7" name="username" value={loginCredentials.username} onChange={handleLoginChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" placeholder="Enter username (i.e. xyz1234)"/>
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" id="password" name="password" value={loginCredentials.password} onChange={handleLoginChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" placeholder="Enter password"/>
        </div>
      </div>

      <button onClick={handleSignIn} disabled={isLoading} className="bg-black text-white w-40 rounded-lg p-3 text-lg mt-10 hover:bg-gray-800 disabled:bg-gray-400">
        {isLoading ? "Signing In..." : "Sign In"}
      </button>

      <div className="flex flex-col items-center space-y-2 mt-4 text-sm">
        <button
          onClick={() => setView('forgot')}
          className="text-black underline hover:text-rit-orange transition-colors duration-200 cursor-pointer"
        >
          Forgot Password?
        </button>
        <button
          onClick={onSwitchToSignUp}
          className="text-black underline hover:text-rit-orange transition-colors duration-200 cursor-pointer"
        >
          Don&apos;t have an account? Sign Up
        </button>
      </div>
    </>
  );

  // Render the forgot password view
  const renderForgotView = () => (
    <>
      <div className="mt-6 w-64 space-y-4">
        <div>
          <label htmlFor="reset-username" className="block text-sm font-medium text-gray-700">Your Username</label>
          <input type="text" id="reset-username" maxLength="7" name="username" value={resetCredentials.username} onChange={handleResetChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" placeholder="Enter username (i.e. xyz1234)" />
        </div>
        <div>
          <label htmlFor="reset-new-password" className="block text-sm font-medium text-gray-700">New Password</label>
          <input type="password" id="reset-new-password" name="newPassword" value={resetCredentials.newPassword} onChange={handleResetChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" placeholder="Enter new password" />
        </div>
      </div>

      <button onClick={handleResetPassword} disabled={isLoading} className="bg-rit-orange text-white w-64 rounded-lg p-3 text-lg mt-10 hover:bg-orange-600">
        {isLoading ? "Resetting..." : "Reset Password"}
      </button>
      <button onClick={() => setView('login')} className="mt-4 text-sm text-black underline hover:text-rit-orange transition-colors duration-200 cursor-pointer">
        Back to Login
      </button>
    </>
  );

  return (
    <div className="bg-white">
      <div className="bg-rit-light-gray h-screen rounded-lg p-5 m-10 justify-center items-center flex flex-col">
        <div className="text-center text-3xl w-1/2">
          Welcome to the RIT Teaching Assistant Portal
          <br />
          <br />
          {view === 'login' ? 'Sign in with your RIT Account' : 'Reset Your Password'}
        </div>
        {view === 'login' ? renderLoginView() : renderForgotView()}
      </div>
    </div>
  );
}