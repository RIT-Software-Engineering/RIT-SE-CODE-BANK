import { Modal, Box, Button, TextField, Typography, Paper, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Card, CardContent, Chip, Stack } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from "react";
import axios from "axios";
import FundingTable from "./FundingTable";
import PublicationTable from "./PublicationTable";

export default function DataPreviewModal({ isOpen, closeModal, parsedData, facultyId, pdfUrl, readOnly = false, formId = null, fileType = 'highlights' }) {
    const [formData, setFormData] = useState(() => ({
        ...(parsedData || {}),
        scholarship: parsedData?.scholarship ?? [],
        publication: parsedData?.publication ?? [],
        table: parsedData?.table ?? [],
    }));
    
    useEffect(() => {
        if (parsedData) {
            setFormData({
                ...parsedData,
                scholarship: parsedData.scholarship ?? [],
                publication: parsedData.publication ?? [],
                table: parsedData.table ?? [],
            });
        }
    }, [parsedData]);

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSave = async () => {
        const { pdfData, ...dataToSave } = formData;
        
        try {
            if (fileType === 'teaching_eval') {
                await axios.post("http://localhost:3000/teaching_evals/parsed", { 
                    ...dataToSave, 
                    faculty_id: facultyId,
                    pdf_data: pdfData || null
                });
                alert("Teaching evaluation saved successfully");
            } else {
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
            }
            closeModal();
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save data");
        }
    };

    if (!isOpen) return null;

    const isTeachingEval = fileType === 'teaching_eval';

    return (
        <Modal open={isOpen}>
            <Paper sx={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: "2%", maxWidth:"1200px", maxHeight:"600px", overflow:"auto"}}>
                <IconButton onClick={closeModal} sx={{float: 'right'}}>
                    <CloseIcon/>
                </IconButton>
                <Typography variant="h6" component="h2" sx={{ mb: 2, clear: 'both' }}>
                    {isTeachingEval ? 'Review Teaching Evaluation' : 'Review and Edit Parsed Data'}
                </Typography>
                
                {pdfUrl && (
                    <Button variant="outlined" onClick={() => window.open(pdfUrl, '_blank')} sx={{ mb: 2 }}>
                        View PDF
                    </Button>
                )}
                
                {isTeachingEval ? (
                    <>
                        <h3>Course Information</h3>
                        <TextField fullWidth label="Course" value={`${formData.course_code || ''} ${formData.course_name || ''}`.trim()} 
                            sx={{ mb: 2 }} disabled />
                        <TextField fullWidth label="Professor" value={formData.professor_name || ''} 
                            sx={{ mb: 2 }} disabled />
                        <TextField fullWidth label="Semester" value={`${formData.semester || ''} ${formData.year || ''}`.trim()} 
                            sx={{ mb: 2 }} disabled />
                        
                        <h3>Evaluation Results</h3>
                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'orange' }}>
                                        <TableCell><b>Q#</b></TableCell>
                                        <TableCell><b>Question</b></TableCell>
                                        <TableCell><b>N</b></TableCell>
                                        <TableCell><b>Responses</b></TableCell>
                                        <TableCell><b>Avg</b></TableCell>
                                        <TableCell><b>Top 2</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formData.table?.sort((a, b) => parseInt(a.question_number) - parseInt(b.question_number)).map((q, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{q.question_number}</TableCell>
                                            <TableCell>{q.question}</TableCell>
                                            <TableCell>{q.n}</TableCell>
                                            <TableCell>
                                                {q.yes ? `Yes: ${q.yes}, No: ${q.no}` :
                                                 `SA: ${q.str_agree}, A: ${q.agree}, N: ${q.neutral}, D: ${q.disagree}, SD: ${q.str_disagree}`}
                                            </TableCell>
                                            <TableCell>{q.avg}</TableCell>
                                            <TableCell>{q.top_two}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {formData.text_responses?.length > 0 && (
                            <>
                                <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Written Responses</h3>
                                {formData.text_responses.map((section, sIdx) => (
                                    <Card key={sIdx} sx={{ mb: 2, borderLeft: '4px solid #1976d2' }}>
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1, color: '#1976d2' }}>
                                                    {section.question}
                                                </Typography>
                                                <Chip 
                                                    label={`${section.responses.length} response${section.responses.length !== 1 ? 's' : ''}`} 
                                                    size="small" 
                                                    variant="outlined"
                                                />
                                            </Stack>
                                            <Stack spacing={1.5}>
                                                {section.responses.map((r, rIdx) => (
                                                    <Box 
                                                        key={rIdx}
                                                        sx={{ 
                                                            p: 1.5,
                                                            bgcolor: '#f5f5f5',
                                                            borderRadius: 1,
                                                            borderLeft: '3px solid #e0e0e0'
                                                        }}
                                                    >
                                                        <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                            {r}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </>
                        )}
                    </>
                ) : (
                    <>
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
                        <FundingTable rows={formData.scholarship ?? []} onRowsChange={(updatedRows) => handleChange('scholarship', updatedRows)} />
                        <PublicationTable rows={formData.publication ?? []} onRowsChange={(updatedRows) => handleChange('publication', updatedRows)}/>
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
                    </>
                )}
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    {!readOnly && <Button variant="contained" onClick={handleSave}>Save</Button>}
                    <Button variant="outlined" onClick={closeModal}>{readOnly ? 'Close' : 'Cancel'}</Button>
                </Box>
            </Paper>
        </Modal>
    );
}
