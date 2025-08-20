// components/profile/CoursesWorkedCard.js
'use client';

import React from 'react';
import EditButton from '../../common/buttons/EditButton';
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';

export default function CoursesWorkedCard({ coursesTaken, onEdit }) {
  const coursesWorked = coursesTaken.filter(
    (course) => course.wasPriorEmployee === true
  );

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" component="h3">
          Work History
        </Typography>
        <EditButton handleOpenModal={onEdit} />
      </Box>
      {coursesWorked.length === 0 ? (
        <Typography color="text.secondary">
          No previous work history found.
        </Typography>
      ) : (
        <List disablePadding>
          {coursesWorked.map((course, index) => (
            <React.Fragment key={course.courseCode}>
              <ListItem sx={{ px: 0, py: 1.5 }}>
                <ListItemText
                  primary={`${course.courseCode} - ${course.name || 'No course name available'}`}
                  secondary={course.description || 'No description provided'}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>
              {index < coursesWorked.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
}