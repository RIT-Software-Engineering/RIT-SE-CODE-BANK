import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Button from "@mui/material/Button";

export default function BackArrow() {
    return (
        <Link href="/dashboard" passHref legacyBehavior>
            <Button
                component="a"
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 2, textTransform: "none" }}
                aria-label="Back"
            >
                Back
            </Button>
        </Link>
    );
}
