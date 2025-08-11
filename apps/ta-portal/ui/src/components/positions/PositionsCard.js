'use client';

import { useAuth } from '@/contexts/AuthContext';
import Tooltip from '../common/ToolTip';
import EditableApplicationForm from '../applications/EditableApplicationForm';
import { useState, useMemo } from 'react';
import { CheckIcon, XIcon, CalendarIcon, ClockIcon, LocationIcon } from '@/assets/icons';
import { formatDate, formatTime } from '@/utils/applicationUtils';
import { gradeEnumToStringValue, letterToGradeValue } from '@/constants/gradeConstants';
import ConfirmationModal from '../common/models/ConfirmationModal';
import { getCandidateHiredStatus } from '@/services/db-apis';
import { useNotification } from '@/contexts/NotificationContext';

const Requirement = ({ text, met }) => (
  <li className={`flex items-center space-x-2 text-sm ${met ? 'text-gray-700' : 'text-red-600 font-medium'}`}>
    {met ? <CheckIcon /> : <XIcon />}
    <span>{text}</span>
  </li>
);

export default function PositionsCard({ position, index }) {
  const { currentUser, refreshUserProfile } = useAuth();
  const { showNotification } = useNotification();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [isConfirmingApplication, setIsConfirmingApplication] = useState(false);
  const [isCheckingHiredStatus, setIsCheckingHiredStatus] = useState(false);

  const hasApplied =
    currentUser?.candidate?.jobPositionApplicationHistory?.some(
      (app) => app.jobPositionId === position.id
    ) || false;

  const eligibilityDetails = useMemo(() => {
    if (!currentUser?.candidate) {
      return { details: [], isOverallEligible: false, reason: 'User is not a candidate.' };
    }

    const requirements = [];
    const candidateStatus = currentUser.candidate.graduateStatus;
    const courseInData = currentUser.candidate.courseHistory.find(
      (historyItem) => historyItem.courseCode === position.courseCode
    );

    // 1. Graduate Status Check
    if (position.graduateStatusRequirement) {
      const met = candidateStatus === position.graduateStatusRequirement;
      requirements.push({ text: `Must be a ${position.graduateStatusRequirement.toLowerCase()} candidate`, met });
    }

    // 2. Course Taken Check
    if (position.courseTakenRequirement) {
      const met = !!courseInData;
      requirements.push({ text: `Must have taken ${position.courseCode}`, met });
    }

    // 3. Grade Check
    if (position.gradeRequirement) {
      const requiredValue = letterToGradeValue[position.gradeRequirement];
      const userValue = courseInData ? letterToGradeValue[gradeEnumToStringValue[courseInData.grade]] : 0;
      const met = userValue >= requiredValue;
      requirements.push({ text: `Requires a grade of ${position.gradeRequirement} or higher`, met });
    }
    
    const isOverallEligible = requirements.every(req => req.met);
    const unmetReasons = requirements.filter(req => !req.met);
    const reason = unmetReasons.map(req => req.text).join(' and ');

    return { details: requirements, isOverallEligible, reason };
  }, [currentUser, position]);

  const handleApplyClick = async () => {
    if (!position?.semesterCode) {
      showNotification("Cannot check your status: Semester code is missing.", "error");
      // Fallback to opening the form directly if semester code is missing
      setIsFormOpen(true);
      return;
    }

    setIsCheckingHiredStatus(true);
    try {
      const hiredStatus = await getCandidateHiredStatus(
        currentUser.username,
        position.semesterCode
      );
      console.log(hiredStatus);

      if (hiredStatus) {
        setIsConfirmingApplication(true);
      } else {
        setIsFormOpen(true);
      }
    } catch (error) {
      console.error("Failed to check hired status:", error);
      showNotification(`Error checking your status: ${error.message}`, "error");
      // Let the user apply anyway if the check fails
      setIsFormOpen(true);
    } finally {
      setIsCheckingHiredStatus(false);
    }
  };


  const renderApplyButton = () => {
    if (hasApplied) {
      return (
        <button className='bg-green-600 text-white font-bold py-2 px-5 rounded-lg shadow-sm whitespace-nowrap cursor-default' disabled>
          Applied
        </button>
      );
    }

    if (eligibilityDetails.isOverallEligible) {
      return (
        <button 
          onClick={handleApplyClick} 
          disabled={isCheckingHiredStatus}
          className='bg-rit-orange text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 transition-colors duration-300 shadow-sm whitespace-nowrap'
        >
          {isCheckingHiredStatus ? 'Checking...' : 'Apply Now'}
        </button>
      );
    }

    return (
      <Tooltip text={eligibilityDetails.reason}>
        <button className='bg-gray-300 text-gray-500 font-bold py-2 px-5 rounded-lg shadow-sm whitespace-nowrap cursor-not-allowed' disabled>
          Apply Now
        </button>
      </Tooltip>
    );
  };

  return (
    <>
      <div key={index} className='bg-white p-6 mb-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 w-full'>
        <div className='flex justify-between items-start flex-wrap gap-4'>
          <div>
            <h2 className='text-2xl font-bold text-gray-800'>{position.course.name}</h2>
            <p className='text-md text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block mt-1'>{position.id}</p>
            <div className='flex items-center text-gray-600 mt-2'>
              <CalendarIcon />
              <span>{formatDate(position.startDate)} - {formatDate(position.endDate)}</span>
            </div>
          </div>
          {(currentUser?.role === 'CANDIDATE' || currentUser?.role === 'EMPLOYEE') && renderApplyButton()}
        </div>

        <div className='mt-4 pt-4 border-t border-gray-200'>
          <p className='text-gray-700 mb-4'>{position.course.description}</p>
          <div className='flex flex-col sm:flex-row sm:space-x-8 space-y-3 sm:space-y-0 text-gray-600'>
            <div className='flex items-center'>
              <LocationIcon />
              <span>{position.location}</span>
            </div>
            <div className='flex items-center'>
              <ClockIcon />
              <div>
                {position.jobSchedules.map((slot, i) => (
                  <span key={i} className='block'>
                    <span className='font-semibold'>{slot.dayOfWeek}:</span>{' '}
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {(currentUser?.role === 'CANDIDATE' || currentUser?.role === 'EMPLOYEE') && eligibilityDetails.details.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-semibold text-gray-800 mb-2">Job Requirements</h4>
              <ul className="space-y-1">
                {eligibilityDetails.details.map((req, i) => (
                  <Requirement key={i} text={req.text} met={req.met} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <EditableApplicationForm
          user={currentUser}
          position={position}
          onClose={() => setIsFormOpen(false)}
          onApplySuccess={refreshUserProfile}
        />
      )}

      {/* Confirmation modal for already accepted offer */}
      <ConfirmationModal
        isOpen={isConfirmingApplication}
        onClose={() => setIsConfirmingApplication(false)}
        onConfirm={() => {
          setIsConfirmingApplication(false);
          setIsFormOpen(true);
        }}
        title="Confirm New Application"
        isConfirming={isCheckingHiredStatus}
      >
        <p className="mt-2">
          You have already accepted an offer for another position this semester.
          In most cases, you are expected to accept <strong>only one offer</strong> per semester. 
          You can still apply for other positions, but please be prepared to communicate with the professors involved if you receive multiple offers.
        </p>
        <p className="mt-2 font-semibold">
          Are you sure you want to proceed with this application?
        </p>
      </ConfirmationModal>
    </>
  );
}