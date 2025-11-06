import {
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
} from "@mui/material";
import { useForm } from "react-hook-form";
import axios from "axios";

export default function GrantsForm({setGrants, defaultValues, isUpdate }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: isUpdate
      ? defaultValues
      : {
          title: "",
          sponsor: "",
          amount: "",
          start_date: "",
          end_date: "",
          grant_status: "Pending",
        },
  });

  const addGrant = (data) => {
    axios.post("http://localhost:3000/grants", data)
      .then((res) => {
        const newGrant = { ...data, id: res.data[0]?.id ?? Math.random() };
        setGrants((prev) => [...prev, newGrant]);
        reset();
      })
      .catch((err) => console.error("Error adding grant:", err));
  };

  return (
    <Box sx={{ width: "60%", marginTop: 4 }}>
      <h3>Create Grant</h3>
      <form onSubmit={handleSubmit(addGrant)}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              {...register("title", { required: "Title is required" })}
              label="Grant Title"
              fullWidth
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              {...register("sponsor", { required: "Sponsor is required" })}
              label="Sponsor"
              fullWidth
              error={!!errors.sponsor}
              helperText={errors.sponsor?.message}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              {...register("amount", {
                required: "Amount is required",
                pattern: {
                  value: /^[0-9]+$/,
                  message: "Amount must be a number",
                },
              })}
              label="Amount"
              fullWidth
              error={!!errors.amount}
              helperText={errors.amount?.message}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              {...register("grant_status")}
              select
              label="Status"
              defaultValue="Pending"
              fullWidth
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Denied">Denied</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              {...register("start_date", { required: "Start date required" })}
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              {...register("end_date", { required: "End date required" })}
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" type="submit">
              Submit
            </Button>
            <Button variant="outlined" type="reset" onClick={() => reset()} sx={{ ml: 2 }}>
              Clear
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}