'use client';

import Link from "next/link";
import React, { Fragment, useEffect, useState } from "react";

// Types
type Assessment = {
    id: string;
    name: string;
    startDate: string;
    dueDate: string;
    questionsCount: number;
    completedByOthers?: number;
    completedQuestions?: number;
    status: "pastDue" | "toDo" | "upcoming";
};

// Helper to split assessments by status
const splitAssessments = (assessments: Assessment[]) => ({
    pastDue: assessments.filter(a => a.status === "pastDue"),
    toDo: assessments.filter(a => a.status === "toDo"),
    upcoming: assessments.filter(a => a.status === "upcoming"),
});

// Assessment Section
const Section: React.FC<{
    projectId: string;
    title: string;
    assessments: Assessment[];
    clickable?: boolean;
    showCompletedByOthers?: boolean;
    showCompletedQuestions?: boolean;
}> = ({
    projectId,
    title,
    assessments,
    clickable = false,
    showCompletedByOthers = false,
    showCompletedQuestions = false,
}) => (
    <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <div className="space-y-2">
            {assessments.length === 0 && (
                <div className="text-gray-500 text-sm">No assessments.</div>
            )}
            {assessments.map((a) => (
                <Fragment key={a.id}>
                    {clickable ? (
                        <Link href={`/projects/${projectId}/assessments/${a.id}`} key={a.id}>
                            <div
                                key={a.id}
                                className={`flex items-center justify-between p-4 rounded border ${
                                    clickable
                                        ? "cursor-pointer hover:bg-gray-50 transition"
                                        : "bg-gray-100"
                                }`}
                            >
                                <div className="flex-1">
                                    <div className="font-medium">{a.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {a.startDate} &ndash; {a.dueDate}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-sm">
                                        <span className="font-semibold">{a.questionsCount}</span> questions
                                    </div>
                                    {showCompletedQuestions && (
                                        <div className="text-sm text-green-700">
                                            <span className="font-semibold">{a.completedQuestions ?? 0}</span> answered
                                        </div>
                                    )}
                                </div>
                            </div>

                        </Link>
                    ) : (
                        <div
                            className={`flex items-center justify-between p-4 rounded border ${
                                clickable
                                    ? "cursor-pointer hover:bg-gray-50 transition"
                                    : "bg-gray-100"
                            }`}
                        >
                            <div className="flex-1">
                                <div className="font-medium">{a.name}</div>
                                <div className="text-xs text-gray-500">
                                    {a.startDate} &ndash; {a.dueDate}
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-sm">
                                    <span className="font-semibold">{a.questionsCount}</span> questions
                                </div>
                            </div>
                        </div>
                        )
                    }
                    {showCompletedByOthers && (
                        <Link href={""}>
                            <PeersBox count={a.completedByOthers ?? 0} />
                        </Link>
                    )}
                </Fragment>
            ))}
        </div>
    </section>
);

const PeersBox: React.FC<{ count: number }> = ({ count }) => (
    <div className="bg-blue-100 text-blue-800 rounded px-3 py-1 text-xs font-semibold text-center min-w-[48px] cursor-pointer">
        {count} peer submissions
    </div>
);

interface ProjectViewProps {
    projectId: string
}
const ClientProjectView: React.FC<ProjectViewProps> = ({ projectId }) => {

    const [assessments, setAssessments] = useState([]);

    // Getting the project's assessments
    useEffect(() => {
        console.log("In useEffect");
        fetch('http://localhost:3003/assessments/byProject/' + projectId)
            .then(res => res.json())
            .then(setAssessments);
    }, []);

    const { pastDue, toDo, upcoming } = splitAssessments(assessments);

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Back Arrow */}
            <Link href="/dashboard">
                <button
                    className="mb-6 flex items-center text-gray-700 hover:text-black"
                    aria-label="Back"
                >
                    Back
                </button>
            </Link>

            {/* Past Due Assessments Section */}
            <Section
                projectId={projectId}
                title="Past Due Assessments"
                assessments={pastDue}
                clickable
                showCompletedByOthers
            />

            {/* To Do Assessments Section */}
            <Section
                projectId={projectId}
                title="To Do Assessments"
                assessments={toDo}
                clickable
                showCompletedQuestions
            />

            {/* Upcoming Assessments Section */}
            <Section
                projectId={projectId}
                title="Upcoming Assessments"
                assessments={upcoming}
            />
        </div>
    );
};

export default ClientProjectView;
