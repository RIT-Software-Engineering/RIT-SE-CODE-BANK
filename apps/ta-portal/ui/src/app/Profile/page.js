// app/Profile/page.js
"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import FeatureGate from "@/components/common/FeatureGate";
import { FEATURES } from "@/configuration/featureFlags";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileModal from "@/components/profile/UserProfileModal";
import { getUserProfile, getAllCourses } from "@/services/db-apis";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ProfileInfoCard from "@/components/profile/ProfileInfoCard";
import CoursesTakenCard from "@/components/profile/CandidateAndEmployee/CoursesTakenCard";
import CoursesWorkedCard from "@/components/profile/CandidateAndEmployee/CoursesWorkedCard";
import ResumeManager from "@/components/profile/CandidateAndEmployee/ResumeManager";

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Button,
} from "@mui/material";

/**
 * Renders the user profile page.
 * This page fetches and displays the profile information for the currently authenticated user.
 * It dynamically renders different sections based on the user's role (e.g., Candidate, Employer)
 * and provides functionality to edit profile details via a modal.
 */
export default function ProfilePage() {
  // State to control which section of the profile is being edited in the modal.
  const [editingSection, setEditingSection] = useState(null);
  const { currentUser, refreshUserProfile, logout } = useAuth();

  // State for storing user profile data, course options for dropdowns, and UI states.
  const [profileData, setProfileData] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);


  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  /**
   * A callback function to manually refresh the profile data from the server.
   * This is passed down to child components (like ResumeManager) that need to
   * trigger a data refresh after performing an action.
   */
  const handleProfileRefresh = useCallback(async () => {
    if (!currentUser?.username) return;
    try {
      const user = await getUserProfile(currentUser.username);
      setProfileData(user);
      refreshUserProfile(); // Also refresh the global auth context.
    } catch (err) {
      console.error("Error refreshing profile data:", err);
      setError("Could not refresh profile data. Please try again.");
    }
  }, [currentUser, refreshUserProfile]);

  // Effect to fetch initial page data (profile and all courses) on component mount or user change.
  useEffect(() => {
    if (!currentUser?.username) {
      setIsLoading(false);
      return;
    }
    /**
     * Fetches all necessary data for the profile page in parallel to optimize load time.
     */
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use Promise.all to fetch user profile and course list concurrently.
        const [user, courses] = await Promise.all([
          getUserProfile(currentUser.username),
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

  /**
   * Handles the successful update of profile data from the modal.
   * It updates the local state, refreshes the global auth context, and closes the modal.
   * @param {object} updatedProfile - The updated profile data returned from the API.
   */
  const handleUpdateSuccess = (updatedProfile) => {
    setProfileData(updatedProfile);
    refreshUserProfile();
    setEditingSection(null); // Close the modal.
  };

  /**
   * Sets the section to be edited, which triggers the UserProfileModal to open.
   * @param {string} section - The identifier for the profile section to edit (e.g., 'info', 'coursesTaken').
   */
  const handleEditRequest = (section) => {
    setEditingSection(section);
  };

  /**
   * A memoized computation to process and enrich the user's course history.
   * It maps over the user's course history and joins it with the full course list
   * to include details like course name and description.
   * @returns {object[]} An array of enriched course history objects.
   */
  const coursesTaken = useMemo(() => {
    const history = profileData?.candidate?.courseHistory || [];
    if (!history.length || !courseOptions.length) return [];
    // Combine history data with detailed course information.
    return history.map((historyItem) => {
      const courseCode =
        historyItem.course?.courseCode || historyItem.courseCode;
      const courseDetails = courseOptions.find(
        (c) => c.courseCode === courseCode
      );
      return {
        courseCode: courseCode,
        name: courseDetails?.name || "Unknown Course",
        description:
          historyItem.course?.description ||
          courseDetails?.description ||
          "No description available",
        grade: historyItem.grade,
        hasTaken: historyItem.hasTaken,
        wasPriorEmployee: historyItem.wasPriorEmployee,
      };
    });
  }, [profileData, courseOptions]);

  // Boolean flags to simplify conditional rendering based on user role.
  const isCandidateOrEmployee =
    profileData?.role === "CANDIDATE" || profileData?.role === "EMPLOYEE";
  const isEmployerOrAdmin =
    profileData?.role === "EMPLOYER" || profileData?.role === "ADMIN";

  // --- Render Logic ---

  // Display a loading spinner while fetching initial data.
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Display an error message if data fetching fails.
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  // Display a message if no user is logged in or profile data is unavailable.
  if (!profileData) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="info">
          No profile data available. Please log in.
        </Alert>
      </Container>
    );
  }

  // Main component render method.
  return (
    <FeatureGate feature={FEATURES.PROFILES}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* The main profile information card, visible to all roles. */}
          <ProfileInfoCard
            profileData={profileData}
            isEmployerOrAdmin={isEmployerOrAdmin}
            isCandidateOrEmployee={isCandidateOrEmployee}
            onEdit={() => handleEditRequest("info")}
          />

          {/* These cards are only visible to Candidates and Employees. */}
          {isCandidateOrEmployee && (
            <>
              <CoursesTakenCard
                coursesTaken={coursesTaken}
                onEdit={() => handleEditRequest("coursesTaken")}
              />
              <CoursesWorkedCard
                coursesTaken={coursesTaken}
                onEdit={() => handleEditRequest("coursesWorked")}
              />
              <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
                <ResumeManager
                  resumes={profileData.candidate?.resumes || []}
                  candidateUsername={profileData.username}
                  onProfileRefresh={handleProfileRefresh}
                />
              </Paper>
            </>
          )}
        </Box>

          <Button
            onClick={() => {
              handleLogout();
            }}
            variant="contained"
            color="error"
            sx={{
              my:5,
              flexShrink: 0,
              flexGrow: 0,
              minWidth: "auto", 
              width: "auto",
            }}
          > Log Out

          </Button>
        {/* The modal for editing profile sections, rendered conditionally. */}
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
      </Container>
    </FeatureGate>
  );
}