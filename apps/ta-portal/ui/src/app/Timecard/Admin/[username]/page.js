// app/Timecard/Admin/[username]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminViewData } from '@/services/db-apis';
import GroupedTimecardView from '@/components/timecard/GroupedTimecardView';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';
import { Container, Box, Typography, CircularProgress, Paper } from '@mui/material';

/**
 * AdminTimecardsPage is a client-side component for administrators to view,
 * search, and manage all employee timecards across the system.
 */
export default function AdminTimecardsPage() {
    // --- STATE MANAGEMENT ---
    const { currentUser } = useAuth();

    // State for UI status (loading, errors)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for timecard data
    const [groupedData, setGroupedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const isAdministrator = currentUser?.role === 'ADMIN';

    // --- DATA FETCHING & PROCESSING ---
    /**
     * Fetches all timecard data from the database and groups it by user.
     * Wrapped in useCallback to prevent re-creation on every render, optimizing performance.
     */
    const fetchData = useCallback(async () => {
        // Only proceed if the user is confirmed to be an administrator.
        if (!isAdministrator) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            // Group the raw data by user
            const rawTimecards = await fetchAdminViewData();
            
            // Group the flat array of timecards into a nested structure.
            // The result will be an array of objects, where each object contains a user and their list of timecards.
            // e.g., [{ user: {...}, timecards: [...] }, { user: {...}, timecards: [...] }]
            const grouped = rawTimecards.reduce((acc, timecard) => {
                if (!timecard.jobPositionHistory?.employee?.candidate?.user) {
                    return acc;
                }

                const employee = timecard.jobPositionHistory.employee;
                const user = employee.candidate.user;

                // Combine first and last name for display and search
                const fullName = `${user.fname} ${user.lname}`;

                // Check if this user is already in our array.
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

                // Add the current timecard to this user's list of timecards.
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
    }, [isAdministrator]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter data based on search term
    useEffect(() => {
        // Trim whitespace from the start and end of the search term.
        const trimmedSearchTerm = searchTerm.trim();

        // If the trimmed term is empty, show all data.
        if (!trimmedSearchTerm) {
            setFilteredData(groupedData);
            return;
        }

        const lowerTerm = trimmedSearchTerm.toLowerCase();

        // Filter the original data based on the user's full name or employee ID
        const filtered = groupedData.filter(employeeEntry => 
            employeeEntry.user.fullName.toLowerCase().includes(lowerTerm) ||
            employeeEntry.user.username.toLowerCase().includes(lowerTerm) ||
            // Add a check to ensure employeeId exists before searching it
            (employeeEntry.employeeId && String(employeeEntry.employeeId).includes(lowerTerm))
        );
        setFilteredData(filtered);

    }, [searchTerm, groupedData]);

    // --- RENDER LOGIC ---
    // Use case where the user is not an admin (Access Denied).
    if (!isAdministrator) {
        return (
            <Container sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="h4" component="h1" color="error.main" fontWeight="bold">
                    Access Denied
                </Typography>
                <Typography sx={{ mt: 1 }}>
                    You do not have permission to view this page.
                </Typography>
            </Container>
        );
    }

    return (
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
                        <Paper elevation={2} sx={{ textAlign: 'center', p: 4, bgcolor: 'error.light' }}>
                            <Typography variant="h6" color="error.main" fontWeight="bold">
                                An Error Occurred
                            </Typography>
                            <Typography sx={{ mt: 1 }} color="text.secondary">
                                {error}
                            </Typography>
                        </Paper>
                    ) : (
                        <GroupedTimecardView groupedData={filteredData}/>
                    )}
                </Box>
            </Container>
        </Box>
    );
}