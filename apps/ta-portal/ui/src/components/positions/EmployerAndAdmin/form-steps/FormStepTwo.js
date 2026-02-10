// src/components/positions/EmployerAndAdmin/form-steps/FormStepTwo.js
'use client';

import { Controller } from "react-hook-form";
import GradeSelector from "../../../common/fields/GradeSelector";
import PrerequisiteCheckboxes from "../form-components/PrerequisiteCheckboxes";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

/**
 * The second step in the multi-step form for creating a new job position.
 *
 * Includes fields for:
 * - Prerequisites (PrerequisiteCheckboxes)
 * - Minimum grade requirement (GradeSelector)
 * - Location (TextField)
 * - Location type (Select)
 * - Max TA's (TextField)
 *
 * @prop {function} register - The register function from react-hook-form.
 * @prop {object} control - The control object from react-hook-form.
 * @prop {object} errors - The errors object from react-hook-form.
 * @returns {ReactNode} The form step component.
 */
export default function FormStepTwo({ register, control, errors }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PrerequisiteCheckboxes register={register} control={control} />
      
      <Controller
        name="gradeRequirement"
        control={control}
        render={({ field, fieldState }) => (
          <GradeSelector
            {...field}
            id="gradeRequirement"
            label="Minimum Grade Required"
            isOptional={true}
            error={fieldState.error}
            
          />
        )}
      />

      <TextField
        fullWidth
        id="location"
        label="Location"
        {...register("location")}
        error={!!errors.location}
        helperText={errors.location?.message}
        sx={(theme) => ({
            "& .MuiOutlinedInput-root": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? ""
                  : "white",
            }
          })}
      />

      <FormControl fullWidth>
        
        <InputLabel id="locationType-label">Location Type</InputLabel>
        <Select
          labelId="locationType-label"
          id="locationType"
          label="Location Type"
          {...register("locationType")}
          defaultValue="INPERSON"
          sx={(theme)=>({ background: theme.palette.mode === 'dark'
                    ? "" : "white" })}
        >
          <MenuItem value="REMOTE">Remote</MenuItem>
          <MenuItem value="HYBRID">Hybrid</MenuItem>
          <MenuItem value="INPERSON">In-Person</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        type="number"
        id="maxTAs"
        label="Max TA's"
        {...register("maxTAs", { 
          valueAsNumber: true,
          min: { value: 1, message: "Must have at least 1 TA." } 
        })}
        error={!!errors.maxTAs}
        helperText={errors.maxTAs?.message}
        sx={(theme) => ({
            "& .MuiOutlinedInput-root": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? ""
                  : "white",
            }
          })}
      />
    </Box>
  );
}