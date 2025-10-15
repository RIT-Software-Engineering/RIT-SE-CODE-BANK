import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import axios from "axios";
import { getGrants} from "../api/api_imports";

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

  useEffect(() => {
    fetchGrants();
  }, []);

  const fetchGrants = async () => {
      try {
        const response = axios.get("http://localhost:5000/api/grants");
        setGrants(response.data);
    } catch (err) {
        console.error(err);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await axios.post("http://localhost:5000/api/grants", formData);
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

  const columns = [
    { field: "title", headerName: "Title", width: 150 },
    { field: "funder", headerName: "Funder", width: 130 },
    { field: "amount", headerName: "Amount", width: 130 },
    { field: "start_date", headerName: "Start Date", width: 100 },
    { field: "end_date", headerName: "End Date", width: 100 },
    { field: "faculty_role", headerName: "Role", width: 80 },
    { field: "faculty_share", headerName: "Faculty Share", width: 150 },
    { field: "grant_status", headerName: "Status", width: 120 },
  ];

  const paginationModel = { page: 0, pageSize: 5 };


  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-semibold mb-4">Grant Manager</h1>

       <Box
        component="form"
        onSubmit={handleSubmit}
        className="bg-gray-50 p-4 rounded-xl shadow-md flex flex-wrap gap-4"
        >
        <TextField
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          size="small"
        />
        <TextField
          label="Funder"
          name="funder"
          value={formData.funder}
          onChange={handleChange}
          size="small"
        />
        <TextField
          label="Amount"
          name="amount"
          type="number"
          value={formData.amount}
          onChange={handleChange}
          size="small"
        />
        <TextField
          label="Start Date"
          name="start_date"
          value={formData.time_period}
          onChange={handleChange}
          size="small"
        />
        <TextField
          label="End Date"
          name="end_date"
          value={formData.time_period}
          onChange={handleChange}
          size="small"
        />
        <TextField
          label="Faculty Role"
          name="faculty_role"
          value={formData.faculty_role}
          onChange={handleChange}
          size="small"
        />
        <TextField
          label="Faculty Share"
          name="faculty_share"
          type="number"
          value={formData.faculty_share}
          onChange={handleChange}
          size="small"
        />
        <TextField
          label="Comments"
          name="other_comments"
          value={formData.other_comments}
          onChange={handleChange}
          size="small"
         
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          className="self-center"
        >
          Add Grant
        </Button>
      </Box>

     <Paper sx={{ height: 420, width: "100%" }}>
        <DataGrid
          rows={grants}
          columns={columns}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[5]}
          sx={{ border: 0 }}
          getRowId={(row) => row.id}
        />
      </Paper>
    </div>
  );

}