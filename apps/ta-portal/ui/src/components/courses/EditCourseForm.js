// components/users/AdminEditUserForm.js
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    upsertCourse,
} from '@/services/db-apis';
import { useNotification } from '@/contexts/NotificationContext';
import { Box, Button, CircularProgress } from '@mui/material';
import ConfirmationModal from '@/components/common/models/ConfirmationModal';
import InputField from '../common/fields/InputField';

/**
 * AdminEditUserForm component for admins to edit user data.
 *
 * Displays different edit forms based on the user's role (candidate, employee, employer, or admin).
 * Allows promoting an employer to an admin and terminating an employee's employment.
 * Submits the form via API calls and triggers parent callbacks.
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - The user data to be edited
 * @param {Function} props.onClose - Callback to close the form dialog
 * @param {Function} props.onUpdateSuccess - Callback fired after successful user data update
 */
export default function EditCourseForm({ course, onClose, onUpdateSuccess }) {
    const { showNotification } = useNotification();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);


    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
    } = useForm({
        defaultValues: {
            courseCode: course.courseCode || '',
            name: course.name || '',
            description: course.description || ''
        },
    });

    useEffect(() => {
        reset({
            courseCode: course.courseCode || '',
            name: course.name || '',
            description: course.description || ''
        });
    }, [course, reset]);

    const handleDeleteCourse = async () => {
        setIsDeleting(true);
        try {
            //await terminateEmployee(user.username);
            showNotification('Course deleted successfully.', 'success');
            if (onUpdateSuccess) onUpdateSuccess();
            if (onClose) onClose();
        } catch (error) {
            console.error('Deletion failed:', error);
            showNotification('Error: Could not delete course.', 'error');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            const finaleData = {
                courseCode: data.courseCode,
                name: data.name,
                description: data.description
            }
            await upsertCourse(finaleData)

            showNotification('Course updated successfully!', 'success');
            if (onUpdateSuccess) onUpdateSuccess();
            if (onClose) onClose();
        } catch (error) {
            console.error('Failed to update course:', error);
            showNotification('Error: Could not update course.', 'error');
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    
                    <Box component="fieldset" sx={{ border: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* --- EDITABLE FIELDS --- */}
                        
                        <InputField
                            id="courseCode"
                            label="Course Code"
                            placeholder="Enter Course Code"
                            registerProps={register("courseCode", { required: "A course code is required."})}
                            required={true}
                            error={errors.courseCode}
                            sx={(theme) => ({
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor:
                                        theme.palette.mode === "dark"
                                            ? ""
                                            : "white",
                                }
                            })}
                        />
                        
                        <InputField
                            id="courseName"
                            label="Course Name"
                            placeholder="Enter Course Name"
                            registerProps={register("name", { required: "A course name is required."})}
                            required={true}
                            error={errors.courseName}
                            sx={(theme) => ({
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor:
                                        theme.palette.mode === "dark"
                                            ? ""
                                            : "white",
                                }
                            })}
                        />

                        <InputField
                            id="courseDescription"
                            label="Course Description"
                            placeholder="Enter Course Description"
                            registerProps={register("description", { required: "A description is required."})}
                            required={true}
                            error={errors.courseDescription}
                            multiline
                            rows={6}
                            sx={(theme) => ({
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor:
                                        theme.palette.mode === "dark"
                                            ? ""
                                            : "white",
                                }
                            })}
                        />
                    </Box>

                    <Button
                                variant="contained"
                                color="error"
                                onClick={() => setShowDeleteConfirm(true)}
                                sx={{ mt: 2 }}
                            >
                                Delete Course
                            </Button>

                    <Box sx={{ pt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            sx={(theme) => ({
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? ""
                                        : "white",

                                "&:hover": {
                                    backgroundColor:
                                        theme.palette.mode === "dark"
                                            ? ""
                                            : "#f5f5f5"
                                }
                            })}


                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Box>
                </Box>
            </form>

            {/* Terminate Employee Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteCourse}
                title="Confirm Deletion"
                isConfirming={isDeleting}
            >
                Are you sure you want to delete this course? This action cannot be undone.
            </ConfirmationModal>
        </>
    );
}