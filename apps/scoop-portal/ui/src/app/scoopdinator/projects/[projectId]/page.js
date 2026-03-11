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
import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "@components/Header";
import { useUser } from "../../utils/user-context/page";
import UnauthorizedPage from "../../unauthorized/page";

const truthyStrings = new Set(["true", "1", "yes", "y", "on"]);
const requireAllKeys = ["requireallparticipants", "requiresallparticipants"];
const allowedSubmissionMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const maxSubmissionBytes = 8 * 1024 * 1024;

const toMetadataMap = (metadata) => {
  if (!metadata) return {};
  const entries = Array.isArray(metadata)
    ? metadata
    : Object.entries(metadata || {}).map(([key, value]) => ({ key, value }));

  return entries.reduce((acc, entry) => {
    if (entry?.key) {
      acc[entry.key.toLowerCase()] = entry.value;
    }
    return acc;
  }, {});
};

const isTruthyValue = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return truthyStrings.has(value.toLowerCase());
  }
  return false;
};

const requiresAllFromMetadata = (metadataMap) =>
  requireAllKeys.some((key) => isTruthyValue(metadataMap?.[key]));

const getParticipantIdsFromWorkflowState = (workflowState) => {
  const ids = new Set();
  if (workflowState?.userId) ids.add(workflowState.userId);
  workflowState?.participants?.forEach((participant) => {
    if (participant?.userId) ids.add(participant.userId);
  });
  return Array.from(ids);
};

const formatPersonName = (data) => {
  if (!data) return "";
  const first = data.fname ?? data.firstName ?? data.givenName;
  const last = data.lname ?? data.lastName ?? data.familyName;
  const full = [first, last].filter(Boolean).join(" ").trim();
  return (
    full ||
    data.display_name ||
    data.preferredName ||
    data.email ||
    data.username ||
    data.id ||
    "Unknown"
  );
};

const buildParticipantDirectory = (team, fallbackUser) => {
  const directory = {};
  if (Array.isArray(team?.members)) {
    team.members.forEach((member) => {
      if (member?.id) {
        directory[member.id] = formatPersonName(member);
      }
    });
  }
  if (fallbackUser?.id && !directory[fallbackUser.id]) {
    directory[fallbackUser.id] = formatPersonName(fallbackUser);
  }
  return directory;
};

const getDisplayName = (directory, userId) => {
  if (!userId) return "Unknown user";
  return directory[userId] || `User ${userId.substring(0, 6)}`;
};

