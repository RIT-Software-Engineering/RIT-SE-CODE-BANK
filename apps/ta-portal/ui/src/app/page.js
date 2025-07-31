// src/app/page.js (home page)
'use client';

import { useState, useEffect } from "react";
import Login from "@/components/auth/Login";
import LandingDashboard from "@/components/dashboard/LandingDashboard";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileModal from "@/components/profile/UserProfileModal";
import { getAllUsers } from "@/services/db-apis";


export default function Home() {
  const { currentUser, setCurrentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDataForModal, setProfileDataForModal] = useState(null);
  
  // ADDED: State to manage the initial data fetch
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all users when the component mounts
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

  const handleLoginSuccess = (user, action) => {
    if (action === 'login' && user && user.uid) {
      localStorage.setItem('userUID', user.uid); 
      setCurrentUser(user);
      console.log("User logged in and session saved:", user);
    } else if (action === 'signup' && user) {
      console.log("New user creation started. Opening profile form.", user);
      setProfileDataForModal(user);
      setIsProfileModalOpen(true);
    } else {
      console.error("Login/Signup failed: Data is missing or invalid.", { user, action });
    }
  };

  const handleProfileUpdateSuccess = (newlyCreatedProfile) => {
    console.log("Profile creation successful. Logging in new user:", newlyCreatedProfile);
    localStorage.setItem('userUID', newlyCreatedProfile.uid);
    setCurrentUser(newlyCreatedProfile);
    setIsProfileModalOpen(false);
    setProfileDataForModal(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('userUID');
    setCurrentUser(null);
  };

  // Render a loading indicator while fetching initial data
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <>
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
        <Login onLoginSuccess={handleLoginSuccess} allUsers={users} />
      )}

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