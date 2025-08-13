'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useState, useMemo, useRef, useEffect } from 'react';
import Tooltip from '../common/ToolTip';
import ConfirmationModal from '../common/models/ConfirmationModal';
import EditableApplicationForm from '../applications/EditableApplicationForm';
import {
  EllipsisVerticalIcon,
  CheckIcon,
  XIcon,
  CalendarIcon,
  ClockIcon,
  LocationIcon,
} from '@/assets/icons';
import { getCandidateHiredStatus } from '@/services/db-apis';
import { formatDate, formatTime } from '@/utils/applicationUtils';
import {
  gradeEnumToStringValue,
  letterToGradeValue,
} from '@/constants/gradeConstants';
import PositionTracker from './EmployerAndAdmin/PositionTracker';
import ViewablePositionForm from './EmployerAndAdmin/ViewablePositionForm';
import ViewableCommentForm from '../comments/ViewableCommentForm';
import { positionStatusEnumToString } from '@/constants/positionStatusConstants';

const Requirement = ({ text, met }) => (
  <li
    className={`flex items-center space-x-2 text-sm ${
      met ? 'text-gray-700' : 'text-red-600 font-medium'
    }`}
  >
    {met ? <CheckIcon /> : <XIcon />}
    <span>{text}</span>
  </li>
);

