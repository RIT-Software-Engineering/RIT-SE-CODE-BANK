// components/users/AdminEditUserForm.js
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    upsertCandidateProfile,
    upsertEmployerProfile,
    terminateEmployee,
} from '@/services/db-apis';
import { useNotification } from '@/contexts/NotificationContext';
import EditCandidateEmployeeData from './EditCandidateEmployeeData';
import EditEmployerAdminData from './EditEmployerAdminData';
import Button from '@mui/material/Button';
import ConfirmationModal from '@/components/common/models/ConfirmationModal';

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
    } = useForm({
            defaultValues: {
            uid: user.uid || '',
            fullName: user.name || '',
            email: user.email || '',
            pronouns: user.pronouns || '',
            major: user.candidate?.major || '',
            graduateStatus: user.candidate?.graduateStatus || '',
            yearLevel: user.candidate?.year || '',
            department: user.employer?.department || '',
        },
    });

    useEffect(() => {
        reset({
            uid: user.uid || '',
            fullName: user.name || '',
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
            name: user.name,
            email: user.email,
            pronouns: user.pronouns,
            department: user?.employer?.department || 'Unknown',
            role: 'ADMIN',
            };

            await upsertEmployerProfile(updatedEmployer);
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
            await terminateEmployee(user.uid);
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
                    uid: data.uid,
                    name: data.fullName,
                    email: data.email,
                    pronouns: data.pronouns,
                    role: userRole,
                    major: data.major,
                    graduateStatus: data.graduateStatus,
                    year: data.graduateStatus === 'GRADUATE' ? 6 : parseInt(data.yearLevel, 10),
                };
                await upsertCandidateProfile(finalData);
            } else {
                const finalData = {
                    uid: data.uid,
                    name: data.fullName,
                    email: data.email,
                    pronouns: data.pronouns,
                    department: data.department,
                    role: userRole,
                };
                await upsertEmployerProfile(finalData);
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
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {isCandidateOrEmployee ? (
                <EditCandidateEmployeeData user={user} register={register} errors={errors} />
            ) : (
                <>
                <EditEmployerAdminData user={user} register={register} errors={errors} />

                {user.role === 'EMPLOYER' && (
                    <Button
                    variant="contained"
                    color="warning"
                    onClick={() => setShowConfirm(true)}
                    className="!mt-2"
                    >
                    Promote to Admin
                    </Button>
                )}
                </>
            )}

            {userRole === 'EMPLOYEE' &&
                user?.candidate?.employees?.[0]?.employeeStatus !== 'TERMINATED' && (
                <Button
                    variant="contained"
                    color="error"
                    onClick={() => setShowTerminateConfirm(true)}
                    className="!mt-2"
                >
                    Terminate Employee
                </Button>
                )}

            <div className="pt-4 flex justify-end gap-4">
                <button
                type="button"
                onClick={onClose}
                className="bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded hover:bg-slate-300"
                >
                Cancel
                </button>
                <button
                type="submit"
                disabled={isSubmitting}
                className="bg-rit-orange text-white font-bold px-6 py-2 rounded hover:bg-orange-600"
                >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
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