// app/Users/page.js
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, getUserProfile } from '@/services/db-apis';
import UserGroup from '@/components/users/UserGroups';
import AdminEditUserForm from '@/components/users/AdminEditUserForm';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';

export default function Admin() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedUsers, setGroupedUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
        users.map((user) => getUserProfile(user.username))
      );
      const groups = enrichedUsers.reduce((acc, user) => {
        const role = user.role || 'UNKNOWN';
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

  const handleEditClick = async (username) => {
    const fullUserData = await getUserProfile(username);
    setSelectedUser(fullUserData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const filterUsers = (users, searchTerm) => {
    if (!searchTerm) return users;
    const lowerTerm = searchTerm.toLowerCase();
    return users.filter((user) => {
      const uidString = String(user.uid);
      const name = `${user.fname?.toLowerCase() || ''} ${
        user.lname?.toLowerCase() || ''
      }`;
      const email = user.email?.toLowerCase() || '';
      return (
        uidString.includes(lowerTerm) ||
        name.includes(lowerTerm) ||
        email.includes(lowerTerm)
      );
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='text-center py-10'>
          <div className='w-8 h-8 border-4 border-dashed rounded-full animate-spin border-rit-orange mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading Users...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className='text-center py-10 px-4 bg-red-50 border border-red-200 rounded-lg'>
          <p className='text-lg font-semibold text-red-700'>
            An Error Occurred
          </p>
          <p className='text-gray-600 mt-2'>{error}</p>
        </div>
      );
    }

    const roleOrder = ['ADMIN', 'EMPLOYER', 'EMPLOYEE', 'CANDIDATE'];

    return roleOrder
      .filter((role) => groupedUsers[role])
      .map((role) => {
        const filtered = filterUsers(groupedUsers[role], searchTerm);
        if (filtered.length === 0 && searchTerm) return null;

        if (role === 'EMPLOYEE') {
          const groupedByStatus = filtered.reduce((acc, user) => {
            const status =
              user?.candidate?.employee?.[0]?.employeeStatus || 'UNKNOWN';
            if (!acc[status]) acc[status] = [];
            acc[status].push(user);
            return acc;
          }, {});

          return (
            <UserGroup
              key={role}
              title={role}
              users={groupedByStatus}
              onEditUser={handleEditClick}
              isEmployeeGroup
            />
          );
        }

        return (
          <UserGroup
            key={role}
            title={role}
            users={filtered}
            onEditUser={handleEditClick}
          />
        );
      });
  };

  return (
    <div className='bg-gray-50 py-10'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        {isAdministrator ? (
          <div className='w-full max-w-4xl mx-auto'>
            <div className='text-center mb-8'>
              <h1 className='text-4xl font-extrabold text-gray-900 tracking-tight'>
                Edit Users
              </h1>
              <p className='mt-2 text-lg text-gray-500'>
                Manage user roles and permissions.
              </p>
            </div>

            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder='Search by name, email, or UID...'
            />

            <div className='mt-6 bg-white p-6 sm:p-8 rounded-xl shadow-md space-y-4'>
              {renderContent()}
            </div>

            {isModalOpen && selectedUser && (
              <div className='fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4'>
                <div className='bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
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
          <div className='text-center py-20'>
            <h1 className='text-4xl text-center font-extrabold text-red-600 tracking-tight'>
              Access Denied
            </h1>
            <p className='mt-4 text-lg text-gray-600'>
              You do not have permission to view this page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
