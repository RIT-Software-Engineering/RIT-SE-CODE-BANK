'use client';

import { TextField } from '@mui/material';

/**
 * A styled, read-only field for displaying information using Material-UI.
 * @param {object} props - The component props.
 * @param {string} props.label - The label for the display field.
 * @param {string | number} props.value - The value to display in the field.
 */
export default function DisplayField({ label, value }) {
  return (
    <TextField
      fullWidth
      variant="filled"
      label={label}
      value={value || 'None'}
      InputProps={{
        readOnly: true,
      }}
      sx={(theme) => ({
            "& .MuiFilledInput-root": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? ""
                  : "white",
            }
          })}
      // This prevents the label from shrinking when there is no value
      InputLabelProps={{ shrink: true }}
    />
  );
}
