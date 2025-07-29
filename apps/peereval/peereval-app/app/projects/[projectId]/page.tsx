"use client";

import { useAuth } from "@/context/AuthContext";
import { getAssessmentsByProject } from "@/services/assessment";
import { getProjectsPeers } from "@/services/project";
import { Assessment } from "@/types/assessment";
import { UserProfile } from "@/types/userProfile";
import { Drawer } from "@mui/material";
import Link from "next/link";
import React, { Fragment, useEffect, useState } from "react";

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
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <div className="space-y-2">
            {assessments.length === 0 && (
                <div className="text-gray-500 text-sm">No assessments.</div>
            )}
            {assessments.map((a) => (
                <Link
                    href={`/projects/${projectId}/assessments/${a.id}${
                        received ? "/received" : ""
                    }`}
                    key={a.id}
                >
                    <div
                        key={a.id}
                        className={
                            "flex items-center justify-between p-4 rounded border cursor-pointer hover:bg-gray-50 transition mb-1"
                        }
                    >
                        <div className="flex-1">
                            <div className="font-medium">{a.name}</div>
                            <div className="text-xs text-gray-500">
                                {new Date(a.startDate).toLocaleDateString()}{" "}
                                &ndash;{" "}
                                {new Date(a.dueDate).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
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
        })();
    }, [currentUser]);

    if (isLoading) return <p>Loading...</p>;
    if (!isInProject)
        return (
            <div className="max-w-3xl mx-auto py-8 px-4">
                <Link href="/dashboard">
                    <button
                        className="mb-4 text-blue-600 underline"
                        aria-label="Back"
                    >
                        &larr; Back
                    </button>
                </Link>
                <p>You ain't in this project as a peer &gt;:(</p>
            </div>
        );

    const { pastDue, toDo, upcoming } = splitAssessments(assessments);

    return (
        <>
            <div className="max-w-3xl mx-auto py-8 px-4">
                {/* Back Arrow */}
                <Link href="/dashboard">
                    <button
                        className="mb-4 text-blue-600 underline"
                        aria-label="Back"
                    >
                        &larr; Back
                    </button>
                </Link>

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
                    <h3 className="text-xl font-semibold mb-2">Your Peers</h3>
                    <ProjectPeersList projectId={projectId} />
                </div>
                <Link
                    href="/journal"
                    className="bg-blue-600 text-white py-2 mx-2 rounded font-semibold cursor-pointer text-center"
                >
                    <button className="cursor-pointer">Your Journal</button>
                </Link>
            </Drawer>
        </>
    );
};

export default ProjectView;
