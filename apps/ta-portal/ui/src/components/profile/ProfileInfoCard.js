// components/Profile/ProfileInfoCard.js

import React from 'react';
import EditButton from '../common/buttons/EditButton';

/**
 * A card component to display user profile information for candidates, employees, employers, and admins.
 * @param {object} props - The component props.
 * @param {object} props.profileData - The user's profile data object.
 * @param {boolean} props.isEmployerOrAdmin - Flag to show employer/admin specific fields.
 * @param {boolean} props.isCandidateOrEmployee - Flag to show candidate/employee specific fields.
 * @param {function} props.onEdit - The function to call when the edit icon is clicked.
 * @returns {JSX.Element} The rendered ProfileInfoCard component.
 */
export default function ProfileInfoCard({
  profileData,
  isEmployerOrAdmin,
  isCandidateOrEmployee,
  onEdit,
}) {
  if (!profileData) return null;

  const yearLevel = profileData.candidate?.graduateStatus === "GRADUATE" ? "Graduate" : profileData.candidate?.year;

  return (
    <section className='bg-white rounded-xl shadow-lg border border-gray-200'>
      <div className='p-6 flex justify-between items-start'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            {profileData.name}
          </h2>
          <p>
            <span className='font-semibold'>Email:</span>{' '}
            {profileData.email || 'N/A'}
          </p>
          <p>
            <span className='font-semibold'>UID:</span>{' '}
            {profileData.uid || 'N/A'}
          </p>
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
                {yearLevel || 'N/A'}
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
        <EditButton handleOpenModal={onEdit} />
      </div>
    </section>
  );
}
