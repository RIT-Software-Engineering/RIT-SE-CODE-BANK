'use client';

import { useState, useRef, useEffect } from 'react';
import { deleteApplication, updateCandidateApplicationStatus } from '@/services/db-apis';
import ViewableApplicationForm from '../ViewableApplicationForm';
import ConfirmationModal from '../../ui/ConfirmationModal';
import {
  formatDate,
  formatTime,
  getStatusClasses,
} from '@/utils/applicationUtils';
import {
  CalendarIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  LocationIcon,
} from '@/assets/icons';
import { useNotification } from '@/contexts/NotificationContext';
import ViewCommentForm from '../../comments/ViewableCommentForm';
import EditableCommentForm from '@/components/comments/EditableCommentForm';

export default function CandidateApplicationCard({
  currentUser,
  application,
  refreshUserProfile,
  onStatusChange,
}) {
  const { id } = application;
  const { showNotification } = useNotification();
  const [isViewingApplication, setIsViewingApplication] = useState(false);
  const [isConfirmingWithdrawal, setIsConfirmingWithdrawal] = useState(false);
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [isViewingComments, setIsViewingComments] = useState(false);

  const [modalState, setModalState] = useState({
    isOpen: false,
    status: null,
    title: '',
  });
  const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);

  const { jobPosition, jobApplicationStatus } = application;
  const statusClasses = getStatusClasses(jobApplicationStatus);

  const handleOpenUpdateModal = (status, title) => {
    setModalState({ isOpen: true, status, title });
  };

  const handleCloseUpdateModal = () => {
    setModalState({ isOpen: false, status: null, title: '' });
  };

  const handleWithdrawClick = () => {
    setIsConfirmingWithdrawal(true);
  };

  const executeWithdrawal = async () => {
    setIsProcessingWithdrawal(true);
    try {
      await deleteApplication(currentUser.uid, application.jobPositionId);
      await refreshUserProfile();
      showNotification('Application withdrawn successfully.', 'success');
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      showNotification('Failed to withdraw application.', 'error');
    } finally {
      setIsProcessingWithdrawal(false);
      setIsConfirmingWithdrawal(false);
    }
  };

  const handleConfirmUpdate = async (comment) => {
    setIsProcessingUpdate(true);
    try {
      console.log(
        `Updating status to "${modalState.status}" for application ID: ${id} with comment: ${comment}`
      );
      const updatedApplication = await updateCandidateApplicationStatus(
        id,
        modalState.status,
        comment
      );
      showNotification(
        `Application status successfully updated to "${modalState.status?.replaceAll('_', ' ')}".`,
        'success'
      );
      console.log('Updated application:', updatedApplication);
      // Call the callback prop to refresh the parent page's data
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setIsProcessingUpdate(false);
      handleCloseUpdateModal();
    }
  };

  const CandidateAndEmployeeHeader = () => (
    <div className='flex-1 min-w-0'>
      <h2 className='text-2xl font-bold text-gray-800'>
        {jobPosition.course.name}
      </h2>
      <p className='text-md text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block mt-1'>
        {jobPosition.id}
      </p>
      <div className='flex items-center text-gray-600 mt-2'>
        <CalendarIcon />
        <span>
          {formatDate(jobPosition.startDate)} -{' '}
          {formatDate(jobPosition.endDate)}
        </span>
      </div>
    </div>
  );

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
                    setIsViewingApplication(true);
                    setIsOpen(false);
                  }}
                  className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  View Application Submission
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
                  View Comment History
                </button>
              </li>
              {jobApplicationStatus.toLowerCase() !== 'accepted' && (
                <li>
                  <button
                    onClick={() => {
                      handleWithdrawClick();
                      setIsOpen(false);
                    }}
                    disabled={isProcessingWithdrawal}
                    className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:text-gray-400'
                  >
                    Withdraw
                  </button>
                </li>
              )}
              {jobApplicationStatus.toLowerCase() === 'pending_acceptance' && (
                <li>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleOpenUpdateModal('ACCEPTED', 'Accept Position');
                    }}
                     className =
                        'w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  >
                    Accept Position
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className='w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden mb-8'>
        <div className='p-6'>
          <div className='flex justify-between items-start flex-wrap gap-4'>
            <CandidateAndEmployeeHeader />
            <div className='text-right'>
              <ActionsMenu />
            </div>
          </div>

          <div className='mt-4 pt-4 border-t border-gray-200'>
            <p className='text-gray-700 mb-4'>
              {jobPosition.course.description}
            </p>
            <div className='flex flex-col sm:flex-row sm:space-x-8 space-y-3 sm:space-y-0 text-gray-600'>
              <div className='flex items-center'>
                <LocationIcon />
                <span>{jobPosition.location}</span>
              </div>
              <div className='flex items-center'>
                <ClockIcon />
                <div>
                  {jobPosition.jobSchedules.map((slot, i) => (
                    <span key={i} className='block'>
                      <span className='font-semibold'>{slot.dayOfWeek}:</span>{' '}
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className='mt-6 pt-4 border-t border-gray-200 flex justify-end'>
            <span
              className={`px-4 py-2 text-md font-bold rounded-full ${statusClasses}`}
            >
              {jobApplicationStatus?.replaceAll('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmingWithdrawal}
        onClose={() => setIsConfirmingWithdrawal(false)}
        onConfirm={executeWithdrawal}
        title='Confirm Withdrawal'
        isConfirming={isProcessingWithdrawal}
      >
        Are you sure you want to withdraw your application for{' '}
        <strong>{jobPosition.course.name}</strong>? This action cannot be
        undone.
      </ConfirmationModal>

      {isViewingApplication && (
        <ViewableApplicationForm
          position={jobPosition}
          application={application}
          onClose={() => setIsViewingApplication(false)}
        />
      )}

      {isViewingComments && (
        <ViewCommentForm
          application={application}
          jobPosition={jobPosition}
          onClose={() => setIsViewingComments(false)}
        />
      )}

      <EditableCommentForm
        isOpen={modalState.isOpen}
        onClose={handleCloseUpdateModal}
        onConfirm={handleConfirmUpdate}
        title={modalState.title}
        isProcessing={isProcessingUpdate}
      />
    </>
  );
}
