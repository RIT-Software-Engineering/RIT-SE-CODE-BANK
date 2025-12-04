// app/Timecard/Admin/[username]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import FeatureGate from "@/components/common/FeatureGate";
import { FEATURES } from "@/configuration/featureFlags";
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminViewData } from '@/services/db-apis';
import GroupedTimecardView from '@/components/timecard/GroupedTimecardView';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';
import { Container, Box, Typography, CircularProgress, Paper, Alert } from '@mui/material';

/**
 * Renders the administrator's timecard management page.
 * This page fetches all timecards from every employee in the system,
 * groups them by employee, and allows the admin to search and review the data.
 * Access is restricted to users with the 'ADMIN' role.
 */
export default function AdminTimecardsPage() {
    // --- STATE MANAGEMENT ---

    // Core hook to get the currently authenticated user.
    const { currentUser } = useAuth();

    // State for managing UI status (loading, errors).
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // `groupedData` holds the original, unprocessed data from the API.
    // `filteredData` holds the data to be displayed after applying the search term.
    const [groupedData, setGroupedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // --- DATA FETCHING & PROCESSING ---

    /**
     * Fetches all timecard data from the database and groups it by user.
     * The raw flat array of timecards is transformed into a nested structure
     * where each top-level element represents an employee and contains their timecards.
     * This function is wrapped in useCallback to prevent re-creation on every render,
     * which optimizes performance by avoiding unnecessary re-fetches.
     */
    const fetchData = useCallback(async () => {
        // Halt execution if the user is not authenticated.
        if (!currentUser) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            // Fetch the raw timecard data from the backend.
            const rawTimecards = await fetchAdminViewData();
            
            // Use reduce to group the flat array of timecards into a nested structure.
            // The result is an array of objects, e.g., [{ user: {...}, timecards: [...] }, ...].
            const grouped = rawTimecards.reduce((acc, timecard) => {
                // Safely skip any timecard that doesn't have the expected nested user data.
                if (!timecard.jobPositionHistory?.employee?.candidate?.user) {
                    return acc;
                }

                const employee = timecard.jobPositionHistory.employee;
                const user = employee.candidate.user;

                // Combine first and last name for easier display and searching.
                const fullName = `${user.fname} ${user.lname}`;

                // Check if this user is already in our accumulator array.
                let userEntry = acc.find(entry => entry.user.username === user.username);
                
                // If the user is not found, create a new entry for them.
                if (!userEntry) {
                    userEntry = { 
                        user: { ...user, fullName }, 
                        employeeId: employee.id,
                        timecards: [] 
                    };
                    acc.push(userEntry);
                }

                // Add the current timecard to this user's list.
                userEntry.timecards.push(timecard);
                return acc;
            }, []);

            // Set both the original data and the display data.
            setGroupedData(grouped);
            setFilteredData(grouped);
        } catch (err) {
            console.error("Failed to fetch admin timecard data:", err);
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

        // Filter the original data based on the user's full name, username, or employee ID.
        const filtered = groupedData.filter(employeeEntry => 
            employeeEntry.user.fullName.toLowerCase().includes(lowerTerm) ||
            employeeEntry.user.username.toLowerCase().includes(lowerTerm) ||
            (employeeEntry.employeeId && String(employeeEntry.employeeId).includes(lowerTerm))
        );
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
        <FeatureGate feature={FEATURES.TIMECARD}>
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, sm: 4 } }}>
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                        Admin Timecard Viewer
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Review and manage all TA timecards.
                    </Typography>
                </Box>
                
                {/* Conditionally render content based on user role. */}
                {currentUser && currentUser.role === 'ADMIN' ? (
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
                                <GroupedTimecardView groupedData={filteredData}/>
                            )}
                        </Box>
                    </>
                ) : (
                    // Render a fallback message if the user is not an admin.
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="error">Access Denied</Typography>
                        <Typography sx={{ mt: 1 }}>
                            You do not have the necessary permissions to view this page.
                        </Typography>
                    </Paper>
                )}
            </Container>
        </Box>
        </FeatureGate>
    );
}