// components/courses/CourseInfoCard.js
'use client';

import React from 'react';
import EditButton from '../common/buttons/EditButton';
import {
  Box,
  Paper,
  Typography,
  Divider,
} from '@mui/material';

/**
 * A component that displays a label and a value
 * @param {string} label The label that describes the value
 * @param {string} value The value to be displayed
 * @returns {ReactElement}
 */
const InfoItem = ({ label, value }) => (
  <Box sx={{ py: 1 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight="medium">
      {value || 'N/A'}
    </Typography>
  </Box>
);


/**
 * A component that displays course info
 * @param {object} courseData The course info, as returned by the API. Includes courseCode, name, and description.
 * @param {function} onEdit Function to call when the edit button is clicked. This is used to open the edit course modal.
 * @returns {ReactElement} A React Element representing the CourseInfoCard.
 */
export default function CourseInfoCard({
  courseData,
  onEdit,
}) {
  if (!courseData) return null;

  return (
    <Paper elevation={2}
      sx={(theme) => ({
        p: { xs: 2, md: 3 }, background: theme.palette.mode === 'dark'
          ? ""
          : "white"
      })}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h2" component="h2">
          {courseData.courseCode} {courseData.name}
        </Typography>
        <EditButton handleOpenModal={onEdit} />
      </Box>
      <Divider />
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column' }}>
        <InfoItem label="Description" value={courseData.description} />
      </Box>
    </Paper>
  );
};