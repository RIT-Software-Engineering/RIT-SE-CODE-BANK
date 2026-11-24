"use client";

/**
 * BackButton
 * 
 * A reusable navigation button with a back arrow icon.
 * 
 * Receives an onClick callback rather than defining a destination.
 * This allows different applications to control navigation while
 * reusing the same button presentation.
 */
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Button from "@mui/material/Button";

export type BackButtonProps = {
    onClick: () => void;
    label?: string;
    ariaLabel?: string;
};

export default function BackButton({
    onClick,
    label = "Back",
    ariaLabel = "Back",
}: BackButtonProps) {
    return (
        <Button
            onClick={onClick}
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2, textTransform: "none" }}
            aria-label={ariaLabel}
        >
            {label}
        </Button>
    );
}