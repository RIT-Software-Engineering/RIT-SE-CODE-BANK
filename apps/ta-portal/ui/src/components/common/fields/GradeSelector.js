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

/**
 * GradeSelector component for selecting a grade from predefined options.
 *
 * Renders a Material-UI Select input with grade options and optional error handling.
 * Can display an optional label if the grade selection is not required.
 *
 * @param {Object} props - Component props
 * @param {string|null} props.value - Current selected grade value
 * @param {Function} props.onChange - Callback triggered when a new grade is selected
 * @param {string} props.id - Unique ID for the Select input
 * @param {string} props.label - Label displayed for the Select input
 * @param {boolean} [props.isOptional=false] - Whether selecting a grade is optional
 * @param {Object} [props.error] - Error object containing message to display if invalid
 */

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
        sx={(theme)=>({ background: theme.palette.mode === 'dark'
                    ? "" : "#e0e0e0" })}
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