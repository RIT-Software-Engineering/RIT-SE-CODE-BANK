import { useState } from "react";
import {
  TextField,
  Button,
  Stack,
  Typography,
  MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

export default function GrantsForm({ onAddGrant }) {
  const [formData, setFormData] = useState({
    title: "",
    funder: "",
    amount: "",
    start_date: null,
    end_date: null,
    faculty_role: "",
    faculty_share: "",
    other_comments: "",
    grant_status: "Funded",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value ? dayjs(value).format("YYYY-MM-DD") : "",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddGrant(formData);
    setFormData({
      title: "",
      funder: "",
      amount: "",
      start_date: null,
      end_date: null,
      faculty_role: "",
      faculty_share: "",
      other_comments: "",
      grant_status: "Funded",
    });
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Add New Grant
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={2} direction="row" flexWrap="wrap" useFlexGap>
          <TextField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <TextField
            label="Funder"
            name="funder"
            value={formData.funder}
            onChange={handleChange}
          />
          <TextField
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
          />
          <DatePicker
            label="Start Date"
            value={formData.start_date ? dayjs(formData.start_date) : null}
            onChange={(date) => handleDateChange("start_date", date)}
          />
          <DatePicker
            label="End Date"
            value={formData.end_date ? dayjs(formData.end_date) : null}
            onChange={(date) => handleDateChange("end_date", date)}
          />
          <TextField
            label="Faculty Role"
            name="faculty_role"
            value={formData.faculty_role}
            onChange={handleChange}
          />
          <TextField
            label="Faculty Share"
            name="faculty_share"
            type="number"
            value={formData.faculty_share}
            onChange={handleChange}
          />
          <TextField
            label="Comments"
            name="other_comments"
            value={formData.other_comments}
            onChange={handleChange}
          />
          <TextField
            select
            label="Grant Status"
            name="grant_status"
            value={formData.grant_status}
            onChange={handleChange}
          >
            <MenuItem value="Funded">Funded</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </TextField>

          <Button variant="contained" color="primary" type="submit">
            Add Grant
          </Button>
        </Stack>
      </form>
    </>
  );
}