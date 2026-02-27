import { Modal, Box, Button, Typography, CircularProgress } from "@mui/material";
import { useState } from "react";
import axios from "axios";
import DataPreviewModal from "./DataPreviewPage";

export default function AddFileModal({ isOpen, closeModal, facultyId }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpload = async () => {
        if (!selectedFile) return;
        
        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("faculty_id", facultyId);

        try {
            const response = await axios.post("http://localhost:3000/file/upload", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.data.pdfData) {
                const binaryString = atob(response.data.data.pdfData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/pdf' });
                setPdfUrl(URL.createObjectURL(blob));
            }

            setParsedData(response.data.data);
            setShowPreview(true);
        } catch (error) {
            alert("Failed to upload file: " + (error.response?.data?.error || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreviewClose = () => {
        setShowPreview(false);
        setParsedData(null);
        setSelectedFile(null);
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
        closeModal();
    };

    return (
        <>
        <Modal open={isOpen && !showPreview} onClose={closeModal}>
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
                {isLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
                        <CircularProgress />
                        <Typography>Processing file...</Typography>
                    </Box>
                ) : (
                    <>
                        <input
                            type="file"
                            accept=".pdf,.csv"
                            onChange={(e) => setSelectedFile(e.target.files[0])}
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
                    </>
                )}
            </Box>
        </Modal>
        <DataPreviewModal isOpen={showPreview} closeModal={handlePreviewClose} parsedData={parsedData} facultyId={facultyId} pdfUrl={pdfUrl} />
        </>
    );
}
