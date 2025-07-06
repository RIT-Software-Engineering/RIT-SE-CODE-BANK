'use client';
import { createContext, useState, useContext, useEffect } from "react";
import { getUserProfile } from "@/services/api"; 

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state

  // This effect runs once when the app loads
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        const storedUID = localStorage.getItem('userUID');
        if (storedUID) {
          // If a user ID is in storage, fetch their full profile
          const userProfile = await getUserProfile(parseInt(storedUID, 10));
          setCurrentUser(userProfile);
        }
      } catch (error) {
        console.error("Session restore failed:", error);
        // Clear out any bad data if the fetch fails
        localStorage.removeItem('userUID');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []); // Empty dependency array means this runs only on mount

  const addApplicationToCurrentUser = (newApplication) => {
    if (!currentUser || !currentUser.candidate) return;

    setCurrentUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        candidate: {
          ...prevUser.candidate,
          // The back-relation from your schema is jobPositionApplicationHistory
          jobPositionApplicationHistory: [...(prevUser.candidate.jobPositionApplicationHistory || []), newApplication],
        },
      };
      return updatedUser;
    });
  };

  const value = {
    currentUser,
    setCurrentUser,
    loading, // Expose loading state
    addApplicationToCurrentUser
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
