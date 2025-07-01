// src/app/page.js (home page)
"use client";

// Note: I'm assuming LandingDashboard is your dynamic dashboard component
import Login from "@/components/Login";
import LandingDashboard from "@/components/LandingDashboard"; 
import UserProfileModal from "@/components/UserProfileModal";
import { useAuth } from "@/contexts/AuthContext";


export default function Home() {
  const { currentUser, setCurrentUser } = useAuth();

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <>
      {/* 2. Check for the `currentUser` object to see if user is logged in */}
      {!currentUser && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {currentUser && (
        <>
          {/* Optional: A simple logout button for testing */}
          <button
            onClick={handleLogout}
            className="fixed top-20 right-4 bg-red-500 text-white py-2 px-4 rounded-lg shadow-md z-50 hover:bg-red-600"
          >
            Logout
          </button>
          
          <UserProfileModal></UserProfileModal>

          {/* 3. Pass the role STRING to the dashboard component */}
          <LandingDashboard userRole={currentUser.role} />
        </>
      )}
    </>
  );
}