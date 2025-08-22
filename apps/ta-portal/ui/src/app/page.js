// src/app/page.js (root page)
'use client';

import { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import LoginWrapper from "@/components/auth/Login/LoginWrapper";
import SignUpForm from "@/components/auth/SignUpForm";
import LandingDashboard from "@/components/dashboard/LandingDashboard";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileModal from "@/components/profile/UserProfileModal";
import { getAllUsers, getUserProfile } from "@/services/db-apis";
import { useNotification } from "@/contexts/NotificationContext";

/**
 * Home Page Component
 * --------------------
 * Acts as the root page of the application. 
 * Responsibilities:
 * - Handles authentication (login/signup flow).
 * - Fetches user data on load.
 * - Displays login/signup forms or dashboard based on authentication state.
 * - Manages profile creation modal after signup.
 *
 * @returns {JSX.Element} The rendered root page (auth forms, profile modal, or dashboard)
 */
export default function Home() {
  // Authentication and notification contexts
  const { currentUser, setCurrentUser } = useAuth();
  const { showNotification } = useNotification();

  // Local state for users, profile modal, loading indicator, and auth flow
  const [users, setUsers] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDataForModal, setProfileDataForModal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authView, setAuthView] = useState('login'); // Toggles between login and signup forms

  /**
   * Fetch all users on component mount.
   * Populates the users list used for validation in login/signup forms.
   */
  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  /**
   * Handle successful login or signup event.
   *
   * @param {Object} user - The user object returned after login/signup.
   * @param {"login"|"signup"} action - The type of auth action performed.
   */
  const handleLoginSuccess = async (user, action) => {
    if (action === 'login' && user && user.username) {
      try {
        // After successful login, fetch the full user profile
        const fullProfile = await getUserProfile(user.username);

        // Save profile in context and persist session in localStorage
        localStorage.setItem('username', fullProfile.username);
        setCurrentUser(fullProfile);
        showNotification("Login successful!", "success");
        console.log("User logged in and session saved:", fullProfile);
      } catch (error) {
        console.error("Failed to fetch full user profile after login:", error);
      }

    } else if (action === 'signup' && user) {
      // For new users, open the profile modal to complete registration
      console.log("New user creation started. Opening profile form.", user);
      setProfileDataForModal(user);
      setIsProfileModalOpen(true);
    } else {
      // Error fallback if user or action data is invalid
      console.error("Login/Signup failed: Data is missing or invalid.", { user, action });
      showNotification("Login/Signup failed. Please try again.", "error");
    }
  };

  /**
   * Handle successful profile creation or update.
   *
   * @param {Object} newlyCreatedProfile - The completed user profile object.
   */
  const handleProfileUpdateSuccess = (newlyCreatedProfile) => {
    console.log("Profile creation successful. Logging in new user:", newlyCreatedProfile);

    // Save profile and update global state
    localStorage.setItem('username', newlyCreatedProfile.username);
    setCurrentUser(newlyCreatedProfile);

    // Reset modal state
    setIsProfileModalOpen(false);
    setProfileDataForModal(null);

    // Return to login view after profile completion
    setAuthView('login');
  };

  // Render a full-page loading spinner while initial data is being fetched
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Modal for creating a user profile after signup */}
      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          mode="create"
          profileData={profileDataForModal}
          onUpdateSuccess={handleProfileUpdateSuccess}
          allUsers={users}
        />
      )}

      {/* Show login/signup forms if no user is logged in */}
      {!currentUser && !isProfileModalOpen && (
        <>
          {authView === 'login' && (
            <LoginWrapper
              onLoginSuccess={handleLoginSuccess}
              allUsers={users}
              onSwitchToSignUp={() => setAuthView('signup')}
            />
          )}
          {authView === 'signup' && (
            <SignUpForm
              onSignUpSubmit={handleLoginSuccess}
              allUsers={users}
              onSwitchToLogin={() => setAuthView('login')}
            />
          )}
        </>
      )}

      {/* Show dashboard if user is authenticated */}
      {currentUser && (
        <LandingDashboard user={currentUser} />
      )}
    </Box>
  );
}