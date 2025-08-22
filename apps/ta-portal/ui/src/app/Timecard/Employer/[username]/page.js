// app/Timecard/Employer/[username]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchEmployerViewData } from '@/services/db-apis';
import GroupedByCourseView from '@/components/timecard/GroupedCourseTimecardView';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';
import { Container, Box, Typography, CircularProgress, Paper, Alert } from '@mui/material';

/**
 * Renders the employer's timecard management page.
 * This page fetches all timecards for employees managed by the current employer,
 * groups them by course and then by employee, and allows the employer to search
 * and review the submitted data. Access is restricted to users with the 'EMPLOYER' role.
 */
export default function EmployerTimecardsPage() {
    // --- STATE MANAGEMENT ---

    // Core hook to get the currently authenticated user.
    const { currentUser } = useAuth();

    // State for managing UI status (loading, errors).
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // `groupedData` holds the original, structured data from the API.
    // `filteredData` holds the data to be displayed after applying the search term.
    const [groupedData, setGroupedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // --- DATA FETCHING & PROCESSING ---

    /**
     * Fetches timecard data for the logged-in employer's employees.
     * It transforms the raw flat array of timecards into a nested structure,
     * grouping first by course and then by employee within each course.
     * This function is wrapped in useCallback for performance optimization.
     */
    const fetchData = useCallback(async () => {
        // Halt execution if the user is not authenticated as an employer.
        if (!currentUser || currentUser.role !== 'EMPLOYER' || !currentUser.username) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            // Fetch the raw, flat list of timecards for this specific employer.
            const rawTimecards = await fetchEmployerViewData(currentUser.username);
            
            // Group the data first by course, then by employee within that course.
            const groupedByCourse = rawTimecards.reduce((acc, timecard) => {
                const jobPosition = timecard.jobPositionHistory?.jobPosition;
                const employee = timecard.jobPositionHistory?.employee;
                const user = employee?.candidate?.user;

                // Skip any timecard with incomplete data to prevent errors.
                if (!jobPosition || !user || !employee) return acc;

                const courseId = `${jobPosition.courseCode}-${jobPosition.sectionNumber}`;

                // Find or create the course group in the accumulator object.
                let courseGroup = acc.find(group => group.courseId === courseId);
                if (!courseGroup) {
                    courseGroup = {
                        courseId: courseId,
                        courseTitle: `${jobPosition.courseCode}-${jobPosition.sectionNumber}`,
                        employees: []
                    };
                    acc.push(courseGroup);
                }

                // Find or create the employee's entry within that course group.
                let employeeEntry = courseGroup.employees.find(emp => emp.user.username === user.username);
                if (!employeeEntry) {
                    const fullName = `${user.fname} ${user.lname}`;
                    employeeEntry = {
                        user: { ...user, fullName },
                        employeeId: employee.id,
                        timecards: []
                    };
                    courseGroup.employees.push(employeeEntry);
                }

                // Add the current timecard to the employee's list.
                employeeEntry.timecards.push(timecard);
                return acc;
            }, []);

            // Set both the original data and the display data.
            setGroupedData(groupedByCourse);
            setFilteredData(groupedByCourse);

        } catch (err) {
            console.error("Failed to fetch employer timecard data:", err);
            setError("Failed to load timecard data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    // Effect to trigger the initial data fetch when the component mounts or the user changes.
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Effect to filter the displayed data whenever the search term or the original data changes.
    useEffect(() => {
        // Trim whitespace from the search term for more accurate matching.
        const trimmedSearchTerm = searchTerm.trim();

        // If the search bar is empty, show all data.
        if (!trimmedSearchTerm) {
            setFilteredData(groupedData);
            return;
        }

        const lowerTerm = trimmedSearchTerm.toLowerCase();
        
        // Filter the data by checking if any employee within a course matches the search term.
        const filtered = groupedData.map(courseGroup => {
            // Filter the employees within this specific course group.
            const filteredEmployees = courseGroup.employees.filter(employee =>
                employee.user.fullName.toLowerCase().includes(lowerTerm) ||
                employee.user.username.toLowerCase().includes(lowerTerm) ||
                (employee.employeeId && String(employee.employeeId).includes(lowerTerm))
            );

            // Only include the course group in the results if it contains at least one matching employee.
            if (filteredEmployees.length > 0) {
                return { ...courseGroup, employees: filteredEmployees };
            }
            return null; // This will be filtered out in the next step.
        }).filter(Boolean); // The .filter(Boolean) step removes any null entries.

        setFilteredData(filtered);

    }, [searchTerm, groupedData]);

    // --- RENDER LOGIC ---

    // Display a loading spinner while the initial user authentication is being checked.
    if (currentUser === undefined) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }
    
    // Main component render method.
    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, sm: 4 } }}>
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                        Employee Timecards
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Review timecards submitted by your TAs, grouped by course.
                    </Typography>
                </Box>
                
                {/* Conditionally render content based on user role. */}
                {currentUser && currentUser.role === 'EMPLOYER' ? (
                    <>
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search by name or employee ID..."
                        />

                        <Box sx={{ mt: 4 }}>
                            {isLoading ? (
                                <Box sx={{ textAlign: 'center', py: 5 }}>
                                    <CircularProgress />
                                    <Typography sx={{ mt: 2 }} color="text.secondary">
                                        Loading Timecards...
                                    </Typography>
                                </Box>
                            ) : error ? (
                                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                            ) : (
                                <GroupedByCourseView groupedData={filteredData} />
                            )}
                        </Box>
                    </>
                ) : (
                    // Render a fallback message if the user is not an employer.
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="error">Access Denied</Typography>
                        <Typography sx={{ mt: 1 }}>
                            You do not have the necessary permissions to view this page.
                        </Typography>
                    </Paper>
                )}
            </Container>
        </Box>
    );
}