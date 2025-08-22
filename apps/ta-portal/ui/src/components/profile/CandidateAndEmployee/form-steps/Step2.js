// src/components/profile/form-steps/CandidateAndEmployee/Step2.js
"use client";
import React from "react";
import SearchBar from "../../../common/searchAndFilter/SearchBar";
import GradeSelector from "@/components/common/fields/GradeSelector";
import { Typography, Box, Paper, IconButton, Chip } from "@mui/material";
import { Close } from "@mui/icons-material";

/**
 * Component for Step 2 of the Candidate and Employee form.
 * Displays a list of taken courses and allows adding, updating, and removing courses.
 * @param {object[]} coursesTaken - The user's course data array
 * @param {string} takenSearch - The search query for taken courses
 * @param {function} setTakenSearch - The function to update the search query for taken courses
 * @param {object[]} courseOptions - The list of available course options
 * @param {function} addCourseTaken - The function to add a course to the user's taken courses
 * @param {function} updateCourseGrade - The function to update a course's grade
 * @param {function} removeCourseTaken - The function to remove a course from the user's taken courses
 * @returns {JSX.Element} The rendered Step2 component
 */
export default function Step2CandidateAndEmployee({
  coursesTaken,
  takenSearch,
  setTakenSearch,
  courseOptions,
  addCourseTaken,
  updateCourseGrade,
  removeCourseTaken,
}) {
  const filteredTakenCourses = takenSearch
    ? courseOptions.filter(c =>
        c.courseCode.toLowerCase().includes(takenSearch.toLowerCase())
      )
    : [];

  return (
    <fieldset className="space-y-6 animate-fade-in">
      <div className="space-y-3">
        <Typography variant="h1">Courses Taken</Typography>
        <Typography variant="body1">
          Search for and add all relevant courses you have completed. You can
          optionally add your grade for each.
        </Typography>
      </div>

      {/* Search Bar + Results */}
      <div className="space-y-4">
        <SearchBar
          value={takenSearch}
          onChange={setTakenSearch}
          placeholder="Search for a course you have taken..."
        />

        {takenSearch && (
          <Paper elevation={3} sx={{ maxHeight: "12rem", overflowY: "auto" }}>
            {filteredTakenCourses.length > 0 ? (
              filteredTakenCourses.map((course) => (
                <Box
                  key={course.courseCode}
                  onClick={() => addCourseTaken(course)}
                  sx={{
                    p: 3,
                    cursor: "pointer",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:last-child": { borderBottom: "none" },
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Typography variant="body1" fontWeight={600} display="inline">
                    {course.courseCode}:
                  </Typography>
                  <Typography variant="body1" ml={1} display="inline">
                    {course.name}
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1" fontStyle="italic">
                  No courses found matching &quot;{takenSearch}&quot;
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </div>

      {/* Selected Courses */}
      <div className="space-y-4 pt-4">
        {coursesTaken.length > 0 && (
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="h2">Selected Courses</Typography>
            <Chip label={coursesTaken.length} size="small" color="primary" />
          </Box>
        )}

        {coursesTaken.map(({ courseCode, grade }) => (
          <Paper
            key={courseCode}
            elevation={2}
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "8px",
              transition: "box-shadow 0.2s ease, transform 0.1s ease",
              "&:hover": {
                boxShadow: 4,
                transform: "translateY(-1px)",
              },
            }}
          >
            <div className="flex items-center justify-between">
              <Typography variant="h3" fontWeight={700} letterSpacing="0.025em">
                {courseCode}
              </Typography>

              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end">
                  <Typography
                    variant="smalltext"
                    mb={1}
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                  >
                    Grade (Optional)
                  </Typography>
                  <GradeSelector
                    id={`grade-${courseCode}`}
                    label=""
                    value={grade}
                    isOptional
                    onChange={(newGradeEnum) =>
                      updateCourseGrade(courseCode, newGradeEnum)
                    }
                  />
                </div>

                <IconButton
                  onClick={() => removeCourseTaken(courseCode)}
                  size="small"
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "8px",
                    width: 40,
                    height: 40,
                    "&:hover": {
                      bgcolor: "error.main",
                      color: "error.contrastText",
                      borderColor: "error.main",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease",
                  }}
                  title={`Remove ${courseCode}`}
                >
                  <Close fontSize="small" />
                </IconButton>
              </div>
            </div>
          </Paper>
        ))}
      </div>
    </fieldset>
  );
}