// src/components/Profile/ProfileInfoCard.js

import React from 'react';
import ResumeManager from './ResumeManager';

/**
 * A card component to display user profile information.
 * @param {object} props - The component props.
 * @param {object} props.profileData - The user's profile data object.
 * @param {boolean} props.isEmployerOrAdmin - Flag to show employer/admin specific fields.
 * @param {boolean} props.isCandidateOrEmployee - Flag to show candidate/employee specific fields.
 * @param {function} props.handleOpenModal - Callback function to open the edit modal.
 * @param {function} props.onProfileRefresh - Callback function to refresh the profile data.
 */
export default function ProfileInfoCard({
  profileData,
  isEmployerOrAdmin,
  isCandidateOrEmployee,
  handleOpenModal,
  //onProfileRefresh,
}) {
  if (!profileData) {
    return (
      <section className='bg-white rounded-xl p-4 shadow-lg border border-gray-200'>
        <div className='p-6'>
          <p>Loading profile...</p>
        </div>
      </section>
    );
  }

  return (
    // <section className='bg-white rounded-xl p-4 shadow-lg border border-gray-200'>
    //   <div className='p-6'>
        <div className='flex justify-between items-start'>
          {/* Profile Details */}
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>
              {profileData.name}
            </h2>
            <p className='text-gray-600 mt-1'>{profileData.email}</p>
            <p>
              <span className='font-semibold'>Pronouns:</span>{' '}
              {profileData.pronouns || 'N/A'}
            </p>
            {isCandidateOrEmployee && (
              <div className='text-gray-800'>
                <p>
                  <span className='font-semibold'>Major:</span>{' '}
                  {profileData.candidate?.major || 'N/A'}
                </p>
                <p>
                  <span className='font-semibold'>Year:</span>{' '}
                  {profileData.candidate?.year || 'N/A'}
                </p>
              </div>
            )}
            {isEmployerOrAdmin && (
              <p>
                <span className='font-semibold'>Department:</span>{' '}
                {profileData.employer?.department || 'N/A'}
              </p>
            )}
          </div>
          <button
            onClick={handleOpenModal}
            className='p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors'
            aria-label='Edit Profile'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z'
              />
            </svg>
          </button>
        </div>

    //     {/* Conditionally render the ResumeManager component */}
    //     {isCandidateOrEmployee && (
    //       <>
    //         <hr className='my-6 border-gray-200' />
    //         <ResumeManager
    //           resumes={profileData.candidate?.resumes || []}
    //           candidateUID={profileData.uid}
    //           onProfileRefresh={onProfileRefresh}
    //         />
    //       </>
    //     )}
    //   </div>
    // </section>
  );
}
