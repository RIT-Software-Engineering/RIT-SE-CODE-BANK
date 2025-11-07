import {
  DataGrid,
} from "@mui/x-data-grid";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";

export default function GrantsTable({ grants, onDelete, onEditSave }) {
  const [editData, setEditData] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const handleEditOpen = (grant) => {
    setEditData(grant);
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setEditData(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onEditSave(editData);
    handleEditClose();
  };

  const columns = [
    { field: "title", headerName: "Title", width: 150 },
    { field: "funder", headerName: "Funder", width: 130 },
    { field: "amount", headerName: "Amount", width: 120 },
    { field: "start_date", headerName: "Start Date", width: 120 },
    { field: "end_date", headerName: "End Date", width: 120 },
    { field: "faculty_role", headerName: "Role", width: 120 },
    { field: "faculty_share", headerName: "Faculty Share", width: 150 },
    { field: "grant_status", headerName: "Status", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <>
          <IconButton color="primary" onClick={() => handleEditOpen(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => onDelete(params.row.grant_id)}>
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <>
      <DataGrid
        rows={grants}
        columns={columns}
        getRowId={(row) => row.grant_id}
        pageSizeOptions={[5]}
        sx={{ border: 0, height: 400 }}
      />

      <Dialog open={openEditDialog} onClose={handleEditClose}>
        <DialogTitle>Edit Grant</DialogTitle>
        <DialogContent>
          {editData && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Title"
                name="title"
                value={editData.title}
                onChange={handleEditChange}
              />
              <TextField
                label="Funder"
                name="funder"
                value={editData.funder}
                onChange={handleEditChange}
              />
              <TextField
                label="Amount"
                name="amount"
                value={editData.amount}
                onChange={handleEditChange}
              />
              <TextField
                label="Faculty Role"
                name="faculty_role"
                value={editData.faculty_role}
                onChange={handleEditChange}
              />
              <TextField
                label="Grant Status"
                name="grant_status"
                value={editData.grant_status}
                onChange={handleEditChange}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}