"use client";

/**
 * PeerSelectModal
 * 
 * A reusable modal for selecting project peers.
 * 
 * Supports selecting peers as a single group or splitting selections
 * into separate responder and receiver groups.
 * 
 * Includes Select All, Deselect All, individual peer selection,
 * and Done controls.
 * 
 * Selection state is controlled by the parent through props and 
 * callback functions.
 */
import {
    Box,
    Button,
    Typography,
} from "@mui/material";

import type { UserProfile } from "../types/userProfile";

export type PeerSelectModalProps = {
    isOpen: boolean;
    onClose: () => void;
    peers: UserProfile[];
    selected: UserProfile[];
    setSelected: (peers: UserProfile[]) => void;
    splitPeers: boolean;
    setSplitPeers: (split: boolean) => void;
    responders: UserProfile[];
    setResponders: (peers: UserProfile[]) => void;
    receivers: UserProfile[];
    setReceivers: (peers: UserProfile[]) => void;
};

export default function PeerSelectModal({
    isOpen,
    onClose,
    peers,
    selected,
    setSelected,
    splitPeers,
    setSplitPeers,
    responders,
    setResponders,
    receivers,
    setReceivers,
}: PeerSelectModalProps) {
    if (!isOpen) return null;

    const handleSelectAll = () => {
        if (splitPeers) {
            setResponders(peers);
            setReceivers(peers);
        } else {
            setSelected(peers);
        }
    };

    const handleDeselectAll = () => {
        if (splitPeers) {
            setResponders([]);
            setReceivers([]);
        } else {
            setSelected([]);
        }
    };

    const togglePeer = (
        peer: UserProfile,
        group: "all" | "responders" | "receivers"
    ) => {
        if (splitPeers) {
            if (group === "responders") {
                setResponders(
                    responders.includes(peer)
                        ? responders.filter((p) => p !== peer)
                        : [...responders, peer]
                );
            } else if (group === "receivers") {
                setReceivers(
                    receivers.includes(peer)
                        ? receivers.filter((p) => p !== peer)
                        : [...receivers, peer]
                );
            }
        } else {
            setSelected(
                selected.includes(peer)
                    ? selected.filter((p) => p !== peer)
                    : [...selected, peer]
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="rounded-lg shadow-lg p-6 w-full max-w-lg relative bg-white dark:bg-zinc-900">
                <Button
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: 16,
                        right: 24,
                        minWidth: 0,
                        color: "grey.600",
                        fontSize: 24,
                    }}
                >
                    ×
                </Button>

                <Typography variant="h5" fontWeight="bold" mb={3}>
                    Select Peers
                </Typography>

                <Box mb={4} display="flex" alignItems="center" gap={2}>
                    <Box display="flex" alignItems="center">
                        <input
                            type="checkbox"
                            checked={splitPeers}
                            onChange={(e) => setSplitPeers(e.target.checked)}
                            style={{ marginRight: 8 }}
                            id="split-peers-checkbox"
                        />
                        <label htmlFor="split-peers-checkbox">
                            Split into responders and receivers
                        </label>
                    </Box>
                </Box>

                <Box mb={4} display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleSelectAll}
                        type="button"
                    >
                        Select All
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleDeselectAll}
                        type="button"
                    >
                        Deselect All
                    </Button>
                </Box>

                {splitPeers ? (
                    <Box display="flex" gap={6}>
                        <Box flex={1}>
                            <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                mb={2}
                            >
                                Responders
                            </Typography>

                            <Box display="flex" flexWrap="wrap" gap={2}>
                                {peers.map((peer) => (
                                    <Button
                                        key={peer.id}
                                        variant={
                                            responders.includes(peer)
                                                ? "contained"
                                                : "outlined"
                                        }
                                        color={
                                            responders.includes(peer)
                                                ? "primary"
                                                : "inherit"
                                        }
                                        onClick={() =>
                                            togglePeer(peer, "responders")
                                        }
                                        sx={{
                                            borderRadius: 2,
                                            minWidth: 0,
                                            px: 2,
                                            py: 1,
                                            textTransform: "none",
                                        }}
                                    >
                                        {peer.name}
                                    </Button>
                                ))}
                            </Box>
                        </Box>

                        <Box flex={1}>
                            <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                mb={2}
                            >
                                Receivers
                            </Typography>

                            <Box display="flex" flexWrap="wrap" gap={2}>
                                {peers.map((peer) => (
                                    <Button
                                        key={peer.id}
                                        variant={
                                            receivers.includes(peer)
                                                ? "contained"
                                                : "outlined"
                                        }
                                        color={
                                            receivers.includes(peer)
                                                ? "primary"
                                                : "inherit"
                                        }
                                        onClick={() =>
                                            togglePeer(peer, "receivers")
                                        }
                                        sx={{
                                            borderRadius: 2,
                                            minWidth: 0,
                                            px: 2,
                                            py: 1,
                                            textTransform: "none",
                                        }}
                                    >
                                        {peer.name}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            mb={2}
                        >
                            Peers
                        </Typography>

                        <Box display="flex" flexWrap="wrap" gap={2}>
                            {peers.map((peer) => (
                                <Button
                                    key={peer.id}
                                    variant={
                                        selected.includes(peer)
                                            ? "contained"
                                            : "outlined"
                                    }
                                    color={
                                        selected.includes(peer)
                                            ? "primary"
                                            : "inherit"
                                    }
                                    onClick={() => togglePeer(peer, "all")}
                                    sx={{
                                        borderRadius: 2,
                                        minWidth: 0,
                                        px: 2,
                                        py: 1,
                                        textTransform: "none",
                                    }}
                                >
                                    {peer.name}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                )}

                <Box mt={6} display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onClose}
                        type="button"
                    >
                        Done
                    </Button>
                </Box>
            </div>
        </div>
    );
}