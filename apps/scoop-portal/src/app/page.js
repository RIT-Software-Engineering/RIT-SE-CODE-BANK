import Image from "next/image";
import { Button } from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
// TODO: Different views for users who are logged in and users who aren't logged in

/**
 * TODO: Documentation for page.js's Home function
 *
 * @returns {JSX.Element}
 */
export default function Home() {
    return (
        <div>
            <h1>Welcome to the New SCOOP Portal.</h1>
            <main>
                <Button
                    href="/projects"
                    variant="outlined"
                    size="large"
                    endIcon={<AssignmentOutlinedIcon fontSize="large" />}
                >
                    Projects
                </Button>
            </main>
        </div>
    );
}
