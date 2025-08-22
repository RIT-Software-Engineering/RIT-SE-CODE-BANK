// components/profile/form-steps/CandidateAndEmployee/Step3.js
"use client";
import React from "react";
import SearchBar from "../../../common/searchAndFilter/SearchBar";
import { Typography, Box, Paper, IconButton, Chip } from "@mui/material";
import { Close } from "@mui/icons-material";

/**
 * Component for Step 3 of the Candidate and Employee form
 * This form step includes fields for prior TA/Grader experience
 * @param {object} props - The component props
 * @param {object[]} props.coursesWorked - The user's course data array
 * @param {string} props.workedSearch - The search query for worked courses
 * @param {function} props.setWorkedSearch - The function to update the search query for worked courses
 * @param {object[]} props.courseOptions - The list of available course options
 * @param {function} props.addCourseWorked - The function to add a course to the user's worked courses
 * @param {function} props.removeCourseWorked - The function to remove a course from the user's worked courses
 * @returns {JSX.Element} The rendered Step3 component
 */
export default function Step3CandidateAndEmployee({
  coursesWorked,
  workedSearch,
  setWorkedSearch,
  courseOptions,
  addCourseWorked,
  removeCourseWorked,
}) {
  const filteredWorkedCourses = workedSearch
    ? courseOptions.filter(c =>
        c.courseCode.toLowerCase().includes(workedSearch.toLowerCase())
      )
    : [];

  return (
    <fieldset className="space-y-6 animate-fade-in">
      <div className="space-y-3">
        <Typography variant="h1">Prior TA/Grader Experience</Typography>
        <Typography variant="body1">
          Add any courses for which you have previously worked as a Teaching
          Assistant or Grader.
        </Typography>
      </div>

      {/* Search Bar + Results */}
      <div className="space-y-4">
        <SearchBar
          value={workedSearch}
          onChange={setWorkedSearch}
          placeholder="Search for a course you have worked for..."
        />

        {workedSearch && (
          <Paper elevation={3} sx={{ maxHeight: "12rem", overflowY: "auto" }}>
            {filteredWorkedCourses.length > 0 ? (
              filteredWorkedCourses.map((course) => (
                <Box
                  key={course.courseCode}
                  onClick={() => addCourseWorked(course)}
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
                  No courses found matching &quot;{workedSearch}&quot;
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </div>

      {/* Selected Courses */}
      <div className="space-y-4 pt-4">
        {coursesWorked.length > 0 && (
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="h2">Selected Courses</Typography>
            <Chip label={coursesWorked.length} size="small" color="primary" />
          </Box>
        )}

        {coursesWorked.map((courseCode) => (
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

              <IconButton
                onClick={() => removeCourseWorked(courseCode)}
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
          </Paper>
        ))}
      </div>
    </fieldset>
  );
}