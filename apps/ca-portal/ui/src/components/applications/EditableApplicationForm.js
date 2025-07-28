'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { applyForJobPosition, applyForJobPositionWithNewResume } from '../../services/db-apis';
import { gradeEnumToStringValue, letterToGradeValue } from '@/constants/gradeConstants';
import { useNotification } from '@/contexts/NotificationContext';
import DisplayField from '../common/fields/DisplayField';
import GradeSelector from '../common/fields/GradeSelector';


export default function EditableApplicationForm({ user, position, onClose, onApplySuccess }) {
    // Get the list of resumes and find the primary one to pre-select.
    const { showNotification } = useNotification();
    const existingResumes = user?.candidate?.resumes || [];
    const primaryResume = existingResumes.find(r => r.isPrimary) || existingResumes[0];

    const initialValues = {
        name: user?.name || '',
        email: user?.email || '',
        major: user?.candidate?.major || '',
        year: user?.candidate?.year || '',
        grade: user?.candidate?.courseHistory?.find(ch => ch.courseCode === position.courseCode)?.grade || '',
        wasPriorEmployeeForThisCourse: user?.candidate?.courseHistory?.find(ch => ch.courseCode === position.courseCode)?.wasPriorEmployee || false,
        wasPriorEmployeeForOtherCourses: user?.candidate?.courseHistory?.some(ch => ch.courseCode !== position.courseCode && ch.wasPriorEmployee) || false,
        priorEmploymentHistory: user?.candidate?.courseHistory?.filter(ch => ch.wasPriorEmployee)?.map(ch => ({
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
            // Convert grade string to enum value
            console.log("Submission data:", formData);

            const isUploadingNewResume = selectedResumeId === 'new';

            if (isUploadingNewResume) {
                if (!formData.resumeFile || formData.resumeFile.length === 0) {
                    alert("Please select a resume file to upload.");
                    return;
                }
                const data = new FormData();
                data.append('candidateUID', user.uid);
                data.append('jobPositionId', position.id);
                data.append('resumeFile', formData.resumeFile[0]);
                data.append('resumeName', formData.resumeName);
                // Use the new formData object here
                const { resumeFile, resumeId, resumeName, ...restOfFormData } = formData;
                data.append('jobPositionApplicationFormData', JSON.stringify(restOfFormData));
                await applyForJobPositionWithNewResume(data);
            } else {
                // Use the new formData object here as well
                const { resumeFile, resumeName, ...restOfFormData } = formData;
                const applicationDetails = {
                    candidateUID: user.uid,
                    jobPositionId: position.id,
                    resumeId: parseInt(formData.resumeId, 10), // Pass the Interview resume's ID
                    jobPositionApplicationFormData: JSON.stringify(restOfFormData),
                };
                await applyForJobPosition(applicationDetails);
            }

            onApplySuccess();
            showNotification('Application submitted successfully.', 'success');
            onClose();
        } catch (err) {
            console.error("Submission failed:", err);
            showNotification(err.message || 'Failed to submit application.', 'error');
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
                    <DisplayField label="Prior Employment For Any Other Course" value={initialValues.wasPriorEmployeeForOtherCourses ? "Yes" : "No"} />
                    <DisplayField label="Prior Employment History" value={initialValues.priorEmploymentHistory.map(item => item.courseCode).join(', ')}  />

                    <Controller
                        name="grade"
                        control={control}
                        rules={{ // Validation rules moved here
                            required: position.gradeRequirement ? "Your grade for this course is required" : false,
                            validate: (enteredGradeEnum) => {
                                // enteredGradeEnum is passed as a Enum value (e.g., 'B_PLUS') whereas position.gradeRequirement is a string value (e.g., 'B+').
                                // Here we convert enteredGradeEnum to a string value for comparison.
                                if (!position.gradeRequirement || !enteredGradeEnum) return true;
                                
                                const enteredValue = letterToGradeValue[gradeEnumToStringValue[enteredGradeEnum]];
                                const requiredValue = letterToGradeValue[position.gradeRequirement];

                                if (enteredValue === undefined) return "Please enter a valid grade.";
                                if (enteredValue < requiredValue) {
                                    return `A grade of ${position.gradeRequirement} or higher is required.`;
                                }
                                return true;
                            }
                        }}
                        render={({ field, fieldState }) => (
                            <GradeSelector
                                {...field} // Passes onChange, onBlur, value
                                id="courseGrade"
                                label={`Grade for ${position.course.courseCode}`}
                                isOptional={!position.gradeRequirement}
                                error={fieldState.error}
                            />
                        )}
                    />

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