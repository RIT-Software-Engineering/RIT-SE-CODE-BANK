import { useAuth } from '@/contexts/AuthContext';
import Tooltip from './ToolTip';
import ApplicationForm from './JobPositionApplicationForm';
import { useState } from 'react';

export default function PositionsCard({ position, index }) {
  const { currentUser, addApplicationToCurrentUser } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const hasApplied =
    currentUser?.student?.jobPositionApplicationHistory?.some(
      (app) => app.jobPositionId === position.id
    ) || false;

  const isEligibleToApply = () => {
    if (!currentUser?.student?.courseHistory) return false;
    const courseInData = currentUser.student.courseHistory.find(
      (historyItem) => historyItem.courseCode === position.courseCode
    );
    if (!courseInData) return false;
    const requiredGrades = ['A', 'A-'];
    return requiredGrades.includes(courseInData.grade);
  };

  const handleApplySuccess = (newApplication) => {
    addApplicationToCurrentUser(newApplication);
  };

  const ClockIcon = () => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className='h-5 w-5 mr-1.5 text-gray-500 inline'
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  );
  const LocationIcon = () => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className='h-5 w-5 mr-1.5 text-gray-500 inline'
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
      />
    </svg>
  );

  const renderApplyButton = () => {
    if (hasApplied) {
      return (
        <button
          className='bg-green-600 text-white font-bold py-2 px-5 rounded-lg shadow-sm whitespace-nowrap cursor-default'
          disabled
        >
          Applied
        </button>
      );
    }

    if (isEligibleToApply()) {
      return (
        <button
          onClick={() => setIsFormOpen(true)}
          className='bg-rit-orange text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 transition-colors duration-300 shadow-sm whitespace-nowrap'
        >
          Apply Now
        </button>
      );
    }

    return (
      <Tooltip text='You do not meet the requirements for this position (must have taken the course with a grade of A or A-).'>
        <button
          className='bg-gray-300 text-gray-500 font-bold py-2 px-5 rounded-lg shadow-sm whitespace-nowrap cursor-not-allowed'
          disabled
        >
          Apply Now
        </button>
      </Tooltip>
    );
  };

  return (
    <>
      <div
        key={index}
        className='bg-white p-6 mb-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 w-full'
      >
        <div className='flex justify-between items-start flex-wrap gap-4'>
          <div>
            <h2 className='text-2xl font-bold text-gray-800'>
              {position.course.name}
            </h2>
            <p className='text-md text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block mt-1'>
              {position.id}
            </p>
          </div>
          {currentUser?.role === 'STUDENT' && renderApplyButton()}
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
                    {new Date(slot.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(slot.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                ))}
              </div>
            </div>
          </div>
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
