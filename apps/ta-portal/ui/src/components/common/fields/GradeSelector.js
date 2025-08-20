// src/components/comments/ViewableCommentForm.js
"use client";
import React from 'react';
import { gradeOptions } from '@/constants/gradeConstants';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
} from '@mui/material';

export default function GradeSelector({ value, onChange, id, label, isOptional = false, error }) {
  
  const handleChange = (event) => {
    onChange(event.target.value || null);
  };

  return (
    <FormControl fullWidth error={!!error}>
      <InputLabel id={`${id}-label`}>
        {label}
        {isOptional && (
          <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
            (Optional)
          </Typography>
        )}
      </InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value || ''}
        label={label}
        onChange={handleChange}
      >
        <MenuItem value="">
          <em>{isOptional ? '-- No Grade --' : 'Select a grade...'}</em>
        </MenuItem>

        {gradeOptions.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      {error && <FormHelperText>{error.message}</FormHelperText>}
    </FormControl>
  );
}