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

export default function Home() {
  const { currentUser, setCurrentUser } = useAuth();
  const { showNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDataForModal, setProfileDataForModal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authView, setAuthView] = useState('login');

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

  // Handle successful login or signup
  const handleLoginSuccess = async (user, action) => {
    if (action === 'login' && user && user.username) {
      try {
        // After successful login, immediately fetch the full profile
        const fullProfile = await getUserProfile(user.username);
        
        // Set the full profile in the context and save the session
        localStorage.setItem('username', fullProfile.username);
        setCurrentUser(fullProfile);
        showNotification("Login successful!", "success");
        console.log("User logged in and session saved:", fullProfile);
      } catch (error) {
        
        console.error("Failed to fetch full user profile after login:", error);
      }

    } else if (action === 'signup' && user) {
      console.log("New user creation started. Opening profile form.", user);
      setProfileDataForModal(user);
      setIsProfileModalOpen(true);
    } else {
      console.error("Login/Signup failed: Data is missing or invalid.", { user, action });
      showNotification("Login/Signup failed. Please try again.", "error");
    }
  };

  const handleProfileUpdateSuccess = (newlyCreatedProfile) => {
    console.log("Profile creation successful. Logging in new user:", newlyCreatedProfile);
    localStorage.setItem('username', newlyCreatedProfile.username);
    setCurrentUser(newlyCreatedProfile);
    setIsProfileModalOpen(false);
    setProfileDataForModal(null);
    setAuthView('login');
  };

  // Render a loading indicator while fetching initial data
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

      {currentUser && (
        <LandingDashboard user={currentUser} />
      )}
    </Box>
  );
}