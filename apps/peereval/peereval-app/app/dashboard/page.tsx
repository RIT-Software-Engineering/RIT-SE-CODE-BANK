
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import {
    getProjectsByOverseer,
    getProjectsByPeer,
} from "@/services/project";

import type { Project } from "@/types/project";

import { ProjectCard } from "@rit/peereval-components";

import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardActionArea,
} from "@mui/material";

const Dashboard: React.FC = () => {
    const router = useRouter();
    const { currentUser } = useAuth();

    const [projectsAsPeer, setProjectsAsPeer] = useState<Project[]>([]);
    const [projectsAsOverseer, setProjectsAsOverseer] = useState<Project[]>([]);

    useEffect(() => {
        if (!currentUser) return;

        (async () => {
            // Get user's projects
            setProjectsAsPeer(await getProjectsByPeer(currentUser.id));
            setProjectsAsOverseer(
                await getProjectsByOverseer(currentUser.id)
            );
        })();
    }, [currentUser]);

    return (
        <Container maxWidth="lg" sx={{ px: 4, py: 10 }}>
            <Typography variant="h1" sx={{ mb: 8 }}>
                Projects
            </Typography>

            <Box sx={{ display: "grid", rowGap: 6 }}>
                {/* Projects as Peer */}
                <section>
                    <Typography variant="h2" sx={{ mb: 4 }}>
                        Projects as Peer
                    </Typography>

                    {projectsAsPeer.length === 0 ? (
                        <Typography color="textPrimary">
                            You are not a peer in any projects.
                        </Typography>
                    ) : (
                        <Grid container spacing={3}>
                            {projectsAsPeer.map((project) => (
                                <Grid
                                    key={project.id}
                                    size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                                >
                                    <ProjectCard
                                        name={project.name}
                                        description={project.description}
                                        onClick={() =>
                                            router.push(
                                                `/projects/${project.id}/`
                                            )
                                        }
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </section>

                <hr />

                {/* Projects as Overseer */}
                <section>
                    <Typography variant="h2" sx={{ mb: 4 }}>
                        Projects as Overseer
                    </Typography>

                    <Grid container spacing={3}>
                        {projectsAsOverseer.map((project) => (
                            <Grid
                                key={project.id}
                                size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                            >
                                <ProjectCard
                                    name={project.name}
                                    description={project.description}
                                    onClick={() =>
                                        router.push(
                                            `/projects/${project.id}/asOverseer`
                                        )
                                    }
                                />
                            </Grid>
                        ))}

                        {/* Create New Project */}
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <Card
                                variant="elevation"
                                sx={{
                                    height: "100%",
                                    borderStyle: "dashed",
                                }}
                                aria-label="Create new project"
                            >
                                <CardActionArea
                                    component={Link}
                                    href="/projects/create"
                                    focusRipple
                                    sx={{
                                        height: "100%",
                                        minHeight: 160,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexDirection: "column",
                                        textAlign: "center",
                                        p: 3,
                                    }}
                                >
                                    <Typography
                                        variant="h2"
                                        sx={{ lineHeight: 1, mb: 1 }}
                                    >
                                        +
                                    </Typography>

                                    <Typography
                                        fontWeight={600}
                                        color="textPrimary"
                                    >
                                        Create New Project
                                    </Typography>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    </Grid>
                </section>
            </Box>
        </Container>
    );
};

export default Dashboard;
