// components/profile/CoursesTakenCard.js
'use client';

import React from 'react';
import EditButton from '../../common/buttons/EditButton';
import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { gradeEnumToStringValue } from '@/constants/gradeConstants';

/**
 * A card component to display a list of courses taken by a candidate.
 * @prop {JobPosition[]} coursesTaken The courses taken by the candidate
 * @prop {(position: JobPosition) => void} onEdit A callback to edit the position
 *
 * @returns {ReactElement} The card component
 */
export default function CoursesTakenCard({ coursesTaken, onEdit }) {
  const gradedCourses = coursesTaken.filter(course => course.hasTaken === true);

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" component="h3">
          Courses Taken
        </Typography>
        <EditButton handleOpenModal={onEdit} />
      </Box>
      {gradedCourses.length === 0 ? (
        <Typography color="text.secondary">
          No graded courses taken found.
        </Typography>
      ) : (
        <List disablePadding>
          {gradedCourses.map((course, index) => (
            <React.Fragment key={`${course.courseCode}-${index}`}>

              <ListItem sx={{ px: 0, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Paper
                  key={course.courseCode}
                  elevation={2}
                  sx={(theme) => ({
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "8px",
                    width:"100%",
                    transition: "box-shadow 0.2s ease, transform 0.1s ease",
                    "&:hover": {
                      boxShadow: 4,
                      transform: "translateY(-1px)",
                    }, background: theme.palette.mode === 'dark'
                      ? ""
                      : "white"
                  })}
                >
                  <ListItemText
                    primary={`${course.courseCode} - ${course.name || "No course name available"}`}
                    secondary={course.description || "No description provided"}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                    sx={{ pr: 2 }}
                  />
                  {(course.grade && gradeEnumToStringValue[course.grade]) && (
                    <Chip
                      label={`Grade: ${gradeEnumToStringValue[course.grade]}`}
                      color="primary"
                      size="small"
                    />
                  )}
                </Paper>
              </ListItem>
              {index < gradedCourses.length - 1}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
}