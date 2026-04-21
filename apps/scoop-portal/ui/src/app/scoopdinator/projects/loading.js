"use client";
import {
  Box,
  Button,
  Card,
  Container,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import Header from "@components/Header";

function ProjectCardLoading() {
  return (
    <Card
      square
      sx={{
        padding: "1em",
        margin: "0.5rem",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: "0.5rem",
        }}
      >
        <Skeleton variant="rectangular">
          <Typography variant="h2">Project Title</Typography>
        </Skeleton>
        <Skeleton variant="rectangular">
          <Button>View</Button>
        </Skeleton>
      </Box>
      <Skeleton
        variant="rectangular"
        sx={{
          mb: "0.25rem",
          display: "inline-block",
        }}
      >
        <Typography sx={{ margin: "0" }}>Project Status</Typography>
      </Skeleton>
      <Typography>
        <Skeleton variant="rectangular" sx={{ mb: "1rem" }} />
      </Typography>
    </Card>
  );
}

/**
 * This is the loading component for the projects page.
 *
 * @description This component is used to display a loading state while the data for all projects is being fetched.
 * @returns {JSX.Element}
 */
function ProjectsLoading() {
  const theme = useTheme();
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height="2.5rem" width="9.5rem" />
        </Typography>

        <ProjectCardLoading />
        <ProjectCardLoading />
        <ProjectCardLoading />
      </Container>
    </>
  );
}

export default ProjectsLoading;
