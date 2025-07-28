// components/users/AdminEditUserForm.js
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { upsertCandidateProfile, upsertEmployerProfile } from '@/services/db-apis';
import { useNotification } from '@/contexts/NotificationContext';

import EditCandidateEmployeeData from './EditCandidateEmployeeData';
import EditEmployerAdminData from './EditEmployerAdminData';

export default function AdminEditUserForm({ user, onClose, onUpdateSuccess }) {
    const { showNotification } = useNotification();
    const userRole = user?.role?.toUpperCase();
    const isCandidateOrEmployee = userRole === 'CANDIDATE' || userRole === 'EMPLOYEE';

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
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

    const watchedStatus = watch('graduateStatus');

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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {isCandidateOrEmployee ? (
            <EditCandidateEmployeeData user={user} register={register} errors={errors} watchedStatus={watchedStatus} />
        ) : (
            <EditEmployerAdminData user={user} register={register} errors={errors} />
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
    );
}
