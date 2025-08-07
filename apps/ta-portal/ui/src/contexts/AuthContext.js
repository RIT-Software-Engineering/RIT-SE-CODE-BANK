'use client';
import { createContext, useState, useContext, useEffect } from "react";
import { getUserProfile } from "@/services/db-apis"; 

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state
  // This effect runs once when the app loads
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
          // If a user ID is in storage, fetch their full profile
          const userProfile = await getUserProfile(storedUsername);
          console.log("Session restored:", userProfile);
          setCurrentUser(userProfile);
        }
      } catch (error) {
        console.error("Session restore failed:", error);
        // Clear out any bad data if the fetch fails
        localStorage.removeItem('username');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []); // Empty dependency array means this runs only on mount


  const refreshUserProfile = async () => {
    try {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        const userProfile = await getUserProfile(storedUsername);
        setCurrentUser(userProfile);
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  };


  const value = {
    currentUser,
    setCurrentUser,
    loading, // Expose loading state
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
