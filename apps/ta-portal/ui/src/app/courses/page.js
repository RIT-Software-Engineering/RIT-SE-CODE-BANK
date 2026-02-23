// app/courses/page.js
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCourses } from '@/services/db-apis';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';
import EditCourseForm from '@/components/courses/EditCourseForm';
import CourseInfoCard from '@/components/courses/CourseInfoCard';

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Modal,
  Paper,
  Typography,
} from '@mui/material';

/**
 * Renders the administrator's user management page.
 * This page allows admins to view all users in the system, grouped by their role.
 * It provides functionality to search for users and edit their profiles via a modal.
 * Access is restricted to users with the 'ADMIN' role.
 */
export default function AdminCoursePage() {
  // --- STATE MANAGEMENT ---

  // Core hook to get the currently authenticated user.
  const { currentUser } = useAuth();

  // State for managing UI status (loading, errors).
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allCourses, setAllCourses] = useState([])

  // State for user data, modal control, and search functionality.
  const [selectedCourse, setSelectedCourse] = useState(null); // The course being edited in the modal.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- AUTHORIZATION ---

  // A boolean flag to simplify access control checks throughout the component.
  const isAdministrator = currentUser?.role === 'ADMIN';

  // --- DATA FETCHING & PROCESSING ---

  /**
   * Fetches all users and their detailed profiles from the database.
   * It then processes this data, grouping users by their assigned role.
   * This function is wrapped in useCallback to prevent unnecessary re-fetches.
   */
  const fetchData = useCallback(async () => {
    // Halt execution if the user is not an administrator.
    if (!isAdministrator) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const courses = await getAllCourses();
      setAllCourses(courses)

    } catch (err) {
      console.error('Failed to retrieve courses: ', err);
      setError('Failed to load course data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdministrator]);

  // Effect to trigger the initial data fetch when the component mounts.
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Handles the click event for the "Edit" button on a user card.
   * It fetches the full user profile and opens the editing modal.
   * @param {string} username - The username of the user to be edited.
   */
  const handleEditClick = async (data) => {
    setSelectedCourse(data);
    setIsModalOpen(true);
  };

  /**
   * Closes the user editing modal and resets the selected user state.
   */
  const handleCloseModal = () => {
    setSelectedCourse(null);
    setIsModalOpen(false);
  };

  // --- RENDER LOGIC ---

  /**
   * Renders the main content of the page, including user groups.
   * It handles loading, error, and no-data states, and applies the search filter.
   * @returns {React.ReactNode} The JSX for the main content area.
   */
  const renderContent = () => {
    // Show a loading spinner while data is being fetched.
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    // Show an error message if the API call fails.
    if (error) {
      return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }

    // Show a message if no courses exist in the system at all.
    if (allCourses.length === 0 && !searchTerm) {
        return <Typography sx={{textAlign: 'center', p: 4}}>No courses found.</Typography>
    }

    return allCourses.map((course) => {
      return (
        <CourseInfoCard
          key={course.courseCode}
          courseData = {course}
          onEdit = {()=>handleEditClick(course)}
        />
      );
    });
  };

  // --- AUTHORIZATION CHECK ---

  // Before rendering the main content, check if the user is authorized.
  // This prevents non-admins from seeing any part of the page.
  if (!isAdministrator && !isLoading) {
    return (
        <Container maxWidth="sm" sx={{py: 8, textAlign: 'center'}}>
            <Typography variant="h1" color="error">Access Denied</Typography>
            <Typography variant="h3" color="text.secondary" sx={{mt: 2}}>You do not have permission to view this page.</Typography>
        </Container>
    )
  }

  // --- MAIN COMPONENT RENDER ---
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Edit Courses
        </Typography>
        <Typography variant="h3" color="text.secondary">
          Manage course information.
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 2,gap: 2 }}>
        <Box sx={{pb:3}}>
          <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder='Search by course name or code'
          sx={{ mb: 3 }}
        />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {renderContent()}
        </Box>
      </Paper>

      {/* The modal for editing a selected user. */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="edit-course-modal-title"
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}
      >
        <Paper
          sx={(theme)=>({ 
            p: {xs: 2, md: 4},
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: theme.palette.mode === 'dark'
                    ? ""
                    : "#e0e0e0" })}
        >
            <EditCourseForm
                course={selectedCourse}
                onClose={handleCloseModal}
                onUpdateSuccess={fetchData}
            />
        </Paper>
      </Modal>
    </Container>
  );
}