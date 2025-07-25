// app/Users/page.js
"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
    getAllUsers, 
    getUserProfile, 
    upsertCandidateProfile, 
    upsertEmployerProfile 
} from "@/services/db-apis";
import UserGroup from "@/components/users/UserGroups";
import Step1CandidateAndEmployee from "@/components/profile/form-steps/CandidateAndEmployee/Step1";
import Step1EmployerAndAdmin from "@/components/profile/form-steps/EmployerAndAdmin/Step1";

export default function Admin() {
    const { currentUser, refreshUserProfile } = useAuth();
    const [ isLoading, setIsLoading ] = useState(true);
    const [ error, setError ] = useState(null);
    const [groupedUsers, setGroupedUsers] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Check if the current user is an administrator
    const isAdministrator = currentUser?.role === "ADMIN";

    const isCandidateOrEmployee = currentUser?.role === "CANDIDATE" || currentUser?.role === "EMPLOYEE";
    const isEmployerOrAdmin = currentUser?.role === "EMPLOYER" || currentUser?.role === "ADMIN";


    // Fetch all users if the current user is an admin
    const fetchData = useCallback(async () => {
        if (!isAdministrator) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const users = await getAllUsers();
            const groups = users.reduce((acc, user) => {
                const role = user.role || 'Unassigned';
                if (!acc[role]) acc[role] = [];
                acc[role].push(user);
                return acc;
            }, {});
            setGroupedUsers(groups);
        } catch (err) {
            console.error("Failed to retrieve users: ", err);
            setError("Failed to load user data. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [isAdministrator]);

    // Effect to run fetchData when the component mounts or the user's admin status changes
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEditClick = async (uid) => {
        const fullUserData = await getUserProfile(uid);
        setSelectedUser(fullUserData);
        setIsModalOpen(true);
    };

    const handleSaveChanges = async (updatedData) => {
        // Construct the payload based on the role, flattening the nested objects
        let payload = {
            uid: updatedData.uid,
            name: updatedData.name,
            email: updatedData.email,
            pronouns: updatedData.pronouns,
            role: updatedData.role,
            ...(updatedData.candidate && { ...updatedData.candidate }),
            ...(updatedData.employer && { ...updatedData.employer }),
        };

        if (payload.role === "EMPLOYER" || payload.role === "ADMIN") await upsertEmployerProfile(payload);
        if (payload.role === "CANDIDATE" || payload.role === "EMPLOYER") await upsertCandidateProfile(payload);
        await fetchData(); // Refresh data after save
    };

    // Renders content based on the state (loading, error, data, or no data)
    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center py-10"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-indigo-500 mx-auto"></div><p className="mt-4 text-gray-600">Loading Users...</p></div>;
        }
        if (error) {
            return <div className="text-center py-10 px-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-lg font-semibold text-red-700">An Error Occurred</p><p className="text-gray-600 mt-2">{error}</p></div>;
        }
        const userRoles = Object.keys(groupedUsers);
        if (userRoles.length === 0) {
            return <div className="text-center py-10 px-4 bg-gray-50 border border-gray-200 rounded-lg"><p className="text-lg font-semibold text-gray-800">No Users Found</p><p className="text-gray-500 mt-1">There are currently no users to display.</p></div>;
        }
        
        const roleOrder = ['ADMIN', 'EMPLOYER', 'EMPLOYEE', 'CANDIDATE'];
        return roleOrder
            .filter(role => groupedUsers[role])
            .map(role => <UserGroup key={role} title={role} users={groupedUsers[role]} onEditUser={handleEditClick} />);
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
                        <div className="mt-8">
                            {renderContent()}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h1 className="text-4xl text-center font-extrabold text-red-600 tracking-tight">Access Denied</h1>
                        <p className="mt-4 text-lg text-gray-600">You do not have permission to view this page.</p>
                    </div>
                )}
            </div>
        </div>
    );
}