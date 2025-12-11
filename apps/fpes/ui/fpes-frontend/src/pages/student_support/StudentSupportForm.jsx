import { Grid, TextField, IconButton, Typography, Paper } from "@mui/material";
import { Controller } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";

export default function StudentSupportForm({ control, errors }) {
  const fields = [
    "independent_studies_supervised",
    "bs_cs_students_supervised",
    "ms_defence_chair",
    "ms_defence_member",
    "active_ms_cs_as_chair",
    "other_bs_projects",
    "other_ms_projects",
    "current_phd_advisees",
    "phd_passed_rpa_as_chair",
    "phd_passed_pro_as_chair",
    "phd_passed_def_as_chair",
    "phd_rpa_def_pro_as_member",
  ];

  return (
    <Paper sx={{padding:"4% 4%", margin:"4% auto", width:"600px"}}>

        <Typography variant="h5" sx={{ mb: 2 }}>
          Student Support Entry
        </Typography>

        <Grid container spacing={2}>

        {fields.map((fieldName) => (
          <Grid item xs={12} sm={6} key={fieldName}>
            <Controller
              name={`student_support.${fieldName}`}
              control={control}
              rules={{
                required: "Required",
                min: { value: 0, message: "Cannot be negative" },
                valueAsNumber: true,
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={fieldName.replaceAll("_", " ")}
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  error={!!errors?.student_support?.[fieldName]}
                  helperText={errors?.student_support?.[fieldName]?.message}
                />
              )}
            />
          </Grid>
        ))}

       <Grid item xs={12}>
        <Controller
          name={"student_support.other_contributions"}
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Other Contributions"
              multiline
              fullWidth
              minRows={4}
              maxRows={10}
            />
          )}
        />
      </Grid>
      </Grid>
    </Paper>
  );
}