// app/Users/page.js
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getAllUsers,
    getUserProfile,
} from '@/services/db-apis';
import UserGroup from '@/components/users/UserGroups';
import AdminEditUserForm from '@/components/users/AdminEditUserForm';

export default function Admin() {
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [groupedUsers, setGroupedUsers] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isAdministrator = currentUser?.role === 'ADMIN';

    const fetchData = useCallback(async () => {
        if (!isAdministrator) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const users = await getAllUsers();
            const enrichedUsers = await Promise.all(
                users.map((user) => getUserProfile(user.uid))
            );

            const groups = enrichedUsers.reduce((acc, user) => {
                const role = user.role || 'Unassigned';
                if (!acc[role]) acc[role] = [];
                acc[role].push(user);
                return acc;
            }, {});
            setGroupedUsers(groups);
        } catch (err) {
            console.error('Failed to retrieve users: ', err);
            setError('Failed to load user data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [isAdministrator]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEditClick = async (uid) => {
        const fullUserData = await getUserProfile(uid);
        setSelectedUser(fullUserData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
        setIsModalOpen(false);
    };

    const renderContent = () => {
        if (isLoading) {
        return (
            <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Users...</p>
            </div>
        );
        }

        if (error) {
        return (
            <div className="text-center py-10 px-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-lg font-semibold text-red-700">An Error Occurred</p>
            <p className="text-gray-600 mt-2">{error}</p>
            </div>
        );
        }

        const userRoles = Object.keys(groupedUsers);
        if (userRoles.length === 0) {
        return (
            <div className="text-center py-10 px-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-lg font-semibold text-gray-800">No Users Found</p>
            <p className="text-gray-500 mt-1">There are currently no users to display.</p>
            </div>
        );
        }

        const roleOrder = ['ADMIN', 'EMPLOYER', 'EMPLOYEE', 'CANDIDATE'];

        return roleOrder
        .filter((role) => groupedUsers[role])
        .map((role) => (
            <UserGroup
            key={role}
            title={role}
            users={groupedUsers[role]}
            onEditUser={handleEditClick}
            />
        ));
    };

    return (
        <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {isAdministrator ? (
            <div className="w-full max-w-4xl mx-auto">
                <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Edit Users</h1>
                <p className="mt-2 text-lg text-gray-500">Manage user roles and permissions.</p>
                </div>

                <div className="mt-8">{renderContent()}</div>

                {/* Admin Edit Modal */}
                {isModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <AdminEditUserForm
                        user={selectedUser}
                        onClose={handleCloseModal}
                        onUpdateSuccess={fetchData}
                    />
                    </div>
                </div>
                )}
            </div>
            ) : (
            <div className="text-center py-20">
                <h1 className="text-4xl text-center font-extrabold text-red-600 tracking-tight">
                Access Denied
                </h1>
                <p className="mt-4 text-lg text-gray-600">
                You do not have permission to view this page.
                </p>
            </div>
            )}
        </div>
        </div>
    );
}
