// app/component/UserProfileForm.js
'use client';
import React from 'react'; 
import { useForm, useWatch } from "react-hook-form";

/**
 * Renders a modal form for creating or updating a student's profile
 * 
 * Includes editable information - name, pronouns, major, courses taken,
 * if the sutdent is/has been employed to be a CA, and if so what courses
 * 
 * @param {Object|null} user - The user object to edit
 * @param {Object|null} mode - The mode of the form - either "edit" or "create"
 * @param {Function} onClose - Callback function to be called when the form is submitted or closed 
 * @returns A modal dialog with the course history form
 */
export default function UserProfileForm({ user, mode, onClose }) {
    const isEditMode = mode === "edit";

     // Initialize react-hook-form with default values either from the user (edit) or empty for new form
    const { register, handleSubmit, control, formState: { isSubmitting }} = useForm({
        defaultValues: isEditMode
        ? { ...user, isEmployee: user.isEmployee ? 'yes' : 'no' }
        : {
            name: '', pronouns: '', major: '', courses: [], graduateStatus: '',
            isEmployee: 'no', coursesWorked: []
        },
    });

    /**
     * Placeholder course data
     * This **will** be replaced by a call to the courses database to get information
     */
    const courseDB = [
        { id: 'SWEN-261', name: 'Introduction to Software Engineering' },
        { id: 'CSCI-261', name: 'Data Structures and Algorithms' },
        { id: 'ISTE-120', name: 'Computational Problem Solving' },
        { id: 'MATH-181', name: 'Calculus I' },
    ];

    // Watch the 'isEmployee' radio button to conditionally show related fields dynamically
    const isEmployeeValue = useWatch({ control, name: 'isEmployee' });

    /**
     * Handles form submission asynchronously.
     * This is where integration with a backend API or database would occur.
     * On successful submission, calls onClose to close the modal.
     * @param {Object} data - Form data collected from the user inputs.
     */
    const onSubmit = async (data) => {
        try {
            // TODO: Add call to database

            // Prepare data for saving, convert 'isEmployee' string to boolean and reset coursesWorked if needed
            const finalData = {
                ...data,
                isEmployee: data.isEmployee === 'yes',
                coursesWorked: data.isEmployee === 'yes' ? data.coursesWorked : [],
            };

            if (isEditMode) {
                console.log('Saving updated profile to database:', { id: user.id, ...finalData });
            } else {
                console.log('Saving new profile to database:', finalData);
            }

            // close modal after submission
            if (onClose) onClose();

        } catch (error) {
            console.error("Failed to submit form:", error);
        }
    };

    // Styling classes
    const formLabel = "block text-sm font-medium text-slate-700 mb-1";
    const formLegend = "text-base font-semibold text-slate-800";
    const inputField = "w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4'>
            <div className='bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col'>
                <div className='p-6 sm:p-8 flex-grow overflow-y-auto'>
                    <div className="flex justify-between items-start mb-2">
                        <h2 className='text-2xl font-bold text-slate-900'>{isEditMode ? 'Edit Student Profile' : 'Complete Your Profile'}</h2>
                    </div>
                    <p className='text-slate-500 mb-8'>{mode === 'edit' ? 'Update your details below' : 'Please fill in the required information'}</p>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-6'>
                        {/* Personal Information Section */}
                        <fieldset className='space-y-4'>
                            <div>
                                <label htmlFor='fullName' className={formLabel}>Full Name</label>
                                <input id='fullName' type='text' placeholder='Enter Full Name' {...register('fullName', { required: true })} className={inputField} />
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <div>
                                    <label htmlFor='pronouns' className={formLabel}>Pronouns</label>
                                    <input id='pronouns' type='text' placeholder='Enter Pronouns' {...register('pronouns', { required: true })} className={inputField} />
                                </div>
                                <div>
                                    <label htmlFor='major' className={formLabel}>Major</label>
                                    <input id='major' type='text' placeholder='Enter Major' {...register('major', { required: true })} className={inputField} />
                                </div>
                            </div>
                        </fieldset>

                        {/* Academic Information Section */}
                        <fieldset>
                            <legend className={formLegend}>Courses Taken</legend>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">{courseDB.map(course => (<label key={course.id} className="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" {...register('courses')} value={course.id} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-slate-700">{`${course.id}: ${course.name}`}</span></label>))}
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend className={formLegend}>Graduation Status</legend>
                            <div className="flex flex-col sm:flex-row sm:space-x-8 mt-2">{['Undergraduate', 'Graduate'].map(status => (<label key={status} className="flex items-center space-x-3 cursor-pointer">
                                <input type="radio" {...register('gradStatus', { required: true })} value={status} className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-slate-700">{status}</span></label>))}
                            </div>
                        </fieldset>

                        {/* Employment Section */}
                        <fieldset>
                            <legend className={formLegend}>Are you currently or have you ever been a Course Assistant?</legend>
                            <div className="flex flex-col sm:flex-row sm:space-x-8 mt-2">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="radio" {...register('isEmployee')} value="yes" className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-slate-700">Yes</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="radio" {...register('isEmployee')} value="no" className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-slate-700">No</span>
                                </label>
                            </div>
                        </fieldset>

                        {/* Conditional Courses Worked For Section */}
                        {isEmployeeValue === 'yes' && (
                            <fieldset>
                                <legend className={formLegend}>Courses Worked For</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">{courseDB.map(course => (<label key={`worked-${course.id}`} className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" {...register('coursesWorked')} value={course.id} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="text-slate-700">{`${course.id}: ${course.name}`}</span></label>))}</div>
                            </fieldset>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 ease-in-out disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center">
                                Save Profile
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
// app/component/UserProfileForm.js
'use client';
import React, { useState, useEffect } from 'react'; 
import { useForm, useWatch } from "react-hook-form";

/**
 * Renders a modal form for creating or updating a student's profile
 * 
 * Includes editable information - name, pronouns, major, courses taken,
 * if the sutdent is/has been employed to be a CA, and if so what courses
 * 
 * @param {Object|null} user - The user object to edit
 * @param {Object|null} mode - The mode of the form - either "edit" or "create"
 * @param {Function} onClose - Callback function to be called when the form is submitted or closed 
 * @returns A modal dialog with the course history form
 */
export default function UserProfileForm({ user, mode, onClose }) {
    const isEditMode = mode === "edit";

     // Initialize react-hook-form with default values either from the user (edit) or empty for new form
    const { register, handleSubmit, control, formState: { isSubmitting }} = useForm({
        defaultValues: isEditMode
        ? { ...user, isEmployee: user.isEmployee ? 'yes' : 'no' }
        : {
            name: '', pronouns: '', major: '', courses: [], graduateStatus: '',
            isEmployee: 'no', coursesWorked: []
        },
    });

    /**
     * Placeholder course data
     * This **will** be replaced by a call to the courses database to get information
     */
    const courseDB = [
        { id: 'SWEN-261', name: 'Introduction to Software Engineering' },
        { id: 'CSCI-261', name: 'Data Structures and Algorithms' },
        { id: 'ISTE-120', name: 'Computational Problem Solving' },
        { id: 'MATH-181', name: 'Calculus I' },
    ];

    // Watch the 'isEmployee' radio button to conditionally show related fields dynamically
    const isEmployeeValue = useWatch({ control, name: 'isEmployee' });

    /**
     * Handles form submission asynchronously.
     * This is where integration with a backend API or database would occur.
     * On successful submission, calls onClose to close the modal.
     * @param {Object} data - Form data collected from the user inputs.
     */
    const onSubmit = async (data) => {
        try {
            // TODO: Add call to database

            // Prepare data for saving, convert 'isEmployee' string to boolean and reset coursesWorked if needed
            const finalData = {
                ...data,
                isEmployee: data.isEmployee === 'yes',
                coursesWorked: data.isEmployee === 'yes' ? data.coursesWorked : [],
            };

            if (isEditMode) {
                console.log('Saving updated profile to database:', { id: user.id, ...finalData });
            } else {
                console.log('Saving new profile to database:', finalData);
            }

            // close modal after submission
            if (onClose) onClose();

        } catch (error) {
            console.error("Failed to submit form:", error);
        }
    };

    // Styling classes
    const formLabel = "block text-sm font-medium text-slate-700 mb-1";
    const formLegend = "text-base font-semibold text-slate-800";
    const inputField = "w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4'>
            <div className='bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col'>
                <div className='p-6 sm:p-8 flex-grow overflow-y-auto'>
                    <div className="flex justify-between items-start mb-2">
                        <h2 className='text-2xl font-bold text-slate-900'>{isEditMode ? 'Edit Student Profile' : 'Complete Your Profile'}</h2>
                    </div>
                    <p className='text-slate-500 mb-8'>{mode === 'edit' ? 'Update your details below' : 'Please fill in the required information'}</p>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-6'>
                        {/* Personal Information Section */}
                        <fieldset className='space-y-4'>
                            <div>
                                <label htmlFor='fullName' className={formLabel}>Full Name</label>
                                <input id='fullName' type='text' placeholder='Enter Full Name' {...register('fullName', { required: true })} className={inputField} />
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <div>
                                    <label htmlFor='pronouns' className={formLabel}>Pronouns</label>
                                    <input id='pronouns' type='text' placeholder='Enter Pronouns' {...register('pronouns', { required: true })} className={inputField} />
                                </div>
                                <div>
                                    <label htmlFor='major' className={formLabel}>Major</label>
                                    <input id='major' type='text' placeholder='Enter Major' {...register('major', { required: true })} className={inputField} />
                                </div>
                            </div>
                        </fieldset>

                        {/* Academic Information Section */}
                        <fieldset>
                            <legend className={formLegend}>Courses Taken</legend>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">{courseDB.map(course => (<label key={course.id} className="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" {...register('courses')} value={course.id} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-slate-700">{`${course.id}: ${course.name}`}</span></label>))}
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend className={formLegend}>Graduation Status</legend>
                            <div className="flex flex-col sm:flex-row sm:space-x-8 mt-2">{['Undergraduate', 'Graduate'].map(status => (<label key={status} className="flex items-center space-x-3 cursor-pointer">
                                <input type="radio" {...register('gradStatus', { required: true })} value={status} className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-slate-700">{status}</span></label>))}
                            </div>
                        </fieldset>

                        {/* Employment Section */}
                        <fieldset>
                            <legend className={formLegend}>Are you currently or have you ever been a Course Assistant?</legend>
                            <div className="flex flex-col sm:flex-row sm:space-x-8 mt-2">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="radio" {...register('isEmployee')} value="yes" className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-slate-700">Yes</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="radio" {...register('isEmployee')} value="no" className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-slate-700">No</span>
                                </label>
                            </div>
                        </fieldset>

                        {/* Conditional Courses Worked For Section */}
                        {isEmployeeValue === 'yes' && (
                            <fieldset>
                                <legend className={formLegend}>Courses Worked For</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">{courseDB.map(course => (<label key={`worked-${course.id}`} className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" {...register('coursesWorked')} value={course.id} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="text-slate-700">{`${course.id}: ${course.name}`}</span></label>))}</div>
                            </fieldset>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 ease-in-out disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center">
                                Save Profile
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}