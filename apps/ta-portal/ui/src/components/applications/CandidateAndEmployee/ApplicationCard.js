"use client";

import { useState, useRef, useEffect } from 'react';
import { deleteApplication, updateCandidateApplicationStatus, getCandidateHiredStatus } from '@/services/db-apis';
import ViewableApplicationForm from '../ViewableApplicationForm';
import ConfirmationModal from '../../common/models/ConfirmationModal';
import {
  formatDate,
  formatTime,
  getStatusClasses,
} from "@/utils/applicationUtils";
import {
  CalendarIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  LocationIcon,
} from "@/assets/icons";
import { useNotification } from "@/contexts/NotificationContext";
import ViewableCommentForm from "../../comments/ViewableCommentForm";
import EditableCommentForm from "@/components/comments/EditableCommentForm";
import ApplicationProgressTracker from "@/components/applications/ApplicationProgressTracker";


export default function CandidateApplicationCard({
  currentUser,
  application,
  refreshUserProfile,
  onStatusChange,
}) {
  const { id } = application;
  const { showNotification } = useNotification();
  const [isViewingApplication, setIsViewingApplication] = useState(false);
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(false);
  const [isProcessingDeletion, setIsProcessingDeletion] = useState(false);
  const [isViewingComments, setIsViewingComments] = useState(false);

  const [modalState, setModalState] = useState({
    isOpen: false,
    status: null,
    title: "",
  });
  const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);

  // check if candidate has already been accepted or hired for any position for the given semester
  const [isConfirmingAcceptance, setIsConfirmingAcceptance] = useState(false);
  const [isCheckingHiredStatus, setIsCheckingHiredStatus] = useState(false);

  const { jobPosition, jobApplicationStatus } = application;
  const statusClasses = getStatusClasses(jobApplicationStatus);

  const handleOpenUpdateModal = (status, title) => {
    setModalState({ isOpen: true, status, title });
  };

  const handleCloseUpdateModal = () => {
    setModalState({ isOpen: false, status: null, title: "" });
  };

  const handleAcceptOffer = async () => {
    if (!jobPosition?.semesterCode) {
      showNotification(
        "Cannot check your status: Semester code is missing.",
        "error"
      );
      return;
    }

    setIsCheckingHiredStatus(true);
    try {
      const hiredStatus = await getCandidateHiredStatus(
        currentUser.username,
        jobPosition.semesterCode
      );

      // If already hired or accepted another offer, show the confirmation modal
      if (hiredStatus) {
        setIsConfirmingAcceptance(true);
      } else {
        // Otherwise, proceed directly to accepting the offer
        handleOpenUpdateModal("ACCEPTED_OFFER", "Accept Position Offer");
      }
    } catch (error) {
      console.error("Failed to check hired status:", error);
      showNotification(`Error checking your status: ${error.message}`, "error");
    } finally {
      setIsCheckingHiredStatus(false);
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmingDeletion(true);
  };

  const executeDeletion = async () => {
    setIsProcessingDeletion(true);
    try {
      await deleteApplication(currentUser.username, application.jobPositionId);
      await refreshUserProfile();
      showNotification("Application deleted successfully.", "success");
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Failed to delete application:", error);
      showNotification("Failed to delete application.", "error");
    } finally {
      setIsProcessingDeletion(false);
      setIsConfirmingDeletion(false);
    }
  };

  const handleConfirmUpdate = async (comment) => {
    setIsProcessingUpdate(true);
    try {
      console.log(
        `Updating status to "${modalState.status}" for application ID: ${id} with comment: ${comment}`
      );
      let fullName = currentUser.fname + " " + currentUser.lname
      const updatedApplication = await updateCandidateApplicationStatus(
        fullName,
        id,
        modalState.status,
        comment
      );
      showNotification(
        `Application status successfully updated to "${modalState.status?.replaceAll(
          "_",
          " "
        )}".`,
        "success"
      );
      console.log("Updated application:", updatedApplication);
      // Call the callback prop to refresh the parent page's data
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      showNotification(`Error: ${error.message}`, "error");
    } finally {
      setIsProcessingUpdate(false);
      handleCloseUpdateModal();
    }
  };

  const CandidateAndEmployeeHeader = () => (
    <div className="flex-1 min-w-0">
      <h2 className="text-2xl font-bold text-gray-800">
        {jobPosition.course.name}
      </h2>
      <p className="text-md text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block mt-1">
        {jobPosition.id}
      </p>
      <div className="flex items-center text-gray-600 mt-2">
        <CalendarIcon />
        <span>
          {formatDate(jobPosition.startDate)} -{" "}
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
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMenuToggle = (e) => {
      e.stopPropagation();
      setIsOpen(!isOpen);
    };

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={handleMenuToggle}
          className="p-2 rounded-full hover:bg-gray-100"
          disabled={isCheckingHiredStatus}
        >
          <EllipsisVerticalIcon />
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20">
            <ul className="py-1">
              <li>
                <button
                  onClick={() => {
                    setIsViewingApplication(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View Comment History
                </button>
              </li>
              {(jobApplicationStatus.toLowerCase() === "applied" ||
                jobApplicationStatus.toLowerCase() === "interview") && (
                <li>
                  <button
                    onClick={() => {
                      handleDeleteClick();
                      setIsOpen(false);
                    }}
                    disabled={isProcessingDeletion}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:text-gray-400"
                  >
                    Delete Application
                  </button>
                </li>
              )}

              {jobApplicationStatus.toLowerCase() === "pending_offer" && (
                <li>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleOpenUpdateModal("DECLINED_OFFER", "Decline Position Offer");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Decline Position Offer
                  </button>
                </li>
              )}

              {jobApplicationStatus.toLowerCase() === "pending_offer" && (
                <li>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleAcceptOffer();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Accept Position Offer
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
      <div className="w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <CandidateAndEmployeeHeader />
            <div className="text-right">
              <ActionsMenu />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-700 mb-4">
              {jobPosition.course.description}
            </p>
            <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-3 sm:space-y-0 text-gray-600">
              <div className="flex items-center">
                <LocationIcon />
                <span>{jobPosition.location}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon />
                <div>
                  {jobPosition.jobSchedules.map((slot, i) => (
                    <span key={i} className="block">
                      <span className="font-semibold">{slot.dayOfWeek}:</span>{" "}
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="w-2/3 mt-6">
              <ApplicationProgressTracker currentStep={jobApplicationStatus} />
            </div>
            <span
              className={`px-4 py-2 text-md font-bold rounded-full ${statusClasses}`}
            >
              {jobApplicationStatus?.replaceAll("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* confirmation modal for deleting application */}
      <ConfirmationModal
        isOpen={isConfirmingDeletion}
        onClose={() => setIsConfirmingDeletion(false)}
        onConfirm={executeDeletion}
        title="Confirm Deletion"
        isConfirming={isProcessingDeletion}
      >
        Are you sure you want to delete your application for{" "}
        <strong>{jobPosition.course.name}</strong>? This action cannot be
        undone.
      </ConfirmationModal>

      {/* confirmation modal for accepting offer */}
      <ConfirmationModal
        isOpen={isConfirmingAcceptance}
        onClose={() => setIsConfirmingAcceptance(false)}
        onConfirm={() => {
          setIsConfirmingAcceptance(false);
          handleOpenUpdateModal("ACCEPTED_OFFER", "Accept Position Offer");
        }}
        title="Confirm Offer Acceptance"
        isConfirming={isProcessingUpdate}
      >
        <p className='mt-2'>
          You have already accepted an offer for another position this semester.
          In most cases, you are expected to accept <strong>only one offer</strong> per semester. 
          Accepting this offer will not automatically withdraw you from the other position. 
          Please contact the administrator or the other course&apos;s professor if you wish to change your decision.
        </p>
        <p className="mt-2 font-semibold">
          Are you sure you want to accept this offer?
        </p>
      </ConfirmationModal>

      {isViewingApplication && (
        <ViewableApplicationForm
          position={jobPosition}
          application={application}
          onClose={() => setIsViewingApplication(false)}
        />
      )}

      {isViewingComments && (
        <ViewableCommentForm
          application={application}
          jobPosition={jobPosition}
          userRole={currentUser.role}
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
