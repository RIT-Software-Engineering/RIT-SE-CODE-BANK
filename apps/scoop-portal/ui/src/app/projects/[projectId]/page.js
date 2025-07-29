"use client";
import Header from "@components/Header";
import { Button, Typography } from "@mui/material";
import { ArrowBack, Edit } from "@mui/icons-material";
import {} from "@mui/icons-material";
import { useUser } from "../../user-context/page";
import UnauthorizedPage from '../../unauthorized/page';

// The current border styles are NOT intended for the final product.
// They are just to show how the divs are organized.

// This is hardcoded and under the assumption that the user viewing the page is an Admin

async function ProjectDetails() {
 const { user } = useUser();
if (!user || user.type !== "admin") {
    return <UnauthorizedPage />;
  }

    // Use to compare the loading skeleton to the page's content
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return (
        <>
            <Header />
            <main>
                <Button href="/projects" startIcon={<ArrowBack />}>
                    Back to Projects
                </Button>
                <div
                    id="project-header"
                    className="flex justify-between mb-4"
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "1rem",
                    }}
                >
                    <Typography variant="h1" component={"h1"}>
                        Demo Project
                    </Typography>
                    <Button startIcon={<Edit />}>Edit Project</Button>
                </div>
                <div
                    id="description-box"
                    className="border-2 border-dashed mb-6"
                    style={{
                        border: "2px dashed #ccc",
                        marginBottom: "1.5rem",
                    }}
                >
                    [ Project description ]
                </div>
                <div
                    id="other-details"
                    className="flex justify-between"
                    style={{ display: "flex", justifyContent: "space-between" }}
                >
                    <div
                        id="participants"
                        className="w-1/3 border-2 border-dashed"
                        stylwe={{ width: "33.33%", border: "2px dashed #ccc" }}
                    >
                        <div id="employer" title="Employer">
                            Employer
                        </div>
                        <div id="employee-list" title="Employees">
                            <ul>
                                <li>Employee 1</li>
                                <li>Employee 2</li>
                                <li>Employee 3</li>
                            </ul>
                        </div>
                    </div>
                    <div
                        id="actions"
                        className="w-2/3 border-2 border-dashed"
                        style={{ width: "66.67%", border: "2px dashed #ccc" }}
                    >
                        <Typography variant="h2" component="h2">
                            Actions
                        </Typography>
                        <ul className="list-disc list-inside">
                            <li>Action 1</li>
                            <li>Action 2</li>
                            <li>Action 3</li>
                        </ul>
                    </div>
                </div>
            </main>
        </>
    );
}

export default ProjectDetails;
