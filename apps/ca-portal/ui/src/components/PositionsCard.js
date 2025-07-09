'use client';

import { useAuth } from '@/contexts/AuthContext';
import Tooltip from './ToolTip';
import ApplicationForm from './JobPositionApplicationForm';
import { useState, useMemo } from 'react';

// --- Icon components for the position card ---
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-1.5 text-gray-500 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'/>
  </svg>
);

const LocationIcon = () => (
  <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-1.5 text-gray-500 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'/>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'/>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-1.5 text-gray-500 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'/>
  </svg>
);

const Requirement = ({ text, met }) => (
  <li className={`flex items-center space-x-2 text-sm ${met ? 'text-gray-700' : 'text-red-600 font-medium'}`}>
    {met ? <CheckIcon /> : <XIcon />}
    <span>{text}</span>
  </li>
);

const letterToGradeValue = {
  'A': 10, 'A-': 9, 'B+': 8, 'B': 7, 'B-': 6,
  'C+': 5, 'C': 4, 'C-': 3, 'D': 2, 'F': 1,
};

export default function PositionsCard({ position, index }) {
  const { currentUser, addApplicationToCurrentUser } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);

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
      const userValue = courseInData ? letterToGradeValue[courseInData.grade] : 0;
      const met = userValue >= requiredValue;
      requirements.push({ text: `Requires a grade of ${position.gradeRequirement} or higher`, met });
    }
    
    const isOverallEligible = requirements.every(req => req.met);
    const unmetReasons = requirements.filter(req => !req.met);
    const reason = unmetReasons.map(req => req.text).join(' and ');

    return { details: requirements, isOverallEligible, reason };
  }, [currentUser, position]);

  const handleApplySuccess = (newApplication, newResumeUrl) => {
    addApplicationToCurrentUser(newApplication, newResumeUrl);
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
        <button onClick={() => setIsFormOpen(true)} className='bg-rit-orange text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 transition-colors duration-300 shadow-sm whitespace-nowrap'>
          Apply Now
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
                    {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {currentUser?.role === 'CANDIDATE' && eligibilityDetails.details.length > 0 && (
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
        <ApplicationForm
          user={currentUser}
          position={position}
          onClose={() => setIsFormOpen(false)}
          onApplySuccess={handleApplySuccess}
        />
      )}
    </>
  );
}