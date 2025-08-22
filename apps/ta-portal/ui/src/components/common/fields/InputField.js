// components/profile/form-components/InputField.js
"use client";
import React from "react";
import { TextField } from "@mui/material";


/**
 * InputField component wraps MUI TextField with additional behavior for validation and formatting.
 *
 * Supports numeric-only input, maxLength enforcement, and integrates with react-hook-form `register` props.
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Unique ID for the input
 * @param {string} props.label - Label displayed above the input
 * @param {string} [props.placeholder] - Placeholder text
 * @param {Object} [props.registerProps] - Props from react-hook-form's `register` function
 * @param {Object} [props.error] - Error object with message to display if invalid
 * @param {string} [props.type="text"] - HTML input type
 * @param {boolean} [props.required=false] - Whether the input is required
 * @param {...any} rest - Any additional props passed to MUI TextField (e.g., maxLength, inputMode)
 */

export default function InputField({
  id,
  label,
  placeholder,
  registerProps,
  error,
  type = "text",
  required = false,
  ...rest
}) {
  const handleChange = (e) => {
    let value = e.target.value;

    if (rest.inputMode === "numeric" && value) {
      value = value.replace(/[^0-9]/g, "");
    }
    if (rest.maxLength && value.length > rest.maxLength) {
      value = value.slice(0, rest.maxLength);
    }

    e.target.value = value;
    registerProps?.onChange?.(e);
  };

  return (
    <TextField
      fullWidth
      variant="outlined"
      id={id}
      label={label}
      placeholder={placeholder}
      type={type}
      required={required}
      {...registerProps}
      onChange={handleChange}
      error={!!error}
      helperText={error ? error.message : ""}
      {...rest}
    />
  );
}
