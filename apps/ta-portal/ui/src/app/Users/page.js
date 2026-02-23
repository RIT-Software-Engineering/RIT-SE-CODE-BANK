// app/Users/page.js
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, getUserProfile } from '@/services/db-apis';
import UserGroup from '@/components/users/UserGroups';
import UserTable from '@/components/users/UserTable';
import AdminEditUserForm from '@/components/users/AdminEditUserForm';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';


import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Modal,
  Paper,
  Typography,
} from '@mui/material';

/**
 * Renders the administrator's user management page.
 * This page allows admins to view all users in the system, grouped by their role.
 * It provides functionality to search for users and edit their profiles via a modal.
 * Access is restricted to users with the 'ADMIN' role.
 */
export default function AdminUsersPage() {
  // --- STATE MANAGEMENT ---

  // Core hook to get the currently authenticated user.
  const { currentUser } = useAuth();

  // State for managing UI status (loading, errors).
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for user data, modal control, and search functionality.
  const [groupedUsers, setGroupedUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null); // The user being edited in the modal.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- AUTHORIZATION ---

  // A boolean flag to simplify access control checks throughout the component.
  const isAdministrator = currentUser?.role === 'ADMIN';

  // --- DATA FETCHING & PROCESSING ---

  /**
   * Fetches all users and their detailed profiles from the database.
   * It then processes this data, grouping users by their assigned role.
   * This function is wrapped in useCallback to prevent unnecessary re-fetches.
   */
  const fetchData = useCallback(async () => {
    // Halt execution if the user is not an administrator.
    if (!isAdministrator) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // First, get the basic list of all users.
      const users = await getAllUsers();
      // Then, fetch the detailed profile for each user to get their role and other info.
      const enrichedUsers = await Promise.all(
        users.map((user) => getUserProfile(user.username))
      );
      // Use reduce to group the enriched user profiles by their role.
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

  // Effect to trigger the initial data fetch when the component mounts.
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Handles the click event for the "Edit" button on a user card.
   * It fetches the full user profile and opens the editing modal.
   * @param {string} username - The username of the user to be edited.
   */
  const handleEditClick = async (username) => {
    const fullUserData = await getUserProfile(username);
    setSelectedUser(fullUserData);
    setIsModalOpen(true);
  };

  /**
   * Closes the user editing modal and resets the selected user state.
   */
  const handleCloseModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  /**
   * Filters an array of users based on a search term.
   * @param {object[]} users - The array of user objects to filter.
   * @param {string} term - The search term to filter by.
   * @returns {object[]} A new array containing only the users that match the search term.
   */
  const filterUsers = (users, term) => {
    if (!term) return users;
    const lowerTerm = term.toLowerCase();
    // Search matches against user ID, full name, or email.
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

  // --- RENDER LOGIC ---

  /**
   * Renders the main content of the page, including user groups.
   * It handles loading, error, and no-data states, and applies the search filter.
   * @returns {React.ReactNode} The JSX for the main content area.
   */
  const renderContent = () => {
    // Show a loading spinner while data is being fetched.
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    // Show an error message if the API call fails.
    if (error) {
      return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }

    // Define a specific order for displaying user roles.
    const roleOrder = ['ADMIN', 'EMPLOYER', 'EMPLOYEE', 'CANDIDATE'];
    // Filter out roles that have no users.
    const filteredRoles = roleOrder.filter((role) => groupedUsers[role]);

    // Show a message if no users exist in the system at all.
    if (filteredRoles.length === 0 && !searchTerm) {
        return <Typography sx={{textAlign: 'center', p: 4}}>No users found.</Typography>
    }

    // Map over the roles to render a UserGroup for each.
    return filteredRoles.map((role) => {
      const filtered = filterUsers(groupedUsers[role], searchTerm);
      // If the search term filters out all users in a group, don't render the group.
      if (filtered.length === 0) return null;

      // Special handling for the 'EMPLOYEE' role to create subgroups by employment status.
      if (role === 'EMPLOYEE') {
        const groupedByStatus = filtered.reduce((acc, user) => {
          const status =
            user?.candidate?.employee?.[0]?.employeeStatus || 'UNKNOWN';
          if (!acc[status]) acc[status] = [];
          acc[status].push(user);
          return acc;
        }, {});

        return (
          <Accordion sx={(theme) => ({
            background: theme.palette.mode === 'dark'
                ? ""
                : "#e0e0e0"
        })}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={600}>
                    EMPLOYEES ({filtered.length})
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <UserTable
            key='Active'
            title='Active'
            users={groupedByStatus['ACTIVE']}
            role='EMPLOYEE'
            onEdit={handleEditClick}
          />

          <UserTable
            key='Unknown'
            title='Unknown'
            users={groupedByStatus['UNKNOWN']}
            role='EMPLOYEE'
            onEdit={handleEditClick}
          />

          
          <UserTable
            key='Inactive'
            title='Inactive'
            users={groupedByStatus['INACTIVE']}
            role='EMPLOYEE'
            onEdit={handleEditClick}
          />
</Box>
            </AccordionDetails>
        </Accordion>
        );
      }

      if (role === 'EMPLOYER') {
      
        return (
          <>
          <UserTable
            key='employer'
            title={role}
            users={groupedUsers['EMPLOYER']}
            role={role}
            onEdit={handleEditClick}
          /></>
        );
      }

      // Render a standard UserGroup for all other roles.
      return (
        roleOrder.includes(role)?
          <UserTable
          key={role}
          title={role}
          users={filtered}
          onEditUser={handleEditClick}
        />:<></>
      );
    });
  };

  // --- AUTHORIZATION CHECK ---

  // Before rendering the main content, check if the user is authorized.
  // This prevents non-admins from seeing any part of the page.
  if (!isAdministrator && !isLoading) {
    return (
        <Container maxWidth="sm" sx={{py: 8, textAlign: 'center'}}>
            <Typography variant="h1" color="error">Access Denied</Typography>
            <Typography variant="h3" color="text.secondary" sx={{mt: 2}}>You do not have permission to view this page.</Typography>
        </Container>
    )
  }

  // --- MAIN COMPONENT RENDER ---
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

      <Paper elevation={2} sx={{ p: 2,gap: 2 }}>
        <Box sx={{pb:3}}>
          <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder='Search by name, email, or UID...'
          sx={{ mb: 3 }}
        />
        </Box>
        
        <Box key={'renderedContentBox'} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {renderContent()}
        </Box>
      </Paper>

      {/* The modal for editing a selected user. */}
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
        <Paper
          sx={(theme)=>({ 
            p: {xs: 2, md: 4},
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: theme.palette.mode === 'dark'
                    ? ""
                    : "#e0e0e0" })}
        >
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