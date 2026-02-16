import {useState, useEffect} from "react";
import axios from 'axios';
import { DataGrid } from "@mui/x-data-grid";
import { Button, Paper } from "@mui/material";
import { Link } from "react-router-dom";
import HighlightsViewModal from "./HighlightsViewModal";
import AddFileModal from "./AddFilePage";

export default function HighlightsPage({facultyId}){
    const [highlights, setHighlights] = useState([]);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewModalForm, setViewModalForm] = useState({});
    const [addFileModalOpen, setAddFileModalOpen] = useState(false);

    function closeModal(){
        setViewModalOpen(false);
    }

    useEffect(() => {
        axios.get("http://localhost:3000/highlights/submitted_by/" + facultyId)
        .then(response => {
            console.log(response);
            // Format Date Information into YYYY-MM-DD HH:MM:SS
            const data = response.data;
            data.map((form) => {
                form.time_submitted = form.time_submitted.match(/^\d{4}-\d{2}-\d{2}/);
            })
            setHighlights(data);
        })
        .catch(console.log("Error Retrieving Highlights"))
    }, []);

    console.log(highlights)

    const columns = [
        {field : "id", headerName : "ID", flex:.2},
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
        <div>
        <h1>Highlights</h1>
        <div>
        <Button component={Link} to="/highlights_form" variant="contained" style={{margin:"2%"}}>Create New Form</Button>
        <Button variant="contained" style={{margin:"2%"}} onClick={() => setAddFileModalOpen(true)}>Add File</Button>
        </div>
        <Paper sx={{ height: 400, width: 600, display:"inline-block"}}>
        <DataGrid
            rows={highlights}
            columns={columns}
            initialState={{ pagination: { paginationModel } }}
        />
        </Paper>
        <HighlightsViewModal formData={viewModalForm} isOpen={viewModalOpen} closeModal={() => closeModal()}/>
        <AddFileModal isOpen={addFileModalOpen} closeModal={() => setAddFileModalOpen(false)} facultyId={facultyId}/>
        </div>
    )
}