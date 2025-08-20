// src/components/positions/EmployerAndAdmin/form-steps/FormStepThree.js
'use client';

import { Controller } from "react-hook-form";
import ScheduleEditor from "../form-components/ScheduleEditor";
import { Box, TextField, Typography } from "@mui/material";

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