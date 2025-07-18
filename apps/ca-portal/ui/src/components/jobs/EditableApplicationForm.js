'use client';

import { useForm, useWatch } from 'react-hook-form';
import { applyForJobPosition, applyForJobPositionWithNewResume } from '../../services/db-apis';
import { letterToGradeValue } from '@/constants/gradeConstants';

// A display field for showing non-editable user info.
const DisplayField = ({ label, value }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <p className="mt-1 block w-full rounded-md border-gray-200 bg-gray-100 shadow-sm p-2 text-gray-600">
            {value || 'None'}
        </p>
    </div>
);

export default function EditableApplicationForm({ user, position, onClose, onApplySuccess }) {
    // Get the list of resumes and find the primary one to pre-select.
    const existingResumes = user?.candidate?.resumes || [];
    const primaryResume = existingResumes.find(r => r.isPrimary) || existingResumes[0];

    const initialValues = {
        name: user?.name || '',
        email: user?.email || '',
        major: user?.candidate?.major || '',
        year: user?.candidate?.year || '',
        grade: user?.candidate?.courseHistory?.find(ch => ch.courseCode === position.courseCode)?.grade || '',
        wasPriorEmployeeForThisCourse: user?.candidate?.courseHistory?.find(ch => ch.courseCode === position.courseCode)?.wasPriorEmployee || false,
        wasPriorEmployeeForAnyOtherJobPosition: user?.candidate?.courseHistory?.some(ch => ch.courseCode !== position.courseCode && ch.wasPriorEmployee) || false,
        priorEmployeeHistory: user?.candidate?.courseHistory?.filter(ch => ch.wasPriorEmployee)?.map(ch => ({
            courseCode: ch.courseCode
        })),
        // Set the default dropdown value to the primary resume's ID, or 'new' if none exist.
        resumeId: primaryResume ? String(primaryResume.id) : 'new',
        // This is for the new resume input field.
        resumeName: '',
    };

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: initialValues,
    });

    // Watch the resume dropdown's value to conditionally show the file input.
    const selectedResumeId = useWatch({ control, name: 'resumeId' });

    /**
     * Handles the form submission, routing to the correct API
     * based on whether a new resume is being uploaded.
     */
    const onSubmit = async (formData) => {
        try {
            const isUploadingNewResume = selectedResumeId === 'new';

            if (isUploadingNewResume) {
                if (!formData.resumeFile || formData.resumeFile.length === 0) {
                    alert("Please select a resume file to upload.");
                    return;
                }
                // Use FormData for requests that include a file.
                const data = new FormData();
                data.append('candidateUID', user.uid);
                data.append('jobPositionId', position.id);
                data.append('resumeFile', formData.resumeFile[0]);
                data.append('resumeName', formData.resumeName);
                const { resumeFile, resumeId, resumeName, ...restOfFormData } = formData;
                data.append('jobPositionApplicationFormData', JSON.stringify(restOfFormData));
                await applyForJobPositionWithNewResume(data);
            } else {
                // Use JSON for requests with an existing resume.
                const { resumeFile, resumeName, ...restOfFormData } = formData;
                const applicationDetails = {
                    candidateUID: user.uid,
                    jobPositionId: position.id,
                    resumeId: parseInt(formData.resumeId, 10), // Pass the selected resume's ID
                    jobPositionApplicationFormData: JSON.stringify(restOfFormData),
                };
                await applyForJobPosition(applicationDetails);
            }

            onApplySuccess();
            onClose();
        } catch (err) {
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
                    <DisplayField label={`Prior Employment For ${position.course.courseCode}`} value={initialValues.wasPriorEmployeeForThisCourse ? "Yes" : "No"} />
                    <DisplayField label="Prior Employment For Any Other Course" value={initialValues.wasPriorEmployeeForAnyOtherJobPosition ? "Yes" : "No"} />
                    <DisplayField label="Prior Employment History" value={initialValues.priorEmployeeHistory.map(item => item.courseCode).join(', ')}  />

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
                        <label htmlFor="resumeId" className="block text-sm font-medium text-gray-700">Resume</label>
                        <select
                            id="resumeId"
                            {...register("resumeId")}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                            {existingResumes.length > 0 &&
                                existingResumes.map(resume => (
                                    <option key={resume.id} value={String(resume.id)}>
                                        {`${resume.name}${resume.isPrimary ? ' (Primary)' : ''}`}
                                    </option>
                                ))
                            }
                            <option value="new">Upload a new resume...</option>
                        </select>
                    </div>

                    {selectedResumeId === 'new' && (
                        <>
                            <div>
                                <label htmlFor="resumeName" className="block text-sm font-medium text-gray-700">
                                    New Resume Name
                                </label>
                                <input
                                    type="text"
                                    id="resumeName"
                                    {...register("resumeName", {
                                        required: selectedResumeId === 'new' ? "Resume name is required." : false,
                                    })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                                    placeholder="e.g., General Purpose Resume"
                                />
                                {errors.resumeName && <p className="text-red-500 text-sm mt-1">{errors.resumeName.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Upload New Resume (PDF)
                                </label>
                                <input
                                    type="file"
                                    {...register("resumeFile", {
                                        validate: (fileList) => (selectedResumeId !== 'new' || fileList.length > 0) || "A PDF resume is required to apply."
                                    })}
                                    accept=".pdf"
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-rit-orange file:text-white hover:file:bg-orange-600"
                                />
                                {errors.resumeFile && <p className="text-red-500 text-sm mt-1">{errors.resumeFile.message}</p>}
                            </div>
                        </>
                    )}

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