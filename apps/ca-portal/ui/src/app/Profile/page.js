// app/Profile/page.js
"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileModal from "@/components/profile/UserProfileModal";
import { getUserProfile } from "@/services/api";

import ProfileInfoCard from "@/components/profile/ProfileInfoCard";
import CoursesTakenCard from "@/components/profile/CoursesTakenCard";
import JobPositionsCard from "@/components/profile/JobPositionsCard";
import CoursesWorkedCard from "@/components/profile/CoursesWorkedCard";

/**
 * ProfilePage displays user profile details including:
 * - Basic user info
 * - Courses taken and worked (for candidates and employees)
 * - Posted job positions (for employers and admins)
 * - A modal to edit profile information
 *
 * Role-based content:
 * - CANDIDATE/EMPLOYEE: Sees courses taken and work history
 * - EMPLOYER/ADMIN: Sees posted job positions
 *
 * @returns User profile page with displays of their data
 */
export default function ProfilePage() {
  const [showModal, setShowModal] = useState(false); // Controls visibility of the profile edit modal
  const { currentUser } = useAuth(); // Authenticated user context
  const [profileData, setProfileData] = useState(null); // Fetched user data from backend
  const [isLoading, setIsLoading] = useState(true); // Loading indicator
  const [error, setError] = useState(null); // Error tracking
  const [profileVersion, setProfileVersion] = useState(0); // Used for triggering re-fetching of profile data after updates

  // Fetches the user profile whenever the authenticated user or profile version changes.
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch only the user profile data for this page.
        const user = await getUserProfile(currentUser.uid);
        setProfileData(user);
      } catch (err) {
        console.error("Error fetching page data:", err);
        setError("Could not load profile data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, profileVersion]);

  // Handles successful profile updates by reloading profile data
  const handleUpdateSuccess = () => {
    console.log("Update successful, refetching data...");
    setProfileVersion((currentVersion) => currentVersion + 1);
    setShowModal(false);
  };

  // Check to see if user is either "CANDIDATE" or "EMPLOYEE" role
  const isCandidateOrEmployee =
    profileData?.role === "CANDIDATE" || profileData?.role === "EMPLOYEE";

  // Check to see if user is either "EMPLOYER" or "ADMIN" role
  const isEmployerOrAdmin =
    profileData?.role === "EMPLOYER" || profileData?.role === "ADMIN";

  const coursesTaken =
    profileData?.candidate?.courseHistory.map((ch) => ch.course) || [];

  // Conditional rendering for loading, error, or missing profile
  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500">Loading profile...</div>
    );
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!profileData)
    return (
      <div className="p-8 text-center text-gray-500">
        No profile data available. Please log in.
      </div>
    );

  const handleOpenModal = () => {
    setShowModal(false);
    setTimeout(() => setShowModal(true), 0);
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <ProfileInfoCard
        profileData={profileData}
        isEmployerOrAdmin={isEmployerOrAdmin}
        isCandidateOrEmployee={isCandidateOrEmployee}
        handleOpenModal={handleOpenModal}
      />
      {/* Courses Taken Card */}
      {isCandidateOrEmployee && (
        <CoursesTakenCard
          profileData={profileData}
          coursesTaken={coursesTaken}
        />
      )}

      {/* Job Positions Card */}
      {isEmployerOrAdmin && (
        <JobPositionsCard
          profileData={profileData}
          coursesTaken={coursesTaken}
        />
      )}

      {/* Courses Worked Card */}
      {isCandidateOrEmployee && <CoursesWorkedCard profileData={profileData} />}

      {/* Profile Edit Modal */}
      {showModal && (
        <UserProfileModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          profileData={profileData}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
