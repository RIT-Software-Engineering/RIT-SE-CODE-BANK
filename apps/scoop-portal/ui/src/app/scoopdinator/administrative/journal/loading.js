import Header from "@components/Header";
import {
  Box,
  Button,
  Card,
  Container,
  Skeleton,
  Typography,
} from "@mui/material";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AddIcon from "@mui/icons-material/Add";

/**
 * Renders the loading skeleton for the journal cards for the main skeleton
 * @returns {JSX.Element}
 */
function JournalCardLoading() {
  return (
    <Card
      square
      sx={{
        fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
        padding: "1rem",
        mb: "0.5rem",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: "0.25rem",
        }}
      >
        <Skeleton variant="rectangular">
          <Typography variant="h2">Month Day, Year at HH:MM XM</Typography>
        </Skeleton>
        <Skeleton variant="rectangular">
          <Button startIcon={<EditNoteIcon />}>Edit Notes</Button>
        </Skeleton>
      </Box>
      <Skeleton variant="rectangular" sx={{ mb: "0.25rem" }}>
        <Typography variant="h3">with the Contactee</Typography>
      </Skeleton>
      <Skeleton variant="rectangular">
        <Typography variant="body1">Notes:</Typography>
      </Skeleton>
      <Box
        sx={{
          border: "1px solid black",
          padding: "1rem",
          marginTop: "1rem",
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: "inherit",
            background: "none",
            border: "none",
          }}
        >
          <Typography sx={{ mb: 0 }}>
            <Skeleton variant="rectangular" sx={{ mb: "0.25rem" }} />
            <Skeleton variant="rectangular" width="30%" />
          </Typography>
        </pre>
      </Box>
    </Card>
  );
}

/**
 * Renders the loading skeleton for the Scoopdinator's Journal page
 * @returns {JSX.Element}
 */
function JournalLoading() {
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, "& > *:last-child": { mb: "0" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
          <Skeleton variant="reactangular">
            <Typography variant="h1">Journal</Typography>
          </Skeleton>
          <Skeleton variant="rectangular">
            <Button startIcon={<FilterAltOutlinedIcon />}>Filter</Button>
          </Skeleton>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <Skeleton variant="rectangular">
            <Button startIcon={<AddIcon />}>Add Entry</Button>
          </Skeleton>
        </Box>
        <JournalCardLoading />
        <JournalCardLoading />
        <JournalCardLoading />
      </Container>
    </>
  );
}

export default JournalLoading;
