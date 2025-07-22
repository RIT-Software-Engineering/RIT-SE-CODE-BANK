// src/components/Profile/ProfileInfoCard.js

import React from 'react';
import EditIcon from '../icons/EditIcon';

/**
 * A card component to display user profile information.
 * @param {object} props - The component props.
 * @param {object} props.profileData - The user's profile data object.
 * @param {boolean} props.isEmployerOrAdmin - Flag to show employer/admin specific fields.
 * @param {boolean} props.isCandidateOrEmployee - Flag to show candidate/employee specific fields.
 * @param {function} props.handleOpenModal - Callback function to open the edit modal.
 */
export default function ProfileInfoCard({
  profileData,
  isEmployerOrAdmin,
  isCandidateOrEmployee,
  handleOpenModal,
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
    <section className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
      <div className="p-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {profileData.name}
          </h2>
          <p className="text-gray-600 mt-1">{profileData.email}</p>
          <p>
            <span className="font-semibold">Pronouns:</span>{" "}
            {profileData.pronouns || "N/A"}
          </p>
          {isCandidateOrEmployee && (
            <div className="text-gray-800">
              <p>
                <span className="font-semibold">Major:</span>{" "}
                {profileData.candidate?.major || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Year:</span>{" "}
                {profileData.candidate?.year || "N/A"}
              </p>
            </div>
          )}
          {isEmployerOrAdmin && (
            <p>
              <span className="font-semibold">Department:</span>{" "}
              {profileData.employer?.department || "N/A"}
            </p>
          )}
        </div>
        <EditIcon handleOpenModal={handleOpenModal}/>
      </div>
    </section>
  );
}
