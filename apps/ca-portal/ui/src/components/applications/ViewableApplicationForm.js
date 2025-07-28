'use client';

import DisplayField from "../common/fields/DisplayField";


export default function ViewableApplicationForm({position, application, onClose }) {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // The definitive resume URL now comes directly from the included resume object.
  const submittedResume = application.resume;

  const displayValues = {
    name: application.candidateName || '',
    email: application.candidateEmail || '',
    major: application.candidateMajor || '',
    year: application.candidateYear || '',
    grade: application.candidateGrade || '',
    wasPriorEmployeeForThisCourse: application.wasPriorEmployeeForThisCourse || false,
    wasPriorEmployeeForOtherCourses: application.wasPriorEmployeeForOtherCourses || false,
    priorEmploymentHistory: application.priorEmploymentHistory || [],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Viewing Application for {position.course.name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>

        <div className="space-y-4">
          <DisplayField label="Full Name" value={displayValues.name} />
          <DisplayField label="Email" value={displayValues.email} />
          <DisplayField label="Major" value={displayValues.major} />
          <DisplayField label="Year" value={displayValues.year} />
          <DisplayField label={`Grade for ${position.courseCode}`} value={displayValues.grade} />
          <DisplayField label={`Prior Employment For ${position.courseCode}`} value={displayValues.wasPriorEmployeeForThisCourse ? "Yes" : "No"} />
          <DisplayField label="Prior Employment For Any Other Courses" value={displayValues.wasPriorEmployeeForOtherCourses ? "Yes" : "No"} />
          <DisplayField label="Prior Employment History" value={displayValues.priorEmploymentHistory}  />
          
          {/* Use the reliable resume URL from the application's relation */}
          {submittedResume?.resumeURL && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Submitted Resume</label>
              <p className="text-sm text-gray-600 mt-1">
                <a
                  href={`${backendURL}${submittedResume.resumeURL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {submittedResume.name || 'View Submitted Resume'}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}