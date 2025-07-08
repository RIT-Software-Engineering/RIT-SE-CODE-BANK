import Link from "next/link";
export default function CandidateApplicationCard(application) {
  application = application.application
  const canidate = application.candidate;
  console.log("Canadate is ")
  console.log(canidate)
  


  const getStatusClasses = (status) => {
    switch (status.toLowerCase()) {
      case "selected":
        return "bg-green-100 text-green-800";
      case "on hold":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "withdrawn":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  console.log("Application is: ")
  console.log(application)
  const statusClasses = getStatusClasses(application.jobApplicationStatus);

  return (
    <div className="w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-[1.02] mb-8 hover:cursor-pointer">
      <div className="p-6">
        {/* --- Card Header: candidate Info --- */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {/* A simple avatar placeholder */}
            <div className="w-16 h-16 rounded-full bg-rit-light-gray flex items-center justify-center">
              <span className="text-2xl font-bold text-black">
                {canidate.user.name.charAt(0)}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-800 truncate">
              {canidate.user.name} | <Link href={`Users/${application.candidateUID}/Messaging`}><span className="text-rit-gray hover:text-gray-600">{canidate.user.email}</span></Link>
            </h2>
            <p className="text-md text-gray-500">
              {"Year " + canidate.year} | {canidate.major}
            </p>
          </div>
          {/* --- Status Badge --- */}
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${statusClasses}`}
          >
            {application.jobApplicationStatus}
          </span>
        </div>

        {/* --- Divider --- */}
        <div className="my-5 border-t border-gray-200"></div>

        {/* --- Application Details --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex items-center space-x-2">
            {/* Simple icon for the resume */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <a
              href={canidate.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              View Resume
            </a>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              Recent Course Grade
            </p>
            <p className="text-lg font-semibold text-gray-800">
              {application.gradeInCourse}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              Previous CA Experience
            </p>
            <p className="text-lg font-semibold text-gray-800">
              {canidate.wasPriorEmployee ? "Yes" : "No"}
            </p>
            {canidate.wasPriorEmployee && (
              <button className="px-4 py-2 bg-rit-gray text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-colors">
                View Canidate Feedback
              </button>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              Previously TA'd Courses
            </p>
            <p className="text-lg font-semibold text-gray-800">
              {application.previouslyTAedCourses.join(", ") || "None"}
            </p>
          </div>
        </div>

        {/* --- Action Buttons --- */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
          <button className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition-colors">
            Reject
          </button>
          <button className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors">
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
