import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, Button, Box
} from '@mui/material';
import HighlightsViewModal from './HighlightsViewModal';

export default function AdminHighlightsPage() {
    const [highlights, setHighlights] = useState([]);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewModalForm, setViewModalForm] = useState({});

    useEffect(() => {
        axios.get('http://localhost:3000/highlights/all')
            .then(res => setHighlights(res.data))
            .catch(err => console.error('Error fetching highlights:', err));
    }, []);

    const handleView = (formId) => {
        axios.get(`http://localhost:3000/forms/${formId}/view_format`)
            .then(res => { setViewModalForm(res.data); setViewModalOpen(true); });
    };

    /* Summarize / Regenerate — moved to Annual Eval page, kept here for future use
    const handleSummarize = async (formId, force = false) => { ... };
    */

    return (
        <Box sx={{ p: '20px', pt: '80px' }}>
            <Typography variant="h4" gutterBottom>Highlights</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Form ID</TableCell>
                            <TableCell>Faculty</TableCell>
                            <TableCell>Submitted</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {highlights.map(row => (
                            <TableRow key={row.form_id}>
                                <TableCell>{row.form_id}</TableCell>
                                <TableCell>{row.faculty_name}</TableCell>
                                <TableCell>{row.time_submitted ? new Date(row.time_submitted).toISOString().substring(0, 10) : 'N/A'}</TableCell>
                                <TableCell>
                                    <Button size="small" variant="contained" onClick={() => handleView(row.form_id)}>
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <HighlightsViewModal
                formData={viewModalForm}
                isOpen={viewModalOpen}
                closeModal={() => setViewModalOpen(false)}
                isAdmin={true}
            />
        </Box>
    );
}
