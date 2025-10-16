import { useEffect, useState } from "react";
import { DataGrid, renderActionsCell} from '@mui/x-data-grid';
import {Paper, Button, IconButton, Modal, Box, Typography} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getServices } from '../../api/services_api_imports';
import axios from 'axios';



export default function ServicesTable({services, setServices}) {
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
        axios.delete("http://localhost:3000/services" + `/${id}`)
        const newServices = services.filter(record => record.id != (id));
        setServices(newServices);
        setDeleteModalOpen(false);
    }

    const columns = [
        {field : "title", headerName : "Service", flex:1},
        {field : "hours_worked", headerName : "Hours Worked", flex:.8},
        {field : "service_type", headerName : "Service Type", flex:1},
        {field : "other_contributions", headerName : "Comments", flex:1},
        {field : "delete", headerName : "", width: 40, renderCell:(params) => {
        return (
          <IconButton
            onClick={(e) => onDeleteClick(params.row)}
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
    console.log(services);

    return (
        <span>
            <Paper sx={{ height: 400, width: '50%', display:"inline-block"}}>
            <DataGrid
                rows={services}
                columns={columns}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[5]}
                sx={{ border: 0 }}
            />
            </Paper>
            <Modal open={deleteModalOpen}>        
            <Box sx={modal_box_style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Are you sure you want to delete this service?
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                    This cannot be undone...
                </Typography>
                <Button variant="outlined" onClick={(e) => setDeleteModalOpen(false)}>Cancel</Button>
                <Button sx={{left: '65%', transform: 'translate(-50%, 0%)'}} variant="contained" color="error" onClick={() => removeRecord(deleteModalId)}>Delete</Button>
            </Box>
            </Modal>
        </span>
    );
}




