"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Modal,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { ArrowBack, EditOutlined } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
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
  const { projectId } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [teamAssignment, setTeamAssignment] = useState(null);
  const [teamWorkflowState, setTeamWorkflowState] = useState(null);
  const [actionStates, setActionStates] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [selectedActionState, setSelectedActionState] = useState(null);
  const [project, setProject] = useState({});

  useEffect(() => {
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

  useEffect(() => {
    if (!user || !projectId) return;

    const determineAccess = async () => {
      setAccessChecked(false);
      setAuthorized(false);

      if (user.type === "scoopdinator") {
        setAuthorized(true);
        setTeamAssignment(null);
        setAccessChecked(true);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teams/${user.id}`
        );
        if (!res.ok) {
          console.error("Failed to fetch teams for user");
          setAuthorized(false);
          setAccessChecked(true);
          return;
        }

        const teams = await res.json();
        const teamForProject = teams.find(
          (team) => Number(team.projectId) === Number(projectId)
        );

        if (teamForProject) {
          setTeamAssignment(teamForProject);
          setAuthorized(true);
        } else {
          setTeamAssignment(null);
          setAuthorized(false);
        }
        setAccessChecked(true);
      } catch (error) {
        console.error("Error determining team access:", error);
        setTeamAssignment(null);
        setAuthorized(false);
        setAccessChecked(true);
      }
    };

    determineAccess();
  }, [user, projectId]);

  useEffect(() => {
    if (!user || !teamAssignment) {
      setTeamWorkflowState(null);
      setActionStates([]);
      return;
    }

    const fetchWorkflowState = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WORKFLOWS_API_URL}/states/workflow?userId=${user.id}`
        );
        if (!res.ok) {
          console.error("Failed to fetch workflow states for user");
          return;
        }

        const workflowStates = await res.json();
        const assignmentState = workflowStates.find(
          (state) =>
            state.teamId &&
            state.teamId === String(teamAssignment.id)
        );

        if (assignmentState) {
          setTeamWorkflowState(assignmentState);
          const sortedStates = (assignmentState.actionStates || []).slice().sort(
            (a, b) => a.index - b.index
          );
          setActionStates(sortedStates);
        } else {
          setTeamWorkflowState(null);
          setActionStates([]);
        }
      } catch (error) {
        console.error("Error loading workflow state:", error);
      }
    };

    fetchWorkflowState();
  }, [user, teamAssignment, refresh]);

  const bubbleStyles = (stateType) => {
    switch (stateType) {
      case "completed":
        return { backgroundColor: "#4caf50", color: "#fff" };
      case "inProgress":
        return { backgroundColor: "#f7df1e", color: "#000" };
      default:
        return { backgroundColor: "#9e9e9e", color: "#fff" };
    }
  };

  const baseActionState = teamWorkflowState?.baseActionState;
  const overallWorkflowStateType = baseActionState?.stateType;

  const formatStateLabel = (stateType) => {
    switch (stateType) {
      case "notStarted":
        return "NOT STARTED";
      case "inProgress":
        return "PENDING";
      case "completed":
        return "COMPLETED";
      case "hidden":
        return "HIDDEN";
      default:
        return stateType?.toUpperCase?.() ?? "UNKNOWN STATUS";
    }
  };

  const overallStatusStyles = () => {
    switch (overallWorkflowStateType) {
      case "completed":
        return {
          backgroundColor: "rgba(76, 175, 80, 0.2)",
          color: "#4caf50",
          border: "1px solid #4caf50",
        };
      case "inProgress":
        return {
          backgroundColor: "rgba(247, 223, 30, 0.2)",
          color: "#f7df1e",
          border: "1px solid #f7df1e",
        };
      case "hidden":
        return {
          backgroundColor: "rgba(124, 135, 142, 0.2)",
          color: "rgb(124, 135, 142)",
        };
      case "notStarted":
      default:
        return {
          backgroundColor: "rgba(158, 158, 158, 0.2)",
          color: "rgb(158, 158, 158)",
          border: "1px dashed rgb(158, 158, 158)",
        };
    }
  };

  const handleOpen = (actionState) => {
    setSelectedActionState(actionState);
    setOpenModal(true);
  };

  const handleClose = () => {
    setSelectedActionState(null);
    setOpenModal(false);
  };

  const submitAction = async () => {
    if (!selectedActionState) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WORKFLOWS_API_URL}/states/handleSubmit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionStateId: selectedActionState.id }),
        }
      );

      if (!res.ok) {
        console.error("Failed to submit action state");
      } else {
        setRefresh((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error submitting action state:", error);
    } finally {
      handleClose();
    }
  };

  const promoteWorkflowToInProgress = async () => {
    if (!baseActionState || overallWorkflowStateType !== "notStarted") {
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WORKFLOWS_API_URL}/states/action/${baseActionState.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stateType: "inProgress" }),
        }
      );
      if (!res.ok) {
        console.error("Failed to update overall workflow state");
        return;
      }
      setRefresh((prev) => prev + 1);
    } catch (error) {
      console.error("Error promoting workflow state:", error);
    }
  };

  if (!user) {
    return <UnauthorizedPage />;
  }

  if (isLoading || !accessChecked) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h6">Loading project details...</Typography>
        </Container>
      </>
    );
  }

  if (!authorized) {
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
          sx={{ mb: 2 }}
        >
          Back to Projects
        </Button>
        <Paper sx={{ marginTop: "1rem", padding: "1rem" }}>
          <Container
            disableGutters
            sx={{
              display: "flex",
              justifyContent: "space-between",
              px: "0",
            }}
          >
            <Typography variant="h1">
              {project.display_name || project.title || "Untitled Project"}
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
              cursor:
                overallWorkflowStateType === "notStarted" ? "pointer" : "default",
              transition: "background-color 0.2s ease",
              ...(overallWorkflowStateType
                ? overallStatusStyles()
                : {
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
                  }),
            }}
            onClick={promoteWorkflowToInProgress}
          >
            <Typography sx={{ margin: 0, fontWeight: 600 }}>
              {overallWorkflowStateType
                ? formatStateLabel(overallWorkflowStateType)
                : project.status
                  ? project.status.toUpperCase()
                  : "UNKNOWN STATUS"}
            </Typography>
          </Box>
          <Typography>{project.description || "No description available."}</Typography>
          <Container
            disableGutters
            sx={{
              display: "flex",
              justifyContent: "space-between",
              px: 0,
              mt: 2,
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
                <Typography>
                  {project.project_challenges || "No challenges listed."}
                </Typography>
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
                <Typography>
                  {project.constraints_assumptions || "No constraints or assumptions listed."}
                </Typography>
              </CardContent>
            </Card>
          </Container>
          <Typography variant="body1" sx={{ marginTop: "1rem" }}>
            Project Team: {project.team_name || "N/A"}
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

          {authorized && teamAssignment && (
            <Box sx={{ marginTop: "2rem" }}>
              <Typography variant="h2" sx={{ marginBottom: "0.5rem" }}>
                Team Workflow Progress
              </Typography>
              <Typography variant="body2" sx={{ marginBottom: "1rem" }}>
                {teamAssignment.name
                  ? `Team: ${teamAssignment.name}`
                  : "Assigned team"}
              </Typography>
              {actionStates.length === 0 ? (
                <Typography variant="body1">
                  No workflow has been linked to this team yet.
                </Typography>
              ) : (
                <Grid container spacing={1}>
                  {actionStates.map((actionState) => (
                    <Grid item key={actionState.id}>
                      <Chip
                        label={actionState.action?.name || "Task"}
                        sx={bubbleStyles(actionState.stateType)}
                        onClick={() => handleOpen(actionState)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Paper>
      </Container>

      <Modal open={openModal} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 420,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" sx={{ marginBottom: "0.5rem" }}>
            {selectedActionState?.action?.name || "Workflow Step"}
          </Typography>
          <Typography variant="body2" sx={{ marginBottom: "1.5rem" }}>
            {selectedActionState?.action?.description ||
              "No description is available for this step."}
          </Typography>
          <Button
            variant="solid-orange"
            onClick={submitAction}
            disabled={
              !selectedActionState ||
              selectedActionState.stateType === "completed"
            }
          >
            Mark Complete
          </Button>
        </Box>
      </Modal>
    </>
  );
}
