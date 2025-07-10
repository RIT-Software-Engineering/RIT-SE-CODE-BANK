'use client';

import Link from "next/link";

// --- Reusable Icon Components ---
const ClockIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-1.5 text-gray-500 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>
);
const LocationIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-1.5 text-gray-500 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'/><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'/></svg>
);
const CalendarIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-1.5 text-gray-500 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'/></svg>
);
const ResumeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);


// --- Reusable Helper Functions ---
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "selected": case "hired": return "bg-green-100 text-green-800";
    case "on hold": return "bg-yellow-100 text-yellow-800";
    case "rejected": return "bg-red-100 text-red-800";
    case "withdrawn": return "bg-gray-500 text-white";
    case "applied": default: return "bg-blue-100 text-blue-800";
  }
};

/**
 * A reusable card component to display an application from either an
 * Employer's or a Candidate's perspective.
 * @param {object} application - The application object from the database.
 * @param {string} viewAs - The perspective to render from ('EMPLOYER' or 'CANDIDATE').
 */
export default function ApplicationCard({ application, viewAs }) {
  // Destructure all possible data points for clarity.
  const { 
    candidate, 
    jobPosition, 
    jobApplicationStatus, 
    gradeInCourse, 
    previouslyTAedCourses 
  } = application;

  const statusClasses = getStatusClasses(jobApplicationStatus);

  // --- Employer-Specific View Components ---
  const EmployerHeader = () => {
    // Guard against missing data
    if (!candidate?.user) return null;
    return (
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-rit-light-gray flex items-center justify-center">
            <span className="text-2xl font-bold text-black">{candidate.user.name.charAt(0)}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-800 truncate">
            {candidate.user.name} | <Link href={`/Users/${application.candidateUID}/Messaging`}><span className="text-rit-gray hover:text-gray-600">{candidate.user.email}</span></Link>
          </h2>
          <p className="text-md text-gray-500">
            {"Year " + candidate.year} | {candidate.major}
          </p>
        </div>
      </div>
    );
  };

  const EmployerActions = () => (
    <>
      <button className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700">Reject</button>
      <button className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">Select</button>
    </>
  );

  // --- Candidate-Specific View Components ---
  const CandidateHeader = () => {
    // Guard against missing data
    if (!jobPosition?.course) return null;
    return (
      <div className="flex-1 min-w-0">
        <h2 className='text-2xl font-bold text-gray-800'>{jobPosition.course.name}</h2>
        <p className='text-md text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block mt-1'>{jobPosition.id}</p>
        <div className='flex items-center text-gray-600 mt-2'>
            <CalendarIcon />
            <span>{formatDate(jobPosition.startDate)} - {formatDate(jobPosition.endDate)}</span>
        </div>
      </div>
    );
  };

  const CandidateActions = () => (
    <>
        {jobApplicationStatus.toLowerCase() === 'applied' && (
            <button className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700">Withdraw</button>
        )}
        <button className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">View Appplication Submission</button>
    </>
  );

  // --- Main Component Render ---
  return (
    <div className="w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-[1.01] mb-8">
      <div className="p-6">
        {/* --- Header Section --- */}
        <div className="flex justify-between items-start flex-wrap gap-4">
            {viewAs === 'EMPLOYER' ? <EmployerHeader /> : <CandidateHeader />}
            <div className='text-right'>
                <span className={`px-4 py-2 text-md font-bold rounded-full ${statusClasses}`}>
                    {jobApplicationStatus}
                </span>
            </div>
        </div>

        {/* --- Details/Body Section --- */}
        
        {/* Employer's View of Details */}
        {viewAs === 'EMPLOYER' && candidate && (
          <>
            <div className="my-5 border-t border-gray-200"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-center space-x-2">
                <ResumeIcon />
                <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 font-medium">View Resume</a>
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
          </>
        )}
        
        {/* Candidate's View of Details */}
        {viewAs === 'CANDIDATE' && jobPosition && (
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
        )}

        {/* --- Action Buttons Footer --- */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
            {viewAs === 'EMPLOYER' ? <EmployerActions /> : <CandidateActions />}
        </div>
      </div>
    </div>
  );
}