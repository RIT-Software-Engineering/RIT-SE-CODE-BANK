'use client';
import { createContext, useState, useContext, useEffect } from "react";
import { getUserProfile } from "@/services/api"; 

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- NEW: Reusable function to fetch and set user data ---
  // This function contains the core logic that was previously duplicated.
  const fetchAndSetUser = async (uid) => {
    try {
      const numericUID = parseInt(uid, 10);
      // Validate that the UID is a number before making an API call.
      if (isNaN(numericUID)) {
        throw new Error(`Invalid UID provided: ${uid}`);
      }
      const userProfile = await getUserProfile(numericUID);
      setCurrentUser(userProfile);
    } catch (error) {
      console.error("Failed to fetch or set user profile:", error);
      // If fetching fails, ensure the user is logged out.
      localStorage.removeItem('userUID');
      setCurrentUser(null);
    }
  };

  // This effect runs once when the app loads to restore the session.
  useEffect(() => {
    const loadInitialUserData = async () => {
      setLoading(true);
      const storedUID = localStorage.getItem('userUID');
      if (storedUID) {
        // Call the reusable function to load the user.
        await fetchAndSetUser(storedUID);
      }
      setLoading(false);
    };

    loadInitialUserData();
  }, []); // Empty dependency array means this runs only on mount

  const addApplicationToCurrentUser = (newApplication, newResumeUrl) => {
    if (!currentUser || !currentUser.candidate) return;
    setCurrentUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        candidate: {
          ...prevUser.candidate,
          resumeURL: newResumeUrl || prevUser.candidate.resumeURL,
          jobPositionApplicationHistory: [...(prevUser.candidate.jobPositionApplicationHistory || []), newApplication],
        },
      };
      return updatedUser;
    });
  };

  // The refresh function is now much simpler.
  const refreshUserProfile = async () => {
    if (currentUser?.uid) {
      setLoading(true);
      // It just calls the same reusable function.
      await fetchAndSetUser(currentUser.uid);
      setLoading(false);
    }
  };


  const value = {
    currentUser,
    setCurrentUser, // Note: You might want to replace this with explicit login/logout functions
    loading,
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
