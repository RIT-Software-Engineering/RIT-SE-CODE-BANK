'use client';
import { createContext, useState, useContext, useEffect, useCallback, useMemo } from "react";
import { getUserProfile } from "@/services/db-apis";

const AuthContext = createContext(null);

/**
 * The AuthProvider component provides authentication state and functions to its children.
 *
 * When the component mounts, it attempts to restore a user session from local storage.
 * If the stored username is valid, the user profile is fetched and stored in the component
 * state. The component also provides functions to refresh the user profile and log out.
 *
 * The component memoizes its context value to prevent unnecessary re-renders in consumers.
 *
 * @param {ReactNode} children The children of the component.
 *
 * @returns {ReactElement} The AuthContext.Provider component with the context value.
 */
export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effect to load user data from storage on initial mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
          const userProfile = await getUserProfile(storedUsername);
          setCurrentUser(userProfile);
        }
      } catch (error) {
        console.error("Session restore failed:", error);
        localStorage.removeItem('username');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []); // Empty array ensures this runs only once on mount

  // Function to refresh user data on demand
  const refreshUserProfile = useCallback(async () => {
    try {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        const userProfile = await getUserProfile(storedUsername);
        setCurrentUser(userProfile);
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  }, []);

  // the logout function to clear the session
  const logout = useCallback(async () => {
    try {
      // Clear Slack session cookies via backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${process.env.NEXT_PUBLIC_API_EXTENSION}${process.env.NEXT_PUBLIC_SLACK_API_EXTENSION}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      await response.json();
    } catch (error) {
      console.error('Failed to clear Slack session:', error);
    }
    
    localStorage.removeItem('username');
    sessionStorage.removeItem('slack_selected_email');
    setCurrentUser(null);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders in consumers
  const value = useMemo(() => ({
    currentUser,
    setCurrentUser,
    loading,
    refreshUserProfile,
    logout
  }), [currentUser, loading, refreshUserProfile, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}