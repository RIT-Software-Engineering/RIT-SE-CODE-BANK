// app/components/UserProfileModal.js
'use client';
import { useState, useEffect } from "react";
import UserProfileForm from "./UserProfileForm";
import { useAuth } from "@/contexts/AuthContext";
import { getAllCourses, getUserProfile } from "@/services/api";

/**
 * Wrapper component that controls the visibility of the {@link UserProfileForm} modal
 * 
 * Handles:
 * - Fetching authenticated user
 * - Fetching course list and student profile
 * - Passing appropriate props to the form for editing or creating a profile
 * @returns A modal containing the {@link UserProfileForm} or null if closed
 */
export default function UserProfileModal() {
    const [isOpen, setIsOpen] = useState(true);                 // Modal is open by default when rendered
    const { currentUser } = useAuth();                          // Retrieves current authenticated user
    const [profileData, setProfileData] = useState(null);       // User profile data
    const [courseOptions, setCourseOptions] = useState([]);     // Available courses for form
    const [mode, setMode] = useState("create");                 // Mode: "create" for new user, "edit" for existing user
    const [isLoading, setIsLoading] = useState(true);           // Controls loading state UI
    const [error, setError] = useState(null);                   // Error tracking
    
    // Fetch profile and course data when component mounts or currentUser changes
    useEffect(() => {
        if (!currentUser?.uid) {
            // If no authenticated user ID, stop and display an error
            setError("Authentication error: No user UID provided.");
            setIsLoading(false);
            return;
        }
        
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch both the course list and the student profile in parallel
                const coursesPromise = getAllCourses();
                const userProfilePromise = getUserProfile(currentUser.uid)
                .catch(err => {
                    // If user profile does not exist (404), treat it as a new profile
                    if (err.status === 404) return null;
                    throw err;
                });
                
                const [courses, user] = await Promise.all([coursesPromise, userProfilePromise]);
                
                setCourseOptions(courses);
                
                if (user) {
                    // If profile exists, populate form with data
                    setProfileData(user);
                    setMode("edit");
                } else {
                    // Otherwise, initialize new profile with basic user info
                    setProfileData({ uid: currentUser.uid, email: currentUser.email || '' });
                    setMode("create");
                }
            } catch (err) {
                console.error("Error fetching data for profile form:", err);
                setError("Could not load profile data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, [currentUser]);
    
    // If the modal is closed or user isn't authenticated, don't render anything
    if (!isOpen || !currentUser) return null;

    // Simple callback to close the modal
    const close = (() => setIsOpen(false));
    
    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4'>
            <div className='bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col'>
                {isLoading && <div className='p-8 text-center'>Loading Profile...</div>}
                {error && <div className='p-8 text-center'><p className="text-red-500 font-semibold">{error}</p><button onClick={close} className="mt-4 px-4 py-2 bg-slate-200 rounded-lg">Close</button></div>}
                {!isLoading && !error && profileData && (
                    <UserProfileForm
                    user={profileData}
                    mode={mode}
                    onClose={close}
                    courseOptions={courseOptions}
                    />
                )}
            </div>
        </div>
    );}