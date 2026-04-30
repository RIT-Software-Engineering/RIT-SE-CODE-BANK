// components/profile/UserProfileModal.js
'use client';
import { useState, useEffect } from 'react';
import UserProfileForm from './UserProfileForm';
import { getAllCourses } from '@/services/db-apis';
import { Modal, Box, Paper, Typography, Button, CircularProgress } from '@mui/material';

/**
 * Wrapper component for the UserProfileForm modal.
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls if the modal is visible.
 * @param {function} props.onClose - Function to call to close the modal.
 * @param {string} props.mode - The mode of the form (edit or create).
 * @param {object} props.profileData - The detailed profile data from the parent page.
 * @param {function} props.onUpdateSuccess - Callback for successful profile updates.
 * @param {string} props.editingSection - The section being edited (mainly for candidate/employee).
 */
export default function UserProfileModal({
  isOpen,
  onClose,
  mode,
  onUpdateSuccess,
  profileData,
  editingSection,
}) {
  const [courseOptions, setCourseOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchCourseData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const courses = await getAllCourses();
          setCourseOptions(courses);
        } catch (err) {
          console.error('Error fetching courses for profile form:', err);
          setError('Could not load course data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCourseData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Style for the modal content
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '56rem', // max-w-3xl
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    borderRadius: '12px',
    boxShadow: 24,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="user-profile-modal-title"
      aria-describedby="user-profile-modal-description"
    >
      <Paper sx={style}>
        {isLoading && (
            <Box sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress />
                <Typography>Loading Form...</Typography>
            </Box>
        )}
        {error && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" fontWeight="bold">{error}</Typography>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              Close
            </Button>
          </Box>
        )}
        {!isLoading && !error && profileData && (
          <UserProfileForm
            user={profileData}
            mode={mode}
            onClose={onClose}
            courseOptions={courseOptions}
            onUpdateSuccess={onUpdateSuccess}
            editingSection={editingSection}
          />
        )}
      </Paper>
    </Modal>
  );
}