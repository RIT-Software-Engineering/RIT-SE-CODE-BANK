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
import { Assessment } from "@/types/assessment";
import { UserProfile } from "@/types/userProfile";
import { Close } from "@mui/icons-material";
import {
    ListItem,
    IconButton,
    ListItemButton,
    ListItemText,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Alert,
    DialogActions,
    Stack,
    Card,
    CardContent,
    Typography,
    List,
} from "@mui/material";
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
                <BackArrow />
                <p>You ain't an overseer for this project &gt;:*(</p>
            </div>
        );

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <BackArrow />
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Project Peers</h2>
                <List>
                    {peers.map((peer) => (
                        <ListItem
                            key={peer.id}
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    aria-label="remove"
                                    color="error"
                                    onClick={() => handleRemovePeer(peer)}
                                    sx={{ m: 0, p: 0.5 }}
                                >
                                    <Close />
                                </IconButton>
                            }
                            disablePadding
                            sx={{
                                m: 0,
                                p: 0,
                                "&:last-child": { borderBottom: "none" },
                            }}
                        >
                            <ListItemButton
                                onClick={() => handleRemovePeer(peer)}
                                sx={{ m: 0, p: 1 }}
                            >
                                <ListItemText
                                    sx={{ m: 0 }}
                                    primary={
                                        <>
                                            {peer.name}
                                            <span
                                                style={{
                                                    color: "#888",
                                                    marginLeft: 8,
                                                }}
                                            >
                                                ({peer.email})
                                            </span>
                                        </>
                                    }
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => setShowAddPeerModal(true)}
                >
                    Add Peer
                </Button>
                <Dialog
                    open={showAddPeerModal}
                    onClose={() => {
                        setShowAddPeerModal(false);
                        setAddPeerEmail("");
                        setModalError("");
                    }}
                >
                    <DialogTitle>Add Peer</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Peer Email"
                            type="email"
                            fullWidth
                            variant="outlined"
                            value={addPeerEmail}
                            onChange={(e) => setAddPeerEmail(e.target.value)}
                            required
                        />
                        {modalError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {modalError}
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setShowAddPeerModal(false);
                                setAddPeerEmail("");
                                setModalError("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddPeer}
                            variant="contained"
                            color="primary"
                        >
                            Add
                        </Button>
                    </DialogActions>
                </Dialog>
            </section>
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">
                    Project Assessments
                </h2>
                <Stack spacing={2}>
                    {assessments
                        .toSorted(
                            (a, b) =>
                                new Date(a.startDate).getTime() -
                                new Date(b.startDate).getTime()
                        )
                        .map((a) => (
                            <Link
                                key={a.id}
                                href={`/projects/${projectId}/asOverseer/assessments/${a.id}`}
                                passHref
                                legacyBehavior
                            >
                                <Card
                                    variant="outlined"
                                    sx={{
                                        cursor: "pointer",
                                        "&:hover": { boxShadow: 3 },
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="h6">
                                            {a.name}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="textPrimary"
                                        >
                                            {new Date(
                                                a.startDate
                                            ).toLocaleDateString()}{" "}
                                            &ndash;{" "}
                                            {new Date(
                                                a.dueDate
                                            ).toLocaleDateString()}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    <hr />
                    <Card
                        variant="outlined"
                        sx={{
                            borderStyle: "dashed",
                        }}
                    >
                        <CardContent
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div>
                                <Typography
                                    variant="subtitle1"
                                    color="textPrimary"
                                >
                                    Assign New Assessment
                                </Typography>
                                <Typography variant="body2" color="textPrimary">
                                    Create and assign a new assessment to
                                    project peers.
                                </Typography>
                            </div>
                            <Link
                                href={`/projects/${projectId}/asOverseer/assignAssessment`}
                                passHref
                                legacyBehavior
                            >
                                <Button
                                    variant="contained"
                                    color="primary"
                                    sx={{ ml: 2 }}
                                >
                                    Assign
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </Stack>
            </section>
        </div>
    );
};

export default OverseerProjectView;
