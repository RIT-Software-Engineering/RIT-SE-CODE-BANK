import { useEffect, useState } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import { Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, } from "@mui/material";

export default function StudentSupportPage() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState({
    independent_studies_supervised: "",
    bs_cs_students_supervised: "",
    ms_defence_chair: "",
    ms_defence_member: "",
    active_ms_cs_as_chair: "",
    other_bs_projects: "",
    other_ms_projects: "",
    current_phd_advisees: "",
    phd_passed_rpa_as_chair: "",
    phd_passed_pro_as_chair: "",
    phd_passed_def_as_chair: "",
    phd_rpa_def_pro_as_member: "",
  });

  useEffect(() => {
    fetchStudentSupport();
  }, []);

  const fetchStudentSupport = async () => {
    try {
      const res = await axios.get("http://localhost:3000/student_support");
      setRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpen = (row = null) => {
    if (row) {
      setEditRow(row);
      setFormData(row);
    } else {
      setEditRow(null);
      setFormData({
        independent_studies_supervised: "",
        bs_cs_students_supervised: "",
        ms_defence_chair: "",
        ms_defence_member: "",
        active_ms_cs_as_chair: "",
        other_bs_projects: "",
        other_ms_projects: "",
        current_phd_advisees: "",
        phd_passed_rpa_as_chair: "",
        phd_passed_pro_as_chair: "",
        phd_passed_def_as_chair: "",
        phd_rpa_def_pro_as_member: "",
      });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editRow) {
        await axios.put(
          `http://localhost:3000/student_support/${editRow.id}`,
          formData
        );
      } else {
        await axios.post("http://localhost:3000/student_support", formData);
      }
      handleClose();
      fetchStudentSupport();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/student_support/${id}`);
      fetchStudentSupport();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "independent_studies_supervised", headerName: "Independent Studies", width: 150 },
    { field: "bs_cs_students_supervised", headerName: "BS CS Supervised", width: 150 },
    { field: "ms_defence_chair", headerName: "MS Chair", width: 130 },
    { field: "ms_defence_member", headerName: "MS Member", width: 130 },
    { field: "active_ms_cs_as_chair", headerName: "Active MS Chair", width: 150 },
    { field: "other_bs_projects", headerName: "Other BS Projects", width: 150 },
    { field: "other_ms_projects", headerName: "Other MS Projects", width: 150 },
    { field: "current_phd_advisees", headerName: "Current PhD Advisees", width: 150 },
    { field: "phd_passed_rpa_as_chair", headerName: "PhD Passed RPA (Chair)", width: 180 },
    { field: "phd_passed_pro_as_chair", headerName: "PhD Passed PRO (Chair)", width: 180 },
    { field: "phd_passed_def_as_chair", headerName: "PhD Passed DEF (Chair)", width: 180 },
    { field: "phd_rpa_def_pro_as_member", headerName: "PhD RPA/DEF/PRO (Member)", width: 180 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <>
          <Button
            size="small"
            variant="contained"
            onClick={() => handleOpen(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  const paginationModel = { page: 0, pageSize: 5 };

  return (
    <Box sx={{ p: 3 }}>
      <h1>Student Support Records</h1>
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpen()}
        sx={{ mb: 2 }}
      >
        Add Record
      </Button>

      <Paper sx={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[5]}
          sx={{ border: 0 }}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editRow ? "Edit Student Support Record" : "Add Student Support Record"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
              mt: 2,
            }}
          >
            {Object.keys(formData).map((key) => (
              <TextField
                key={key}
                label={key.replaceAll("_", " ")}
                name={key}
                value={formData[key]}
                onChange={handleChange}
                type="number"
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}