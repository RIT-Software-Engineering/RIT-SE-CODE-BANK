// app/Timecard/Employer/[username]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchEmployerViewData } from '@/services/db-apis';
import GroupedByCourseView from '@/components/timecard/GroupedCourseTimecardView';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';

/**
 * EmployerTimecardsPage is a client-side component for employers to view,
 * search, and manage the timecards of employees who work for them,
 * with the data grouped by course.
 */
export default function EmployerTimecardsPage() {
    // --- STATE MANAGEMENT ---
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [groupedData, setGroupedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // --- AUTHORIZATION ---
    const isEmployer = currentUser?.role === 'EMPLOYER';

    // --- DATA FETCHING & PROCESSING ---
    /**
     * Fetches timecard data for the logged-in employer's employees and groups it by course, then by user.
     */
    const fetchData = useCallback(async () => {
        // Only proceed if the user is an employer and their username is available.
        if (!isEmployer || !currentUser.username) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            // Fetch the raw, flat list of timecards for this specific employer.
            const rawTimecards = await fetchEmployerViewData(currentUser.username);
            
            // Group the data first by course, then by employee.
            const groupedByCourse = rawTimecards.reduce((acc, timecard) => {
                const jobPosition = timecard.jobPositionHistory?.jobPosition;
                const employee = timecard.jobPositionHistory?.employee;
                const user = employee?.candidate?.user;

                // Skip if essential data is missing to prevent errors
                if (!jobPosition || !user || !employee) return acc;

                const courseId = `${jobPosition.courseCode}-${jobPosition.sectionNumber}`;

                // Find or create the course group in the accumulator.
                let courseGroup = acc.find(group => group.courseId === courseId);
                if (!courseGroup) {
                    courseGroup = {
                        courseId: courseId,
                        courseTitle: `${jobPosition.courseCode}-${jobPosition.sectionNumber}`,
                        employees: []
                    };
                    acc.push(courseGroup);
                }

                // Find or create the employee within that course group.
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

                employeeEntry.timecards.push(timecard);
                return acc;
            }, []);

            setGroupedData(groupedByCourse);
            setFilteredData(groupedByCourse);

        } catch (err) {
            console.error("Failed to fetch employer timecard data:", err);
            setError("Failed to load timecard data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [isEmployer, currentUser]);

    // This effect runs once when the component mounts to fetch the initial data.
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // This effect filters the data based on the search term.
    useEffect(() => {
        // Trim whitespace from the start and end of the search term.
        const trimmedSearchTerm = searchTerm.trim();

        // 2. If the trimmed term is empty, show all data.
        if (!trimmedSearchTerm) {
            setFilteredData(groupedData);
            return;
        }

        const lowerTerm = trimmedSearchTerm.toLowerCase();
        
        const filtered = groupedData.map(courseGroup => {
            // Filter the employees within this course.
            const filteredEmployees = courseGroup.employees.filter(employee =>
                employee.user.fullName.toLowerCase().includes(lowerTerm) ||
                employee.user.username.toLowerCase().includes(lowerTerm) ||
                // Add a check to ensure employeeId exists before searching it
                (employee.employeeId && String(employee.employeeId).includes(lowerTerm))
            );

            // Only include the course if it has matching employees.
            if (filteredEmployees.length > 0) {
                return { ...courseGroup, employees: filteredEmployees };
            }
            return null;
        }).filter(Boolean);

        setFilteredData(filtered);

    }, [searchTerm, groupedData]);

    // --- RENDER LOGIC ---
    if (!isEmployer) {
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
                        Employee Timecards
                    </h1>
                    <p className="mt-2 text-lg text-gray-500">
                        Review timecards submitted by your TAs, grouped by course.
                    </p>
                </div>

                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by name or employee ID..."
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
                        // Use the new GroupedByCourseView component
                        <GroupedByCourseView groupedData={filteredData} />
                    )}
                </div>
            </div>
        </div>
    );
}