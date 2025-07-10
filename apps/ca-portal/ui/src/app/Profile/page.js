// app/Profile/page.js
"use client";
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileModal from "@/components/profile/UserProfileModal";

import ProfileInfoCard from "@/components/profile/ProfileInfoCard";
import CoursesTakenCard from "@/components/profile/CoursesTakenCard";
import JobPositionsCard from "@/components/profile/JobPositionsCard";
import CoursesWorkedCard from "@/components/profile/CoursesWorkedCard";

/**
 * ProfilePage displays user profile details by consuming data directly from the AuthContext.
 *
 * It relies on the `currentUser` and `loading`
 * states provided by the `useAuth` hook. It triggers profile updates using the
 * `refreshUserProfile` function from the context.
 */
export default function ProfilePage() {
  // --- State Management ---
  // Local state is now only needed for UI elements specific to this page.
  const [showModal, setShowModal] = useState(false);

  // --- Auth Context ---
  // Get all necessary data and functions directly from the AuthContext.
  // `currentUser` is the single source of truth for profile data.
  // `loading` indicates if the initial session load or a refresh is in progress.
  const { currentUser, loading, refreshUserProfile } = useAuth();

  // --- Event Handlers ---
  // This function is now simpler. It calls the context's refresh function
  // to update the global user state, which automatically re-renders this page.
  const handleUpdateSuccess = () => {
    console.log("Update successful, refetching data via context...");
    refreshUserProfile();
    setShowModal(false);
  };

  // This function now uses a simple timeout to ensure the modal re-mounts correctly,
  // which can help with re-initializing its internal state if needed.
  const handleOpenModal = () => {
    setShowModal(false);
    setTimeout(() => setShowModal(true), 0);
  };

  // --- Derived Data & Role Checks ---
  // All checks and data derivations are now based on `currentUser` from the context.
  const isCandidateOrEmployee =
    currentUser?.role === "CANDIDATE" || currentUser?.role === "EMPLOYEE";
  const isEmployerOrAdmin =
    currentUser?.role === "EMPLOYER" || currentUser?.role === "ADMIN";
  const coursesTaken =
    currentUser?.candidate?.courseHistory.map((ch) => ch.course) || [];

  // --- Conditional Rendering ---
  // Use the `loading` state from the context to display a loading message.
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  }

  // If loading is complete and there's no user, they are likely not logged in.
  if (!currentUser) {
    return (
      <div className="p-8 text-center text-gray-500">
        No profile data available. Please log in.
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <ProfileInfoCard
        profileData={currentUser}
        isEmployerOrAdmin={isEmployerOrAdmin}
        isCandidateOrEmployee={isCandidateOrEmployee}
        handleOpenModal={handleOpenModal}
      />
      
      {isCandidateOrEmployee && (
        <CoursesTakenCard
          profileData={currentUser}
          coursesTaken={coursesTaken}
        />
      )}

      {isEmployerOrAdmin && (
        <JobPositionsCard
          profileData={currentUser}
          coursesTaken={coursesTaken}
        />
      )}

      {isCandidateOrEmployee && <CoursesWorkedCard profileData={currentUser} />}

      {showModal && (
        <UserProfileModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          profileData={currentUser}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
