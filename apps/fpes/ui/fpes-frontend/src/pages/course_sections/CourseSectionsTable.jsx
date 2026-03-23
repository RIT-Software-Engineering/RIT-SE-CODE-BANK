import { useState } from "react";
import { DataGrid } from '@mui/x-data-grid';
import {Paper, Button, IconButton, Modal, Box, Typography} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';



export default function CourseSectionsTable({course_sections, setCourseSections}) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteModalId, setDeleteModalId] = useState(-1);

    const modal_box_style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };

    // Sends the delete call to database
    const onDeleteClick = (params) => {
        console.log("delete clicked")
        setDeleteModalOpen(true);
        setDeleteModalId(params.id);
    }

    // Updates state to remove record
    const removeRecord = (id) => {
        axios.delete("http://localhost:3000/course_sections" + `/${id}`)
        const newCourseSections = course_sections.filter(record => record.id != (id));
        setCourseSections(newCourseSections);
        setDeleteModalOpen(false);
    }

    const columns = [
        {field : "id", headerName : "ID", flex:.2},
        {field : "course_code", headerName : "Course", flex:1},
        {field : "days_of_the_week", headerName : "Class Days", flex:1},
        {field : "room_location", headerName : "Location", flex:1},
        {field : "number_of_students", headerName : "Number of Students", flex:1},
        {field : "semester", headerName : "Semester", flex:1},
        {field : "scholastic_year", headerName : "Scholastic Year", flex:1},
        {field : "delete", headerName : "", width: 40, renderCell:(params) => {
        return (
          <IconButton
            onClick={() => onDeleteClick(params.row)}
            variant="contained"
            color="text.primary"
            sx={{left:"50%", transform:"translate(-50%, 0%)"}}
          >
            <DeleteIcon/>
          </IconButton>
        );
        } }
    ]
    
    const paginationModel = { page: 0, pageSize: 5 };
    console.log(course_sections);

    return (
        <span>
            <Paper sx={{ height: 400, width: 600, display:"inline-block"}}>
            <DataGrid
                rows={course_sections}
                columns={columns}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[5]}
                sx={{ border: 0 }}
            />
            </Paper>
            <Modal open={deleteModalOpen}>        
            <Box sx={modal_box_style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Are you sure you want to delete this course section?
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                    This cannot be undone...
                </Typography>
                <Button variant="outlined" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                <Button sx={{left: '65%', transform: 'translate(-50%, 0%)'}} variant="contained" color="error" onClick={() => removeRecord(deleteModalId)}>Delete</Button>
            </Box>
            </Modal>
        </span>
    );
}




