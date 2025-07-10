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
          // 1. Parse the string from localStorage to a base-10 integer.
          const numericUID = parseInt(storedUID, 10);
          // 2. Add a check to ensure the parsed UID is a valid number (not NaN).
          // This prevents errors if the localStorage value is corrupted or not a number.
          if (!isNaN(numericUID)) {
            // 3. If valid, fetch the user's full profile.
            const userProfile = await getUserProfile(numericUID);
            setCurrentUser(userProfile);
          } else {
            // Handle the case where the stored UID is invalid.
            console.error("Invalid UID found in localStorage:", storedUID);
            localStorage.removeItem('userUID'); // Clean up the bad data.
            setCurrentUser(null);
          }
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

  const addApplicationToCurrentUser = (newApplication, newResumeUrl) => {
    if (!currentUser || !currentUser.candidate) return;
    setCurrentUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        candidate: {
          ...prevUser.candidate,
          resumeURL: newResumeUrl || prevUser.candidate.resumeURL,
          // The back-relation from your schema is jobPositionApplicationHistory
          jobPositionApplicationHistory: [...(prevUser.candidate.jobPositionApplicationHistory || []), newApplication],
        },
      };
      return updatedUser;
    });
  };

  const refreshUserProfile = async () => {
    try {
      const storedUID = localStorage.getItem('userUID');
      if (storedUID) {
        const numericUID = parseInt(storedUID, 10);
        if (!isNaN(numericUID)) {
          const userProfile = await getUserProfile(numericUID);
          setCurrentUser(userProfile);
        } else {
           console.error("Attempted to refresh with invalid UID:", storedUID);
        }
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  };


  const value = {
    currentUser,
    setCurrentUser,
    loading, // Expose loading state
    addApplicationToCurrentUser,
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
