import { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, Button, CircularProgress, Collapse, Box
} from '@mui/material';
import HighlightsViewModal from './HighlightsViewModal';

export default function AdminHighlightsPage() {
    const [highlights, setHighlights] = useState([]);
    const [summaries, setSummaries] = useState({});
    const [loading, setLoading] = useState({});
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewModalForm, setViewModalForm] = useState({});

    useEffect(() => {
        axios.get('http://localhost:3000/highlights/all')
            .then(res => {
                console.log('highlights/all response:', res.data);
                setHighlights(res.data);
            })
            .catch(err => console.error('Error fetching highlights:', err));
    }, []);

    const handleView = (formId) => {
        axios.get(`http://localhost:3000/forms/${formId}/view_format`)
            .then(res => {
                setViewModalForm(res.data);
                setViewModalOpen(true);
            });
    };

    const handleSummarize = async (formId) => {
        if (summaries[formId]) {
            setSummaries(prev => ({ ...prev, [formId]: null }));
            return;
        }
        setLoading(prev => ({ ...prev, [formId]: true }));
        try {
            const res = await axios.post(`http://localhost:3000/highlights/${formId}/summarize`);
            setSummaries(prev => ({ ...prev, [formId]: res.data.summary || res.data.error }));
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to generate summary';
            setSummaries(prev => ({ ...prev, [formId]: msg }));
            setLoading(prev => ({ ...prev, [formId]: false }));
        }
    };

    return (
        <div style={{ padding: '20px', paddingTop: '80px' }}>
            <Typography variant="h4" gutterBottom>All Faculty Highlights</Typography>
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
                        {highlights.map((row) => (
                        <Fragment key={row.form_id}>
                            <TableRow>
                                <TableCell>{row.form_id}</TableCell>
                                    <TableCell>{row.faculty_name}</TableCell>
                                    <TableCell>{row.time_submitted ? new Date(row.time_submitted).toISOString().substring(0, 10) : 'N/A'}</TableCell>
                                    <TableCell sx={{ display: 'flex', gap: 1 }}>
                                        <Button size="small" variant="contained" onClick={() => handleView(row.form_id)}>
                                            View
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleSummarize(row.form_id)}
                                            disabled={loading[row.form_id]}
                                        >
                                            {loading[row.form_id]
                                                ? <CircularProgress size={16} />
                                                : summaries[row.form_id] ? 'Hide' : 'Summarize'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            <TableRow>
                                <TableCell colSpan={4} sx={{ py: 0 }}>
                                    <Collapse in={!!summaries[row.form_id]}>
                                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, my: 1 }}>
                                            <Typography variant="body2">{summaries[row.form_id]}</Typography>
                                        </Box>
                                    </Collapse>
                                </TableCell>
                            </TableRow>
                        </Fragment>
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
        </div>
    );
}
