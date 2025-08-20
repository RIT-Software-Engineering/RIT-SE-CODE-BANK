// src/components/common/fields/SelectField.js
"use client";
import React from "react";
import { FormControl, InputLabel, Select, FormHelperText } from "@mui/material";

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
