// app/components/UserProfileModal.js
'use client';
import { useState, useEffect } from "react";
import UserProfileForm from "./UserProfileForm";
import { useAuth } from "@/contexts/AuthContext";
import { getAllCourses, getUserProfile } from "@/services/api";

/**
 * Wrapper component that controls the visibility of the {@link UserProfileForm} modal
 * 
 * @param {Object} passedUser - The passed in user object whose profile to edit (required) 
 * @returns A modal containing the {@link UserProfileForm} or null if closed
 */
export default function UserProfileModal() {
    const [isOpen, setIsOpen] = useState(true); // defaults the modal to open when called
    const { currentUser } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [courseOptions, setCourseOptions] = useState([]);
    const [mode, setMode] = useState("create");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (!currentUser?.uid) {
            setError("Authentication error: No user UID provided.");
            setIsLoading(false);
            return;
        }
        
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const coursesPromise = getAllCourses();
                const userProfilePromise = getUserProfile(currentUser.uid)
                .catch(err => {
                    if (err.status === 404) return null;
                    throw err;
                });
                
                const [courses, user] = await Promise.all([coursesPromise, userProfilePromise]);
                
                setCourseOptions(courses);
                
                if (user) {
                    setProfileData(user);
                    setMode("edit");
                } else {
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
    
    if (!isOpen || !currentUser) return null;
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