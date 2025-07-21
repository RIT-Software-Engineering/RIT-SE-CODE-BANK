"use client";

import { useAuth } from "@/context/AuthContext";
import {
    getAssessmentById,
    getAssessmentsByProject,
} from "@/services/assessment";
import {
    addProjectPeerByEmail,
    getProjectOverseers,
    getProjectsPeers,
    removeProjectPeerByEmail,
} from "@/services/project";
import { Assessment } from "@/types/assessment";
import { UserProfile } from "@/types/userProfile";
import Link from "next/link";
import { useEffect, useState } from "react";

const OverseerProjectView: React.FC<{
    params: { projectId: string };
}> = ({ params }) => {
    const { currentUser } = useAuth();
    const [peers, setPeers] = useState<UserProfile[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [showAddPeerModal, setShowAddPeerModal] = useState(false);
    const [addPeerEmail, setAddPeerEmail] = useState("");
    const [modalError, setModalError] = useState("");
    const [isLoading, setIsLoading] = useState<Boolean>(true);
    const [isOverseer, setIsOverseer] = useState<Boolean>(false);

    const { projectId } = params;

    useEffect(() => {
        (async () => {
            setIsLoading(true);

            // Make sure the user is an overseer for this project
            const os = await getProjectOverseers(projectId);
            if (!os.some((o) => o.id == currentUser?.id)) {
                setIsOverseer(false);
                setIsLoading(false);
                return;
            }

            setIsOverseer(true);
            setIsLoading(false);
        })();
    }, [currentUser]);

    useEffect(() => {
        (async () => {
            // Get project peers
            const ps = await getProjectsPeers(projectId);
            setPeers(ps);

            // Get project assessments
            const as = await getAssessmentsByProject(projectId);
            setAssessments(as);
        })();
    }, [showAddPeerModal]);

    const handleAddPeer = async () => {
        if (!addPeerEmail) return;
        try {
            await addProjectPeerByEmail(projectId, addPeerEmail);
        } catch (err) {
            setModalError((err as Error).message);
            return;
        }
        setShowAddPeerModal(false);
        setAddPeerEmail("");
    };

    const handleRemovePeer = async (peer: UserProfile) => {
        if (confirm(`Remove ${peer.name} from project?`)) {
            setPeers((prev) => prev.filter((p) => p.id !== peer.id));
            await removeProjectPeerByEmail(projectId, peer.email);
        }
    };

    if (isLoading) return <p>Loading...</p>;
    if (!isOverseer)
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
                <p>You ain't an overseer for this project &gt;:*(</p>
            </div>
        );

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
                    {peers.map((peer) => (
                        <li
                            key={peer.id}
                            className="group flex items-center gap-2 cursor-pointer"
                        >
                            <span
                                className="underline group-hover:text-blue-700"
                                title="Remove peer"
                                onClick={() => handleRemovePeer(peer)}
                            >
                                {peer.name}
                            </span>
                            <button
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                title="Remove peer"
                                onClick={() => handleRemovePeer(peer)}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
                <button
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => setShowAddPeerModal(true)}
                >
                    Add Peer
                </button>
                {showAddPeerModal && (
                    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm gap-6">
                        <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                            <h3 className="text-lg font-semibold mb-4">
                                Add Peer
                            </h3>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!addPeerEmail) return;
                                    handleAddPeer();
                                }}
                            >
                                <input
                                    type="email"
                                    className="w-full border rounded px-3 py-2 mb-4"
                                    placeholder="Enter peer email"
                                    value={addPeerEmail}
                                    onChange={(e) =>
                                        setAddPeerEmail(e.target.value)
                                    }
                                    required
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded bg-gray-200"
                                        onClick={() => {
                                            setShowAddPeerModal(false);
                                            setAddPeerEmail("");
                                            setModalError("");
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </form>
                        </div>
                        {modalError && (
                            <div className="bg-red-600 p-2 rounded shadow-lg">
                                <p className="text-white">{modalError}</p>
                            </div>
                        )}
                    </div>
                )}
            </section>
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">
                    Project Assessments
                </h2>
                {assessments
                    .toSorted(
                        (a, b) =>
                            new Date(a.startDate).getTime() -
                            new Date(b.startDate).getTime()
                    )
                    .map((a) => (
                        <Link
                            href={`/projects/${projectId}/asOverseer/assessments/${a.id}`}
                        >
                            <div
                                key={a.id}
                                className="flex items-center justify-between p-4 rounded border"
                            >
                                <div className="flex-1">
                                    <div className="font-medium">{a.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(
                                            a.startDate
                                        ).toLocaleDateString()}{" "}
                                        &ndash;{" "}
                                        {new Date(
                                            a.dueDate
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                <div className="flex items-center justify-between p-4 rounded border border-dashed mt-4 bg-gray-50">
                    <div className="flex-1">
                        <div className="font-medium text-gray-700">
                            Assign New Assessment
                        </div>
                        <div className="text-xs text-gray-500">
                            Create and assign a new assessment to project peers.
                        </div>
                    </div>
                    <Link
                        href={`/projects/${projectId}/asOverseer/assignAssessment`}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Assign
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default OverseerProjectView;
