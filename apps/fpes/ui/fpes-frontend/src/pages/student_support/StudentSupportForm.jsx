import { Grid, TextField, IconButton, Typography, Paper } from "@mui/material";
import { Controller } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";

export default function StudentSupportForm({
  control,
  errors,
}) {
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
      <Paper sx={{ p: 3, mb: 3, position: "relative" }}>
        
      <Grid item size={10}>
      <Typography variant="h5" textAlign="left">Record Entry</Typography>
      </Grid>

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
            render={({ field: f }) => (
              <TextField
                {...f}
                label={fieldName.replaceAll("_", " ")}
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
                error={errors?.student_support?.[fieldName]}
                helperText={errors?.student_support?.[fieldName]?.message}
              />
            )}
          />
  
        </Grid>
      ))}
        </Grid>

          <Grid item size={10}>
              <Controller
                  name={'student_support.other_contributions'}
                  control={control}
                  render={({field}) =>
                      <TextField 
                      sx={{width:"100%"}} 
                      {...field} 
                      label="Other Contributions" 
                      placeholder="Other Contributions" 
                      multiline minRows={4} 
                      maxRows={10}
                      />
                  }
              />
          </Grid>
      </Paper>
  );
}