// app/Profile/page.js
"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileModal from "@/components/profile/UserProfileModal";
import { getUserProfile, getAllCourses } from "@/services/db-apis";

import ProfileInfoCard from "@/components/profile/ProfileInfoCard";
import CoursesTakenCard from "@/components/profile/CandidateAndEmployee/CoursesTakenCard";
import CoursesWorkedCard from "@/components/profile/CandidateAndEmployee/CoursesWorkedCard";
import ResumeManager from "@/components/profile/CandidateAndEmployee/ResumeManager";
import JobPositionsCard from "@/components/positions/EmployerAndAdmin/JobPositionsCard";

export default function ProfilePage() {
  const [editingSection, setEditingSection] = useState(null); 
  const { currentUser, refreshUserProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  // State to hold the master list of all available courses.
  const [courseOptions, setCourseOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // This function fetches the user's profile and updates the state.
  const handleProfileRefresh = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const user = await getUserProfile(currentUser.uid);
      setProfileData(user);
      refreshUserProfile();
    } catch (err) {
      console.error("Error refreshing profile data:", err);
      setError("Could not refresh profile data. Please try again.");
    }
  }, [currentUser, refreshUserProfile]);

  // This effect fetches both the user's profile and the master course list.
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
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
  }, [currentUser]);

  // This function is called when a profile update is successful.
  const handleUpdateSuccess = (updatedProfile) => {
    setProfileData(updatedProfile);
    refreshUserProfile();
    setEditingSection(null); // Close the modal on success
  };

  // This function is called when a user requests to edit a specific section.
  const handleEditRequest = (section) => {
    setEditingSection(section);
  };

  // Calculate the courses taken by the user
  const coursesTaken = useMemo(() => {
    const history = profileData?.candidate?.courseHistory || [];
    if (!history.length || !courseOptions.length) return [];
    return history.map((historyItem) => {
      const courseCode = historyItem.course?.courseCode || historyItem.courseCode;
      const courseDetails = courseOptions.find((c) => c.courseCode === courseCode);
      return {
        courseCode: courseCode,
        name: courseDetails?.name || "Unknown Course",
        description: historyItem.course?.description || courseDetails?.description || "No description available",
        grade: historyItem.grade,
        hasTaken: historyItem.hasTaken,
        wasPriorEmployee: historyItem.wasPriorEmployee,
      };
    });
  }, [profileData, courseOptions]);

  const isCandidateOrEmployee = profileData?.role === "CANDIDATE" || profileData?.role === "EMPLOYEE";
  const isEmployerOrAdmin = profileData?.role === "EMPLOYER" || profileData?.role === "ADMIN";

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!profileData) return <div className="p-8 text-center text-gray-500">No profile data available. Please log in.</div>;

  // --- Main Render ---
  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <ProfileInfoCard
        profileData={profileData}
        isEmployerOrAdmin={isEmployerOrAdmin}
        isCandidateOrEmployee={isCandidateOrEmployee}
        onEdit={() => handleEditRequest('info')}
      />
      
      {isCandidateOrEmployee && (
        <>
          <CoursesTakenCard
            coursesTaken={coursesTaken}
            onEdit={() => handleEditRequest('coursesTaken')}
          />
          <CoursesWorkedCard
            coursesTaken={coursesTaken}
            onEdit={() => handleEditRequest('coursesWorked')}
          />
          <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
             <ResumeManager
                resumes={profileData.candidate?.resumes || []}
                candidateUID={profileData.uid}
                onProfileRefresh={handleProfileRefresh}
              />
          </section>
        </>
      )}

      {isEmployerOrAdmin && (
        <JobPositionsCard
          profileData={profileData}
          coursesTaken={coursesTaken}
        />
      )}

      {editingSection && (
        <UserProfileModal
          isOpen={!!editingSection}
          onClose={() => setEditingSection(null)}
          profileData={profileData}
          mode="edit"
          onUpdateSuccess={handleUpdateSuccess}
          editingSection={editingSection}
          courseOptions={courseOptions}
        />
      )}
    </div>
  );
}