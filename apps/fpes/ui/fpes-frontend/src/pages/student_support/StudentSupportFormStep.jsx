import { Grid, TextField, Button, Paper, Typography, Box, IconButton } from "@mui/material";
import StudentSupportForm from "./StudentSupportForm";

export default function StudentSupportFormStep({ form_id, control, errors }) {

  function StudentSupport() {
    this.independent_studies_supervised = 0;
    this.bs_cs_students_supervised = 0;
    this.ms_defence_chair = 0;
    this.ms_defence_member = 0;
    this.active_ms_cs_as_chair = 0;
    this.other_bs_projects = 0;
    this.other_ms_projects = 0;
    this.current_phd_advisees = 0;
    this.phd_passed_rpa_as_chair = 0;
    this.phd_passed_pro_as_chair = 0;
    this.phd_passed_def_as_chair = 0;
    this.phd_rpa_def_pro_as_member = 0;
    this.other_contributions = "";
    this.form_id = form_id;
  }

  return (
    <Box sx={{ width: "80%", margin: "auto" }}>
      <StudentSupportForm control={control} errors={errors} />
    </Box>
  );
}