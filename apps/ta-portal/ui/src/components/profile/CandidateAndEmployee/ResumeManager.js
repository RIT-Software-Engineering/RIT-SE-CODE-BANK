// src/components/profile/CandidateAndEmployee/ResumeManager.js
'use client';

import React, { useState } from 'react';
import {
  uploadNewCandidateResume,
  updatePrimaryResume,
  deleteResume,
  updateResumeName,
} from '@/services/db-apis';
import { useNotification } from '@/contexts/NotificationContext';
import ConfirmationModal from '@/components/common/models/ConfirmationModal';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  Paper,
  TextField,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import {
    Delete as DeleteIcon, 
    Check as CheckIcon, 
    Close as CancelIcon,
    Star as PrimaryIcon,
    UploadFile as UploadFileIcon
} from '@mui/icons-material';

/**
 * A component that allows candidates to manage their resumes.
 * 
 * @param {object} props - Component props.
 * @param {array} props.resumes - Array of candidate's resumes.
 * @param {string} props.candidateUsername - Candidate's username.
 * @param {function} props.onProfileRefresh - Function to be called when the resume list changes.
 */
export default function ResumeManager({ resumes, candidateUsername, onProfileRefresh }) {
  const { showNotification } = useNotification();

  const [newResumeName, setNewResumeName] = useState('');
  const [newResumeFile, setNewResumeFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [editingResumeId, setEditingResumeId] = useState(null);
  const [editingResumeName, setEditingResumeName] = useState('');

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    resumeId: null,
    isProcessing: false,
  });

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleStartEditing = (resume) => {
    setEditingResumeId(resume.id);
    setEditingResumeName(resume.name);
  };

  const handleCancelEditing = () => {
    setEditingResumeId(null);
    setEditingResumeName('');
  };

  const handleSaveName = async () => {
    if (!editingResumeName.trim()) {
      showNotification('Resume name cannot be empty.', 'error');
      return;
    }
    try {
      await updateResumeName(editingResumeId, editingResumeName.trim());
      showNotification('Resume renamed successfully.', 'success');
      onProfileRefresh();
      handleCancelEditing();
    } catch (err) {
      showNotification(err.message || 'Failed to rename resume.', 'error');
    }
  };

  const handleSetPrimary = async (resumeId) => {
    try {
      await updatePrimaryResume(candidateUsername, resumeId);
      onProfileRefresh();
      showNotification('Primary resume updated successfully.', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to set primary resume.', 'error');
    }
  };

  const handleOpenDeleteModal = (resumeId) => {
    setDeleteModalState({ isOpen: true, resumeId, isProcessing: false });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalState({ isOpen: false, resumeId: null, isProcessing: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState.resumeId) return;

    setDeleteModalState(prev => ({ ...prev, isProcessing: true }));

    try {
      await deleteResume(deleteModalState.resumeId);
      onProfileRefresh();
      showNotification('Resume deleted successfully.', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete resume.', 'error');
    } finally {
      handleCloseDeleteModal();
    }
  };

  const handleAddNewResume = async (e) => {
    e.preventDefault();
    if (!newResumeName || !newResumeFile) {
      showNotification('Please provide a resume name and file.', 'error');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('candidateUsername', candidateUsername);
    formData.append('name', newResumeName);
    formData.append('resumeFile', newResumeFile);

    try {
      await uploadNewCandidateResume(formData);
      setNewResumeName('');
      setNewResumeFile(null);
      e.target.reset();
      onProfileRefresh();
      showNotification('Resume uploaded successfully.', 'success');
    } catch (err) {
      showNotification(err.message || 'An error occurred. Failed to upload resume.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h3" component="h3" gutterBottom>
        My Resumes
      </Typography>
      
      <List sx={{ mb: 3 }}>
        {resumes.length > 0 ? (
          resumes.map((resume) => (
            <Paper key={resume.id} variant="outlined" sx={{ p: 1.5, mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {editingResumeId === resume.id ? (
                <>
                  <TextField
                    value={editingResumeName}
                    onChange={(e) => setEditingResumeName(e.target.value)}
                    size="small"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    sx={{ flexGrow: 1, mr: 2 }}
                  />
                  <Box>
                    <IconButton onClick={handleSaveName} size="small" color="success"><CheckIcon /></IconButton>
                    <IconButton onClick={handleCancelEditing} size="small"><CancelIcon /></IconButton>
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MuiLink href={`${backendURL}${resume.resumeURL}`} target="_blank" rel="noopener noreferrer" underline="hover">
                      {resume.name}
                    </MuiLink>
                    {resume.isPrimary && <Chip label="Primary" color="primary" size="small" icon={<PrimaryIcon />} sx={{ ml: 2 }} />}
                  </Box>
                  <Box>
                    <Button size="small" onClick={() => handleStartEditing(resume)}>Rename</Button>
                    <Button size="small" onClick={() => handleSetPrimary(resume.id)} disabled={resume.isPrimary}>Set Primary</Button>
                    <IconButton onClick={() => handleOpenDeleteModal(resume.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </>
              )}
            </Paper>
          ))
        ) : (
          <Typography color="text.secondary">No resumes uploaded yet.</Typography>
        )}
      </List>

      <Divider sx={{ my: 3 }} />

      <Box component="form" onSubmit={handleAddNewResume} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography>Upload New Resume</Typography>
        <TextField
          label="Resume Name"
          value={newResumeName}
          onChange={(e) => setNewResumeName(e.target.value)}
          placeholder="e.g., Software Engineering Resume"
          fullWidth
        />
        <Button
          component="label"
          variant="outlined"
          startIcon={<UploadFileIcon />}
        >
          {newResumeFile ? newResumeFile.name : 'Select Resume File (PDF)'}
          <input type="file" hidden onChange={(e) => setNewResumeFile(e.target.files[0])} accept=".pdf" />
        </Button>
        <Button
          type="submit"
          disabled={isUploading}
          variant="contained"
          sx={{ alignSelf: 'flex-start' }}
        >
          {isUploading ? <CircularProgress size={24} /> : 'Upload Resume'}
        </Button>
      </Box>

      <ConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Resume"
        isConfirming={deleteModalState.isProcessing}
      >
        Are you sure you want to delete this resume? This action cannot be undone.
      </ConfirmationModal>
    </Box>
  );
}