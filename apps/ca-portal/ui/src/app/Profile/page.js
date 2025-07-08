// app/Profile/page.js
'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileModal from '@/components/UserProfileModal';
import { getUserProfile } from '@/services/api';

/**
 * ProfilePage displays user profile details including:
 * - Basic user info
 * - Courses taken and worked (for candidates and employees)
 * - Posted job positions (for employers and admins)
 * - A modal to edit profile information
 *
 * Role-based content:
 * - CANDIDATE/EMPLOYEE: Sees courses taken and work history
 * - EMPLOYER/ADMIN: Sees posted job positions
 * 
 * @returns User profile page with displays of their data
 */
export default function ProfilePage() {
    const [showModal, setShowModal] = useState(false);          // Controls visibility of the profile edit modal
    const { currentUser } = useAuth();                          // Authenticated user context
    const [profileData, setProfileData] = useState(null);       // Fetched user data from backend
    const [isLoading, setIsLoading] = useState(true);           // Loading indicator
    const [error, setError] = useState(null);                   // Error tracking
    const [profileVersion, setProfileVersion] = useState(0);    // Used for triggering re-fetching of profile data after updates

    // Fetches the user profile whenever the authenticated user or profile version changes.
    useEffect(() => {
        if (!currentUser?.uid) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch only the user profile data for this page.
                const user = await getUserProfile(currentUser.uid);
                setProfileData(user);
            } catch (err) {
                console.error("Error fetching page data:", err);
                setError("Could not load profile data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser, profileVersion]);

    // Handles successful profile updates by reloading profile data
    const handleUpdateSuccess = () => {
        console.log("Update successful, refetching data...");
        setProfileVersion(currentVersion => currentVersion + 1);
        setShowModal(false);
    };

    // Check to see if user is either "CANDIDATE" or "EMPLOYEE" role
    const isCandidateOrEmployee = profileData?.role === 'CANDIDATE' || profileData?.role === 'EMPLOYEE';
    
    // Employee previously worked courses
    const coursesWorked = profileData?.candidate?.courseHistory
        ?.filter(ch => ch.wasPriorEmployee)
        .map(ch => ch.course)
        .filter(Boolean) || [];
    
    // "CANDIDATE" or "EMPLOYEE" previous courses taken
    const coursesTaken = profileData?.candidate?.courseHistory
        .map(ch => ch.course) || [];

    // Check to see if user is either "EMPLOYER" or "ADMIN" role
    const isEmployerOrAdmin = profileData?.role === 'EMPLOYER' || profileData?.role === 'ADMIN';

    // "EMPLOYER" or "ADMIN" job positions
    const jobPositions = profileData?.employer?.jobPostions || [];

    // Opens the profile edit modal. Uses setTimeout to trigger a re-render on the next tick
    const handleOpenModal = () => {
        setShowModal(false);
        setTimeout(() => setShowModal(true), 0);
    };

    // Conditional rendering for loading, error, or missing profile
    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!profileData) return <div className="p-8 text-center text-gray-500">No profile data available. Please log in.</div>

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
            {/* Profile Info Card */}
            <section className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                <div className="p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
                        <p className="text-gray-600 mt-1">{profileData.email}</p>
                        <p><span className="font-semibold">Pronouns:</span> {profileData.pronouns || "N/A"}</p>
                        {isCandidateOrEmployee && (
                            <div className="text-gray-800">
                                <p><span className="font-semibold">Major:</span> {profileData.candidate?.major || "N/A"}</p>
                                <p><span className="font-semibold">Year:</span> {profileData.candidate?.year || "N/A"}</p>
                            </div>
                        )}
                        {isEmployerOrAdmin && (
                            <p><span className="font-semibold">Department:</span> {profileData.employer?.department || "N/A"}</p>
                        )}
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                        aria-label="Edit Profile"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
                        </svg>
                    </button>
                </div>
            </section>

            {/* Courses Taken Card */}
            {isCandidateOrEmployee && (
                <section className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Courses Taken</h3>
                        {coursesTaken.length === 0 ? (
                            <p className="text-gray-500">No previous courses taken found.</p>
                        ) : (
                            <ul className="space-y-4">
                                {coursesTaken.map((course) => (
                                    <li key={course.courseCode} className="border-b border-gray-200 pb-4 last:border-b-0">
                                        <p className="text-md font-semibold text-gray-800">
                                            {course.courseCode} - {course.name || "No course name available"}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {course.description || "No description provided"}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}

            {/* Job Positions Card */}
            {isEmployerOrAdmin && (
                <section className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Posted Job Positions</h3>
                        {jobPositions.length === 0 ? (
                            <p className="text-gray-500">No posted job positions found.</p>
                        ) : (
                            <ul className="space-y-3">
                                {jobPositions.map((job) => (
                                    <li key={job.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                        <div className="font-semibold text-gray-800">{job.id}</div>
                                        <div className="text-md text-gray-600">
                                            {job.course?.courseCode} - {job.course?.name || "Unnamed Course"}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            {job.location} ({job.locationType}) – {job.jobPositionStatus}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}

            {/* Courses Worked Card */}
            {isCandidateOrEmployee && (
                <section className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Work History</h3>
                        {coursesWorked.length === 0 ? (
                            <p className="text-gray-500">No previous work history found.</p>
                        ) : (
                            <ul className="space-y-4">
                                {coursesWorked.map((course) => (
                                    <li key={course.courseCode} className="border-b border-gray-200 pb-4 last:border-b-0">
                                        <p className="text-md font-semibold text-gray-800">
                                            {course.courseCode} - {course.name || "No course name available"}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {course.description || "No description provided"}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}

            {/* Profile Edit Modal */}
            {showModal && (
                <UserProfileModal 
                    isOpen={showModal} 
                    onClose={() => setShowModal(false)}
                    profileData={profileData}
                    onUpdateSuccess={handleUpdateSuccess}
                />
            )}
        </div>
    );
}
