import { Modal, Box, Button, TextField, Typography, Paper, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from "react";
import axios from "axios";
import FundingTable from "./FundingTable";
import PublicationTable from "./PublicationTable";

export default function DataPreviewModal({ isOpen, closeModal, parsedData, facultyId, pdfUrl, readOnly = false, formId = null }) {
    const [formData, setFormData] = useState(() => ({
        ...(parsedData || {}),
        scholarship: parsedData?.scholarship ?? [],
        publication: parsedData?.publication ?? [],
    }));
    
    useEffect(() => {
        if (parsedData) {
            setFormData({
                ...parsedData,
                scholarship: parsedData.scholarship ?? [],
                publication: parsedData.publication ?? [],
            });
        }
    }, [parsedData]);

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSave = async () => {
        const { pdfData, ...dataToSave } = formData;
        
        try {
            if (formId) {
                await axios.put(`http://localhost:3000/highlights/parsed/${formId}`, { 
                    ...dataToSave, 
                    faculty_id: facultyId
                });
                alert("Data updated successfully");
            } else {
                const result = await axios.post("http://localhost:3000/highlights/parsed", { 
                    ...dataToSave, 
                    faculty_id: facultyId,
                    pdf_data: pdfData || null
                });
                alert(result.data.replaced ? "Identical PDF found - existing form replaced" : "Data saved successfully");
            }
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
                
                {pdfUrl && (
                    <Button variant="outlined" onClick={() => window.open(pdfUrl, '_blank')} sx={{ mb: 2 }}>
                        View PDF
                    </Button>
                )}
                
                <h3>Basic Information</h3>
                <TextField fullWidth label="Name" value={formData.name || ''} 
                    onChange={(e) => handleChange('name', e.target.value)} 
                    sx={{ mb: 2 }} 
                    disabled={readOnly} />
                
                <TextField fullWidth label="Rank" value={formData.rank || ''} 
                    onChange={(e) => handleChange('rank', e.target.value)} 
                    sx={{ mb: 2 }} 
                    disabled={readOnly} />
                
                <TextField fullWidth label="Unit" value={formData.unit || ''} 
                    onChange={(e) => handleChange('unit', e.target.value)} 
                    sx={{ mb: 2 }} 
                    disabled={readOnly} />
                
                <TextField fullWidth label="Affiliations" value={formData.affiliations || ''} 
                    onChange={(e) => handleChange('affiliations', e.target.value)} 
                    sx={{ mb: 2 }} 
                    disabled={readOnly} />
                
                <TextField fullWidth label="Period" value={formData.period || ''} 
                    onChange={(e) => handleChange('period', e.target.value)} 
                    sx={{ mb: 2 }} 
                    disabled={readOnly} />
                
                <h3>Scholarship</h3>
                <FundingTable rows={formData.scholarship ?? []} />
                <PublicationTable rows={formData.publication ?? []}/>
                <h3>Teaching</h3>
                <TextField fullWidth multiline rows={6} 
                    value={formData.teaching || ''} 
                    onChange={(e) => handleChange('teaching', e.target.value)} 
                    sx={{ mb: 2 }} 
                    disabled={readOnly} />
                
                <h3>Service {formData.service_hours && <span style={{ color: "#555" }}>| Total hours:({formData.service_hours})</span>}</h3>
                <TextField fullWidth multiline rows={6} 
                    value={formData.service || ''} 
                    onChange={(e) => handleChange('service', e.target.value)} 
                    sx={{ mb: 2 }} 
                    disabled={readOnly} />
                
                <h3>Administrative</h3>
                <TextField fullWidth multiline rows={6} 
                    value={formData.administrative || ''} 
                    onChange={(e) => handleChange('administrative', e.target.value)} 
                    sx={{ mb: 2 }} 
                    disabled={readOnly} />
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    {!readOnly && <Button variant="contained" onClick={handleSave}>Save</Button>}
                    <Button variant="outlined" onClick={closeModal}>{readOnly ? 'Close' : 'Cancel'}</Button>
                </Box>
            </Paper>
        </Modal>
    );
}
