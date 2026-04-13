import { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Typography, Collapse, Box, Divider, Card, CardContent, Chip, Stack, Button, CircularProgress
} from '@mui/material';

export default function TeachingEvalPage() {
    const [percentiles, setPercentiles] = useState([]);
    const [allEvals, setAllEvals] = useState([]);
    const [selectedFormId, setSelectedFormId] = useState(null);
    const [evalDetail, setEvalDetail] = useState(null);
    const [summaries, setSummaries] = useState({});
    const [loading, setLoading] = useState({});

    useEffect(() => {
        fetch('http://localhost:3000/teaching_evals/percentiles')
            .then(res => res.json())
            .then(setPercentiles);

        fetch('http://localhost:3000/teaching_evals/all')
            .then(res => res.json())
            .then(setAllEvals);
    }, []);

    function handleRowClick(formId) {
        if (selectedFormId === formId) {
            setSelectedFormId(null);
            setEvalDetail(null);
            return;
        }
        setSelectedFormId(formId);
        setEvalDetail(null);
        fetch(`http://localhost:3000/teaching_evals/${formId}/view`)
            .then(res => res.json())
            .then(setEvalDetail);
    }

    const handleSummarize = async (formId) => {
        if (summaries[formId]) {
            setSummaries(prev => ({ ...prev, [formId]: null }));
            return;
        }
        setLoading(prev => ({ ...prev, [formId]: true }));
        try {
            const res = await fetch(`http://localhost:3000/teaching_evals/${formId}/summarize`, {
                method: 'POST'
            });
            const data = await res.json();
            setSummaries(prev => ({ ...prev, [formId]: data.summary || data.error }));
        } catch (err) {
            setSummaries(prev => ({ ...prev, [formId]: 'Failed to generate summary' }));
        } finally {
            setLoading(prev => ({ ...prev, [formId]: false }));
        }
    };

    return (
        <div style={{ padding: '20px', paddingTop: '80px' }}>
            <Typography variant="h4" gutterBottom>Teaching Evaluations</Typography>

            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>All Teaching Evaluations</Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Professor</TableCell>
                            <TableCell>Course</TableCell>
                            <TableCell>Semester</TableCell>
                            <TableCell>Year</TableCell>
                            <TableCell>Submitted</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allEvals.map((row, idx) => (
                            <>
                                <TableRow
                                    key={idx}
                                    hover
                                    onClick={() => handleRowClick(row.form_id)}
                                    sx={{ cursor: 'pointer', bgcolor: selectedFormId === row.form_id ? 'action.selected' : 'inherit' }}
                                >
                                    <TableCell>{row.professor_name}</TableCell>
                                    <TableCell>{row.course_name}</TableCell>
                                    <TableCell>{row.semester}</TableCell>
                                    <TableCell>{row.year}</TableCell>
                                    <TableCell>{row.time_submitted?.substring(0, 10)}</TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSummarize(row.form_id);
                                            }}
                                            disabled={loading[row.form_id]}
                                        >
                                            {loading[row.form_id]
                                                ? <CircularProgress size={16} />
                                                : summaries[row.form_id] ? 'Hide' : 'Summarize'}
                                        </Button>
                                    </TableCell>
                                </TableRow>

                                <TableRow key={`${idx}-summary`}>
                                    <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                        <Collapse in={!!summaries[row.form_id]} unmountOnExit>
                                            <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, my: 1 }}>
                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#1976d2' }}>
                                                    AI Summary
                                                </Typography>
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                    {summaries[row.form_id]}
                                                </Typography>
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>

                                <TableRow key={`${idx}-detail`}>
                                    <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                        <Collapse in={selectedFormId === row.form_id} unmountOnExit>
                                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                {!evalDetail && <Typography variant="body2">Loading...</Typography>}

                                                {evalDetail && evalDetail.questions?.length > 0 && (
                                                    <>
                                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                            Question Scores
                                                        </Typography>
                                                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell>#</TableCell>
                                                                        <TableCell>Question</TableCell>
                                                                        <TableCell align="right">N</TableCell>
                                                                        <TableCell align="right">Avg</TableCell>
                                                                        <TableCell align="right">SWEN Avg</TableCell>
                                                                        <TableCell align="right">Top Two</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {evalDetail.questions.map((q, qIdx) => (
                                                                        <TableRow key={qIdx}>
                                                                            <TableCell>{q.question_number}</TableCell>
                                                                            <TableCell>{q.question}</TableCell>
                                                                            <TableCell align="right">{q.n}</TableCell>
                                                                            <TableCell align="right">{q.avg}</TableCell>
                                                                            <TableCell align="right">{q.swen_avg}</TableCell>
                                                                            <TableCell align="right">{q.top_two}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    </>
                                                )}

                                                {evalDetail && evalDetail.text_responses?.length > 0 && (
                                                    <>
                                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3, mb: 2 }}>
                                                            Written Responses
                                                        </Typography>
                                                        {evalDetail.text_responses.map((section, sIdx) => (
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
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            </>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography variant="h5" gutterBottom>Percentile Rankings</Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Professor</TableCell>
                            <TableCell align="right">Avg Score</TableCell>
                            <TableCell align="right">Eval Count</TableCell>
                            <TableCell align="right">Percentile</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {percentiles.map((row, idx) => (
                            <TableRow key={idx}>
                                <TableCell>{row.professor_name}</TableCell>
                                <TableCell align="right">{row.overall_avg?.toFixed(2)}</TableCell>
                                <TableCell align="right">{row.eval_count}</TableCell>
                                <TableCell align="right">{row.percentile?.toFixed(1)}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}
