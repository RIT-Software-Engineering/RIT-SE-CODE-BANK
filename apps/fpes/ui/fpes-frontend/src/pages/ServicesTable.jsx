import { useEffect, useState } from "react";
import { DataGrid, renderActionsCell} from '@mui/x-data-grid';
import {Paper, Button, IconButton, Modal, Box, Typography} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getServices } from '../api/services_api_imports';
import axios from 'axios';



export default function ServicesTable() {
    const [services, setServices] = useState([]);
    const [deleteModalOpen, setDeleteModal] = useState(false);
    const [deleteModalId, setDeleteModalId] = useState(-1);

    // Sends the delete call to database
    const onDeleteClick = (params) => {
        console.log("delete clicked")
        setDeleteModal(true);
        setDeleteModalId(params.id);
    }

    // Updates state to remove record
    const removeRecord = (id) => {
        axios.delete("http://localhost:3000/services" + `/${params.id}`)
        const newServices = services.filter(record => record.id != (id));
        setServices(newServices);
    }

    // Gets all services from the database
    const getAllServices = () => {
        useEffect(() => {
            getServices()
            .then((response) => {
                setServices(response.data);
            })
        }, []);
    }

    getAllServices();

    const columns = [
        {field : "title", headerName : "Service", width : 130},
        {field : "hours_worked", headerName : "Hours Worked", width : 130},
        {field : "service_type", headerName : "Service Type", width : 130},
        {field : "other_contributions", headerName : "Comments", width : 130},
        {field : "delete", headerName : "", width: 130, renderCell:(params) => {
        return (
          <IconButton
            onClick={(e) => onDeleteClick(params.row)}
            variant="contained"
            color="text.primary"
          >
            <DeleteIcon/>
          </IconButton>
        );
        } }
    ]
    
    const paginationModel = { page: 0, pageSize: 5 };

    return (
        <div>
            <Paper sx={{ height: 400, width: '100%' }}>
            <DataGrid
                rows={services}
                columns={columns}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[5]}
                sx={{ border: 0 }}
            />
            </Paper>
            <Modal open={deleteModalOpen}>        
            <Box>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Text in a modal
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                    Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
                </Typography>
            </Box>
            </Modal>
        </div>
    );
}




