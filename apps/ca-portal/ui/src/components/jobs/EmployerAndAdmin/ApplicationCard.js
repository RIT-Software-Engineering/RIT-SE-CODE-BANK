'use client';

import Link from "next/link";
import { getStatusClasses } from "@/utils/applicationUtils";
import { ResumeIcon } from "@/assets/icons";

export default function ApplicationCard({ application }) {
  const { 
    candidate, 
    jobApplicationStatus, 
    gradeInCourse, 
    previouslyTAedCourses,
    applicationData = JSON.parse(application.applicationData),
    resume,
  } = application;
  const statusClasses = getStatusClasses(jobApplicationStatus);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const EmployerHeader = () => (
    <div className="flex items-center space-x-4 flex-1 min-w-0">
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-2xl font-bold text-black">{candidate.user.name.charAt(0)}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold text-gray-800 truncate">
          {candidate.user.name} | <Link href={`/Users/${application.candidateUID}/Messaging`}><span className="text-gray-600 hover:text-gray-800">{candidate.user.email}</span></Link>
        </h2>
        <p className="text-md text-gray-500">
          {"Year " + candidate.year} | {candidate.major}
        </p>
      </div>
    </div>
  );

  const EmployerActions = () => (
    <>
      {(jobApplicationStatus.toLowerCase() === 'applied' || jobApplicationStatus.toLowerCase() === 'pending_acceptance' || jobApplicationStatus.toLowerCase() === 'selected')&& (
        <button className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700">Reject</button>
      )}
      {(jobApplicationStatus.toLowerCase() === 'applied')&& (
        <button className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">Select for Interview</button>
      )}
      {(jobApplicationStatus.toLowerCase() === 'applied' || jobApplicationStatus.toLowerCase() === 'selected')&& (
        <button className="px-4 py-2 bg-rit-orange text-white font-semibold rounded-lg shadow-md hover:bg-rit-dark-gray">Offer Position</button>
      )}
    </>
  );

  return (
    <div className="w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-[1.01] mb-8">
      <div className="p-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <EmployerHeader />
          <div className='text-right'>
            <span className={`px-4 py-2 text-md font-bold rounded-full ${statusClasses}`}>
              {jobApplicationStatus}
            </span>
          </div>
        </div>
        
        <div className="my-5 border-t border-gray-200"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-500">Resume</p>
              <ResumeIcon />
            </div>
            <a href={`${backendURL}${resume.resumeURL}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 font-medium">{resume.name}</a>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Recent Course Grade</p>
            <p className="text-lg font-semibold text-gray-800">{gradeInCourse || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Previous CA Experience</p>
            <p className="text-lg font-semibold text-gray-800">{candidate.wasPriorEmployee ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Previously TA&apos;d Courses</p>
            <p className="text-lg font-semibold text-gray-800">{previouslyTAedCourses?.join(", ") || "None"}</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
          <EmployerActions />
        </div>
      </div>
    </div>
  );
}