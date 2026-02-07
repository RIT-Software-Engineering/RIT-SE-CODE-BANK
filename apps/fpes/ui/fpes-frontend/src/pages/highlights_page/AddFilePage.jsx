import { Modal, Box, Button, Typography } from "@mui/material";
import { useState } from "react";

export default function AddFileModal({ isOpen, closeModal }) {
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = () => {
        if (!selectedFile) return;
        
        const formData = new FormData();
        formData.append("file", selectedFile);

        //Replace later with actual upload endpoint
        console.log("Uploading file:", selectedFile.name);
        closeModal();
    };

    return (
        <Modal open={isOpen} onClose={closeModal}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
            }}>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                    Upload File
                </Typography>
                <input
                    type="file"
                    accept=".pdf,.csv"
                    onChange={handleFileChange}
                    style={{ marginBottom: '20px' }}
                />
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button variant="contained" onClick={handleUpload} disabled={!selectedFile}>
                        Upload
                    </Button>
                    <Button variant="outlined" onClick={closeModal}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
