'use client';
import { useState, useEffect } from "react";
import UserProfileForm from "./UserProfileForm";
import { useAuth } from "@/contexts/AuthContext";
import { getAllCourses } from "@/services/db-apis";
/**
 * Wrapper component for the UserProfileForm modal.
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls if the modal is visible.
 * @param {function} props.onClose - Function to call to close the modal.
 * @param {object} props.profileData - The detailed profile data from the parent page.
 * @param {function} props.onUpdateSuccess - Callback for successful profile updates.
 */
export default function UserProfileModal({ isOpen, onClose, onUpdateSuccess, profileData }) {
    const [courseOptions, setCourseOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // This effect fetches data that is only needed by the form itself.
    useEffect(() => {
        const fetchCourseData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const courses = await getAllCourses();
                setCourseOptions(courses);
            } catch (err) {
                console.error("Error fetching courses for profile form:", err);
                setError("Could not load course data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchCourseData();
    }, []); // Only needs to run once when the modal is mounted.
    
    if (!isOpen) return null;

    // Determine the form's mode based on the detailed profile data passed from the page.
    const mode = profileData?.name ? "edit" : "create";
    
    /**
     * This handler receives the full updated profile from the form
     * and passes it up to the page's onUpdateSuccess function.
     * @param {object} updatedProfile - The full user profile object.
     */
    const handleFormSuccess = (updatedProfile) => {
        if (onUpdateSuccess) {
            onUpdateSuccess(updatedProfile);
        }
    };
    
    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4'>
            <div className='bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col'>
                {isLoading && <div className='p-8 text-center'>Loading Form...</div>}
                
                {error && (
                    <div className='p-8 text-center'>
                        <p className="text-red-500 font-semibold">{error}</p>
                        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-200 rounded-lg">Close</button>
                    </div>
                )}

                {!isLoading && !error && profileData && (
                    <UserProfileForm
                        user={profileData} // Pass the detailed data to the form.
                        mode={mode}
                        onClose={onClose}
                        courseOptions={courseOptions}
                        onUpdateSuccess={handleFormSuccess} // Pass the new handler.
                    />
                )}
            </div>
        </div>
    );
}
