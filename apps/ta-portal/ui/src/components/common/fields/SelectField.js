// src/components/common/fields/SelectField.js
"use client";
import React from "react";
import { FormControl, InputLabel, Select, FormHelperText } from "@mui/material";

/**
 * SelectField component wraps MUI Select with label, error handling, and react-hook-form integration.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.id - Unique ID for the select field
 * @param {string} props.label - Label displayed above the select field
 * @param {Object} [props.registerProps] - Props from react-hook-form's `register` function
 * @param {Object} [props.error] - Error object with message to display if invalid
 * @param {boolean} [props.required=false] - Whether the field is required
 * @param {React.ReactNode} props.children - Option elements (<MenuItem>) to render inside the select
 * @param {any} [props.value] - Optional controlled value for the select field
 * @param {...any} rest - Any additional props passed to MUI Select
 */

export default function SelectField({
  id,
  label,
  registerProps,
  error,
  required = false,
  children,
  value,
  ...rest
}) {
  const { ref, onChange, onBlur, name } = registerProps || {};
  const selectValue = value ?? registerProps?.value ?? "";

  return (
    <FormControl fullWidth error={!!error}>
      <InputLabel id={`${id}-label`}>
        {label}
        {required && <span> *</span>}
      </InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        label={label}
        name={name}
        value={selectValue}
        onChange={onChange}
        onBlur={onBlur}
        inputRef={ref}
        {...rest}
      >
        {children}
      </Select>
      {error && <FormHelperText>{error.message}</FormHelperText>}
    </FormControl>
  );
}
