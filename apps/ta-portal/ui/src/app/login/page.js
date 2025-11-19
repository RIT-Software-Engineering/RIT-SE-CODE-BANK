// src/app/login/page.js
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import LoginWrapper from "@/components/auth/Login/LoginWrapper";
import SignUpForm from "@/components/auth/SignUpForm";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileModal from "@/components/profile/UserProfileModal";
import { getAllUsers, getUserProfile } from "@/services/db-apis";
import { useNotification } from "@/contexts/NotificationContext";

/**
 * Login Page Component
 * --------------------
 * Dedicated page for user authentication (login/signup flow).
 * Redirects to home page after successful login.
 *
 * @returns {JSX.Element} The rendered login page
 */
export default function LoginPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useAuth();
  const { showNotification } = useNotification();

  const [users, setUsers] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDataForModal, setProfileDataForModal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authView, setAuthView] = useState('login');

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  // Fetch all users on component mount
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

  const handleLoginSuccess = async (user, action) => {
    if (action === 'login' && user && user.username) {
      try {
        const fullProfile = await getUserProfile(user.username);
        localStorage.setItem('username', fullProfile.username);
        setCurrentUser(fullProfile);
        showNotification("Login successful!", "success");
        router.push('/');
      } catch (error) {
        console.error("Failed to fetch full user profile after login:", error);
      }
    } else if (action === 'signup' && user) {
      setProfileDataForModal(user);
      setIsProfileModalOpen(true);
    } else {
      console.error("Login/Signup failed: Data is missing or invalid.", { user, action });
      showNotification("Login/Signup failed. Please try again.", "error");
    }
  };

  const handleProfileUpdateSuccess = (newlyCreatedProfile) => {
    localStorage.setItem('username', newlyCreatedProfile.username);
    setCurrentUser(newlyCreatedProfile);
    setIsProfileModalOpen(false);
    setProfileDataForModal(null);
    setAuthView('login');
    router.push('/');
  };

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
    <Box 
      sx={{ 
        minHeight: "calc(100vh - 200px)", 
        display: "flex", 
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
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
    </Box>
  );
}
