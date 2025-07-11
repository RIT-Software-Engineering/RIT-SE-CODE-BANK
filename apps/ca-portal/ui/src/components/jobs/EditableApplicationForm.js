'use client';

import { useForm } from 'react-hook-form';
import { applyForJobPosition, applyForJobPositionWithNewResume } from '../../services/db-apis'; 
import { letterToGradeValue } from '@/constants/gradeConstants';

// A display field for showing non-editable user info.
const DisplayField = ({ label, value }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <p className="mt-1 block w-full rounded-md border-gray-200 bg-gray-100 shadow-sm p-2 text-gray-600">
        {value || 'Not Provided'}
      </p>
    </div>
);

export default function EditableApplicationForm({ user, position, onClose, onApplySuccess }) {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Prepare the initial form values from the user's current profile.
  const initialValues = {
    name: user?.name || '',
    email: user?.email || '',
    major: user?.candidate?.major || '',
    year: user?.candidate?.year || '',
    grade: user?.candidate?.courseHistory?.find(ch => ch.courseCode === position.courseCode)?.grade || '',
    resumeURL: user?.candidate?.resumeURL || '',
  };
  
  // Initialize the form hook.
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initialValues,
  });

  // Define the submission handler.
  const onSubmit = async (formData) => {
    try {
      let newApplication;
      const hasNewResume = formData.resumeFile && formData.resumeFile.length > 0;

      if (hasNewResume) {
        const data = new FormData();
        data.append('candidateUID', user.uid);
        data.append('jobPositionId', position.id);
        data.append('resumeFile', formData.resumeFile[0]);
        const { resumeFile, ...restOfFormData } = formData;
        data.append('jobPositionApplicationFormData', JSON.stringify(restOfFormData));
        newApplication = await applyForJobPositionWithNewResume(data);
      } else {
        const applicationDetails = {
          candidateUID: user.uid,
          jobPositionId: position.id,
          jobPositionApplicationFormData: JSON.stringify(formData),
        };
        newApplication = await applyForJobPosition(applicationDetails);
      }
      onApplySuccess();
      onClose();
    } catch (err)      {
      console.error("Submission failed:", err);
      alert(err.message || 'An unknown error occurred during submission.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Apply for {position.course.name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <DisplayField label="Full Name" value={initialValues.name} />
            <DisplayField label="Email" value={initialValues.email} />
            <DisplayField label="Major" value={initialValues.major} />
            <DisplayField label="Year" value={initialValues.year} />
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Grade for {position.course.courseCode}
                {!position.gradeRequirement && <span className="text-gray-500 text-xs ml-1">(Optional)</span>}
              </label>
              <input 
                type="text" 
                {...register("grade", { 
                  required: position.gradeRequirement ? "Your grade for this course is required" : false,
                  validate: (enteredGrade) => {
                    if (!position.gradeRequirement || !enteredGrade) return true;
                    const enteredValue = letterToGradeValue[enteredGrade.toUpperCase()];
                    const requiredValue = letterToGradeValue[position.gradeRequirement];
                    if (!enteredValue) return "Please enter a valid grade (e.g., A, B+, C-).";
                    if (enteredValue < requiredValue) return `A grade of ${position.gradeRequirement} or higher is required.`;
                    return true;
                  }
                })} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" 
              />
              {errors.grade && <p className="text-red-500 text-sm mt-1">{errors.grade.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {initialValues.resumeURL ? "Upload New Resume (Optional)" : "Upload Resume (PDF Required)"}
              </label>
              <input 
                type="file"
                {...register("resumeFile", {
                  validate: (fileList) => (fileList.length > 0 || !!initialValues.resumeURL) || "A PDF resume is required to apply."
                })}
                accept=".pdf"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-rit-orange file:text-white hover:file:bg-orange-600"
              />
              {errors.resumeFile && <p className="text-red-500 text-sm mt-1">{errors.resumeFile.message}</p>}

              {initialValues.resumeURL && (
                  <p className="text-xs text-gray-500 mt-1">
                      Current resume on file: 
                      <a 
                        href={`${backendURL}${initialValues.resumeURL}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline ml-1"
                      >
                        View Current Resume
                      </a>
                  </p>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="bg-rit-orange text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 disabled:bg-gray-400">
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}