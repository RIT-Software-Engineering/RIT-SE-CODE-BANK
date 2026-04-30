// src/components/common/buttons/EditButton.js
'use client';

import { IconButton, Tooltip } from '@mui/material';
import Edit from '@mui/icons-material/Edit'; // The icon component from MUI

/**
 * A Material-UI styled edit button.
 * @param {object} props - The component props.
 * @param {function} props.handleOpenModal - The function to call when the button is clicked.
 */
export default function EditIcon({ handleOpenModal }) {
  return (
    <Tooltip title="Edit" arrow>
      <IconButton
        onClick={handleOpenModal}
        aria-label="Edit"
        sx={{
          // Use the theme's primary color for the icon
          color: 'primary.main',
          // Add a subtle background on hover for better visibility
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <Edit />
      </IconButton>
    </Tooltip>
  );
}