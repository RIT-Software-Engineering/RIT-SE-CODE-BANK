
"use client";

import { Close } from "@mui/icons-material";

import {
    ListItem,
    IconButton,
    ListItemButton,
    ListItemText,
    Button,
    List,
    Stack,
    Typography,
} from "@mui/material";

import type { UserProfile } from "../types/userProfile";

export type ProjectPeerListProps = {
    peers: UserProfile[];
    onRemovePeer?: (peer: UserProfile) => void;
    onAddPeer?: () => void;
    variant?: "management" | "compact";
    loading?: boolean;
    title?: string;
    showTitle?: boolean;
    emptyMessage?: string;
};

export default function ProjectPeerList({
    peers,
    onRemovePeer,
    onAddPeer,
    variant = "management",
    loading = false,
    title = "Project Peers",
    showTitle = true,
    emptyMessage = "No peers found.",
}: ProjectPeerListProps) {

    // Compact view: read-only peer list for sidebars.
    if (variant === "compact") {
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
                    {emptyMessage}
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
    }

    // Management view: peer list with removal and addition controls.
    return (
        <section className="mb-8">
            {showTitle && (
                <h2 className="text-lg font-semibold mb-4">
                    {title}
                </h2>
            )}

            {loading ? (
                <div className="text-sm text-gray-500">
                    Loading...
                </div>
            ) : (
                <List>
                    {peers.map((peer) => (
                        <ListItem
                            key={peer.id}
                            secondaryAction={
                                onRemovePeer && (
                                    <IconButton
                                        edge="end"
                                        aria-label={`Remove ${peer.name}`}
                                        color="error"
                                        onClick={() => onRemovePeer(peer)}
                                        sx={{ m: 0, p: 0.5 }}
                                    >
                                        <Close />
                                    </IconButton>
                                )
                            }
                            disablePadding
                            sx={{
                                m: 0,
                                p: 0,
                                "&:last-child": {
                                    borderBottom: "none",
                                },
                            }}
                        >
                            {onRemovePeer ? (
                                <ListItemButton
                                    onClick={() => onRemovePeer(peer)}
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
                            ) : (
                                <ListItemText
                                    sx={{ m: 0, p: 1 }}
                                    primary={`${peer.name} (${peer.email})`}
                                />
                            )}
                        </ListItem>
                    ))}
                </List>
            )}

            {onAddPeer && (
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={onAddPeer}
                >
                    Add Peer
                </Button>
            )}
        </section>
    );
}
