import { IconButton, Modal, Paper, Button } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import DataPreviewPage from "./DataPreviewPage";

export default function HighlightsViewModal({formData, isOpen, closeModal, onOverwrite, currentUserId, isAdmin}){
    const canEdit = isAdmin || currentUserId === formData?.faculty_information?.faculty_id;
    
    const parsedData = {
        name: formData?.faculty_information?.name || '',
        rank: formData?.faculty_information?.rank || '',
        unit: formData?.faculty_information?.unit || '',
        affiliations: formData?.faculty_information?.affiliations || '',
        period: formData?.highlights?.last_saved?.match(/^\d{4}/) || '',
        scholarship: formData?.grants || [],
        teaching: formData?.highlights?.teaching_section || '',
        service: formData?.highlights?.service_section || '',
        service_hours: formData?.highlights?.service_hours || null,
        administrative: formData?.highlights?.administrative_responsibilities || ''
    };

    const formId = formData?.highlights?.form_id;
    const pdfUrl = formId ? `http://localhost:3000/file/pdf/${formId}` : null;

    return (
        <Modal open={isOpen}>
            <Paper sx={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: "2%", maxWidth:"1200px", maxHeight:"600px", overflow:"auto"}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <IconButton onClick={closeModal}>
                        <CloseIcon/>
                    </IconButton>
                    {pdfUrl && (
                        <Button variant="outlined" onClick={() => window.open(pdfUrl, '_blank')} sx={{ ml: 2 }}>View Original PDF</Button>
                    )}
                    {onOverwrite && canEdit && (
                        <Button variant="outlined" onClick={onOverwrite} sx={{ ml: 2 }}>Overwrite</Button>
                    )}
                </div>
                <DataPreviewPage 
                    isOpen={true} 
                    closeModal={closeModal} 
                    parsedData={parsedData} 
                    facultyId={formData?.faculty_information?.faculty_id}
                    pdfUrl={pdfUrl}
                    readOnly={!canEdit}
                    formId={formId}
                />
            </Paper>
        </Modal>
    )
}