import {useState, useEffect} from "react";
import axios from 'axios';
import { DataGrid } from "@mui/x-data-grid";
import { Button, Paper, Box, Card, CardContent, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import HighlightsViewModal from "./HighlightsViewModal";
import AddFileModal from "./AddFilePage";
import DataPreviewModal from "./DataPreviewPage";

export default function HighlightsPage({facultyId, isAdmin = false}){
    const [highlights, setHighlights] = useState([]);
    const [teachingEvals, setTeachingEvals] = useState([]);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewModalForm, setViewModalForm] = useState({});
    const [viewModalType, setViewModalType] = useState('highlights');
    const [addFileModalOpen, setAddFileModalOpen] = useState(false);
    const [percentile, setPercentile] = useState(null);

    function loadHighlights() {
        axios.get("http://localhost:3000/highlights/submitted_by/" + facultyId)
        .then(response => {
            const data = response.data;
            data.map((form) => {
                form.time_submitted = form.time_submitted.match(/^\d{4}-\d{2}-\d{2}/);
                form.type = 'Highlights';
            })
            setHighlights(data);
        })
        .catch(() => console.log("Error Retrieving Highlights"))
    }

    function loadTeachingEvals() {
        axios.get("http://localhost:3000/teaching_evals/submitted_by/" + facultyId)
        .then(response => {
            const data = response.data;
            data.map((form) => {
                form.time_submitted = form.time_submitted.match(/^\d{4}-\d{2}-\d{2}/);
                form.type = 'Teaching Eval';
                form.id = form.form_id;
            })
            setTeachingEvals(data);
        })
        .catch(() => console.log("Error Retrieving Teaching Evals"))
    }

    // Load percentile data for faculty member on component mount
    function loadPercentile() {
        axios.get("http://localhost:3000/teaching_evals/percentile/faculty/" + facultyId)
        .then(response => {
            if (response.data) {
                setPercentile(response.data);
            }
        })
        .catch(err => console.log("Error Retrieving Percentile:", err))
    }

    useEffect(() => {
        loadHighlights();
        loadTeachingEvals();
        loadPercentile();
    }, [facultyId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reload percentile when returning to the page
    useEffect(() => {
        const handleFocus = () => loadPercentile();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [facultyId]); // eslint-disable-line react-hooks/exhaustive-deps

    const columns = [
        {field : "id", headerName : "ID", flex:.2},
        {field : "type", headerName : "Type", flex:.5},
        {field : "time_submitted", headerName : "Submitted On", flex:1},
        {field : "Open", flex: .5, sortable: false, renderCell : (params) => (
            <Button variant="contained" onClick={() => {
                if (params.row.type === 'Teaching Eval') {
                    axios.get("http://localhost:3000/teaching_evals/" + params.row.id + "/view")
                    .then(response => {
                        const data = response.data;
                        if (!isAdmin && data.faculty_information_id !== facultyId) {
                            alert('You do not have permission to view this teaching evaluation');
                            return;
                        }
                        setViewModalForm(data);
                        setViewModalType('teaching_eval');
                        setViewModalOpen(true);
                    });
                } else {
                    axios.get("http://localhost:3000/forms/" + params.row.id + "/view_format")
                    .then(response => {
                        setViewModalForm(response.data);
                        setViewModalType('highlights');
                        setViewModalOpen(true);
                    });
                }
            }}>View</Button>
        )}

    ]

    const paginationModel = { page: 0, pageSize: 5 };

    return (
        <div>
        <h1>Highlights & Teaching Evaluations</h1>
        {percentile && (
            <Card sx={{ position: 'absolute', top: 80, right: 20, minWidth: 150, bgcolor: '#f5f5f5', boxShadow: 1 }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary">Teaching Eval Percentile</Typography>
                    <Typography variant="h6" color="text.primary">{percentile.percentile?.toFixed(1)}%</Typography>
                    <Typography variant="caption" color="text.secondary">Avg: {percentile.overall_avg?.toFixed(2)}</Typography>
                </CardContent>
            </Card>
        )}
        <div>
        <Button component={Link} to="/highlights_form" variant="contained" style={{margin:"2%"}}>Create New Form</Button>
        <Button variant="contained" style={{margin:"2%"}} onClick={() => setAddFileModalOpen(true)}>Add File</Button>
        </div>
        <Paper sx={{ height: 400, width: 600, display:"inline-block"}}>
        <DataGrid
            rows={[...highlights, ...teachingEvals]}
            columns={columns}
            initialState={{ pagination: { paginationModel } }}
        />
        </Paper>
        <HighlightsViewModal 
            formData={viewModalForm} 
            isOpen={viewModalOpen && viewModalType === 'highlights'} 
            closeModal={() => setViewModalOpen(false)} 
            onOverwrite={() => { setViewModalOpen(false); setAddFileModalOpen(true); }}
            currentUserId={facultyId}
            isAdmin={isAdmin}
        />
        <DataPreviewModal 
            isOpen={viewModalOpen && viewModalType === 'teaching_eval'}
            closeModal={() => setViewModalOpen(false)}
            parsedData={{ ...viewModalForm, table: viewModalForm.questions }}
            facultyId={facultyId}
            readOnly={true}
            fileType="teaching_eval"
        />
        <AddFileModal isOpen={addFileModalOpen} closeModal={() => { setAddFileModalOpen(false); loadHighlights(); loadTeachingEvals(); }} facultyId={facultyId}/>
        </div>
    )
}