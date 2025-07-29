import Header from "@components/Header";
import {
  Box,
  Button,
  Card,
  Container,
  Skeleton,
  Typography,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";

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
          <Typography>
            <Skeleton variant="rectangular" sx={{ mb: "0.25rem" }} />
            <Skeleton variant="rectangular" width="30%" />
          </Typography>
        </pre>
      </Box>
    </Card>
  );
}

function JournalLoading() {
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, "& > *:last-child": { mb: "0" } }}>
        <Skeleton variant="reactangular">
          <Typography variant="h1" sx={{ mb: 4 }}>
            Journal
          </Typography>
        </Skeleton>
        <JournalCardLoading />
        <JournalCardLoading />
        <JournalCardLoading />
      </Container>
    </>
  );
}

export default JournalLoading;
