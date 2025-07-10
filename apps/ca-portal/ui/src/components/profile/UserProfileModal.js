// components/profile/UserProfileModal.js
"use client";
import { useState, useEffect } from "react";
import UserProfileForm from "./UserProfileForm";
import { useAuth } from "@/contexts/AuthContext";
import { getAllCourses, getUserProfile } from "@/services/db-apis";

/**
 * Wrapper component that controls the visibility of the UserProfileForm modal.
 * * It now relies on the AuthContext for user data and only fetches data
 * that is specific to the form itself, like the list of available courses.
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls if the modal is visible.
 * @param {function} props.onClose - Function to call to close the modal.
 * @param {function} props.onUpdateSuccess - Callback for successful profile updates.
 * @returns A modal containing the UserProfileForm or null if closed.
 */
export default function UserProfileModal({ isOpen, onClose, onUpdateSuccess }) {
  // --- Auth Context ---
  // Get the user data directly from the context.
  const { currentUser } = useAuth();

  // --- Local State ---
  // State is now only for data and UI elements specific to this modal.
  const [courseOptions, setCourseOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching ---
  // This effect only fetches the list of courses, as the user data is already available.
  useEffect(() => {
    // Don't fetch if there's no user.
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const fetchCourseData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch only the course list needed for the form's dropdowns.
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
  }, [currentUser]); // Re-run if the user changes.

  // If the modal is not set to be open from the parent, render nothing.
  if (!isOpen) return null;

  // Determine the form's mode based on whether the user profile seems complete.
  // A user with a 'name' property is considered to have an existing profile.
  const mode = currentUser?.name ? "edit" : "create";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Conditional rendering for loading, error, and form states */}
        {isLoading && <div className="p-8 text-center">Loading Form...</div>}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-500 font-semibold">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-slate-200 rounded-lg"
            >
              Close
            </button>
          </div>
        )}

        {!isLoading && !error && currentUser && (
          <UserProfileForm
            // Pass the user data from the context directly to the form.
            user={currentUser}
            mode={mode}
            onClose={onClose}
            courseOptions={courseOptions}
            onUpdateSuccess={onUpdateSuccess}
          />
        )}
      </div>
    </div>
  );
}