const extractTeamMemberIds = (team) => {
  if (!Array.isArray(team?.members)) return [];
  const ids = team.members
    .map((member) => member?.id)
    .filter((id) => typeof id === "string" && id.trim().length > 0);
  return Array.from(new Set(ids));
};

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
  const [teamMembers, setTeamMembers] = useState([]);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionError, setSubmissionError] = useState("");
  const participantSyncKeysRef = useRef({});
  const workflowParticipantMembers = useMemo(() => {
    if (!Array.isArray(teamWorkflowState?.participants)) return [];
    return teamWorkflowState.participants.map((participant) => ({
      id: participant.userId,
      ...participant,
    }));
  }, [teamWorkflowState]);

  const resolvedTeamMembers = useMemo(() => {
    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      return teamMembers;
    }
    if (Array.isArray(teamAssignment?.members)) {
      return teamAssignment.members;
    }
    return [];
  }, [teamMembers, teamAssignment]);

  const combinedTeamMembers = useMemo(() => {
    const map = new Map();
    [...resolvedTeamMembers, ...workflowParticipantMembers].forEach((member) => {
      if (member?.id) {
        map.set(member.id, member);
      }
    });
    return Array.from(map.values());
  }, [resolvedTeamMembers, workflowParticipantMembers]);

  const teamMemberIds = useMemo(
    () => extractTeamMemberIds({ members: combinedTeamMembers }),
    [combinedTeamMembers]
  );
  const teamMemberIdsKey = useMemo(
    () => teamMemberIds.slice().sort().join("|"),
    [teamMemberIds]
  );

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
    if (!teamAssignment?.id || !process.env.NEXT_PUBLIC_API_URL) {
      setTeamMembers(teamAssignment?.members || []);
      return;
    }

    let cancelled = false;
    const loadTeamMembers = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teams/${teamAssignment.id}/members`
        );
        if (!res.ok) {
          throw new Error("Failed to load team members");
        }
        const data = await res.json();
        if (!cancelled) {
          setTeamMembers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Unable to load team members:", error);
        if (!cancelled) {
          setTeamMembers(teamAssignment?.members || []);
        }
      }
    };

    loadTeamMembers();

    return () => {
      cancelled = true;
    };
  }, [teamAssignment?.id, teamAssignment?.members, user]);

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
          const sortedStates = (assignmentState.actionStates || [])
            .slice()
            .sort((a, b) => a.index - b.index);
          const participantIds = getParticipantIdsFromWorkflowState(assignmentState);
          const participantCount =
            participantIds.length > 0 ? participantIds.length : 1;
          const currentUserId = user?.id ?? null;
          const participantDirectory = buildParticipantDirectory(
            { ...teamAssignment, members: combinedTeamMembers },
            user
          );
          const enrichedStates = sortedStates.map((state) => {
            const metadataMap = toMetadataMap(state.action?.metadata);
            const submissions = Array.isArray(state.submissions)
              ? state.submissions
              : [];
            const completedSubmissions = submissions.filter(
              (submission) => submission?.completed
            );
            const submittedCount = completedSubmissions.length;
            const userHasSubmitted = currentUserId
              ? completedSubmissions.some(
                  (submission) => submission.userId === currentUserId
                )
              : false;
            const requiresAllParticipants =
              state?.action?.requireAllParticipants === true ||
              requiresAllFromMetadata(metadataMap);
            const requiresSubmission =
              state?.action?.requiresSubmission === true ||
              state?.action?.actionType === "complex";
            const submissionMimeTypes = Array.isArray(state?.action?.submissionMimeTypes)
              ? state.action.submissionMimeTypes
              : [];
            const pendingUserIds = requiresAllParticipants
              ? participantIds.filter(
                  (id) =>
                    !completedSubmissions.some(
                      (submission) => submission.userId === id
                    )
                )
              : [];
            const missingParticipantNames = pendingUserIds.map((id) =>
              getDisplayName(participantDirectory, id)
            );

            return {
              ...state,
              metadataMap,
              requiresAllParticipants,
              requiresSubmission,
              submissionMimeTypes,
              submittedCount,
              participantCount,
              userHasSubmitted,
              missingParticipantNames,
            };
          });
          setActionStates(enrichedStates);
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

  useEffect(() => {
    if (
      !teamWorkflowState?.id ||
      teamMemberIds.length === 0 ||
      !process.env.NEXT_PUBLIC_WORKFLOWS_API_URL
    ) {
      return;
    }

    const cacheKey = `${teamWorkflowState.id}:${teamMemberIdsKey}`;

    if (participantSyncKeysRef.current[teamWorkflowState.id] === cacheKey) {
      return;
    }
    participantSyncKeysRef.current[teamWorkflowState.id] = cacheKey;

    const controller = new AbortController();

    const syncParticipants = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WORKFLOWS_API_URL}/states/workflow/${teamWorkflowState.id}/participants`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ participantUserIds: teamMemberIds }),
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          throw new Error("Failed to sync workflow participants");
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Failed to sync workflow participants:", error);
        delete participantSyncKeysRef.current[teamWorkflowState.id];
      }
    };

    syncParticipants();

    return () => controller.abort();
  }, [teamWorkflowState?.id, teamMemberIds, teamMemberIdsKey]);

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
    setSubmissionFile(null);
    setSubmissionError("");
    setSelectedActionState(actionState);
    setOpenModal(true);
  };

  const handleClose = () => {
    setSelectedActionState(null);
    setSubmissionFile(null);
    setSubmissionError("");
    setOpenModal(false);
  };

  const handleSubmissionFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSubmissionFile(null);
      setSubmissionError("");
      return;
    }
    if (file.size > maxSubmissionBytes) {
      setSubmissionError("File is too large. Please upload a file under 8MB.");
      setSubmissionFile(null);
      return;
    }
    if (!allowedSubmissionMimeTypes.includes(file.type)) {
      setSubmissionError("Unsupported file type. Please upload PDF, DOC, DOCX, or XLSX files.");
      setSubmissionFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSubmissionFile({
        name: file.name,
        type: file.type,
        data: reader.result,
      });
      setSubmissionError("");
    };
    reader.readAsDataURL(file);
  };

  const submitAction = async () => {
    if (!selectedActionState || !user?.id) return;
    if (selectedActionState?.requiresSubmission && !submissionFile) {
      setSubmissionError("A file submission is required for this action.");
      return;
    }

    try {
      const body = {
        actionStateId: selectedActionState.id,
        userId: user.id,
        workflowStateId: teamWorkflowState?.id,
      };
      if (selectedActionState?.requiresSubmission && submissionFile) {
        body.fileData = submissionFile.data;
        body.fileName = submissionFile.name;
        body.fileType = submissionFile.type;
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WORKFLOWS_API_URL}/states/handleSubmit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        const message = payload?.message || "Failed to submit action state";
        throw new Error(message);
      }

      setRefresh((prev) => prev + 1);
      setSubmissionFile(null);
      setSubmissionError("");
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
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <Chip
                          label={actionState.action?.name || "Task"}
                          sx={bubbleStyles(actionState.stateType)}
                          title={
                            actionState.requiresAllParticipants
                              ? `${Math.min(
                                  actionState.submittedCount ?? 0,
                                  actionState.participantCount ?? 0
                                )} of ${actionState.participantCount ?? 0} teammates submitted`
                              : undefined
                          }
                          onClick={() => handleOpen(actionState)}
                        />
                        {actionState.requiresAllParticipants &&
                          (actionState.missingParticipantNames?.length ?? 0) > 0 && (
                            <Typography
                              variant="caption"
                              sx={{ mt: 0.25, color: "#F76902", fontWeight: 500 }}
                            >
                              {`${Math.min(
                                actionState.submittedCount ?? 0,
                                actionState.participantCount ?? 0
                              )}/${actionState.participantCount ?? 0} • Waiting on ${actionState.missingParticipantNames.join(", ")}`}
                            </Typography>
                          )}
                      </Box>
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
          {selectedActionState?.requiresAllParticipants && (
            <Typography variant="body2" color="text.secondary" sx={{ marginBottom: "1rem" }}>
              This step requires every teammate to submit.{" "}
              {Math.min(
                selectedActionState.submittedCount ?? 0,
                selectedActionState.participantCount ?? 0
              )}{" "}
              of {selectedActionState.participantCount ?? 0} submissions completed.
              {selectedActionState.userHasSubmitted &&
                (selectedActionState.submittedCount ?? 0) <
                  (selectedActionState.participantCount ?? 0) &&
                " You're all set—waiting on your teammates."}
              {(selectedActionState.missingParticipantNames?.length ?? 0) > 0 && (
                <>
                  {" "}
                  Waiting on{" "}
                  {selectedActionState.missingParticipantNames.join(", ")}.
                </>
              )}
            </Typography>
          )}
          {selectedActionState?.requiresSubmission && (
            <Box sx={{ marginBottom: "1rem" }}>
              <Typography variant="body2" sx={{ marginBottom: "0.5rem" }}>
                File submission required (PDF, DOC, DOCX, or XLSX).
              </Typography>
              <Button
                component="label"
                variant="outlined"
                size="small"
                sx={{ textTransform: "none" }}
              >
                {submissionFile?.name ? `Replace ${submissionFile.name}` : "Choose File"}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.xlsx"
                  onChange={handleSubmissionFileChange}
                />
              </Button>
              {submissionFile?.name && (
                <Typography variant="caption" sx={{ display: "block", marginTop: "0.25rem" }}>
                  Selected: {submissionFile.name}
                </Typography>
              )}
              {submissionError && (
                <Typography variant="caption" color="error" sx={{ display: "block", marginTop: "0.25rem" }}>
                  {submissionError}
                </Typography>
              )}
              {Array.isArray(selectedActionState?.submissions) &&
                selectedActionState.submissions.length > 0 && (
                  <Box sx={{ marginTop: "0.75rem" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                      Submitted files
                    </Typography>
                    {selectedActionState.submissions.map((submission) => (
                      <Box
                        key={`${submission.userId}-${submission.completedAt ?? submission.createdAt ?? submission.id}`}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.35rem",
                        }}
                      >
                        <Typography variant="caption">
                          {submission.fileName || "Submission"} by{" "}
                          {submission.userId ? submission.userId.slice(0, 8) : "unknown"}
                        </Typography>
                        {submission.fileData && (
                          <Button
                            size="small"
                            href={submission.fileData}
                            download={submission.fileName || "submission"}
                          >
                            Download
                          </Button>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
            </Box>
          )}
          <Button
            variant="solid-orange"
            onClick={submitAction}
            disabled={
              !selectedActionState ||
              selectedActionState.stateType === "completed" ||
              selectedActionState.userHasSubmitted ||
              (selectedActionState?.requiresSubmission && !submissionFile)
            }
          >
            {selectedActionState?.requiresAllParticipants
              ? selectedActionState?.userHasSubmitted
                ? "Submitted"
                : "Mark My Part Complete"
              : "Mark Complete"}
          </Button>
        </Box>
      </Modal>
    </>
  );
}
