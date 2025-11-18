import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Paper, Modal, Box, Typography, Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

export default function StudentSupportTable({ records, setRecords }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:3000/student_support/${id}`);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setDeleteOpen(false);
  };

  const columns = [
    { field: "id", headerName: "ID", width: 60 },
    { field: "independent_studies_supervised", headerName: "Independent Studies", width: 150 },
    { field: "bs_cs_students_supervised", headerName: "BS CS Supervised", width: 150 },
    { field: "ms_defence_chair", headerName: "MS Defense Chairs", width: 150 },
    { field: "ms_defence_member", headerName: "MS Defense Members", width: 170 },
    { field: "active_ms_cs_as_chair", headerName: "Active MS, CS, AS Chairs", width: 180 },
    { field: "other_bs_projects", headerName: "Other BS Projects", width: 140 },
    { field: "other_ms_projects", headerName: "Other MS Projects", width: 140 },
    { field: "current_phd_advisees", headerName: "Current PHD Advisees", width: 170 },
    { field: "phd_passed_rpa_as_chair", headerName: "PHD Passed RPA as Chair", width: 200 },
    { field: "phd_passed_pro_as_chair", headerName: "PHD Passed PRO as Chair", width: 200 },
    { field: "phd_passed_def_as_chair", headerName: "PHD Passed DEF as Chair", width: 200 },
    { field: "phd_rpa_def_pro_as_member", headerName: "PHD, RPA, DEF, PRO as Member", width: 250 },
    {
      field: "actions",
      headerName: "",
      width: 100,
      renderCell: (params) => (
        <IconButton onClick={() => { setDeleteId(params.row.id); setDeleteOpen(true); }}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <>
      <Paper sx={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={records}
          columns={columns}
          getRowId={(r) => r.id}
          pageSizeOptions={[5]}
          sx={{ border: 0 }}
        />
      </Paper>
      <Modal open={deleteOpen}>
        <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <Typography>Are you sure you want to delete this record?</Typography>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteId)} color="error" variant="contained" sx={{ ml: 2 }}>Delete</Button>
        </Box>
      </Modal>
    </>
  );
}