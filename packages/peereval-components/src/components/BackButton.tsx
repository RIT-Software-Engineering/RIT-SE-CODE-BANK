"use client";

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