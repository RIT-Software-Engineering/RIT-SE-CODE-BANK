// components/profile/form-components/InputField.js
"use client";
import React from "react";
import { TextField } from "@mui/material";

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
