// src/app/page.js (home page)
'use client';

import { useState } from "react";
import Login from "@/components/features/auth/Login";
import LandingDashboard from "@/components/features/dashboard/LandingDashboard";
import { useAuth } from "@/contexts/AuthContext";
// Import the modal component you'll be using
import UserProfileModal from "@/components/profile/UserProfileModal";


export default function Home() {
  const { currentUser, setCurrentUser } = useAuth();
  
  // State to manage the user profile modal's visibility and data
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDataForModal, setProfileDataForModal] = useState(null);

  const handleLoginSuccess = (user, action) => {
    // If the action is 'login', it's an existing user signing in.
    if (action === 'login' && user && user.uid) {
      localStorage.setItem('userUID', user.uid); 
      setCurrentUser(user);
      console.log("User logged in and session saved:", user);
    // If the action is 'signup', it's a new user.
    } else if (action === 'signup' && user && user.uid) {
      console.log("New user creation started. Opening profile form.", user);
      // Set the temporary user data and open the modal to complete the profile.
      setProfileDataForModal(user);
      setIsProfileModalOpen(true);
    } else {
      console.error("Login/Signup failed: Data is missing or invalid.", { user, action });
    }
  };

  // This function is called by the UserProfileModal after a new profile is created.
  const handleProfileUpdateSuccess = (newlyCreatedProfile) => {
    console.log("Profile creation successful. Logging in new user:", newlyCreatedProfile);
    localStorage.setItem('userUID', newlyCreatedProfile.uid);
    setCurrentUser(newlyCreatedProfile);
    setIsProfileModalOpen(false);
    setProfileDataForModal(null);
  };

  // Function to handle user logout
  const handleLogout = () => {
    localStorage.removeItem('userUID');
    setCurrentUser(null);
  };

  return (
    <>
      {/* Conditionally render the UserProfileModal for new user creation */}
      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          mode="create"
          profileData={profileDataForModal}
          onUpdateSuccess={handleProfileUpdateSuccess}
        />
      )}

      {/* Render Login component if no user is logged in AND the profile modal is closed */}
      {!currentUser && !isProfileModalOpen && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Render Dashboard if a user is logged in */}
      {currentUser && (
        <>
          <button
            onClick={handleLogout}
            className="fixed top-20 right-4 bg-red-500 text-white py-2 px-4 rounded-lg shadow-md z-50 hover:bg-red-600"
          >
            Logout
          </button>
          <LandingDashboard user={currentUser} />
        </>
      )}
    </>
  );
}