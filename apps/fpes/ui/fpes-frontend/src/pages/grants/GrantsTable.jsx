import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Paper,
  Button,
  IconButton,
  Modal,
  Box,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

export default function GrantsTable({ grants, setGrants }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const onDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  const removeGrant = (id) => {
    axios.delete(`http://localhost:3000/grants/${id}`);
    setGrants((prev) => prev.filter((g) => g.id !== id));
    setDeleteModalOpen(false);
  };

  const columns = [
    { field: "title", headerName: "Title", flex: 1 },
    { field: "sponsor", headerName: "Sponsor", flex: 1 },
    { field: "amount", headerName: "Amount", flex: 0.5 },
    { field: "grant_status", headerName: "Status", flex: 0.5 },
    { field: "start_date", headerName: "Start Date", flex: 0.7 },
    { field: "end_date", headerName: "End Date", flex: 0.7 },
    {
      field: "delete",
      headerName: "",
      width: 60,
      renderCell: (params) => (
        <IconButton color="error" onClick={() => onDeleteClick(params.row.id)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <>
      <Paper sx={{ height: 400, width: "90%", mb: 3 }}>
        <DataGrid
          rows={grants}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[5]}
        />
      </Paper>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6">
            Are you sure you want to delete this grant?
          </Typography>
          <Button onClick={() => setDeleteModalOpen(false)} sx={{ mt: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            sx={{ ml: 2 }}
            onClick={() => removeGrant(deleteId)}
          >
            Delete
          </Button>
        </Box>
      </Modal>
    </>
  );
}