"use client";

import BackArrow from "@/components/BackArrow";
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
import type { Assessment } from "@rit/peereval-components";
import { UserProfile } from "@/types/userProfile";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AddPeerDialog,
        ProjectPeerList,
        ProjectAssessmentList
     } from "@rit/peereval-components";

const OverseerProjectView: React.FC = () => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const [peers, setPeers] = useState<UserProfile[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [showAddPeerModal, setShowAddPeerModal] = useState(false);
    const [addPeerEmail, setAddPeerEmail] = useState("");
    const [modalError, setModalError] = useState("");
    const [isLoading, setIsLoading] = useState<Boolean>(true);
    const [isOverseer, setIsOverseer] = useState<Boolean>(false);

    const { projectId } = useParams<{ projectId: string }>();

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
                <BackArrow />
                <p>You ain't an overseer for this project &gt;:*(</p>
            </div>
        );

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <BackArrow />
            <ProjectPeerList
                peers={peers}
                onRemovePeer={handleRemovePeer}
                onAddPeer={() => setShowAddPeerModal(true)}
            />

            <AddPeerDialog
                open={showAddPeerModal}
                email={addPeerEmail}
                error={modalError}
                onEmailChange={setAddPeerEmail}
                onClose={() => {
                    setShowAddPeerModal(false);
                    setAddPeerEmail("");
                    setModalError("");
                }}
                onSubmit={handleAddPeer}
            />
            <ProjectAssessmentList
                assessments={assessments}
                onAssessmentSelect={(assessmentId) =>
                    router.push(
                        `/projects/${projectId}/asOverseer/assessments/${assessmentId}`
                    )
                }
                onAssign={() =>
                    router.push(`/projects/${projectId}/asOverseer/assignAssessment`)
                }
            />
        </div>
    );
};

export default OverseerProjectView;
