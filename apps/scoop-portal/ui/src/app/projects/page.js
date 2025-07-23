"use client";

import React, { useEffect, useState } from "react";
import Header from "@components/Header";
import { Box, Button, Card, Container, Typography } from "@mui/material";
import baseTheme from "@styles/theme";

export default function Projects() {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        console.log("API URL: ", process.env.NEXT_PUBLIC_API_URL);
        const fetchProjects = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/project`
                );
                const data = await res.json();
                setProjects(data);
            } catch (err) {
                console.error("Failed to fetch projects: ", err);
            }
        };

        fetchProjects();
    }, []);

    return (
        <>
            <Header />
            <Container>
                <Typography variant="h1" sx={{ mb: 4 }}>
                    Projects
                </Typography>
                <>
                    {projects.map((project) => (
                        <Card
                            square
                            key={project.id}
                            sx={{
                                padding: "1em",
                                margin: "0.5rem",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography variant="h2">
                                    {project.display_name ||
                                        project.title ||
                                        "Unknown Project"}
                                </Typography>
                                <Button
                                    variant="solid-orange"
                                    href={`/projects/${project.id}`}
                                >
                                    View
                                </Button>
                            </Box>
                            <Box
                                sx={{
                                    padding: "0.25em 0.75em",
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
                        </Card>
                    ))}
                </>
            </Container>
        </>
    );
}
