// src/components/positions/EmployerAndAdmin/form-components/PrerequisiteCheckboxes.js
'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
} from '@mui/material';

/**
 * A form component for selecting prerequisites for a job position.
 *
 * This component renders two parts:
 * 1. A checkbox for requiring the course as a prerequisite.
 * 2. A radio group for selecting the graduate status requirement.
 *
 * The component uses the `react-hook-form` library to register the fields and
 * handle form state.
 *
 * @prop {function} register - The `register` function from `react-hook-form`.
 * @prop {object} control - The `control` object from `react-hook-form`.
 *
 * @returns A JSX element containing the prerequisites form fields.
 */
export default function PrerequisiteCheckboxes({ register, control }) {
  if (!control || !register) {
    return null;
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
        Prerequisites
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              id="courseTakenRequirement"
              {...register("courseTakenRequirement")}
            />
          }
          label="Require this course as a prerequisite"
        />
        
        <Controller
          name="graduateStatusRequirement"
          control={control}
          defaultValue={null} // Default to 'Any' (no requirement)
          render={({ field }) => (
            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <FormLabel component="legend">Graduate Status Requirement</FormLabel>
              <RadioGroup
                row
                aria-label="graduate-status-requirement"
                name="graduateStatusRequirement"
                value={field.value || ''} // Use an empty string to represent the 'Any' option
                onChange={(e) => {
                  const value = e.target.value;
                  // When 'Any' is selected, its value is '', which we convert to null for the form state
                  field.onChange(value === '' ? null : value);
                }}
              >
                <FormControlLabel value="GRADUATE" control={<Radio />} label="Graduate" />
                <FormControlLabel value="UNDERGRADUATE" control={<Radio />} label="Undergraduate" />
                <FormControlLabel value="" control={<Radio />} label="Any" />
              </RadioGroup>
            </FormControl>
          )}
        />
      </FormGroup>
    </Box>
  );
}