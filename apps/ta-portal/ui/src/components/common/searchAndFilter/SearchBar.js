// src/components/common/searchAndFilter/SearchBar.js
'use client';

import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

/**
 * A search bar component with a search icon and a clear button.
 *
 * This component accepts the same props as `@mui/material/TextField`, with the
 * following additional props:
 *
 * - `value`: The current search value.
 * - `onChange`: A function to call when the search value changes.
 * - `placeholder`: The placeholder text to display in the search bar.
 *
 * @param {Object} props - Component props
 * @param {string} props.value - The current search value
 * @param {Function} props.onChange - A function to call when the search value changes
 * @param {string} [props.placeholder] - The placeholder text to display in the search bar
 * @param {...any} props - Any additional props passed to the MUI TextField component
 */
export default function SearchBar({ value, onChange, placeholder, ...props }) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <TextField
  fullWidth
  value={value}
  size="small"
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
  {...props}
  sx={(theme) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? ""
        : "#e0e0e0",
  }
})}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon color="action" />
      </InputAdornment>
    ),
    endAdornment: (
      value && (
        <InputAdornment position="end">
          <IconButton
            aria-label="clear search"
            onClick={handleClear}
            edge="end"
            size="small"
          >
            <ClearIcon />
          </IconButton>
        </InputAdornment>
      )
    ),
  }}
  
/>
  );
}