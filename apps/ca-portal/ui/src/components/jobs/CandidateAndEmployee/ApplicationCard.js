'use client';

import { useState } from "react";
import ViewableApplicationForm from "../ViewableApplicationForm";
import { formatDate, formatTime, getStatusClasses } from "@/utils/applicationUtils";
import { CalendarIcon, ClockIcon, LocationIcon } from "@/assets/icons";

export default function CandidateApplicationCard({ currentUser, application }) {
  const [isViewingApplication, setIsViewingApplication] = useState(false);
  
  const { jobPosition, jobApplicationStatus } = application;
  const statusClasses = getStatusClasses(jobApplicationStatus);

  const CandidateAndEmployeeHeader = () => (
    <div className="flex-1 min-w-0">
      <h2 className='text-2xl font-bold text-gray-800'>{jobPosition.course.name}</h2>
      <p className='text-md text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block mt-1'>{jobPosition.id}</p>
      <div className='flex items-center text-gray-600 mt-2'>
        <CalendarIcon />
        <span>{formatDate(jobPosition.startDate)} - {formatDate(jobPosition.endDate)}</span>
      </div>
    </div>
  );

  const CandidateAndEmployeeActions = () => (
    <>
      {jobApplicationStatus.toLowerCase() === 'applied' && (
        <button className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700">Withdraw</button>
      )}
      <button 
        onClick={() => setIsViewingApplication(true)}
        className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
      >
        View Application Submission
      </button>
    </>
  );

  return (
    <>
      <div className="w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-[1.01] mb-8">
        <div className="p-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <CandidateAndEmployeeHeader />
            <div className='text-right'>
              <span className={`px-4 py-2 text-md font-bold rounded-full ${statusClasses}`}>
                  {jobApplicationStatus}
              </span>
            </div>
          </div>

          <div className='mt-4 pt-4 border-t border-gray-200'>
            <p className='text-gray-700 mb-4'>{jobPosition.course.description}</p>
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

          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <CandidateAndEmployeeActions />
          </div>
        </div>
      </div>

      {isViewingApplication && (
        <ViewableApplicationForm
          user={currentUser}
          position={jobPosition}
          application={application}
          onClose={() => setIsViewingApplication(false)}
          onApplySuccess={() => {}} // No action needed on success when just viewing
          viewOnly={true}
        />
      )}
    </>
  );
}