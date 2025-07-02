import { Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

export default function ProjectDetailsLayout({ children }) {
    return (
        <div>
            <Button href="/projects" startIcon={<ArrowBack />}>
                Back to Projects
            </Button>
            {children}
        </div>
    );
}
