"use client";

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