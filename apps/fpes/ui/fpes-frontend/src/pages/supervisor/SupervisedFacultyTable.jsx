import { useState, useEffect} from 'react';
import { DataGrid, renderActionsCell} from '@mui/x-data-grid';
import axios from 'axios';
import { Box, Typography } from '@mui/material';

export default function SupervisedFacultyTable({supervisorId}){
    const [supervised, setSupervised] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:3000/faculty/supervised_by/" + supervisorId)
        .then((res) => {
            setSupervised(res.data); 
            console.log("http://localhost:3000/faculty/supervised_by/" + supervisorId);
        })
    }, []);

    const columns = [
        {field : "faculty_id", headerName : "Faculty ID", flex:.5},
        {field : "name", headerName : "Name", flex:1.}
    ]

    const paginationModel = { page: 0, pageSize: 5 };

    return (
        <Box>
            <Typography variant="h4">People You Supervise</Typography>
            <DataGrid
                rows={supervised}
                columns={columns}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[5]}
                sx={{ border: 0, minWidth:"600px" }}
                getRowId={(row) => row.faculty_id}
            />
        </Box>
    )
}