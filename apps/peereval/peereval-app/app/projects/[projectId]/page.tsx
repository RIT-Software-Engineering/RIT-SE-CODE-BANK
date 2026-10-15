
"use client";

import BackArrow from "@/components/BackArrow";
import { useAuth } from "@/context/AuthContext";
import {
    getAssessmentsByProject,
    getReceivedAssessmentResponses,
} from "@/services/assessment";
import {
    getProjectByID,
    getProjectsPeers,
} from "@/services/project";
import { Assessment } from "@/types/assessment";
import { Project } from "@/types/project";
import { UserProfile } from "@/types/userProfile";
import { Drawer } from "@mui/material";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    Typography,
    Button,
    Stack,
} from "@mui/material";

// Helper to split assessments by date.
const splitAssessments = (assessments: Assessment[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
        pastDue: assessments.filter(
            (a) => new Date(a.dueDate) < today
        ),
        toDo: assessments.filter(
            (a) =>
                new Date(a.startDate) <= today &&
                today <= new Date(a.dueDate)
        ),
        upcoming: assessments.filter(
            (a) => new Date(a.startDate) > today
        ),
    };
};

// Assessment section and navigation.
const Section: React.FC<{
    projectId: string;
    title: string;
    assessments: Assessment[];
    received?: boolean;
}> = ({ projectId, title, assessments, received = false }) => (
    <section className="mb-8">
        <Typography variant="h6" component="h2" gutterBottom>
            {title}
        </Typography>

        <Stack spacing={2}>
            {assessments.length === 0 && (
                <Typography color="textPrimary">
                    No assessments.
                </Typography>
            )}

            {assessments.map((assessment) => (
                <Link
                    href={`/projects/${projectId}/assessments/${assessment.id}${
                        received ? "/received" : ""
                    }`}
                    key={assessment.id}
                    style={{ textDecoration: "none" }}
                >
                    <Card variant="outlined">
                        <CardContent>
                            <Typography
                                variant="subtitle1"
                                color="textPrimary"
                                fontWeight={500}
                            >
                                {assessment.name}
                            </Typography>

                            <Typography
                                variant="caption"
                                color="textPrimary"
                            >
                                {new Date(
                                    assessment.startDate
                                ).toLocaleDateString()}{" "}
                                &ndash;{" "}
                                {new Date(
                                    assessment.dueDate
                                ).toLocaleDateString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </Stack>
    </section>
);

// Sidebar showing the project's peers.
const ProjectPeersList: React.FC<{ projectId: string }> = ({
    projectId,
}) => {
    const [peers, setPeers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadPeers = async () => {
            setLoading(true);

            try {
                const data = await getProjectsPeers(projectId);

                if (!cancelled) {
                    setPeers(data);
                }
            } catch (error) {
                console.error("Failed to load project peers:", error);

                if (!cancelled) {
                    setPeers([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadPeers();

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    if (loading) {
        return (
            <div className="text-sm text-gray-500">
                Loading...
            </div>
        );
    }

    if (peers.length === 0) {
        return (
            <div className="text-sm text-gray-500">
                No peers found.
            </div>
        );
    }

    return (
        <Stack spacing={1} className="mt-2">
            {[...peers]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((peer) => (
                    <Stack
                        key={peer.id}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >
                        <Typography variant="body1" color="textPrimary">
                            {peer.name}
                        </Typography>

                        <Typography variant="body2" color="textPrimary">
                            ({peer.email})
                        </Typography>
                    </Stack>
                ))}
        </Stack>
    );
};

interface ProjectViewProps {
    params: Promise<{ projectId: string }>;
}

const ProjectView: React.FC<ProjectViewProps> = ({ params }) => {
    const { currentUser } = useAuth();
    const { projectId } = React.use(params);

    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [receivedAssessments, setReceivedAssessments] = useState<
        Assessment[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInProject, setIsInProject] = useState(false);
    const [projectInfo, setProjectInfo] = useState<
        Project | undefined
    >(undefined);

    useEffect(() => {
        if (!currentUser) return;

        let cancelled = false;

        const loadProject = async () => {
            setIsLoading(true);

            try {
                // Verify that this user belongs to the project as a peer.
                const projectPeers = await getProjectsPeers(projectId);

                if (cancelled) return;

                if (
                    !projectPeers.some(
                        (peer) => peer.id === currentUser.id
                    )
                ) {
                    setIsInProject(false);
                    setAssessments([]);
                    setReceivedAssessments([]);
                    return;
                }

                setIsInProject(true);

                // Load assigned assessments and project information.
                const [
                    peerAssessments,
                    receiverAssessments,
                    project,
                ] = await Promise.all([
                    getAssessmentsByProject(projectId, {
                        responder: currentUser.id,
                    }),
                    getAssessmentsByProject(projectId, {
                        receiver: currentUser.id,
                    }),
                    getProjectByID(projectId),
                ]);

                // Ignore results if the page has been left or changed.
                if (cancelled) return;

                setAssessments(peerAssessments);
                setProjectInfo(project);

                // Check which assessments have feedback released to this user.
                const releaseChecks = await Promise.all(
                    receiverAssessments.map(async (assessment) => {
                        try {
                            const feedback =
                                await getReceivedAssessmentResponses(
                                    assessment.id,
                                    currentUser.id,
                                    currentUser.id
                                );

                            return feedback.length > 0;
                        } catch (error) {
                            console.error(
                                `Failed to check released feedback for ${assessment.name}:`,
                                error
                            );

                            return false;
                        }
                    })
                );

                if (cancelled) return;

                // Show an assessment here only when released feedback exists.
                setReceivedAssessments(
                    receiverAssessments.filter(
                        (_, index) => releaseChecks[index]
                    )
                );
            } catch (error) {
                console.error(
                    "Failed to load project assessments:",
                    error
                );
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadProject();

        return () => {
            cancelled = true;
        };
    }, [projectId, currentUser]);

    const toCamelCase = (str: string): string =>
        str
            .toLowerCase()
            .replace(/(?:^\w|[ ]\w)/g, (match, offset) =>
                offset === 0
                    ? match.toLowerCase()
                    : match.trim().toUpperCase()
            )
            .replace(/\s+/g, "");

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (!isInProject) {
        return (
            <div className="max-w-3xl mx-auto py-8 px-4">
                <BackArrow />
                <p>You ain't in this project as a peer &gt;:(</p>
            </div>
        );
    }

    const { pastDue, toDo, upcoming } =
        splitAssessments(assessments);

    return (
        <>
            <div className="max-w-3xl mx-auto py-8 px-4">
                <BackArrow />

                <Section
                    projectId={projectId}
                    title="Past Due Assessments"
                    assessments={pastDue}
                />

                <Section
                    projectId={projectId}
                    title="To Do Assessments"
                    assessments={toDo}
                />

                <Section
                    projectId={projectId}
                    title="Upcoming Assessments"
                    assessments={upcoming}
                />

                <hr className="mb-4" />

                <Section
                    projectId={projectId}
                    title="Your Received Feedback"
                    assessments={receivedAssessments}
                    received
                />
            </div>

            <Drawer variant="permanent" anchor="right">
                <div className="w-64 p-4">
                    <Typography
                        variant="h6"
                        className="mb-2"
                        fontWeight={600}
                    >
                        Your Peers
                    </Typography>

                    <ProjectPeersList projectId={projectId} />

                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        component={Link}
                        href={
                            "/journal" +
                            (projectInfo === undefined
                                ? ""
                                : `?fromProject=${toCamelCase(
                                      projectInfo.name
                                  )}`)
                        }
                        sx={{ mt: 3 }}
                    >
                        Your Journal
                    </Button>
                </div>
            </Drawer>
        </>
    );
};

export default ProjectView;
