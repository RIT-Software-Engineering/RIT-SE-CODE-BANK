import { useEffect, useState } from "react";
import { DataGrid, renderActionsCell} from '@mui/x-data-grid';
import {Paper, Button, IconButton, Modal, Box, Typography} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import DepartmentsForm from "./DepartmentsForm";
import { editingStateInitializer } from "@mui/x-data-grid/internals";



export default function DepartmentsTable({departments, setDepartments}) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteModalId, setDeleteModalId] = useState(-1);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editModalValues, setEditModalValues] = useState({});

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

    // Opens edit modal
    const onEditClick = (params) => {
        console.log(params);
        setEditModalOpen(true);
        setEditModalValues(params);
    }

    // Updates state to remove record
    const removeRecord = (id) => {
        axios.delete("http://localhost:3000/departments" + `/${id}`)
        .then((res) => {
            const newDepartments = departments.filter(record => record.id != (id));
            setDepartments(newDepartments);
            setDeleteModalOpen(false);
        }
        ).catch((err) => {
            console.log(err)
            setDeleteModalOpen(false);
        })
        
    }

    const updateDepartment = (data) => {
        axios.put("http://localhost:3000/departments" + `/${editModalValues.id}`, data)
        .then((res) => {
            setDepartments(prevDepartments => prevDepartments.map((department) => {
                if(department.id == editModalValues.id){
                    data.id = editModalValues.id;
                    return data
                }else{
                    return department
                }
            }));
            setEditModalOpen(false);
        });
    }

    const columns = [
        {field : "id", headerName : "ID", flex:.2},
        {field : "department_name", headerName : "Name", flex:1},
        {field : "college", headerName : "College", flex:1},
        {field : "edit", headerName : "", width: 40, renderCell:(params) => {
        return (
          <IconButton
            onClick={(e) => onEditClick(params.row)}
            variant="contained"
            color="text.primary"
            sx={{left:"50%", transform:"translate(-50%, 0%)"}}
          >
            <EditIcon/>
          </IconButton>
        );
        }},
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
    console.log(departments);

    return (
        <span>
            <Paper sx={{ height: 400, width: 400, display:"inline-block"}}>
            <DataGrid
                rows={departments}
                columns={columns}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[5]}
                sx={{ border: 0 }}
            />
            </Paper>
            {/* Modal for the delete pop up */}
            <Modal open={deleteModalOpen}>        
            <Box sx={modal_box_style}>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                    Are you sure you want to delete this department?
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                    This cannot be undone...
                </Typography>
                <Button variant="outlined" onClick={(e) => setDeleteModalOpen(false)}>Cancel</Button>
                <Button sx={{left: '65%', transform: 'translate(-50%, 0%)'}} variant="contained" color="error" onClick={() => removeRecord(deleteModalId)}>Delete</Button>
            </Box>
            </Modal>
            {/*Edit Modal*/}
            <Modal open={editModalOpen}>
                <Box sx={modal_box_style}>
                    <div>
                        <DepartmentsForm departments={departments} setDepartments={setDepartments} isUpdate={true} defaultValues={editModalValues} onSubmit={updateDepartment}/>
                    </div>
                    <Button variant="outlined" onClick={(e) => setEditModalOpen(false)}>Cancel</Button>
                </Box>
            </Modal>
        </span>
    );
}




