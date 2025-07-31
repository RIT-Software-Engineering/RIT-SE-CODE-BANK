import { Box, Button, Typography } from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

export default function JournalHeader({ setFilterDialogOpen }) {
  const handleOpenFilterDialog = () => setFilterDialogOpen(true);

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
      <Typography variant="h1">Journal</Typography>
      <Button
        variant="outline-orange"
        onClick={handleOpenFilterDialog}
        startIcon={<FilterAltOutlinedIcon />}
      >
        Filter
      </Button>
    </Box>
  );
}
