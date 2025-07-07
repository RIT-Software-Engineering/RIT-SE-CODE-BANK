'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileModal from '@/components/UserProfileModal';
import { getUserProfile } from '@/services/api';

export default function ProfilePage() {
    const [showModal, setShowModal] = useState(false);
    const { currentUser } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        if (!currentUser?.uid) return;
        setIsLoading(true);
        setError(null);
        try {
            const user = await getUserProfile(currentUser.uid);
            setProfileData(user);
        } catch (err) {
            console.error("Error fetching profile data:", err);
            setError("Could not load profile data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser?.uid]);

    const isStudentOrEmployee = profileData?.role === 'STUDENT' || profileData?.role === 'EMPLOYEE';
    const coursesWorked = profileData?.student?.courseHistory
        ?.filter(ch => ch.wasPriorEmployee)
        .map(ch => ch.course)
        .filter(Boolean) || [];

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!profileData) {
        return <div className="p-8 text-center text-gray-500">No profile data available. Please log in.</div>
    }

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
            {/* Profile Info Card */}
            <section className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                <div className="p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
                        <p className="text-gray-600 mt-1">{profileData.email}</p>
                        {isStudentOrEmployee && (
                            <div className="mt-4 space-y-1 text-gray-800">
                                <p><span className="font-semibold">Major:</span> {profileData.student?.major || "N/A"}</p>
                                <p><span className="font-semibold">Year:</span> {profileData.student?.year || "N/A"}</p>
                                <p><span className="font-semibold">Pronouns:</span> {profileData.pronouns || "N/A"}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
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

            {/* Courses Worked Card */}
            {isStudentOrEmployee && (
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
                    onUpdateSuccess={fetchData}
                />
            )}
        </div>
    );
}