export default function PositionsCard({
  position,
  index,
  onEdit,
  onApprove,
  onReject,
  showEditAction,
  showApproveRejectActions,
  showTracker,
}) {
  const { currentUser, refreshUserProfile } = useAuth();
  const { showNotification } = useNotification();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [isViewingComments, setIsViewingComments] = useState(false);
  const [isConfirmingApplication, setIsConfirmingApplication] = useState(false);
  const [isCheckingHiredStatus, setIsCheckingHiredStatus] = useState(false);

  const hasApplied =
    currentUser?.candidate?.jobPositionApplicationHistory?.some(
      (app) => app.jobPositionId === position.id
    ) || false;

  const eligibilityDetails = useMemo(() => {
    if (!currentUser?.candidate) {
      return {
        details: [],
        isOverallEligible: false,
        reason: 'User is not a candidate.',
      };
    }

    const requirements = [];
    const candidateStatus = currentUser.candidate.graduateStatus;
    const courseInData = currentUser.candidate.courseHistory.find(
      (historyItem) => historyItem.courseCode === position.courseCode
    );

    if (position.graduateStatusRequirement) {
      const met = candidateStatus === position.graduateStatusRequirement;
      requirements.push({
        text: `Must be a ${position.graduateStatusRequirement.toLowerCase()} candidate`,
        met,
      });
    }

    if (position.courseTakenRequirement) {
      const met = !!courseInData;
      requirements.push({
        text: `Must have taken ${position.courseCode}`,
        met,
      });
    }

    if (position.gradeRequirement) {
      const requiredValue = letterToGradeValue[position.gradeRequirement];
      const userValue = courseInData
        ? letterToGradeValue[gradeEnumToStringValue[courseInData.grade]]
        : 0;
      const met = userValue >= requiredValue;
      requirements.push({
        text: `Requires a grade of ${position.gradeRequirement} or higher`,
        met,
      });
    }

    const isOverallEligible = requirements.every((req) => req.met);
    const unmetReasons = requirements.filter((req) => !req.met);
    const reason = unmetReasons.map((req) => req.text).join(' and ');

    return { details: requirements, isOverallEligible, reason };
  }, [currentUser, position]);

  const handleApplyClick = async () => {
    if (!position?.semesterCode) {
      showNotification(
        'Cannot check your status: Semester code is missing.',
        'error'
      );
      setIsFormOpen(true);
      return;
    }

    setIsCheckingHiredStatus(true);
    try {
      const hiredStatus = await getCandidateHiredStatus(
        currentUser.username,
        position.semesterCode
      );
      if (hiredStatus) {
        setIsConfirmingApplication(true);
      } else {
        setIsFormOpen(true);
      }
    } catch (error) {
      console.error('Failed to check hired status:', error);
      showNotification(`Error checking your status: ${error.message}`, 'error');
      setIsFormOpen(true);
    } finally {
      setIsCheckingHiredStatus(false);
    }
  };

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
        <button
          className='bg-gray-300 text-gray-500 font-bold py-2 px-5 rounded-lg shadow-sm whitespace-nowrap cursor-not-allowed'
          disabled
        >
          Apply Now
        </button>
      </Tooltip>
    );
  };

  const ActionsMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuToggle = (e) => {
      e.stopPropagation();
      setIsOpen(!isOpen);
    };

    return (
      <div className='relative' ref={menuRef}>
        <button
          onClick={handleMenuToggle}
          className='p-2 rounded-full hover:bg-gray-100'
        >
          <EllipsisVerticalIcon />
        </button>
        {isOpen && (
          <div className='absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20'>
            <ul className='py-1'>
              <li>
                <button
                  onClick={() => {
                    setIsViewingDetails(true);
                    setIsOpen(false);
                  }}
                  className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  View Details
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setIsViewingComments(true);
                    setIsOpen(false);
                  }}
                  className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  View Comments
                </button>
              </li>

              {showEditAction && (
                <>
                  <div className='my-1 border-t border-gray-100'></div>
                  <li>
                    <button
                      onClick={() => {
                        onEdit(position);
                        setIsOpen(false);
                      }}
                      className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                    >
                      Edit Position
                    </button>
                  </li>
                </>
              )}

              {showApproveRejectActions &&
                position.jobPositionStatus === 'PENDING_APPROVAL' && (
                  <>
                    <div className='my-1 border-t border-gray-100'></div>
                    <li>
                      <button
                        onClick={() => {
                          onApprove(position.id);
                          setIsOpen(false);
                        }}
                        className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                      >
                        Approve Position
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          onReject(position.id);
                          setIsOpen(false);
                        }}
                        className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100'
                      >
                        Reject Position
                      </button>
                    </li>
                  </>
                )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        key={index}
        className='bg-white p-6 mb-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 w-full'
      >
        <div className='flex justify-between items-start flex-wrap gap-4'>
          <div className='flex-grow'>
            <h2 className='text-2xl font-bold text-gray-800'>
              {position.course.name}
            </h2>
            <p className='text-md text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block mt-1'>
              {position.id}
            </p>
            <div className='flex items-center text-gray-600 mt-2'>
              <CalendarIcon className="h-4 w-4 mr-1.5" />
              <span className="text-sm">
                {formatDate(position.startDate)} - {formatDate(position.endDate)}
              </span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {(currentUser?.role === 'ADMIN' ||
              currentUser?.role === 'EMPLOYER') && <ActionsMenu />}
            {(currentUser?.role === 'CANDIDATE' ||
              currentUser?.role === 'EMPLOYEE') &&
              renderApplyButton()}
          </div>
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
          {(currentUser?.role === 'CANDIDATE' ||
            currentUser?.role === 'EMPLOYEE') &&
            eligibilityDetails.details.length > 0 && (
              <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
                <h4 className='text-md font-semibold text-gray-800 mb-2'>
                  Job Requirements
                </h4>
                <ul className='space-y-1'>
                  {eligibilityDetails.details.map((req, i) => (
                    <Requirement key={i} text={req.text} met={req.met} />
                  ))}
                </ul>
              </div>
            )}
        </div>

        {showTracker && (
          <div className='mt-4 pt-4 border-t border-gray-200'>
            <PositionTracker currentStep={position.jobPositionStatus} />
          </div>
        )}
      </div>

      {isFormOpen && (
        <EditableApplicationForm
          user={currentUser}
          position={position}
          onClose={() => setIsFormOpen(false)}
          onApplySuccess={refreshUserProfile}
        />
      )}
      {isViewingDetails && (
        <ViewablePositionForm
          position={position}
          onClose={() => setIsViewingDetails(false)}
        />
      )}
      {isViewingComments && (
        <ViewableCommentForm
          foreignKey={position.id}
          foreignTableName="JobPosition"
          itemTitle="Position Comment History"
          itemSubtitle={position.course.name}
          statusEnumMap={positionStatusEnumToString}
          userRole={currentUser.role}
          onClose={() => setIsViewingComments(false)}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmingApplication}
        onClose={() => setIsConfirmingApplication(false)}
        onConfirm={() => {
          setIsConfirmingApplication(false);
          setIsFormOpen(true);
        }}
        title='Confirm New Application'
        isConfirming={isCheckingHiredStatus}
      >
        <p className='mt-2'>
          You have already accepted an offer for another position this semester.
          In most cases, you are expected to accept{' '}
          <strong>only one offer</strong> per semester. You can still apply for
          other positions, but please be prepared to communicate with the
          professors involved if you receive multiple offers.
        </p>
        <p className='mt-2 font-semibold'>
          Are you sure you want to proceed with this application?
        </p>
      </ConfirmationModal>
    </>
  );
}