// src/components/profile/UserProfileForm.js
'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  createCandidateProfile,
  createEmployerProfile,
  updateCandidateProfile,
  updateEmployerProfile,
} from '@/services/db-apis';
import { useNotification } from '@/contexts/NotificationContext';
import { Box, Typography, Button, IconButton, CircularProgress } from '@mui/material';
import { Close } from '@mui/icons-material';

// Import the step components
import Step1CandidateAndEmployee from './CandidateAndEmployee/form-steps/Step1';
import Step2CandidateAndEmployee from './CandidateAndEmployee/form-steps/Step2';
import Step3CandidateAndEmployee from './CandidateAndEmployee/form-steps/Step3';
import Step1EmployerAndAdmin from './EmployerAndAdmin/form-steps/Step1';


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

  // Create initial default values to prevent undefined errors
  const getInitialDefaultValues = () => {
    const baseDefaults = {
      uid: user?.uid || '',
      fname: user?.fname || '',
      lname: user?.lname || '',
      email: user?.email || '',
      pronouns: user?.pronouns || '',
    };

    if (isCandidateOrEmployee) {
      return {
        ...baseDefaults,
        major: user?.candidate?.major || '',
        yearLevel: user?.candidate?.year?.toString() || '',
        graduateStatus: user?.candidate?.graduateStatus || '',
      };
    } else {
      return {
        ...baseDefaults,
        department: user?.employer?.department || '',
      };
    }
  };

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
    // Provide initial default values to prevent undefined errors
    defaultValues: getInitialDefaultValues(),
  });

  const watchedStatus = watch('graduateStatus');

  // This useEffect updates the form when user data changes
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
        defaultValues.yearLevel = user.candidate?.year?.toString() || '';
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

  // Update form values for courses
  useEffect(() => {
    setValue('coursesTaken', coursesTaken);
    setValue('coursesWorked', coursesWorked);
  }, [setValue, coursesTaken, coursesWorked]);

  // Handle next step with custom validation
  const nextStep = async () => {
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
    if (!isValid) return;

    if (currentStep === 1 && mode === 'create') {
      const { uid, email } = getValues();
      const uidExists = allUsers.some((u) => u.uid.toString() === uid.trim());
      if (uidExists) {
        showNotification(
          'This User ID is already taken. Please choose another one.',
          'error'
        );
        return;
      }
      const emailExists = allUsers.some(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (emailExists) {
        showNotification(
          'This email is already in use by another account.',
          'error'
        );
        return;
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
        email: data.email,
        pronouns: data.pronouns,
        role: user.role,
        year,
        major: data.major,
        graduateStatus: data.graduateStatus,
        wasPriorEmployee: coursesWorked.length > 0,
        courseHistory: Array.from(courseHistoryMap.values()),
      };

      let updatedProfile;
      if (isEditMode) {
        updatedProfile = await updateCandidateProfile(finalData);
      } else {
        finalData.password = user.password;
        updatedProfile = await createCandidateProfile(finalData);
      }

      if (onUpdateSuccess) onUpdateSuccess(updatedProfile);
      showNotification('Profile saved!', 'success');
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to submit form:', error);
      showNotification(`Error: Could not save profile. ${error.message}`, 'error');
    }
  };

  const onSubmitEmployer = async (data) => {
    try {
      const finalData = {
        uid: parseInt(data.uid, 10),
        fname: data.fname,
        lname: data.lname,
        username: user.username,
        email: data.email,
        pronouns: data.pronouns,
        department: data.department,
        role: user.role,
      };
      let updatedProfile;
      if (isEditMode) {
        updatedProfile = await updateEmployerProfile(finalData);
      } else {
        finalData.password = user.password;
        updatedProfile = await createEmployerProfile(finalData);
      }

      if (onUpdateSuccess) onUpdateSuccess(updatedProfile);
      showNotification('Profile saved!', 'success');
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to submit employer form:', error);
      showNotification(`Error: Could not save profile. ${error.message}`, 'error');
    }
  };

  const onSubmit = isCandidateOrEmployee ? onSubmitCandidate : onSubmitEmployer;

  const renderContent = () => {
    if (isEditMode && editingSection && isCandidateOrEmployee) {
      switch (editingSection) {
        case 'info':
          return (
            <Step1CandidateAndEmployee
              register={register}
              errors={errors}
              watchedStatus={watchedStatus}
              watch={watch}
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
          return <Typography>Invalid section selected.</Typography>;
      }
    }
    if (isCandidateOrEmployee) {
      switch (currentStep) {
        case 1:
          return (
            <Step1CandidateAndEmployee
              register={register}
              errors={errors}
              watchedStatus={watchedStatus}
              watch={watch}
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
    return <Step1EmployerAndAdmin register={register} errors={errors} />;
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, flexGrow: 1, overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h1" component="h2">
          {isEditMode ? `Edit Profile` : 'Complete Your Profile'}
        </Typography>
        <IconButton onClick={onClose} aria-label="close">
          <Close />
        </IconButton>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {isCandidateOrEmployee && !editingSection
          ? `Please complete all steps. Step ${currentStep} of ${totalSteps}.`
          : 'Update your details below.'}
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ mb: 4 }}>
            {renderContent()}
        </Box>

        <Box sx={{ pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isCandidateOrEmployee && !editingSection && currentStep > 1 ? (
            <Button
              variant="outlined"
              onClick={prevStep}
            >
              Previous
            </Button>
          ) : (
            <div /> // Placeholder for alignment
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isCandidateOrEmployee &&
              !editingSection &&
              currentStep < totalSteps && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={nextStep}
                >
                  Next
                </Button>
              )}
            {(!isCandidateOrEmployee ||
              (isCandidateOrEmployee &&
                !editingSection &&
                currentStep === totalSteps) ||
              editingSection) && (
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isSubmitting ? 'Saving...' : 'Save Profile'}
                </Button>
            )}
          </Box>
        </Box>
      </form>
    </Box>
  );
}
