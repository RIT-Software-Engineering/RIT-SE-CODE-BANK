// app/Timecard/Admin/[username]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminViewData } from '@/services/db-apis';
import GroupedTimecardView from '@/components/timecard/GroupedTimecardView';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';

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
        // If the search term is empty, show all the data.
        if (!searchTerm) {
            setFilteredData(groupedData);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();
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
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="w-full max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Admin Timecard Viewer
                    </h1>
                    <p className="mt-2 text-lg text-gray-500">
                        Review and manage all employee timecards.
                    </p>
                </div>

                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by employee name..."
                />

                <div className="mt-6">
                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-rit-blue mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading Timecards...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 px-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-lg font-semibold text-red-700">An Error Occurred</p>
                            <p className="text-gray-600 mt-2">{error}</p>
                        </div>
                    ) : (
                        <GroupedTimecardView groupedData={filteredData}/>
                    )}
                </div>
            </div>
        </div>
    );
}