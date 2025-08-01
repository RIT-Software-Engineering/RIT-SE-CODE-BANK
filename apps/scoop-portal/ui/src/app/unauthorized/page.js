"use client";
import { Typography, Box } from "@mui/material";

export default function UnauthorizedPage() {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <Typography variant="h6" color="error">
                You are not authorized to view this page.
            </Typography>
        </Box>
    );
}