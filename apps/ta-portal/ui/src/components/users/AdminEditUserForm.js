// components/users/AdminEditUserForm.js
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    updateCandidateProfile,
    updateEmployerProfile,
    terminateEmployee,
} from '@/services/db-apis';
import { useNotification } from '@/contexts/NotificationContext';
import EditCandidateEmployeeData from './EditCandidateEmployeeData';
import EditEmployerAdminData from './EditEmployerAdminData';
import { Box, Button, CircularProgress } from '@mui/material';
import ConfirmationModal from '@/components/common/models/ConfirmationModal';

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
export default function AdminEditUserForm({ user, onClose, onUpdateSuccess }) {
    const { showNotification } = useNotification();
    const userRole = user?.role?.toUpperCase();
    const isCandidateOrEmployee = userRole === 'CANDIDATE' || userRole === 'EMPLOYEE';
    const [showConfirm, setShowConfirm] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);
    const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
    const [isTerminating, setIsTerminating] = useState(false);


    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
    } = useForm({
        defaultValues: {
            uid: user.uid || '',
            fname: user.fname || '',
            lname: user.lname || '',
            email: user.email || '',
            pronouns: user.pronouns || '',
            major: user.candidate?.major || '',
            graduateStatus: user.candidate?.graduateStatus || '',
            yearLevel: user.candidate?.year || '',
            department: user.employer?.department || '',
        },
    });

    const watchedStatus = watch('graduateStatus');

    useEffect(() => {
        reset({
            uid: user.uid || '',
            fname: user.fname || '',
            lname: user.lname || '',
            email: user.email || '',
            pronouns: user.pronouns || '',
            major: user.candidate?.major || '',
            graduateStatus: user.candidate?.graduateStatus || '',
            yearLevel: user.candidate?.year || '',
            department: user.employer?.department || '',
        });
    }, [user, reset]);

    const handlePromoteToAdmin = async () => {
        setIsPromoting(true);
        try {
            const updatedEmployer = {
                uid: user.uid,
                fname: user.fname,
                lname: user.lname,
                username: user.username,
                email: user.email,
                pronouns: user.pronouns,
                department: user?.employer?.department || 'Unknown',
                role: 'ADMIN',
            };

            await updateEmployerProfile(updatedEmployer);
            showNotification('User promoted to Admin successfully!', 'success');

            if (onUpdateSuccess) onUpdateSuccess();
            if (onClose) onClose();

            setShowConfirm(false);
        } catch (error) {
            console.error('Promotion failed:', error);
            showNotification('Error: Could not promote user.', 'error');
        } finally {
            setIsPromoting(false);
        }
    };

    const handleTerminateEmployee = async () => {
        setIsTerminating(true);
        try {
            await terminateEmployee(user.username);
            showNotification('Employee terminated successfully.', 'success');
            if (onUpdateSuccess) onUpdateSuccess();
            if (onClose) onClose();
        } catch (error) {
            console.error('Termination failed:', error);
            showNotification('Error: Could not terminate employee.', 'error');
        } finally {
            setIsTerminating(false);
            setShowTerminateConfirm(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            if (isCandidateOrEmployee) {
                const finalData = {
                    uid: parseInt(data.uid, 10),
                    fname: data.fname,
                    lname: data.lname,
                    username: user.username,
                    email: data.email,
                    pronouns: data.pronouns,
                    role: userRole,
                    major: data.major,
                    graduateStatus: data.graduateStatus,
                    year: data.graduateStatus === 'GRADUATE' ? 6 : parseInt(data.yearLevel, 10),
                };
                await updateCandidateProfile(finalData);
            } else {
                const finalData = {
                    uid: parseInt(data.uid, 10),
                    fname: data.fname,
                    lname: data.lname,
                    username: user.username,
                    email: data.email,
                    pronouns: data.pronouns,
                    department: data.department,
                    role: userRole,
                };
                await updateEmployerProfile(finalData);
            }

            showNotification('Profile updated successfully!', 'success');
            if (onUpdateSuccess) onUpdateSuccess();
            if (onClose) onClose();
        } catch (error) {
            console.error('Failed to update user:', error);
            showNotification('Error: Could not update profile.', 'error');
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {isCandidateOrEmployee ? (
                        <EditCandidateEmployeeData
                            register={register}
                            errors={errors}
                            watchedStatus={watchedStatus}
                            watch={watch}
                        />
                    ) : (
                        <>
                            <EditEmployerAdminData user={user} register={register} errors={errors} />

                            {user.role === 'EMPLOYER' && (
                                <Button
                                    variant="contained"
                                    color="warning"
                                    onClick={() => setShowConfirm(true)}
                                    sx={{ mt: 2 }}
                                >
                                    Promote to Admin
                                </Button>
                            )}
                        </>
                    )}

                    {userRole === 'EMPLOYEE' &&
                        user?.candidate?.employee?.[0]?.employeeStatus !== 'TERMINATED' && (
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => setShowTerminateConfirm(true)}
                                sx={{ mt: 2 }}
                            >
                                Terminate Employee
                            </Button>
                        )}

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

            {/* Promote to Admin Modal */}
            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handlePromoteToAdmin}
                title="Confirm Promotion"
                isConfirming={isPromoting}
            >
                Are you sure you want to promote this employer to an admin?
            </ConfirmationModal>

            {/* Terminate Employee Modal */}
            <ConfirmationModal
                isOpen={showTerminateConfirm}
                onClose={() => setShowTerminateConfirm(false)}
                onConfirm={handleTerminateEmployee}
                title="Confirm Termination"
                isConfirming={isTerminating}
            >
                Are you sure you want to terminate this employee? This action cannot be undone.
            </ConfirmationModal>
        </>
    );
}