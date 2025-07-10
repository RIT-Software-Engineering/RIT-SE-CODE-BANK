// app/Profile/page.js
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileModal from "@/components/profile/UserProfileModal";
import { getUserProfile, getAllCourses } from "@/services/db-apis";

import ProfileInfoCard from "@/components/profile/ProfileInfoCard";
import CoursesTakenCard from "@/components/profile/CoursesTakenCard";
import JobPositionsCard from "@/components/profile/JobPositionsCard";
import CoursesWorkedCard from "@/components/profile/CoursesWorkedCard";

export default function ProfilePage() {
  const [showModal, setShowModal] = useState(false);
  const { currentUser, refreshUserProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  // State to hold the master list of all available courses.
  const [courseOptions, setCourseOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // This effect now fetches both the user's profile and the master course list.
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch both data sets in parallel for efficiency.
        const [user, courses] = await Promise.all([
          getUserProfile(currentUser.uid),
          getAllCourses(),
        ]);
        setProfileData(user);
        setCourseOptions(courses);
      } catch (err) {
        console.error("Error fetching page data:", err);
        setError("Could not load profile data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]); // Runs when the base user from the context changes.

  const handleUpdateSuccess = (updatedProfile) => {
    setProfileData(updatedProfile); // Update local state directly with the correct data.
    refreshUserProfile(); // Also, tell the context to refresh to ensure consistency across the app.
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setShowModal(false);
    setTimeout(() => setShowModal(true), 0);
  };

  // --- DERIVED DATA FIX ---
  // `useMemo` creates a stable, correctly formatted list of courses taken.
  const coursesTaken = useMemo(() => {
    // Get the raw course history from the current profile data.
    const history = profileData?.candidate?.courseHistory || [];
    if (!history.length || !courseOptions.length) {
      return [];
    }

    // Map over the history and ensure each item has the full course details.
    return history.map((historyItem) => {
      // Handle both nested `{course: {courseCode: ...}}` and flat `{courseCode: ...}` structures.
      const courseCode =
        historyItem.course?.courseCode || historyItem.courseCode;
      // Find the full course details from the master list.
      const courseDetails = courseOptions.find(
        (c) => c.courseCode === courseCode
      );

      // Return a consistent object structure that CoursesTakenCard can always rely on.
      return {
        courseCode: courseCode,
        name: courseDetails?.name || "Unknown Course",
        // FIX: Check for the description in the nested object first, then fall back to the master list.
        description:
          historyItem.course?.description ||
          courseDetails?.description ||
          "No description available",
        // You can add other properties from historyItem if needed, like 'grade'.
        grade: historyItem.grade,
      };
    });
  }, [profileData, courseOptions]); // This will only re-calculate when profileData or courseOptions changes.

  const isCandidateOrEmployee =
    profileData?.role === "CANDIDATE" || profileData?.role === "EMPLOYEE";
  const isEmployerOrAdmin =
    profileData?.role === "EMPLOYER" || profileData?.role === "ADMIN";

  // --- Conditional Rendering ---
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

  // --- Main Render ---
  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <ProfileInfoCard
        profileData={profileData}
        isEmployerOrAdmin={isEmployerOrAdmin}
        isCandidateOrEmployee={isCandidateOrEmployee}
        handleOpenModal={handleOpenModal}
      />

      {isCandidateOrEmployee && (
        <CoursesTakenCard
          profileData={profileData}
          // Pass the new, consistently formatted coursesTaken array.
          coursesTaken={coursesTaken}
        />
      )}

      {isEmployerOrAdmin && (
        <JobPositionsCard
          profileData={profileData}
          coursesTaken={coursesTaken}
        />
      )}

      {isCandidateOrEmployee && <CoursesWorkedCard profileData={profileData} />}

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
