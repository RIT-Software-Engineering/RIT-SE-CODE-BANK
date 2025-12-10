import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

export default function SupervisedFormsTable({facultyId}){
    const [forms, setForms] = useState([]);

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
        {field : "time_submitted", headerName : "Submitted On", flex:1}
    ]

    const paginationModel = { page: 0, pageSize: 5 };

    return (
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
    )
}