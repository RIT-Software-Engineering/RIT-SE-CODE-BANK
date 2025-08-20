// src/components/positions/EmployerAndAdmin/CreateCourseModal.js
'use client';

import { useState, useEffect } from "react";
import { createCourse } from "@/services/db-apis";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

export default function CreateCourseModal ({ isOpen, onClose, onCourseCreated, initialCode }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newCourse = await createCourse({ courseCode: initialCode, name, description });
      onCourseCreated(newCourse);
      onClose(); 
    } catch (error) {
      console.error("Failed to create course:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h2" component="div">
          Create New Course
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          margin="normal"
          label="Course Code"
          value={initialCode}
          InputProps={{
            readOnly: true,
          }}
          variant="filled"
        />
        <TextField
          autoFocus
          fullWidth
          margin="normal"
          label="Course Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Description"
          multiline
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          color="primary"
          disabled={isSubmitting || !name}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Create Course'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
