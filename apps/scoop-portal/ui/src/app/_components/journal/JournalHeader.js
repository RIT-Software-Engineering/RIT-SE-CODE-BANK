import { Box, Button, Typography } from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import AddIcon from "@mui/icons-material/Add";

export default function JournalHeader({
  setFilterDialogOpen,
  setNewEntryOpen,
  handleJSONDownload

}) {
  const handleOpenFilterDialog = () => setFilterDialogOpen(true);

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Typography variant="h1">Journal</Typography>
        <Button
          variant="outline-orange"
          onClick={handleOpenFilterDialog}
          startIcon={<FilterAltOutlinedIcon />}
        >
          Filter
        </Button>
        <Button variant="outline-orange" onClick={handleJSONDownload}>Export</Button>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button
          variant="outline-orange"
          onClick={() => setNewEntryOpen(true)}
          startIcon={<AddIcon />}
        >
          Add Entry
        </Button>
      </Box>
    </>
  );
}