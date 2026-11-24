"use client";

/**
 * AddPeerDialog
 * 
 * A reusable dialog for adding a peer to a project.
 * 
 * Displays an email input, validation errors, and Add/Cancel actions.
 * The parent component controls the input value and handles peer creation
 * through the supplied callbacks.
 * 
 * This component does not communicate directly with the backend.
 */
import {
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from "@mui/material";

export type AddPeerDialogProps = {
    open: boolean;
    email: string;
    error: string;
    onEmailChange: (email: string) => void;
    onClose: () => void;
    onSubmit: () => void;
};

export default function AddPeerDialog({
    open,
    email,
    error,
    onEmailChange,
    onClose,
    onSubmit,
}: AddPeerDialogProps) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add Peer</DialogTitle>

            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Peer Email"
                    type="email"
                    fullWidth
                    variant="outlined"
                    value={email}
                    onChange={(event) =>
                        onEmailChange(event.target.value)
                    }
                    required
                />

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    Cancel
                </Button>

                <Button
                    onClick={onSubmit}
                    variant="contained"
                    color="primary"
                >
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
}