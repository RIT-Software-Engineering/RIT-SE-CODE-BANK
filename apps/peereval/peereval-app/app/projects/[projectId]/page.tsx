
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

import type { Assessment } from "@/types/assessment";
import type { Project } from "@/types/project";
import type { UserProfile } from "@rit/peereval-components";

import {
    AssessmentSection,
    ProjectPeerList,
} from "@rit/peereval-components";

import {
    Button,
    Drawer,
    Typography,
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

// Fetches project peers using PeerEval's project service
// and delegates their presentation to the shared component.
const ProjectPeersSidebar: React.FC<{ projectId: string }> = ({
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

    return (
        <ProjectPeerList
            peers={peers}
            loading={loading}
            variant="compact"
            showTitle={false}
            emptyMessage="No peers found."
        />
    );
};

interface ProjectViewProps {
    params: Promise<{ projectId: string }>;
}

const ProjectView: React.FC<ProjectViewProps> = ({ params }) => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const { projectId } = React.use(params);

    const handleAssessmentSelect = (
        assessmentId: string,
        received = false
    ) => {
        router.push(
            `/projects/${projectId}/assessments/${assessmentId}${
                received ? "/received" : ""
            }`
        );
    };

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

                <AssessmentSection
                    title="Past Due Assessments"
                    assessments={pastDue}
                    onAssessmentSelect={handleAssessmentSelect}
                />

                <AssessmentSection
                    title="To Do Assessments"
                    assessments={toDo}
                    onAssessmentSelect={handleAssessmentSelect}
                />

                <AssessmentSection
                    title="Upcoming Assessments"
                    assessments={upcoming}
                    onAssessmentSelect={handleAssessmentSelect}
                />

                <hr className="mb-4" />

                <AssessmentSection
                    title="Your Received Feedback"
                    assessments={receivedAssessments}
                    onAssessmentSelect={(assessmentId) =>
                        handleAssessmentSelect(assessmentId, true)
                    }
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

                    <ProjectPeersSidebar projectId={projectId} />

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
