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

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";

export default function ProfilePage() {
  const [editingSection, setEditingSection] = useState(null);
  const { currentUser, refreshUserProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleProfileRefresh = useCallback(async () => {
    if (!currentUser?.username) return;
    try {
      const user = await getUserProfile(currentUser.username);
      setProfileData(user);
      refreshUserProfile();
    } catch (err) {
      console.error("Error refreshing profile data:", err);
      setError("Could not refresh profile data. Please try again.");
    }
  }, [currentUser, refreshUserProfile]);

  useEffect(() => {
    if (!currentUser?.username) {
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
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

  const handleUpdateSuccess = (updatedProfile) => {
    setProfileData(updatedProfile);
    refreshUserProfile();
    setEditingSection(null);
  };

  const handleEditRequest = (section) => {
    setEditingSection(section);
  };

  const coursesTaken = useMemo(() => {
    const history = profileData?.candidate?.courseHistory || [];
    if (!history.length || !courseOptions.length) return [];
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

  const isCandidateOrEmployee =
    profileData?.role === "CANDIDATE" || profileData?.role === "EMPLOYEE";
  const isEmployerOrAdmin =
    profileData?.role === "EMPLOYER" || profileData?.role === "ADMIN";

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

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="info">
          No profile data available. Please log in.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <ProfileInfoCard
          profileData={profileData}
          isEmployerOrAdmin={isEmployerOrAdmin}
          isCandidateOrEmployee={isCandidateOrEmployee}
          onEdit={() => handleEditRequest("info")}
        />

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
  );
}