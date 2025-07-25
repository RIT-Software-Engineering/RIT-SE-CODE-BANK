"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { getStatusClasses } from "@/utils/applicationUtils";
import { ResumeIcon, EllipsisVerticalIcon } from "@/assets/icons";
import ViewableApplicationForm from "../ViewableApplicationForm";
import ViewCommentForm from "../../comments/ViewableCommentForm";
import EditableCommentForm from "@/components/comments/EditableCommentForm";
import { updateCandidateApplicationStatus } from "@/services/db-apis";
import { useNotification } from "@/contexts/NotificationContext";
import ApplicationProgressTracker from "@/components/profile/ApplicationProgressTracker";

export default function ApplicationCard({
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

  const { id, jobApplicationStatus, resume } = application;

  const statusClasses = getStatusClasses(jobApplicationStatus);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleOpenUpdateModal = (status, title) => {
    setModalState({ isOpen: true, status, title });
  };

  const handleCloseUpdateModal = () => {
    setModalState({ isOpen: false, status: null, title: "" });
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

  const EmployerHeader = () => (
    <div className="flex items-center space-x-4 flex-1 min-w-0">
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-2xl font-bold text-black">
            {application.candidateName.charAt(0)}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold text-gray-800 truncate">
          {application.candidateName}
          {" | "}
          <Link
            href={`/Users/${application.candidateUID}/Messaging`}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-gray-600 hover:text-gray-800">
              {application.candidateEmail}
            </span>
          </Link>
        </h2>
        <p className="text-md text-gray-500">
          {"Year " + application.candidateYear} | {application.candidateMajor}
        </p>
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

    // NOTE: You'll want to add your real onClick logic to these buttons
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={handleMenuToggle}
          className="p-2 rounded-full hover:bg-gray-100"
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
                jobApplicationStatus.toLowerCase() === "PENDING_OFFER" ||
                jobApplicationStatus.toLowerCase() === "Interview") && (
                <li>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleOpenUpdateModal("REJECTED", "Reject Application");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Reject
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
                      handleOpenUpdateModal(
                        "PENDING_OFFER",
                        "Offer Position"
                      );
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
                <ResumeIcon />
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
                Previous CA Experience For This Course
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {application.wasPriorEmployeeForThisCourse ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Previously CA&apos;d Courses
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {application.priorEmploymentHistory || "None"}
              </p>
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
