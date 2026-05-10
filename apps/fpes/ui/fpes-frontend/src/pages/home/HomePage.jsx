import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ padding: "5rem 2rem 2rem", textAlign: "center" }} style={{background: "white"}}>
      <Typography variant="h5" sx={{ mb: 2 }} color="black">Welcome</Typography>
      <Typography variant="body1" color="gray" sx={{ mb: 4 }}>
        Not sure where to begin? Head to the Getting Started page.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/getting-started")}>
        Get Started
      </Button>
    </Box>
  );
}
