// app/Users/page.js
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, getUserProfile } from '@/services/db-apis';
import UserGroup from '@/components/users/UserGroups';
import AdminEditUserForm from '@/components/users/AdminEditUserForm';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Modal,
  Paper,
  Typography,
} from '@mui/material';

export default function AdminUsersPage() {
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

  const filterUsers = (users, term) => {
    if (!term) return users;
    const lowerTerm = term.toLowerCase();
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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }

    const roleOrder = ['ADMIN', 'EMPLOYER', 'EMPLOYEE', 'CANDIDATE'];
    const filteredRoles = roleOrder.filter((role) => groupedUsers[role]);

    if (filteredRoles.length === 0 && !searchTerm) {
        return <Typography sx={{textAlign: 'center', p: 4}}>No users found.</Typography>
    }

    return filteredRoles.map((role) => {
      const filtered = filterUsers(groupedUsers[role], searchTerm);
      if (filtered.length === 0) return null;

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

  if (!isAdministrator && !isLoading) {
    return (
        <Container maxWidth="sm" sx={{py: 8, textAlign: 'center'}}>
            <Typography variant="h1" color="error">Access Denied</Typography>
            <Typography variant="h3" color="text.secondary" sx={{mt: 2}}>You do not have permission to view this page.</Typography>
        </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Edit Users
        </Typography>
        <Typography variant="h3" color="text.secondary">
          Manage user roles and permissions.
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder='Search by name, email, or UID...'
          sx={{ mb: 3 }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {renderContent()}
        </Box>
      </Paper>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="edit-user-modal-title"
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}
      >
        <Paper sx={{
            p: {xs: 2, md: 4},
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto'
        }}>
            <AdminEditUserForm
                user={selectedUser}
                onClose={handleCloseModal}
                onUpdateSuccess={fetchData}
            />
        </Paper>
      </Modal>
    </Container>
  );
}