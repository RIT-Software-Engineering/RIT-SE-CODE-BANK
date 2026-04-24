// src/app/login/page.js
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import LoginWrapper from "@/components/auth/Login/LoginWrapper";
import SignUpForm from "@/components/auth/SignUpForm";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileModal from "@/components/profile/UserProfileModal";
import { getAllUsers, getLoginMode, getUserProfile } from "@/services/db-apis";
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

  const [loginMode, setLoginMode] = useState("prod")
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDataForModal, setProfileDataForModal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authView, setAuthView] = useState('login');
  const [redirectPath, setRedirectPath] = useState(null);

  // Capture redirect query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      setRedirectPath(redirect);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      let targetPath = '/';
      if (redirectPath === 'positions') {
        const formattedRole = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase();
        targetPath = `/Positions/${formattedRole}/${currentUser.username}`;
      } else if (redirectPath) {
        targetPath = redirectPath;
      }
      router.push(targetPath);
    }
  }, [currentUser, router, redirectPath]);

  // Fetch all users on component mount
  useEffect(() => {
    async function fetchLoginMode() {
      try {
        const mode = await getLoginMode();
        setLoginMode(mode.loginMode);
      } catch (err) {
        console.error("Failed to fetch login mode:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLoginMode();
  }, []);

  const handleLoginSuccess = async (user, action) => {
    if (action === 'login' && user && user.username) {
      try {
        const fullProfile = await getUserProfile(user.username);
        localStorage.setItem('username', fullProfile.username);
        setCurrentUser(fullProfile);
        showNotification("Login successful!", "success");
        
        // Redirect to the target path or home
        let targetPath = '/';
        if (redirectPath === 'positions') {
          const formattedRole = fullProfile.role.charAt(0).toUpperCase() + fullProfile.role.slice(1).toLowerCase();
          targetPath = `/Positions/${formattedRole}/${fullProfile.username}`;
        } else if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
          targetPath = redirectPath;
        }
        router.push(targetPath);
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
    
    // Redirect to the target path or home
    let targetPath = '/';
    if (redirectPath === 'positions') {
      const formattedRole = newlyCreatedProfile.role.charAt(0).toUpperCase() + newlyCreatedProfile.role.slice(1).toLowerCase();
      targetPath = `/Positions/${formattedRole}/${newlyCreatedProfile.username}`;
    } else if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
      targetPath = redirectPath;
    }
    router.push(targetPath);
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
        />
      )}

      {authView === 'login' && (
        <LoginWrapper
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignUp={() => setAuthView('signup')}
          loginMode={loginMode}
        />
      )}
      
      {authView === 'signup' && (
        <SignUpForm
          onSignUpSubmit={handleLoginSuccess}
          onSwitchToLogin={() => setAuthView('login')}
        />
      )}
    </Box>
  );
}
