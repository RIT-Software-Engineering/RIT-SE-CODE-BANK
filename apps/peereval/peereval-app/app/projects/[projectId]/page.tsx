"use client";

import BackArrow from "@/components/BackArrow";
import { useAuth } from "@/context/AuthContext";
import { getAssessmentsByProject } from "@/services/assessment";
import {
    getProjectByID,
    getProjectOverseers,
    getProjectsPeers,
} from "@/services/project";
import { Assessment } from "@/types/assessment";
import { Project } from "@/types/project";
import { UserProfile } from "@/types/userProfile";
import { Drawer } from "@mui/material";
import Link from "next/link";
import React, { Fragment, useEffect, useState } from "react";
import { Card, CardContent, Typography, Button, Stack } from "@mui/material";

// Helper to split assessments by status
const splitAssessments = (assessments: Assessment[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
        pastDue: assessments.filter((a) => new Date(a.dueDate) < today),
        toDo: assessments.filter(
            (a) =>
                new Date(a.startDate) <= today && today <= new Date(a.dueDate)
        ),
        upcoming: assessments.filter((a) => new Date(a.startDate) > today),
    };
};

// Assessment Section
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
                <Typography color="text.secondary">No assessments.</Typography>
            )}
            {assessments.map((a) => (
                <Link
                    href={`/projects/${projectId}/assessments/${a.id}${
                        received ? "/received" : ""
                    }`}
                    key={a.id}
                    style={{ textDecoration: "none" }}
                >
                    <Card variant="outlined">
                        <CardContent>
                            <Typography
                                variant="subtitle1"
                                color="textPrimary"
                                fontWeight={500}
                            >
                                {a.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {new Date(a.startDate).toLocaleDateString()}{" "}
                                &ndash;{" "}
                                {new Date(a.dueDate).toLocaleDateString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </Stack>
    </section>
);

const ProjectPeersList: React.FC<{ projectId: string }> = ({ projectId }) => {
    const [peers, setPeers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await getProjectsPeers(projectId);
                setPeers(data);
            } catch (e) {
                setPeers([]);
            }
            setLoading(false);
        })();
    }, [projectId]);

    if (loading) return <div className="text-sm text-gray-500">Loading...</div>;
    if (peers.length === 0)
        return <div className="text-sm text-gray-500">No peers found.</div>;

    return (
        <ul className="space-y-1">
            {peers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((peer) => (
                    <li key={peer.id} className="text-md text-gray-800">
                        {peer.name}{" "}
                        <span className="text-sm text-gray-600">
                            ({peer.email})
                        </span>
                    </li>
                ))}
        </ul>
    );
};

interface ProjectViewProps {
    params: { projectId: string };
}
const ProjectView: React.FC<ProjectViewProps> = ({ params }) => {
    const { currentUser } = useAuth();
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [receivedAssessments, setReceivedAssessments] = useState<
        Assessment[]
    >([]);
    const [isLoading, setIsLoading] = useState<Boolean>(true);
    const [isInProject, setIsInProject] = useState<Boolean>(false);
    const [projectInfo, setProjectInfo] = useState<Project | undefined>(
        undefined
    );

    const { projectId } = params;

    useEffect(() => {
        (async () => {
            // Make sure user is in this project as a peer
            const ps = await getProjectsPeers(projectId);
            if (!ps.some((p) => p.id == currentUser?.id)) {
                setIsInProject(false);
                setIsLoading(false);
                return;
            }

            setIsInProject(true);

            // Getting the peer's assessments to respond to
            const as = await getAssessmentsByProject(projectId, {
                responder: currentUser?.id,
            });
            setAssessments(as);
            setIsLoading(false);

            // Getting the peer's received assessment responses
            const ras = await getAssessmentsByProject(projectId, {
                receiver: currentUser?.id,
            });
            // Only show if after due date
            setReceivedAssessments(
                ras.filter((ra) => new Date() > new Date(ra.dueDate))
            );

            // Get the project info
            setProjectInfo(await getProjectByID(projectId));
        })();
    }, [currentUser]);

    // Helper function to convert a string to camelCase (lowercase first, then camelCase based on spaces)
    function toCamelCase(str: string): string {
        return str
            .toLowerCase()
            .replace(/(?:^\w|[ ]\w)/g, (match, offset) =>
                offset === 0 ? match.toLowerCase() : match.trim().toUpperCase()
            )
            .replace(/\s+/g, "");
    }

    if (isLoading) return <p>Loading...</p>;
    if (!isInProject)
        return (
            <div className="max-w-3xl mx-auto py-8 px-4">
                <BackArrow />
                <p>You ain't in this project as a peer &gt;:(</p>
            </div>
        );

    const { pastDue, toDo, upcoming } = splitAssessments(assessments);

    console.dir(projectInfo);

    return (
        <>
            <div className="max-w-3xl mx-auto py-8 px-4">
                <BackArrow />

                {/* Past Due Assessments Section */}
                <Section
                    projectId={projectId}
                    title="Past Due Assessments"
                    assessments={pastDue}
                />

                {/* To Do Assessments Section */}
                <Section
                    projectId={projectId}
                    title="To Do Assessments"
                    assessments={toDo}
                />

                {/* Upcoming Assessments Section */}
                <Section
                    projectId={projectId}
                    title="Upcoming Assessments"
                    assessments={upcoming}
                />
                <hr className="mb-4" />

                {/* Received Feedback Section */}
                <Section
                    projectId={projectId}
                    title="Your Received Feedback"
                    assessments={receivedAssessments}
                    received
                />
            </div>
            <Drawer variant="permanent" anchor="right">
                <div className="w-64 p-4">
                    <Typography variant="h6" className="mb-2" fontWeight={600}>
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
                            (projectInfo == undefined
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
