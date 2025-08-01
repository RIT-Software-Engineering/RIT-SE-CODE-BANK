"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Paper,
  useTheme,
} from "@mui/material";
import { ArrowBack, EditOutlined } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import ProjectDetailsLoading from "./loading";
import Header from "@components/Header";
import { useUser } from "../../utils/user-context/page";
import UnauthorizedPage from "../../unauthorized/page";

/**
 * This component fetches the details of a project based on the provided project ID and displays it on the Project Details page.
 *
 * @param {*} params - The parameters passed to the component.
 * @returns {JSX.Element} The elements that make up the Project Details page.
 * @throws {Error} If the project ID is not provided or if there is an error fetching the project data, it will log an error to the console.
 *
 */
export default function ProjectDetails({ params }) {
  const theme = useTheme();
  const { user } = useUser();
  const { projectId } = React.use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState([]);

  useEffect(() => {
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
    const fetchProject = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/project/${projectId}`
        );
        const data = await res.json();
        setProject(data);
      } catch (err) {
        console.error("Failed to fetch project: ", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) fetchProject();
  }, [projectId]);

  if (!user || user.type !== "admin") {
    return <UnauthorizedPage />;
  }

  return (
    <>
      <Header />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          href="/projects"
          startIcon={<ArrowBack />}
          variant="outline-orange"
        >
          Back to Projects
        </Button>
        <Paper
          sx={{
            marginTop: "1rem",
            padding: "1rem",
          }}
        >
          <Container
            disableGutters
            sx={{
              display: "flex",
              justifyContent: "space-between",
              px: "0",
            }}
          >
            <Typography variant="h1">
              {project.display_name || project.title}
            </Typography>
            <Button
              startIcon={<EditOutlined />}
              variant="solid-orange"
              onClick={() => {
                alert("Edit functionality not implemented yet");
              }}
            >
              Edit Details
            </Button>
          </Container>
          <Box
            sx={{
              marginBlock: "1rem",
              padding: "0.5em 1em",
              display: "inline-block",
              backgroundColor:
                project.status === "active"
                  ? "rgba(0, 156, 189, 0.2)"
                  : project.status === "in progress"
                    ? "rgba(246, 190, 0, 0.2)"
                    : project.status === "completed"
                      ? "rgba(132, 189, 0, 0.2)"
                      : "rgba(124, 135, 142, 0.2)",
              color:
                project.status === "active"
                  ? theme.palette.info.main
                  : project.status === "in progress"
                    ? theme.palette.warning.main
                    : project.status === "completed"
                      ? theme.palette.success.main
                      : "rgb(124, 135, 142)",
            }}
          >
            <Typography sx={{ margin: "0" }}>
              {project.status.toUpperCase()}
            </Typography>
          </Box>
          <Typography>{project.description}</Typography>
          <Container
            disableGutters
            sx={{
              display: "flex",
              justifyContent: "space-between",
              px: "0",
            }}
          >
            <Card
              variant="outlined"
              sx={{
                width: "45%",
                padding: "0.25rem 1rem",
              }}
            >
              <CardContent>
                <Typography variant="h3">Challenges:</Typography>
                <Typography>{project.project_challenges}</Typography>
              </CardContent>
            </Card>
            <Card
              variant="outlined"
              sx={{
                width: "45%",
                padding: "0.25rem 1rem",
              }}
            >
              <CardContent>
                <Typography variant="h3">Constraints & Assumptions:</Typography>
                <Typography>{project.constraints_assumptions}</Typography>
              </CardContent>
            </Card>
          </Container>
          <Typography variant="body1" sx={{ marginTop: "1rem" }}>
            Project Team: {project.team_name}
          </Typography>
          <Typography>
            Created:{" "}
            {project.created_at
              ? new Date(project.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })
              : "Unknown Date"}
          </Typography>
          <Typography>
            Last updated:{" "}
            {project.updated_at
              ? new Date(project.updated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })
              : "Unknown Date"}
          </Typography>
        </Paper>
      </Container>
    </>
  );
}
