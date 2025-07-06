// app/component/UserProfileForm.js
'use client';
import React, { useEffect } from 'react'; 
import { useForm, useWatch } from "react-hook-form";
import { upsertCandidateProfile, upsertEmployerProfile } from '@/services/api';

/**
 * Renders a modal form for creating or updating a candidate's profile
 * 
 * Includes editable information - name, pronouns, major, courses taken,
 * if the sutdent is/has been employed to be a CA, and if so what courses
 * 
 * @param {Object|null} user - The user object to edit
 * @param {Object|null} mode - The mode of the form - either "edit" or "create"
 * @param {Function} onClose - Callback function to be called when the form is submitted or closed 
 * @param {Object} courseOptions - The list of courses to be presented to the user
 * @returns A modal dialog with the course history form
 */
export default function UserProfileForm({ user, mode, onClose, courseOptions }) {
    const isEditMode = mode === "edit";
    const userRole = user?.role?.toUpperCase().trim();
    const isCandidateOrEmployee = userRole === "CANDIDATE" || userRole === "EMPLOYEE";

     // Initialize react-hook-form with default values either from the user (edit) or empty for new form
    const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm();
    useEffect(() => {
        if (user) {
            const defaultValues = isCandidateOrEmployee
            ? { // Defaults for CANDIDATE or EMPLOYEE
                fullName: user.name || '',
                pronouns: user.pronouns || '',
                major: user.candidate?.major || '',
                gradeLevel: user.candidate?.year || '',
                courses: user.courseHistory?.map(ch => ch.courseCode) || [],
                graduateStatus: user.candidate?.graduateStatus || '',
                isEmployee: user.candidate?.wasPriorEmployee ? 'yes' : 'no',
                coursesWorked: user.courseHistory?.filter(ch => ch.wasPriorEmployee).map(ch => ch.courseCode) || []
            }
            : { // Defaults for EMPLOYER or ADMIN
                fullName: user.name || '',
                pronouns: user.pronouns || '',
                department: user.staff?.department || ''
            };
            reset(defaultValues);
        }
    }, [user, reset, isCandidateOrEmployee]); 

    /**
     * List of available courses to display to the user
     */
    const courseDB = courseOptions;

    // Watch the 'isEmployee' radio button to conditionally show related fields dynamically
    const isEmployeeValue = useWatch({ control, name: 'isEmployee' });

    // Used to conditionally render the "Year Level" select field only for undergraduates
    const graduateStatus = useWatch({ control, name: 'graduateStatus' });

    /**
     * Handles form submission asynchronously and sends CANDIDATE/EMPLOYEE profile data to backend.
     * Converts year level to 6 if the user is a graduate
     * On successful submission, calls onClose to close the modal.
     * @param {Object} data - Form data collected from the user inputs.
     */
    const onSubmitCandidate = async (data) => {
    try {
        // Determine year correctly:
        let year;
        if (data.graduateStatus === "GRADUATE") {
            year = 6;
        } else if (data.gradeLevel) {
            year = parseInt(data.gradeLevel, 10);
            if (isNaN(year)) {
                throw new Error("Invalid year level selected. Please choose a valid year.");
            }
        } else {
            throw new Error("Year level is required for undergraduate candidates.");
        }

        const finalData = {
            uid: user.uid,
            name: data.fullName,
            email: user.email,
            pronouns: data.pronouns,
            year: year,
            major: data.major,
            graduateStatus: data.graduateStatus,
            wasPriorEmployee: data.isEmployee === 'yes',
            courseHistory: data.courses.map(courseCode => ({
                courseCode: courseCode,
                grade: 'A',
                wasPriorEmployee: data.coursesWorked?.includes(courseCode) || false,
            })),
        };
        await upsertCandidateProfile(finalData);

        alert("Profile saved!");
        if (onClose) onClose();
    } catch (error) {
        console.error("Failed to submit form:", error);
        alert(`Error: Could not save profile. ${error.message}`);
    }
};

    /**
     * Handles form submission for EMPLOYER/ADMIN profiles.
     * @param {Object} data - Form data collected from the user inputs.
     */
    const onSubmitStaff = async (data) => {
        try {
            const finalData = {
                uid: user.uid,
                name: data.fullName,
                email: user.email,
                pronouns: data.pronouns,
                department: data.department,
                role: user.role,
            };
            await upsertEmployerProfile(finalData);

            alert("Profile saved!");
            if (onClose) onClose();
        } catch (error) {
            console.error("Failed to submit staff form:", error);
            alert(`Error: Could not save profile. ${error.message}`);
        }
    };

    const onSubmit = isCandidateOrEmployee ? onSubmitCandidate : onSubmitStaff;

    // Reusable Helper for Input Fields
    const InputField = ({ id, label, placeholder, registerProps, error }) => (
        <div>
            <label htmlFor={id} className={formLabel}>{label} <span className="text-red-500">*</span></label>
            <input id={id} type='text' placeholder={placeholder} {...registerProps} className={`${inputField} ${error ? 'border-red-500' : 'border-slate-300'}`} />
            {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
        </div>
    );

    // Styling classes
    const formLabel = "block text-sm font-medium text-slate-700 mb-1";
    const formLegend = "text-base font-semibold text-slate-800";
    const inputField = "w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4'>
            <div className='bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col'>
                <div className='p-6 sm:p-8 flex-grow overflow-y-auto'>
                    <div className="flex justify-between items-start mb-2">
                        <h2 className='text-2xl font-bold text-slate-900'>
                            {(isEditMode ? `Edit ${userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase()} Profile` : 'Complete Your Profile')}
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-3xl leading-none">&times;</button>
                    </div>
                    <p className='text-slate-500 mb-8'>
                        {isCandidateOrEmployee && !isEditMode
                            ? 'Please fill in all required information.'
                            : 'Update your details below.'
                        }
                    </p>
                    <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-6'>
                        <fieldset className='space-y-4'>
                            <InputField 
                                id="fullName" 
                                label="Full Name" 
                                placeholder="Enter Full Name" 
                                registerProps={register('fullName', { required: 'Full name is required.' })} 
                                error={errors.fullName} 
                            />
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <InputField 
                                    id="pronouns" 
                                    label="Pronouns" 
                                    placeholder="Enter Pronouns" 
                                    registerProps={register('pronouns', { required: 'Pronouns are required.' })} 
                                    error={errors.pronouns} 
                                />
                                {isCandidateOrEmployee ? (
                                    <InputField 
                                        id="major" 
                                        label="Major" 
                                        placeholder="Enter Major" 
                                        registerProps={register('major', { required: 'Major is required.' })} 
                                        error={errors.major} 
                                    />
                                ) : (
                                    <InputField 
                                        id="department" 
                                        label="Department" 
                                        placeholder="Enter Department" 
                                        registerProps={register('department', { required: 'Department is required.' })} 
                                        error={errors.department} 
                                    />
                                )}
                            </div>
                        </fieldset>

                        {/* Candidate/Employee specific fields */}
                        {isCandidateOrEmployee && (
                            <>
                                <fieldset className='space-y-4'>
                                    <div>
                                        <label className={formLabel}>Graduate Status <span className="text-red-500">*</span></label>
                                        <div className="flex flex-col sm:flex-row sm:space-x-8 mt-2">
                                            {['UNDERGRADUATE', 'GRADUATE'].map(status => (
                                                <label key={status} className="flex items-center space-x-3 cursor-pointer">
                                                    <input type="radio" {...register('graduateStatus', { required: "Please select a status." })} value={status} className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                    <span className="text-slate-700">{status}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {errors.graduateStatus && <p className="text-red-500 text-xs mt-1">{errors.graduateStatus.message}</p>}
                                    </div>
                                    {graduateStatus === 'UNDERGRADUATE' && (
                                        <div>
                                            <label htmlFor="gradeLevel" className={formLabel}>Year Level <span className="text-red-500">*</span></label>
                                            <select 
                                                id="gradeLevel" 
                                                {...register('gradeLevel', { required: 'Please select your year level.' })} 
                                                className={`${inputField} ${errors.gradeLevel ? 'border-red-500' : 'border-slate-300'}`}
                                            >
                                                <option value="" disabled>Select Year...</option>
                                                {[2, 3, 4, 5].map(level => <option key={level} value={level}>{level}</option>)}
                                            </select>
                                            {errors.gradeLevel && <p className="text-red-500 text-xs mt-1">{errors.gradeLevel.message}</p>}
                                        </div>
                                    )}
                                </fieldset>
                                <fieldset>
                                    <legend className={formLegend}>Courses Taken <span className="text-red-500">*</span></legend>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                                        {courseDB.map(course => (
                                            <label key={course.courseCode} className="flex items-center space-x-3 cursor-pointer">
                                                <input type="checkbox" {...register('courses', { required: "Select at least one course." })} value={course.courseCode} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-slate-700">{`${course.courseCode}: ${course.name}`}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.courses && <p className="text-red-500 text-xs mt-1">{errors.courses.message}</p>}
                                </fieldset>
                                <fieldset>
                                    <legend className={formLegend}>Are you currently or have you ever been a Course Assistant? <span className="text-red-500">*</span></legend>
                                    <div className="flex flex-col sm:flex-row sm:space-x-8 mt-2">
                                        <label className="flex items-center space-x-3 cursor-pointer"><input type="radio" {...register('isEmployee')} value="yes" className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="text-slate-700">Yes</span></label>
                                        <label className="flex items-center space-x-3 cursor-pointer"><input type="radio" {...register('isEmployee')} value="no" className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="text-slate-700">No</span></label>
                                    </div>
                                </fieldset>
                                {isEmployeeValue === 'yes' && (
                                    <fieldset>
                                        <legend className={formLegend}>Courses Worked For <span className="text-red-500">*</span></legend>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                                            {courseDB.map(course => (
                                                <label key={`worked-${course.courseCode}`} className="flex items-center space-x-3 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        {...register('coursesWorked', { 
                                                            validate: value => (isEmployeeValue === 'yes' && (!value || value.length === 0)) ? "Select at least one course you've worked for." : true
                                                        })} 
                                                        value={course.courseCode} 
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                                    />
                                                    <span className="text-slate-700">{`${course.courseCode}: ${course.name}`}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {errors.coursesWorked && <p className="text-red-500 text-xs mt-1">{errors.coursesWorked.message}</p>}
                                    </fieldset>
                                )}
                            </>
                        )}

                        <div className="pt-2">
                            <button type="submit" disabled={isSubmitting} className="w-full bg-rit-orange text-white font-bold py-3 px-4 rounded-lg hover:bg-rit-orange focus:outline-none focus:ring-4 focus:ring-rit-light-gray transition-all duration-300 ease-in-out disabled:bg-rit-dark-gray disabled:cursor-not-allowed flex items-center justify-center">
                                {isSubmitting ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}