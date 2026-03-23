import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

export default function TeachingEvalPage() {
    const [percentiles, setPercentiles] = useState([]);
    const [allEvals, setAllEvals] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3000/teaching_evals/percentiles')
            .then(res => res.json())
            .then(setPercentiles);
            
        fetch('http://localhost:3000/teaching_evals/all')
            .then(res => res.json())
            .then(setAllEvals);
    }, []);

    return (
        <div style={{ padding: '20px', paddingTop: '80px' }}>
            <Typography variant="h4" gutterBottom>Teaching Evaluations</Typography>

            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>All Teaching Evaluations</Typography>
            <TableContainer component={Paper} sx={{ mb: 4, maxHeight: 400 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Professor</TableCell>
                            <TableCell>Course</TableCell>
                            <TableCell>Semester</TableCell>
                            <TableCell>Year</TableCell>
                            <TableCell>Submitted</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allEvals.map((row, idx) => (
                            <TableRow key={idx}>
                                <TableCell>{row.professor_name}</TableCell>
                                <TableCell>{row.course_name}</TableCell>
                                <TableCell>{row.semester}</TableCell>
                                <TableCell>{row.year}</TableCell>
                                <TableCell>{row.time_submitted?.substring(0, 10)}</TableCell>
                            </TableRow>
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
