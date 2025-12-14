import { useEffect, useState } from "react";
import axios from "axios";
import { Paper, Typography, Box, } from "@mui/material";

export default function StudentSupportPage() {
  const [studentSupportData, setStudentSupportData] = useState(null);

  useEffect(() => {
    fetchStudentSupport();
  }, []);

  const fetchStudentSupport = async () => {
    try {
      const res = await axios.get("http://localhost:3000/student_support");
      setStudentSupportData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Student Support
        </Typography>

        {Object.entries(studentSupportData).map(([key, value]) => (
          <Typography key={key} sx={{ mb: 1 }}>
            <strong>{key.replaceAll("_", " ")}:</strong> {value}
          </Typography>
        ))}
      </Paper>
    </Box>
  );
}