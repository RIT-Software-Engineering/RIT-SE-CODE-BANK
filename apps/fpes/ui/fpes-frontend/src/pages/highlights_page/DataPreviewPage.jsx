import { Modal, Box, Button, TextField, Typography, Paper, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from "react";
import axios from "axios";

export default function DataPreviewModal({ isOpen, closeModal, parsedData }) {
    console.log("DataPreviewModal received:", parsedData);
    const [formData, setFormData] = useState(parsedData || {});
    
    useEffect(() => {
        if (parsedData) {
            setFormData(parsedData);
        }
    }, [parsedData]);
    
    console.log("formData state:", formData);

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSave = async () => {
        console.log("Saving data:", formData);
        
        try {
            await axios.post("http://localhost:3000/highlights/parsed", formData);
            alert("Data saved successfully");
            closeModal();
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save data");
        }
    };

    if (!isOpen) return null;

    return (
        <Modal open={isOpen}>
            <Paper sx={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: "2%", maxWidth:"1200px", maxHeight:"600px", overflow:"auto"}}>
                <IconButton onClick={closeModal} sx={{float: 'right'}}>
                    <CloseIcon/>
                </IconButton>
                <Typography variant="h6" component="h2" sx={{ mb: 2, clear: 'both' }}>Review and Edit Parsed Data</Typography>
                
                <h3>Basic Information</h3>
                <TextField fullWidth label="Name" value={formData.name || ''} 
                    onChange={(e) => handleChange('name', e.target.value)} sx={{ mb: 2 }} />
                
                <TextField fullWidth label="Rank" value={formData.rank || ''} 
                    onChange={(e) => handleChange('rank', e.target.value)} sx={{ mb: 2 }} />
                
                <TextField fullWidth label="Unit" value={formData.unit || ''} 
                    onChange={(e) => handleChange('unit', e.target.value)} sx={{ mb: 2 }} />
                
                <TextField fullWidth label="Affiliations" value={formData.affiliations || ''} 
                    onChange={(e) => handleChange('affiliations', e.target.value)} sx={{ mb: 2 }} />
                
                <TextField fullWidth label="Period" value={formData.period || ''} 
                    onChange={(e) => handleChange('period', e.target.value)} sx={{ mb: 2 }} />
                
                <h3>Scholarship</h3>
                <TextField fullWidth multiline rows={6} 
                    value={formData.scholarship || ''} 
                    onChange={(e) => handleChange('scholarship', e.target.value)} sx={{ mb: 2 }} />
                
                <h3>Teaching</h3>
                <TextField fullWidth multiline rows={6} 
                    value={formData.teaching || ''} 
                    onChange={(e) => handleChange('teaching', e.target.value)} sx={{ mb: 2 }} />
                
                <h3>Service</h3>
                <TextField fullWidth multiline rows={6} 
                    value={formData.service || ''} 
                    onChange={(e) => handleChange('service', e.target.value)} sx={{ mb: 2 }} />
                
                <h3>Administrative</h3>
                <TextField fullWidth multiline rows={6} 
                    value={formData.administrative || ''} 
                    onChange={(e) => handleChange('administrative', e.target.value)} sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button variant="contained" onClick={handleSave}>Save</Button>
                    <Button variant="outlined" onClick={closeModal}>Cancel</Button>
                </Box>
            </Paper>
        </Modal>
    );
}
