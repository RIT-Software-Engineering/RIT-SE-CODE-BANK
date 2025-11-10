import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Paper, Button, IconButton, Modal, Box, Typography, } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

export default function GrantsTable({ grants, setGrants }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(-1);

  /*const onDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };*/

  const removeGrant = (id) => {
    axios.delete("http://localhost:3000/grants" + '/${id}')
    const newGrants = grants.filter(record => record.id != id);
    setGrants(newGrants);
    setDeleteModalOpen(false);
  };

  const columns = [
    { field: "title", headerName: "Title", width: 60 },
    { field: "sponsor", headerName: "Sponsor", width: 80 },
    { field: "amount", headerName: "Amount", width: 80 },
    { field: "grant_status", headerName: "Status", width: 80 },
    { field: "start_date", headerName: "Start Date", width: 100 },
    { field: "end_date", headerName: "End Date", width: 120 },
    {
      field: "delete", headerName: "", width: 60,
      renderCell: (params) => (
        <IconButton 
          onClick={() => { setDeleteId(params.row.id); setDeleteModalOpen(true); }}
          variant="contained"
          color="text.primary"
          sx={{left:"50%", transform:"translate(-50%, 0%)"}}
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  const paginationModel = { page: 0, pageSize: 5 };

  return (
    <span>
      <Paper sx={{ height: 400, width:600, display:"inline-block"}}>
          <DataGrid
              rows={grants}
              columns={columns}
              getRowId={(row) => row.id}
              initialState={{ pagination: { paginationModel } }}
              pageSizeOptions={[5]}
              sx={{ border: 0 }}
          />
      </Paper>

      <Modal open={deleteModalOpen}>
          <Box sx={{
              position:'absolute', top:'50%', left:'50%',
              transform:'translate(-50%, -50%)',
              width:400, bgcolor:'background.paper', border:'2px solid #000',
              boxShadow:24, p:4
          }}>
              <Typography variant="h6">Are you sure you want to delete this grant?</Typography>
              <Button variant="outlined" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button sx={{left:'65%', transform:'translate(-50%, 0%)'}} variant="contained" color="error" onClick={() => removeGrant(deleteId)}>Delete</Button>
          </Box>
      </Modal>
    </span>
  );
}