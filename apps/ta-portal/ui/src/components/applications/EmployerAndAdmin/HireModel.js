// src/components/applications/EmployerAndAdmin/HireModal.js
'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Close as XIcon } from '@mui/icons-material';

/**
 * HireModal component for finalizing the hiring process of a candidate.
 * Displays candidate and job position details, collects an Employee ID
 * and a hiring comment, validates the form, and triggers confirmation.
 *
 * @param {Object} props - Component props
 * @param {Object} props.application - Candidate's application data
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onConfirm - Callback fired when hire is confirmed, receives (employeeId: number, comment: string)
 * @param {boolean} props.isProcessing - Whether a hire action is currently being processed (disables inputs/buttons)
 */
export default function HireModal({ application, onClose, onConfirm, isProcessing }) {
  const [employeeId, setEmployeeId] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    } else if (!/^\d+$/.test(employeeId.trim())) {
      newErrors.employeeId = 'Employee ID must be a number';
    }

    if (!comment.trim()) {
      newErrors.comment = 'Comment is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const employeeIdNumber = parseInt(employeeId.trim(), 10);
    onConfirm(employeeIdNumber, comment.trim());
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
      
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h2" component="div">
          Hire Candidate
        </Typography>
        <IconButton onClick={onClose} disabled={isProcessing}>
          <XIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
          <Typography variant="h3" gutterBottom>
            {application.candidateFName} {application.candidateLName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <Box component="span" sx={{ fontWeight: 'bold' }}>Email:</Box> {application.candidateEmail}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <Box component="span" sx={{ fontWeight: 'bold' }}>Student UID:</Box> {application.candidateUID}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <Box component="span" sx={{ fontWeight: 'bold' }}>Course:</Box> {application.jobPosition.courseCode}-{String(application.jobPosition.sectionNumber).padStart(2, '0')}: {application.jobPosition.course?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <Box component="span" sx={{ fontWeight: 'bold' }}>Professor:</Box> {application.jobPosition.employer.user.fname} {application.jobPosition.employer.user.lname}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <Box component="span" sx={{ fontWeight: 'bold' }}>Semester:</Box> {application.jobPosition.semesterCode}
          </Typography>
        </Paper>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            margin="normal"
            id="employeeId"
            name="employeeId"
            label="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Enter numeric employee ID"
            inputProps={{ maxLength: 7 }}
            error={!!errors.employeeId}
            helperText={errors.employeeId}
            disabled={isProcessing}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            id="comment"
            name="comment"
            label="Hiring Comment"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Provide details on why the candidate is being hired"
            error={!!errors.comment}
            helperText={errors.comment}
            disabled={isProcessing}
            required
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? <CircularProgress size={24} /> : 'Confirm Hire'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}