"use client";

import { Box, Button, Container, Typography } from "@mui/material";
import { ArrowBack, Edit, Height } from "@mui/icons-material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import React, { Suspense, useEffect, useState } from "react";
import ProjectDetailsLoading from "./loading";

export default function ProjectDetails({ params }) {
    const { projectId } = React.use(params);
    const [isLoading, setIsLoading] = useState(true);
    const [project, setProject] = useState([]);

    useEffect(() => {
        console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
        const fetchProject = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/project/${projectId}`
                );
                const data = await res.json();
                setProject(data);
            } catch (err) {
                console.error("Failed to fetch project: ", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (projectId) fetchProject();
    }, [projectId]);

    if (isLoading) {
        return <ProjectDetailsLoading />;
    }

    return (
        <>
            <Container>
                <Button
                    href="/projects"
                    startIcon={<ArrowBackOutlinedIcon />}
                    variant="outline-orange"
                >
                    Back to Projects
                </Button>
                <Container sx={{ marginTop: "1rem" }}>
                    <Typography variant="h1">
                        {project.display_name || project.title}
                    </Typography>
                    <Typography>{project.status}</Typography>
                    <Typography>{project.description}</Typography>
                    <Container
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box
                            sx={{
                                width: "50%",
                                padding: "0.25rem 1rem",
                            }}
                        >
                            <Typography variant="h3">Challenges:</Typography>
                            <Typography>
                                {project.project_challenges}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                width: "50%",
                                padding: "0.25rem 1rem",
                            }}
                        >
                            <Typography variant="h3">
                                Constraints & Assumptions:
                            </Typography>
                            <Typography>
                                {project.constraints_assumptions}
                            </Typography>
                        </Box>
                    </Container>
                </Container>
            </Container>
        </>
    );
}
