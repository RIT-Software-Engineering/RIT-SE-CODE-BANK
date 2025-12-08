import { useState, useEffect} from 'react';
import { DataGrid, renderActionsCell} from '@mui/x-data-grid';

export default function SupervisedFaculty({supervisorId}){
    const [supervised, setSupervised] = useState([]);

    useEffect(() => {});

    const columns = [
        {field : "faculty_id", headerName : "Faculty ID", flex:.2},
        {field : "name", headerName : "Name", flex:1.}
    ]

    const paginationModel = { page: 0, pageSize: 5 };

    return (
        <DataGrid
            rows={supervised}
            columns={columns}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[5]}
            sx={{ border: 0 }}
        />
    )
}