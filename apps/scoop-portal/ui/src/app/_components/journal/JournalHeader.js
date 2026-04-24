import { Box, Button, Stack, Typography } from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import AddIcon from "@mui/icons-material/Add";

export default function JournalHeader({
  setFilterDialogOpen,
  setNewEntryOpen,
  handleJSONDownload
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h1" sx={{ mb: 2 }}>Journal</Typography>
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center"
      }}>
        <Button
          variant="outline-orange"
          onClick={() => setFilterDialogOpen(true)}
          startIcon={<FilterAltOutlinedIcon />}
        >
          Filter
        </Button>
        <Button
          variant="solid-orange"
          onClick={() => setNewEntryOpen(true)}
          startIcon={<AddIcon />}
        >
          Add Entry
        </Button>
      </Box>
    </Box>
  );
}