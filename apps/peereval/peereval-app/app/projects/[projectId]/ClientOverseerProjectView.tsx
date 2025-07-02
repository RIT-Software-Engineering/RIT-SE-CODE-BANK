'use client';

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";

type Peer = {
    id: string,
    name: string
}

type Assessment = {
    id: string,
    name: string,
    description: string,
    startDate: string,
    dueDate: string,
}

const ClientOverseerProjectView: React.FC<{
    projectId: string
}> = ({ projectId }) => {

    const [peers, setPeers] = useState<Peer[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);

    useEffect(() => {
        // Get the project peers
        fetch('http://localhost:3003/projects/getPeersFull/' + projectId)
            .then(res => res.json())
            .then(setPeers);
        
        // Get the project assessments
        fetch('http://localhost:3003/assessments/byProject/' + projectId)
            .then(res => res.json())
            .then(setAssessments);
    }, [])

    return (
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
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Project Peers</h2>
                <ul>
                    {peers.map(peer => (
                        <li key={peer.id}>{peer.name}</li>
                    ))}
                </ul>
            </section>
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Project Assessments</h2>
                    {assessments.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-4 rounded border">
                            <div className="flex-1">
                                <div className="font-medium">{a.name}</div>
                                <div className="text-xs text-gray-500">
                                    {a.startDate} &ndash; {a.dueDate}
                                </div>
                            </div>
                        </div>
                    ))}
            </section>
        </div>
    );
}

export default ClientOverseerProjectView;