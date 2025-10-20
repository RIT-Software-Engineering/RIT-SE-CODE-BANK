import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import axios from "axios";
import { TextField, Button, Box, Typography, Stack, IconButton, Dialog, DialogTitle, DialogContent, DialogActions} from "@mui/material";
import { getGrants } from '../../api/grants_api_imports';
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export default function GrantsTable() {
  const [grants, setGrants] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    funder: "",
    amount: "",
    start_date: "",
    end_date: "",
    faculty_role: "",
    faculty_share: "",
    other_comments: "",
    grant_status: "Funded",
  });
  
  const [editData, setEditData] = useState(null); 
  const [openEditDialog, setOpenEditDialog] = useState(false); 

  const fetchGrants = async () => {
     try {
      const response = await getGrants()
      console.log(response.data); 
      setGrants(response.data);
      } catch (err) {
        console.error(err);
      }
  }

  useEffect(() => {
    fetchGrants();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await axios.post("http://localhost:3000/grants", formData);
    setFormData({
      title: "",
      funder: "",
      amount: "",
      time_period: "",
      faculty_role: "",
      faculty_share: "",
      other_comments: "",
      grant_status: "Funded",
    });
    fetchGrants();
  } catch (err) {
    console.error(err);
  }
};

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`http://localhost:3000/grants/${id}`);
      fetchGrants();
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleEditSave = async () => {
    try {
      await axios.put(`http://localhost:3000/grants/${editData.id}`, editData);
      handleEditClose();
      fetchGrants();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { field: "title", headerName: "Title", width: 150 },
    { field: "funder", headerName: "Funder", width: 130 },
    { field: "amount", headerName: "Amount", width: 130 },
    { field: "start_date", headerName: "Start Date", width: 100 },
    { field: "end_date", headerName: "End Date", width: 100 },
    { field: "faculty_role", headerName: "Role", width: 80 },
    { field: "faculty_share", headerName: "Faculty Share", width: 150 },
    { field: "grant_status", headerName: "Status", width: 120 },
    { field: "actions", headerName: "Actions", width: 100,
      renderCell: (params) => (
        <>
        <IconButton
          color="primary"
            onClick={() => handleEditOpen(params.row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  const paginationModel = { page: 0, pageSize: 5 };


  return (
  <Box sx={{ padding: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Grants Management
      </Typography>

      <Paper sx={{ padding: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
          Add New Grant
      </Typography>
      <Stack spacing={2} direction="row" flexWrap="wrap" useFlexGap>
        <TextField
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange} />
        <TextField
          label="Funder"
          name="funder"
          value={formData.funder}
          onChange={handleChange} />
        <TextField
          label="Amount"
          name="amount"
          type="number"
          value={formData.amount}
          onChange={handleChange} />
        <TextField
          label="Start Date"
          name="start_date"
          value={formData.time_period}
          onChange={handleChange} />
        <TextField
          label="End Date"
          name="end_date"
          value={formData.time_period}
          onChange={handleChange} />
        <TextField
          label="Faculty Role"
          name="faculty_role"
          value={formData.faculty_role}
          onChange={handleChange} />
        <TextField
          label="Faculty Share"
          name="faculty_share"
          type="number"
          value={formData.faculty_share}
          onChange={handleChange} />
        <TextField
          label="Comments"
          name="other_comments"
          value={formData.other_comments}
          onChange={handleChange} />
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Add Grant
        </Button>
      </Stack>
      </Paper>
    {/*Table*/}
    <Paper sx={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={grants}
          columns={columns}
          getRowId={(row) => row.id}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[5]}
          sx={{ border: 0 }} />
      </Paper>
      {/*Edit*/}
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
                type="number"
                value={editData.amount}
                onChange={handleEditChange}
              />
              <TextField
                label="Start Date"
                name="Start Date"
                value={editData.start_date}
                onChange={handleEditChange}
              />
              <TextField
                label="End Date"
                name="End Date"
                value={editData.start_date}
                onChange={handleEditChange}
              />
              <TextField
                label="Faculty Role"
                name="faculty_role"
                value={editData.faculty_role}
                onChange={handleEditChange}
              />
              <TextField
                label="Faculty Share"
                name="faculty_share"
                type="number"
                value={editData.faculty_share}
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
          <Button variant="contained" onClick={handleEditSave}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}