import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import HighlightsViewModal from '../highlights_page/HighlightsViewModal';

export default function SupervisedFormsTable({facultyId}){
    const [forms, setForms] = useState([]);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewModalForm, setViewModalForm] = useState({});

    function closeModal(){
        setViewModalOpen(false);
    }

    useEffect( () => {
        axios.get("http://localhost:3000/forms/supervisor/" + facultyId)
        .then((response) => {
            const data = response.data;
            data.map((form, index) => {
                form.time_submitted = form.time_submitted.match(/^\d{4}-\d{2}-\d{2}/)
            })
            setForms(data);
        })
    }, []);

    const columns = [
        {field : "name", headerName : "Faculty Name", flex:1},
        {field : "type", headerName : "Form Type", flex:.5},
        {field : "time_submitted", headerName : "Submitted On", flex:1},
        {field : "Open", flex: .5, sortable: false, renderCell : (params) => {
            const onClick = (e) => {
                axios.get("http://localhost:3000/forms/" + params.row.id + "/view_format")
                .then( (response) => {
                    setViewModalForm(response.data);
                    console.log(response.data);
                    setViewModalOpen(true);
                    console.log(viewModalOpen);
                });
                
            }

            return(
                <Button variant="contained" onClick={onClick}>View</Button>
            )
        }}
    ]

    const paginationModel = { page: 0, pageSize: 5 };

    return (
        <>
        <Box>
            <Typography variant='h4'>Your Supervisee's Forms</Typography>
            <DataGrid
                columns={columns}
                rows={forms}
                getRowId={(row) => row.id}
                paginationModel={paginationModel}
                sx={{ border: 0, minWidth:"600px" }}
            />
        </Box>
        <HighlightsViewModal formData={viewModalForm} isOpen={viewModalOpen} closeModal={() => closeModal()}/>
        </>
    )
}