"use client";

import { useState, useEffect } from "react";
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Typography,
    Box
} from "@mui/material";

export default function ApplicationsPage() {
    const [applications, setApplications] = useState([]);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/application");
            const data = await response.json();
            setApplications(data);
        } catch (error) {
            console.error("Error fetching applications:", error);
        }
    };

    const downloadResume = async (id) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/application/${id}/resume`);
            if (!response.ok) throw new Error('Failed to download resume');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = applications.find(app => app.id === id)?.resumeFileName || 'resume.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading resume:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Applications
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Coops Completed</TableCell>
                            <TableCell>Start Semester</TableCell>
                            <TableCell>Resume</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {applications.map((application) => (
                            <TableRow key={application.id}>
                                <TableCell>
                                    {application.firstName} {application.lastName}
                                </TableCell>
                                <TableCell>{application.ritEmail}</TableCell>
                                <TableCell>{application.coopsCompleted}</TableCell>
                                <TableCell>{application.startSemester}</TableCell>
                                <TableCell>
                                    {application.hasResume ? (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => downloadResume(application.id)}
                                        >
                                            Download {application.resumeFileName || 'Resume'}
                                        </Button>
                                    ) : (
                                        "No resume"
                                    )}
                                </TableCell>
                                <TableCell>
                                    {application.accepted ? "Accepted" : "Pending"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}