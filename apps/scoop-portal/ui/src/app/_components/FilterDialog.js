import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

/**
 *
 * @param {boolean} open - True if the dialog should be open, False otherwise
 * @param {string} title - The title of the filter dialog
 * @param {*} children - Any components to be shown for the filter dialog content
 * @param {*} onCancel - The function for canceling the filter
 * @param {*} onSubmit - the function for submitting the filter to be used
 * @param {string} actionLabel - The label for the button to submit the filter
 * @returns {JSX.Element}
 */
export default function FilterDialog({
  open,
  title = "Filter",
  children,
  onCancel,
  onSubmit,
  actionLabel,
  secondaryAction,
  actionButtonProps = {},
  actionsSx = {},
}) {
  const { variant, sx, ...restActionButtonProps } = actionButtonProps;
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ display: "flex", justifyContent: "flex-end", gap: 1, px: 2, ...actionsSx }}>
        <Button variant="outline-orange" onClick={onCancel}>
          Cancel
        </Button>
        {secondaryAction}
        <Button variant={variant || "outline-orange"} onClick={onSubmit} sx={sx} {...restActionButtonProps}>
          {actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
