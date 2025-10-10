import { useEffect, useState } from "react";
import { DataGrid} from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import axios from 'axios';
import { getServices } from "../api/services_api_imports";

export default function ServicesTable() {
    const [services, setServices] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:3000/services")
        .then((response) => {
            setServices(response.data);
            console.log(response.data);
        })
    }, []);

    const columns = [
        {field : "title", headerName : "Service", width : 130},
        {field : "hours_worked", headerName : "Hours Worked", width : 130},
        {field : "service_type", headerName : "Service Type", width : 130},
        {field : "other_contributions", headerName : "Comments", width : 130},
    ]
    
    const paginationModel = { page: 0, pageSize: 5 };

    return (
        <div>
            <h1>This is a header</h1>
            <Paper sx={{ height: 400, width: '100%' }}>
            <DataGrid
                rows={services}
                columns={columns}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[5]}
                sx={{ border: 0 }}
            />
            </Paper>
        </div>
    );
}