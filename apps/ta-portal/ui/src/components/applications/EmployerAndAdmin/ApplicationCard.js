// components/applications/EmployerAndAdmin/ApplicationCard.js
"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { getStatusClasses } from "@/utils/applicationUtils";
import { DocumentIcon, EllipsisVerticalIcon } from "@/assets/icons";
import ViewableApplicationForm from "../ViewableApplicationForm";
import ViewableCommentForm from "../../comments/ViewableCommentForm";
import EditableCommentForm from "@/components/comments/EditableCommentForm";
import { updateCandidateApplicationStatus, getCandidateHiredStatus } from "@/services/db-apis";
import ConfirmationModal from "@/components/common/models/ConfirmationModal";
import { useNotification } from "@/contexts/NotificationContext";
import ApplicationTracker from "../ApplicationProgressTracker";

export default function ApplicationCard({
  currentUser,
  jobPosition,
  application,
  onStatusChange,
}) {
  const { showNotification } = useNotification();
  const [isViewingApplication, setIsViewingApplication] = useState(false);
  const [isViewingComments, setIsViewingComments] = useState(false);

  const [modalState, setModalState] = useState({
    isOpen: false,
    status: null,
    title: "",
  });
  const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);

  // check if candidate has already been accepted or hired for a position for the given semester
  const [isConfirmingOffer, setIsConfirmingOffer] = useState(false);
  const [isCheckingHiredStatus, setIsCheckingHiredStatus] = useState(false);

  const { id, jobApplicationStatus, resume } = application;

  const statusClasses = getStatusClasses(jobApplicationStatus);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleOpenUpdateModal = (status, title) => {
    setModalState({ isOpen: true, status, title });
  };

  const handleCloseUpdateModal = () => {
    setModalState({ isOpen: false, status: null, title: "" });
  };

  const handleOfferPosition = async () => {
    if (!jobPosition?.semesterCode) {
      showNotification(
        "Cannot check candidate status: Semester code is missing.",
        "error"
      );
      return;
    }

    setIsCheckingHiredStatus(true);
    try {
      const hiredStatus = await getCandidateHiredStatus(
        application.username,
        jobPosition.semesterCode
      );

      // If the candidate is already hired for the semester, show the confirmation modal.
      if (hiredStatus) {
        setIsConfirmingOffer(true);
      } else {
        // Otherwise, proceed directly to the comment modal for the offer.
        handleOpenUpdateModal("PENDING_OFFER", "Offer Position");
      }
    } catch (error) {
      console.error("Failed to check candidate hired status:", error);
      showNotification(`Error checking hired status: ${error.message}`, "error");
    } finally {
      setIsCheckingHiredStatus(false);
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

  const EmployerHeader = () => (
    <div className="flex items-center space-x-4 flex-1 min-w-0">
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-2xl font-bold text-black">
            {application.candidateFName.charAt(0)}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold text-gray-800 truncate">
          {application.candidateFName} {application.candidateLName}
          {" "}
          ({currentUser.role === 'EMPLOYER' && (
            <span className="user-pronouns">{application.candidatePronouns}</span>
          )})
          {" | "}
          <Link
            href={`/Messaging/${encodeURIComponent(application.candidateEmail)}`}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-gray-600 hover:text-gray-800">
              {application.candidateEmail}
            </span>
          </Link>
        </h2>
        <p className="text-md text-gray-500">
          {"UID: " + application.candidateUID}
        </p>
        <p className="text-md text-gray-500">
          {"Year " + application.candidateYear} | {application.candidateMajor}
        </p>
      </div>
    </div>
  );


  // TODO Make this into a reusable component that takes an list of object that define the options
  // Each object would possibly have
  //- label: string (The text to display)
  //- onClick: function (The function to call on click)
  //- className: string (Optional additional classes for the button, e.g., 'text-red-600')
  // Actions menu is also called in PositionsCard.js
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
              <div className="my-1 border-t border-gray-100"></div>

              {(jobApplicationStatus.toLowerCase() === "applied" ||
                jobApplicationStatus.toLowerCase() === "interview" ||
                jobApplicationStatus.toLowerCase() === "pending_offer" ||
                jobApplicationStatus.toLowerCase() === "accepted_offer" ||
                jobApplicationStatus.toLowerCase() === "hired") && (
                <li>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleOpenUpdateModal("REJECTED", "Reject Application");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Reject Application
                  </button>
                </li>
              )}
              {jobApplicationStatus.toLowerCase() === "applied" && (
                <li>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleOpenUpdateModal(
                        "INTERVIEW",
                        "Select for Interview"
                      );
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Select for Interview
                  </button>
                </li>
              )}
              {(jobApplicationStatus.toLowerCase() === "applied" ||
                jobApplicationStatus.toLowerCase() === "interview") && (
                <li>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleOfferPosition();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Offer Position
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
            <EmployerHeader />
            <div className="text-right">
              <ActionsMenu />
            </div>
          </div>

          <div className="my-5 border-t border-gray-200"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-500">Resume</p>
                <DocumentIcon />
              </div>
              <a
                href={`${backendURL}${resume.resumeURL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {resume.name}
              </a>
            </div>
            {application.coverLetterURL && (
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-500">Cover Letter</p>
                <DocumentIcon />
              </div>
              <a
                href={`${backendURL}${application.coverLetterURL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {application.coverLetterName || 'View Cover Letter'}
              </a>
            </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">
                Recent Course Grade
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {application.candidateGrade || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Previous TA Experience For This Course
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {application.wasPriorEmployeeForThisCourse ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Previously TA&apos;d Courses
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {application.priorEmploymentHistory || "None"}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="w-2/3 mt-6">
              <ApplicationTracker currentStep={jobApplicationStatus}/>
            </div>
            <span
              className={`px-4 py-2 text-md font-bold rounded-full ${statusClasses}`}
            >
              {jobApplicationStatus?.replaceAll("_", " ")}
            </span>
          </div>
        </div>
      </div>

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

      {/* confirmation model to confirm that an employer/admin wants to offer a position to a candidate who has already taken another position's offer */}
      <ConfirmationModal
        isOpen={isConfirmingOffer}
        onClose={() => setIsConfirmingOffer(false)}
        onConfirm={() => {
          setIsConfirmingOffer(false);
          // If confirmed, open the original comment modal for the offer
          handleOpenUpdateModal("PENDING_OFFER", "Offer Position");
        }}
        title="Confirm Offer"
        isConfirming={isProcessingUpdate}
      >
        <p>
          Candidate <strong>{application.candidateFName} {application.candidateLName}</strong> has already accepted another position for this semester.
        </p>
        <p className="mt-2">
          Are you sure you want to proceed with making them an offer?
        </p>
      </ConfirmationModal>
    </>
  );
}
