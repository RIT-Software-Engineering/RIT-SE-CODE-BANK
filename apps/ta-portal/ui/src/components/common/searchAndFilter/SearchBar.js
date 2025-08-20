// src/components/common/searchAndFilter/SearchBar.js
'use client';

import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export default function SearchBar({ value, onChange, placeholder, ...props }) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <TextField
      fullWidth
      variant="outlined"
      value={value}
      size="small"
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
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
      {...props}
    />
  );
}