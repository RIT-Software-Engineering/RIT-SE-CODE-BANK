'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  upsertCandidateProfile,
  upsertEmployerProfile,
} from '@/services/db-apis';
import { useNotification } from '@/contexts/NotificationContext';

// Import the step components
import Step1CandidateAndEmployee from './CandidateAndEmployee/form-steps/Step1';
import Step2CandidateAndEmployee from './CandidateAndEmployee/form-steps/Step2';
import Step3CandidateAndEmployee from './CandidateAndEmployee/form-steps/Step3';
import Step1EmployerAndAdmin from './EmployerAndAdmin/form-steps/Step1';


/**
 * Form component for the UserProfileModal that allows users to create or edit their profile.
 * @param {object} props - The component props.
 * @param {object} props.user - The user's profile data object.
 * @param {string} props.mode - The mode of the form (edit or create).
 * @param {function} props.onClose - Function to call to close the modal.
 * @param {object[]} props.courseOptions - The list of available courses.
 * @param {function} props.onUpdateSuccess - Callback for successful profile updates.
 * @param {string} props.editingSection - The section being edited (mainly for candidate/employee).
 * @param {object[]} props.allUsers - The list of all existing users for uniqueness checks.
 */
export default function UserProfileForm({
  user,
  mode,
  onClose,
  courseOptions,
  onUpdateSuccess,
  editingSection,
  allUsers = [],
}) {
  const { showNotification } = useNotification();
  const isEditMode = mode === 'edit';
  const userRole = user?.role?.toUpperCase().trim();
  const isCandidateOrEmployee =
    userRole === 'CANDIDATE' || userRole === 'EMPLOYEE';

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [coursesTaken, setCoursesTaken] = useState([]);
  const [coursesWorked, setCoursesWorked] = useState([]);
  const [takenSearch, setTakenSearch] = useState('');
  const [workedSearch, setWorkedSearch] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    trigger,
    getValues,
  } = useForm({
    defaultValues: {
      uid: user?.uid || '',
      fname: user?.fname || '',
      lname: user?.lname || '',
      email: user?.email || '',
      pronouns: user?.pronouns || '',
      major: user?.candidate?.major || '',
      yearLevel: user?.candidate?.year || '',
      graduateStatus: user?.candidate?.graduateStatus || '',
      department: user?.employer?.department || '',
    },
  });

  const watchedStatus = watch('graduateStatus');

  // Set default values
  useEffect(() => {
    if (user) {
      const defaultValues = {
        uid: user.uid || '',
        fname: user.fname || '',
        lname: user.lname || '',
        email: user.email || '',
        pronouns: user.pronouns || '',
      };
      if (isCandidateOrEmployee) {
        defaultValues.major = user.candidate?.major || '';
        defaultValues.yearLevel = user.candidate?.year || '';
        defaultValues.graduateStatus = user.candidate?.graduateStatus || '';
        const initialTaken =
          user.candidate?.courseHistory
            ?.filter((ch) => ch.hasTaken)
            .map((ch) => ({
              courseCode: ch.course?.courseCode || ch.courseCode,
              grade: ch.grade,
            })) || [];
        setCoursesTaken(initialTaken);
        const initialWorked =
          user.candidate?.courseHistory
            ?.filter((ch) => ch.wasPriorEmployee)
            .map((ch) => ch.course?.courseCode || ch.courseCode) || [];
        setCoursesWorked(initialWorked);
      } else {
        defaultValues.department = user.employer?.department || '';
      }
      reset(defaultValues);
    }
  }, [user, isCandidateOrEmployee, reset]);

  // Update form values
  useEffect(() => {
    setValue('coursesTaken', coursesTaken);
    setValue('coursesWorked', coursesWorked);
  }, [setValue, coursesTaken, coursesWorked]);

  // Handle next step with custom validation
  const nextStep = async () => {
    // First, trigger standard validation for required fields
    const fieldsToValidate =
      currentStep === 1
        ? [
            'uid',
            'fname',
            'lname',
            'email',
            'pronouns',
            'major',
            'graduateStatus',
            ...(watchedStatus === 'UNDERGRADUATE' ? ['yearLevel'] : []),
          ]
        : [];

    const isValid = await trigger(fieldsToValidate);
    if (!isValid) return; // Stop if basic validation fails

    // Second, perform custom validation for uniqueness and type, but only in create mode for step 1
    if (currentStep === 1 && mode === 'create') {
      const { uid, email } = getValues(); // Get current form values

      // Check if UID is unique
      const uidExists = allUsers.some((u) => u.uid.toString() === uid.trim());
      if (uidExists) {
        showNotification(
          'This User ID is already taken. Please choose another one.',
          'error'
        );
        return; // Stop navigation
      }

      // Check if email is unique
      const emailExists = allUsers.some(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (emailExists) {
        showNotification(
          'This email is already in use by another account.',
          'error'
        );
        return; // Stop navigation
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Course history handlers
  const addCourseTaken = (course) => {
    if (!coursesTaken.find((c) => c.courseCode === course.courseCode))
      setCoursesTaken([
        ...coursesTaken,
        { courseCode: course.courseCode, grade: null },
      ]);
    setTakenSearch('');
  };
  const removeCourseTaken = (courseCode) =>
    setCoursesTaken(coursesTaken.filter((c) => c.courseCode !== courseCode));
  const updateCourseGrade = (courseCode, grade) =>
    setCoursesTaken(
      coursesTaken.map((c) =>
        c.courseCode === courseCode ? { ...c, grade } : c
      )
    );
  const addCourseWorked = (course) => {
    if (!coursesWorked.includes(course.courseCode))
      setCoursesWorked([...coursesWorked, course.courseCode]);
    setWorkedSearch('');
  };
  const removeCourseWorked = (courseCode) =>
    setCoursesWorked(coursesWorked.filter((c) => c !== courseCode));

  // Handle form submission based on user role
  const onSubmitCandidate = async (data) => {
    try {
      let year;
      if (data.graduateStatus === 'GRADUATE') year = 6;
      else if (data.yearLevel) year = parseInt(data.yearLevel, 10);
      else
        throw new Error('Year level is required for undergraduate candidates.');
      if (isNaN(year)) throw new Error('Invalid year level selected.');

      const courseHistoryMap = new Map();
      coursesTaken.forEach((course) =>
        courseHistoryMap.set(course.courseCode, {
          courseCode: course.courseCode,
          hasTaken: true,
          grade: course.grade,
          wasPriorEmployee: false,
        })
      );
      coursesWorked.forEach((courseCode) => {
        if (courseHistoryMap.has(courseCode))
          courseHistoryMap.get(courseCode).wasPriorEmployee = true;
        else
          courseHistoryMap.set(courseCode, {
            courseCode: courseCode,
            hasTaken: false,
            grade: null,
            wasPriorEmployee: true,
          });
      });

      const finalData = {
        uid: parseInt(data.uid, 10),
        fname: data.fname,
        lname: data.lname,
        username: user.username,
        password: user.password,
        email: data.email,
        pronouns: data.pronouns,
        role: user.role,
        year,
        major: data.major,
        graduateStatus: data.graduateStatus,
        wasPriorEmployee: coursesWorked.length > 0,
        courseHistory: Array.from(courseHistoryMap.values()),
      };

      const updatedProfile = await upsertCandidateProfile(finalData);
      if (onUpdateSuccess) onUpdateSuccess(updatedProfile);
      showNotification('Profile saved!', 'success');
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to submit form:', error);
      showNotification(
        `Error: Could not save profile. ${error.message}`,
        'error'
      );
    }
  };
  const onSubmitEmployer = async (data) => {
    try {
      const finalData = {
        uid: parseInt(data.uid, 10),
        fname: data.fname,
        lname: data.lname,
        username: user.username,
        password: user.password,
        email: data.email,
        pronouns: data.pronouns,
        department: data.department,
        role: user.role,
      };
      const updatedProfile = await upsertEmployerProfile(finalData);
      if (onUpdateSuccess) onUpdateSuccess(updatedProfile);
      showNotification('Profile saved!', 'success');
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to submit employer form:', error);
      showNotification(
        `Error: Could not save profile. ${error.message}`,
        'error'
      );
    }
  };

  // Set the onSubmit function based on user role
  const onSubmit = isCandidateOrEmployee ? onSubmitCandidate : onSubmitEmployer;

  // Render the form content based on the current step
  const renderContent = () => {
    // Candidate/employee edit forms
    if (isEditMode && editingSection && isCandidateOrEmployee) {
      switch (editingSection) {
        case 'info':
          return (
            <Step1CandidateAndEmployee
              user={user}
              register={register}
              errors={errors}
              watchedStatus={watchedStatus}
            />
          );
        case 'coursesTaken':
          return (
            <Step2CandidateAndEmployee
              coursesTaken={coursesTaken}
              takenSearch={takenSearch}
              setTakenSearch={setTakenSearch}
              courseOptions={courseOptions}
              addCourseTaken={addCourseTaken}
              updateCourseGrade={updateCourseGrade}
              removeCourseTaken={removeCourseTaken}
            />
          );
        case 'coursesWorked':
          return (
            <Step3CandidateAndEmployee
              coursesWorked={coursesWorked}
              workedSearch={workedSearch}
              setWorkedSearch={setWorkedSearch}
              courseOptions={courseOptions}
              addCourseWorked={addCourseWorked}
              removeCourseWorked={removeCourseWorked}
            />
          );
        default:
          return <p>Invalid section selected.</p>;
      }
    }
    // Candidate/Employee on-ramping form
    if (isCandidateOrEmployee) {
      switch (currentStep) {
        case 1:
          return (
            <Step1CandidateAndEmployee
              user={user}
              register={register}
              errors={errors}
              watchedStatus={watchedStatus}
            />
          );
        case 2:
          return (
            <Step2CandidateAndEmployee
              coursesTaken={coursesTaken}
              takenSearch={takenSearch}
              setTakenSearch={setTakenSearch}
              courseOptions={courseOptions}
              addCourseTaken={addCourseTaken}
              updateCourseGrade={updateCourseGrade}
              removeCourseTaken={removeCourseTaken}
            />
          );
        case 3:
          return (
            <Step3CandidateAndEmployee
              coursesWorked={coursesWorked}
              workedSearch={workedSearch}
              setWorkedSearch={setWorkedSearch}
              courseOptions={courseOptions}
              addCourseWorked={addCourseWorked}
              removeCourseWorked={removeCourseWorked}
            />
          );
        default:
          return null;
      }
    }
    // Employer/Admin form
    return (
      <Step1EmployerAndAdmin user={user} register={register} errors={errors} />
    );
  };

  return (
    <div className='p-6 sm:p-8 flex-grow overflow-y-auto'>
      <div className='flex justify-between items-start mb-2'>
        <h2 className='text-2xl font-bold text-slate-900'>
          {isEditMode ? `Edit Profile` : 'Complete Your Profile'}
        </h2>
        <button
          onClick={onClose}
          className='text-slate-400 hover:text-slate-700 text-3xl leading-none'
        >
          &times;
        </button>
      </div>
      <p className='text-slate-500 mb-6'>
        {isCandidateOrEmployee && !editingSection
          ? `Please complete all steps. Step ${currentStep} of ${totalSteps}.`
          : 'Update your details below.'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-6'>
        {renderContent()}

        <div className='pt-4 flex justify-between items-center'>
          {/* Previous button or a placeholder div to maintain space */}
          {isCandidateOrEmployee && !editingSection && currentStep > 1 ? (
            <button
              type='button'
              onClick={prevStep}
              className='bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 transition-colors'
            >
              Previous
            </button>
          ) : (
            <div /> // Empty div on the left to push content to the right
          )}

          <div className='flex items-center gap-4'>
            {/* Show Next button ONLY in multi-step mode */}
            {isCandidateOrEmployee &&
              !editingSection &&
              currentStep < totalSteps && (
                <button
                  type='button'
                  onClick={nextStep}
                  className='bg-rit-orange text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors'
                >
                  Next
                </button>
              )}

            {/* Show Save button if it's a single-step form, OR the last step of a multi-step form, OR we are editing a single section */}
            {(!isCandidateOrEmployee ||
              (isCandidateOrEmployee &&
                !editingSection &&
                currentStep === totalSteps) ||
              editingSection) && (
              <button
                type='submit'
                disabled={isSubmitting}
                className='bg-rit-orange text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-rit-light-gray transition-all duration-300 ease-in-out disabled:bg-rit-dark-gray disabled:cursor-not-allowed flex items-center justify-center'
              >
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
