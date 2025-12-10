import {useState, useEffect} from "react";
import axios from 'axios';
import { DataGrid } from "@mui/x-data-grid";
import { Button, Paper } from "@mui/material";
import { Link } from "react-router-dom";

export default function HighlightsPage({facultyId}){
    const [highlights, setHighlights] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:3000/highlights/submitted_by/" + facultyId)
        .then(response => {
            console.log(response);
            // Format Date Information into YYYY-MM-DD HH:MM:SS
            
            setHighlights(response.data);
        })
        .catch(console.log("Error Retrieving Highlights"))
    }, []);

    console.log(highlights)

    const columns = [
        {field : "id", headerName : "ID", flex:.2},
        {field : "time_submitted", headerName : "Submitted On", flex:1},
        {field: "action", headerName: "Action", 
            renderCell: (params) => (
                <Link to={`/highlights_form/${params.row.id}`}>
                Edit
                </Link>
        )}
        
    ]

    const paginationModel = { page: 0, pageSize: 5 };

    return (
        <div>
        <h1>Highlights</h1>
        <div>
        <Button component={Link} to="/highlights_form" variant="contained" style={{margin:"2%"}}>Create New Form</Button>
        </div>
        <Paper sx={{ height: 400, width: 600, display:"inline-block"}}>
        <DataGrid
            rows={highlights}
            columns={columns}
            initialState={{ pagination: { paginationModel } }}
        />
        </Paper>
        </div>
    )
}