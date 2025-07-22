"use client";

import { Box, Button, Container, Typography, Paper } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import React, { useEffect, useState } from "react";
import ProjectDetailsLoading from "./loading";
import Header from "@components/Header";
import baseTheme from "@styles/theme";

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
            <Header />

            <Container>
                <Button
                    href="/projects"
                    startIcon={<ArrowBackOutlinedIcon />}
                    variant="outline-orange"
                >
                    Back to Projects
                </Button>
                <Paper
                    sx={{
                        marginTop: "1rem",
                        paddingBlock: "1rem",
                    }}
                >
                    <Typography variant="h1">
                        {project.display_name || project.title}
                    </Typography>
                    <Box
                        sx={{
                            marginBlock: "1rem",
                            padding: "0.5em 1em",
                            display: "inline-block",
                            backgroundColor:
                                project.status === "active"
                                    ? "rgba(0, 156, 189, 0.2)"
                                    : project.status === "in progress"
                                      ? "rgba(246, 190, 0, 0.2)"
                                      : project.status === "completed"
                                        ? "rgba(132, 189, 0, 0.2)"
                                        : "rgba(124, 135, 142, 0.2)",
                            color:
                                project.status === "active"
                                    ? baseTheme.palette.info.main
                                    : project.status === "in progress"
                                      ? baseTheme.palette.warning.main
                                      : project.status === "completed"
                                        ? baseTheme.palette.success.main
                                        : "rgb(124, 135, 142)",
                        }}
                    >
                        <Typography sx={{ margin: "0" }}>
                            {project.status.toUpperCase()}
                        </Typography>
                    </Box>
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
                </Paper>
            </Container>
        </>
    );
}
