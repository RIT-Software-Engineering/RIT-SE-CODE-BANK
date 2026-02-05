// src/components/positions/EmployerAndAdmin/form-steps/FormStepThree.js
'use client';

import { Controller } from "react-hook-form";
import ScheduleEditor from "../form-components/ScheduleEditor";
import { Box, TextField, Typography } from "@mui/material";

/**
 * Component for Step 3 of the Employer and Admin form. 
 * This step includes fields for start date, end date, and schedule (w/ days of the week and start and end times).
 *
 * @param {object} props - The component props.
 * @param {function} props.register - The form register function.
 * @param {object} props.control - The form control object.
 * @param {object} props.errors - The form errors object.
 *
 * @returns {JSX.Element} The rendered FormStepThree component.
 */
export default function FormStepThree({ register, control, errors }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        fullWidth
        type="date"
        id="startDate"
        label="Start Date"
        InputLabelProps={{ shrink: true }}
        {...register("startDate", {
          required: "Start date is required.",
        })}
        error={!!errors.startDate}
        helperText={errors.startDate?.message}
      />
      <TextField
        fullWidth
        type="date"
        id="endDate"
        label="End Date"
        InputLabelProps={{ shrink: true }}
        {...register("endDate", {
          required: "End date is required.",
        })}
        error={!!errors.endDate}
        helperText={errors.endDate?.message}
      />
      <Controller
        name="jobSchedules"
        control={control}
        render={({ field }) => (
          <>
            <ScheduleEditor
              initialSchedules={field.value}
              onSchedulesChange={field.onChange}
            />
            {errors.jobSchedules && (
              <Typography color="error" variant="caption" sx={{ mt: 1, ml: 2 }}>
                {errors.jobSchedules.message}
              </Typography>
            )}
          </>
        )}
      />
    </Box>
  );
}