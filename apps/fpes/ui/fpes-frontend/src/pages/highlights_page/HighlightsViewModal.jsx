import { IconButton, Modal, Paper, Button, Tabs, Tab, Box } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import DataPreviewPage from "./DataPreviewPage";
import { useState } from "react";

export default function HighlightsViewModal({formData, isOpen, closeModal, onOverwrite, currentUserId, isAdmin}){
    const [activeTab, setActiveTab] = useState(0);
    const canEdit = isAdmin || currentUserId === formData?.faculty_information?.faculty_id;
    
    const hasHighlights = !!formData?.highlights;
    const hasTeachingEval = !!formData?.teaching_eval;

    const parsedData = {
        name: formData?.faculty_information?.name || '',
        rank: formData?.faculty_information?.rank || '',
        unit: formData?.faculty_information?.unit || '',
        affiliations: formData?.faculty_information?.affiliations || '',
        period: formData?.highlights?.last_saved?.match(/^\d{4}/) || '',
        scholarship: formData?.grants || [],
        publication: formData?.publications || [],
        teaching: formData?.highlights?.teaching_section || '',
        service: formData?.highlights?.service_section || '',
        service_hours: formData?.highlights?.service_hours || null,
        administrative: formData?.highlights?.administrative_responsibilities || ''
    };

    const teachingEvalData = {
        course_code: formData?.teaching_eval?.course_name?.split(/[\s-]/)[0] || '',
        course_name: formData?.teaching_eval?.course_name || '',
        professor_name: formData?.teaching_eval?.professor_name || formData?.faculty_information?.name || '',
        semester: formData?.teaching_eval?.semester || '',
        year: formData?.teaching_eval?.year || '',
        table: formData?.teaching_eval?.questions || [],
        text_responses: formData?.teaching_eval?.text_responses || []
    };

    const pdfUrl = formData?.highlights?.form_id ? `http://localhost:3000/file/pdf/${formData.highlights.form_id}` : null;

    return (
        <Modal open={isOpen}>
            <Paper sx={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: "2%", maxWidth:"1200px", maxHeight:"600px", overflow:"auto"}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
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

                {(hasHighlights || hasTeachingEval) && (
                    <>
                        {hasHighlights && hasTeachingEval && (
                            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                                <Tab label="Highlights Form" />
                                <Tab label="Teaching Evaluation" />
                            </Tabs>
                        )}
                        
                        {(activeTab === 0 && hasHighlights) && (
                            <DataPreviewPage 
                                isOpen={true} 
                                closeModal={closeModal} 
                                parsedData={parsedData} 
                                facultyId={formData?.faculty_information?.faculty_id}
                                pdfUrl={pdfUrl}
                                readOnly={!canEdit}
                                formId={formData?.highlights?.form_id}
                                fileType="highlights"
                            />
                        )}
                        
                        {(activeTab === 1 && hasTeachingEval) && (
                            <DataPreviewPage 
                                isOpen={true} 
                                closeModal={closeModal} 
                                parsedData={teachingEvalData} 
                                facultyId={formData?.faculty_information?.faculty_id}
                                pdfUrl={pdfUrl}
                                readOnly={true}
                                fileType="teaching_eval"
                            />
                        )}
                        
                        {!hasHighlights && hasTeachingEval && (
                            <DataPreviewPage 
                                isOpen={true} 
                                closeModal={closeModal} 
                                parsedData={teachingEvalData} 
                                facultyId={formData?.faculty_information?.faculty_id}
                                pdfUrl={pdfUrl}
                                readOnly={true}
                                fileType="teaching_eval"
                            />
                        )}
                    </>
                )}
            </Paper>
        </Modal>
    )
}