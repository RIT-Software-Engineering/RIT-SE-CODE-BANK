'use client';
import { createContext, useState, useContext, useEffect, useCallback, useMemo } from "react";
import { getUserProfile } from "@/services/db-apis";

const AuthContext = createContext(null);

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
  const logout = useCallback(() => {
    localStorage.removeItem('username');
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