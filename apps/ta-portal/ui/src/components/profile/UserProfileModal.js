// components/profile/UserProfileModal.js
'use client';
import { useState, useEffect } from 'react';
import UserProfileForm from './UserProfileForm';
import { getAllCourses } from '@/services/db-apis';

/**
 * Wrapper component for the UserProfileForm modal.
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls if the modal is visible.
 * @param {function} props.onClose - Function to call to close the modal.
 * @param {string} props.mode - The mode of the form (edit or create).
 * @param {object} props.profileData - The detailed profile data from the parent page.
 * @param {function} props.onUpdateSuccess - Callback for successful profile updates.
 * @param {string} props.editingSection - The section being edited (mainly for candidate/employee).
 */
export default function UserProfileModal({
  isOpen,
  onClose,
  mode,
  onUpdateSuccess,
  profileData,
  editingSection,
}) {
  const [courseOptions, setCourseOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const courses = await getAllCourses();
        setCourseOptions(courses);
      } catch (err) {
        console.error('Error fetching courses for profile form:', err);
        setError('Could not load course data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourseData();
  }, []);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col'>
        {isLoading && <div className='p-8 text-center'>Loading Form...</div>}
        {error && (
          <div className='p-8 text-center'>
            <p className='text-red-500 font-semibold'>{error}</p>
            <button
              onClick={onClose}
              className='mt-4 px-4 py-2 bg-slate-200 rounded-lg'
            >
              Close
            </button>
          </div>
        )}
        {!isLoading && !error && profileData && (
          <UserProfileForm
            user={profileData}
            mode={mode}
            onClose={onClose}
            courseOptions={courseOptions}
            onUpdateSuccess={onUpdateSuccess}
            editingSection={editingSection}
          />
        )}
      </div>
    </div>
  );
}
