"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Header from '@components/Header';
import {
  Box, Typography, Container, Button, Grid, Paper, Chip, Modal,
} from '@mui/material';
import { useUser } from "../utils/user-context/page";

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

const isTruthy = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return truthyStrings.has(value.toLowerCase());
  }
  return false;
};

const requiresAllFromMetadata = (metadataMap) =>
  requireAllKeys.some((key) => isTruthy(metadataMap?.[key]));

const getParticipantIdsFromWorkflowState = (workflowState) => {
  const ids = new Set();
  if (workflowState?.userId) ids.add(workflowState.userId);
  workflowState?.participants?.forEach((participant) => {
    if (participant?.userId) ids.add(participant.userId);
  });
  return Array.from(ids);
};

const formatPersonName = (data) => {
  if (!data) return "Unknown";
  const first = data.fname ?? data.firstName ?? data.givenName;
  const last = data.lname ?? data.lastName ?? data.familyName;
  const name = [first, last].filter(Boolean).join(" ").trim();
  return (
    name ||
    data.display_name ||
    data.preferredName ||
    data.email ||
    data.username ||
    data.id ||
    "Unknown"
  );
};

const buildTeamDirectory = (team, fallbackUsers = []) => {
  const directory = {};
  if (Array.isArray(team?.members)) {
    team.members.forEach((member) => {
      if (member?.id) {
        directory[member.id] = formatPersonName(member);
      }
    });
  }
  fallbackUsers.forEach((user) => {
    if (user?.id && !directory[user.id]) {
      directory[user.id] = formatPersonName(user);
    }
  });
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

const deriveActionStateDetails = (
  actionState,
  workflowState,
  userId,
  team,
  fallbackUsers = []
) => {
  const metadataMap = toMetadataMap(actionState?.action?.metadata);
  const submissions = Array.isArray(actionState?.submissions)
    ? actionState.submissions
    : [];
  const participantIds = getParticipantIdsFromWorkflowState(workflowState);
  const participantCount =
    participantIds.length > 0 ? participantIds.length : 1;
  const directory = buildTeamDirectory(team, fallbackUsers);
  const requiresAllParticipants =
    actionState?.action?.requireAllParticipants === true ||
    requiresAllFromMetadata(metadataMap);
  const requiresSubmission =
    actionState?.action?.requiresSubmission === true ||
    actionState?.action?.actionType === "complex";
  const submissionMimeTypes = Array.isArray(actionState?.action?.submissionMimeTypes)
    ? actionState.action.submissionMimeTypes
    : [];
  const completedSubmissions = submissions.filter(
    (submission) => submission?.completed
  );
  const pendingUserIds = requiresAllParticipants
    ? participantIds.filter(
        (id) =>
          !completedSubmissions.some(
            (submission) => submission.userId === id
          )
      )
    : [];
  const missingParticipantNames = pendingUserIds.map((id) =>
    getDisplayName(directory, id)
  );

  return {
    metadataMap,
    requiresAllParticipants,
    requiresSubmission,
    submissionMimeTypes,
    submittedCount: completedSubmissions.length,
    participantCount,
    userHasSubmitted: userId
      ? completedSubmissions.some(
          (submission) => submission.userId === userId
        )
      : false,
    missingParticipantNames,
    pendingUserIds,
    participantDirectory: directory,
  };
};



export default function bubbled(){
  
  const [workflowStates, setWorkflowStates] = useState([]);
  const [teamsById, setTeamsById] = useState({});
  const [usersById, setUsersById] = useState({});
  const [open, setOpen] = useState(false);
  const [openActionState, setOpenActionState] = useState(null);
  const [openAction, setOpenAction] = useState(null);
  const [activeWorkflowState, setActiveWorkflowState] = useState(null);
  const [refresh, forceRefresh] = useState(0);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionError, setSubmissionError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {user} = useUser();
  const workflowsApiUrl = process.env.NEXT_PUBLIC_WORKFLOWS_API_URL || "http://localhost:5001";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const participantsSyncMapRef = useRef({});

  useEffect(() => {
    let cancelled = false;
    async function getActions() {
      if(user == null || user.id == null){
        if (!cancelled) {
          setWorkflowStates([]);
          setIsLoading(false);
        }
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`${workflowsApiUrl}/states/workflow?userId=${user.id}`);
        if (!res.ok) {
          throw new Error(`Failed to load workflow states (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) {
          setWorkflowStates(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading workflow states:", error);
          setWorkflowStates([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    getActions();
    return () => {
      cancelled = true;
    };
  },[refresh, user, workflowsApiUrl]);

  useEffect(() => {
    if (!user?.id || !apiBaseUrl) {
      return;
    }

    if (!workflowStates.some((state) => state.teamId)) {
      return;
    }

    let cancelled = false;
    async function loadTeams() {
      try {
        const res = await fetch(`${apiBaseUrl}/api/teams/${user.id}`);
        if (!res.ok) {
          throw new Error(`Failed to load teams for user (${res.status})`);
        }
        const data = await res.json();
        if (cancelled) {
          return;
        }
        const nextTeams = {};
        const nextUsers = {};
        data.forEach((team) => {
          nextTeams[team.id] = team;
          team.members?.forEach((member) => {
            if (member?.id) {
              nextUsers[member.id] = member;
            }
          });
        });

        if (Object.keys(nextTeams).length > 0) {
          setTeamsById((prev) => ({ ...prev, ...nextTeams }));
        }
        if (Object.keys(nextUsers).length > 0) {
          setUsersById((prev) => ({ ...prev, ...nextUsers }));
        }
      } catch (error) {
        console.error("Error loading teams:", error);
      }
    }

    loadTeams();

    return () => {
      cancelled = true;
    };
  }, [workflowStates, user, apiBaseUrl]);

  useEffect(() => {
    if (!apiBaseUrl) {
      return;
    }

    const relevantIds = new Set();
    workflowStates.forEach((state) => {
      if (state.userId) {
        relevantIds.add(state.userId);
      }
      state.participants?.forEach((participant) => {
        if (participant?.userId) {
          relevantIds.add(participant.userId);
        }
      });
    });

    if (user?.id) {
      relevantIds.add(user.id);
    }

    const missingIds = Array.from(relevantIds).filter(
      (id) => id && !usersById[id]
    );

    if (missingIds.length === 0) {
      return;
    }

    let cancelled = false;
    async function loadUsers() {
      const updates = {};
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const res = await fetch(`${apiBaseUrl}/api/users/${id}`);
            if (!res.ok || cancelled) {
              return;
            }
            const data = await res.json();
            if (data?.id) {
              updates[data.id] = data;
            }
          } catch (error) {
            console.error(`Failed to fetch user ${id}:`, error);
          }
        })
      );

      if (!cancelled && Object.keys(updates).length > 0) {
        setUsersById((prev) => ({ ...prev, ...updates }));
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [workflowStates, user, usersById, apiBaseUrl]);

  useEffect(() => {
    if (
      workflowStates.length === 0 ||
      !workflowsApiUrl ||
      Object.keys(teamsById).length === 0
    ) {
      return;
    }

    workflowStates.forEach((state) => {
      if (!state.teamId) {
        return;
      }

      const team = teamsById[state.teamId];
      const teamMemberIds = extractTeamMemberIds(team);
      const participantIds = Array.isArray(state.participants)
        ? state.participants
            .map((participant) => participant?.userId)
            .filter((id) => typeof id === "string" && id.trim().length > 0)
        : [];
      const memberIds = Array.from(
        new Set([...teamMemberIds, ...participantIds])
      );
      if (memberIds.length === 0) {
        return;
      }

      const cacheKey = `${state.id}:${memberIds.slice().sort().join("|")}`;
      if (participantsSyncMapRef.current[state.id] === cacheKey) {
        return;
      }
      participantsSyncMapRef.current[state.id] = cacheKey;

      fetch(`${workflowsApiUrl}/states/workflow/${state.id}/participants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantUserIds: memberIds }),
      }).catch((error) => {
        console.error("Failed to sync workflow participants:", error);
        delete participantsSyncMapRef.current[state.id];
      });
    });
  }, [workflowStates, teamsById, workflowsApiUrl]);

  const formatUserName = (userId) => {
    if (!userId) {
      return "Unknown";
    }
    const info = usersById[userId];
    const first = info?.fname ?? info?.firstName;
    const last = info?.lname ?? info?.lastName;
    const baseName = [first, last].filter(Boolean).join(" ").trim();
    const fallback = info?.email || info?.username || userId;
    const resolved = baseName || fallback;
    if (user?.id && userId === user.id) {
      return `${resolved} (You)`;
    }
    return resolved;
  };

  const getParticipantNames = (state) => {
    const ids = new Set();
    if (state.userId) {
      ids.add(state.userId);
    }
    state.participants?.forEach((participant) => {
      if (participant?.userId) {
        ids.add(participant.userId);
      }
    });
    return Array.from(ids)
      .map((id) => formatUserName(id))
      .join(", ");
  };

  const teamGroups = useMemo(() => {
    const groups = {};
    workflowStates.forEach((state) => {
      if (!state.teamId) {
        return;
      }
      if (!groups[state.teamId]) {
        groups[state.teamId] = [];
      }
      groups[state.teamId].push(state);
    });
    return groups;
  }, [workflowStates]);

  const personalStates = useMemo(
    () => workflowStates.filter((state) => !state.teamId),
    [workflowStates],
  );

  const handleOpen = (actionState, workflowState, derivedDetails = null) => {
    setSubmissionFile(null);
    setSubmissionError("");
    const details =
      derivedDetails ??
      deriveActionStateDetails(
        actionState,
        workflowState,
        user?.id,
        teamsById[workflowState?.teamId],
        [user]
      );
    setOpenActionState({
      ...actionState,
      ...details,
    });
    setOpenAction(actionState.action);
    setActiveWorkflowState(workflowState);
    setOpen(true);
  };

  const handleClose = async(shouldPromote = true) => {
    const shouldMarkInProgress =
      shouldPromote &&
      openActionState?.stateType != "completed" &&
      !openAction?.requiresSubmission;
    if(shouldMarkInProgress){
      try {
        await fetch(`${workflowsApiUrl}/states/handleSubmit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actionStateId: openActionState.id,
            stateType: "inProgress",
            userId: user?.id,
            workflowStateId: activeWorkflowState?.id,
          }),
        });
        forceRefresh(previous => previous + 1);
      } catch (e) {console.error('Error handling submit:', e);}
    }
    setOpenAction(null);
    setOpenActionState(null);
    setActiveWorkflowState(null);
    setSubmissionFile(null);
    setSubmissionError("");
    setOpen(false);
  };

  useEffect(() => {
    if (!openActionState) {
      return;
    }
    const targetWorkflow = workflowStates.find((state) =>
      state.actionStates?.some((as) => as.id === openActionState.id)
    );
    if (!targetWorkflow) {
      return;
    }
    const latestActionState = targetWorkflow.actionStates.find(
      (as) => as.id === openActionState.id
    );
    if (!latestActionState) {
      return;
    }
    const teamForState = teamsById[targetWorkflow.teamId];
    const derivedDetails = deriveActionStateDetails(
      latestActionState,
      targetWorkflow,
      user?.id,
      teamForState,
      [user]
    );
    setOpenActionState((prev) => {
      if (
        !prev ||
        (prev.submittedCount === derivedDetails.submittedCount &&
          prev.participantCount === derivedDetails.participantCount &&
          prev.stateType === latestActionState.stateType &&
          prev.requiresAllParticipants === derivedDetails.requiresAllParticipants &&
          (prev.missingParticipantNames || []).join("|") ===
            (derivedDetails.missingParticipantNames || []).join("|"))
      ) {
        return prev;
      }
      return {
        ...latestActionState,
        ...derivedDetails,
      };
    });
    setOpenAction(latestActionState.action);
    setActiveWorkflowState(targetWorkflow);
  }, [workflowStates, teamsById, user?.id, openActionState?.id]);

  const markLocalSubmissionProgress = (payload) => {
    setOpenActionState((prev) => {
      if (!prev) return prev;
      const directory = prev.participantDirectory || {};
      const pendingIds = prev.pendingUserIds || [];
      const remainingIds = pendingIds.filter(
        (id) => String(id) !== String(user?.id)
      );
      return {
        ...prev,
        stateType: payload?.fullyCompleted ? "completed" : "inProgress",
        submittedCount: payload?.completedCount ?? prev.submittedCount,
        participantCount: payload?.requiredCount ?? prev.participantCount,
        userHasSubmitted: true,
        pendingUserIds: remainingIds,
        missingParticipantNames: remainingIds.map(
          (id) => directory[id] || `User ${String(id).slice(0, 6)}`
        ),
      };
    });
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
    if (!openActionState || !user?.id) {
      return;
    }
    if (openAction?.requiresSubmission && !submissionFile) {
      setSubmissionError("A file submission is required for this action.");
      return;
    }
    try {
      const body = {
        actionStateId: openActionState.id,
        userId: user.id,
        workflowStateId: activeWorkflowState?.id,
      };
      if (openAction?.requiresSubmission && submissionFile) {
        body.fileData = submissionFile.data;
        body.fileName = submissionFile.name;
        body.fileType = submissionFile.type;
      }
      const res = await fetch(`${workflowsApiUrl}/states/handleSubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          payload?.message ||
          `Failed to submit action state (${res.status})`;
        alert(message);
        return;
      }
      const requiresAll = payload?.requiresAllParticipants;
      const fullyCompleted = payload?.fullyCompleted;
      markLocalSubmissionProgress(payload);
      forceRefresh(previous => previous + 1);
      setSubmissionFile(null);
      setSubmissionError("");
      if (requiresAll && !fullyCompleted) {
        return;
      }
      handleClose(false);
    } catch (e) {
      console.error('Error handling submit:', e);
      alert(e.message);
    }
  };

  const bubbleColor = (actionState) => {
      switch(actionState.stateType){
        case "completed":
          return { backgroundColor: '#4caf50', color: '#fff' };
        case "inProgress":
          return { backgroundColor: '#f7df1e', color: '#000' };
        default:
          return { backgroundColor: '#9e9e9e', color: '#fff' };
      }
  };

  const renderActionChips = (workflowState) => {
    const sortedStates = (workflowState.actionStates || [])
      .slice()
      .sort((a, b) => a.index - b.index);

    if (sortedStates.length === 0) {
      return (
        <Grid item>
          <Typography variant="body2" color="text.secondary">
            No actions assigned yet.
          </Typography>
        </Grid>
      );
    }

    return sortedStates.map((actionState) => {
      const team = teamsById[workflowState.teamId];
      const derivedDetails = deriveActionStateDetails(
        actionState,
        workflowState,
        user?.id,
        team,
        [user]
      );
      return (
        <Grid item key={actionState.id}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <Chip
              label={actionState.action?.name || "Task"}
              sx={bubbleColor(actionState)}
              title={
                derivedDetails.requiresAllParticipants
                  ? `${Math.min(
                      derivedDetails.submittedCount ?? 0,
                      derivedDetails.participantCount ?? 0
                    )} of ${derivedDetails.participantCount ?? 0} teammates submitted`
                  : undefined
              }
              onClick={() => handleOpen(actionState, workflowState, derivedDetails)}
            />
            {workflowState.teamId &&
              derivedDetails.requiresAllParticipants &&
              (derivedDetails.missingParticipantNames?.length ?? 0) > 0 && (
                <Typography
                  variant="caption"
                  sx={{ mt: 0.25, color: "#F76902", fontWeight: 500 }}
                >
                  {`${Math.min(
                    derivedDetails.submittedCount ?? 0,
                    derivedDetails.participantCount ?? 0
                  )}/${derivedDetails.participantCount ?? 0} • Waiting on ${derivedDetails.missingParticipantNames.join(", ")}`}
                </Typography>
              )}
          </Box>
        </Grid>
      );
    });
  };

  const hasTeamWorkflows = Object.keys(teamGroups).length > 0;
  const hasPersonalWorkflows = personalStates.length > 0;

  return (
    <>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4, maxWidth: "1280px" }}>
          {isLoading ? (
            <Typography variant="body1">Loading workflow actions...</Typography>
          ) : (
            <>
              {hasTeamWorkflows && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Team Workflows
                  </Typography>
                  {Object.entries(teamGroups).map(([teamId, states]) => {
                    const team = teamsById[teamId];
                    const teamName = team?.name || `Team ${teamId}`;
                    const memberNames = team?.members?.map((member) => formatUserName(member.id)).join(", ");
                    return (
                      <Paper key={teamId} sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" sx={{ mb: 1 }}>
                          {teamName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {memberNames
                            ? `Members: ${memberNames}`
                            : "Members: Not available"}
                        </Typography>
                        {states.map((state) => (
                          <Box key={state.id} sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              Actions for: {getParticipantNames(state) || "Shared"}
                            </Typography>
                            <Grid container spacing={1} sx={{ mt: 1 }}>
                              {renderActionChips(state)}
                            </Grid>
                          </Box>
                        ))}
                      </Paper>
                    );
                  })}
                </Box>
              )}

              {hasPersonalWorkflows && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    My Workflows
                  </Typography>
                  {personalStates.map((state) => (
                    <Paper key={state.id} sx={{ p: 3, mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        Participants: {getParticipantNames(state) || "You"}
                      </Typography>
                      <Grid container spacing={1}>
                        {renderActionChips(state)}
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              )}

              {!hasTeamWorkflows && !hasPersonalWorkflows && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="body1">
                    No workflow actions assigned yet. Once actions are assigned, they will show up here.
                  </Typography>
                </Paper>
              )}
            </>
          )}
          <Modal open={open} onClose={() => handleClose()}>
            <Box  sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
              }}>
              <Typography variant="h6">
                {openAction?.name || "Workflow Action"}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {openAction?.description || "No additional details provided."}
              </Typography>
              {activeWorkflowState && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Participants: {getParticipantNames(activeWorkflowState) || "Shared"}
                </Typography>
              )}
              {openActionState?.requiresAllParticipants && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This step requires every teammate to submit.{" "}
                  {Math.min(
                    openActionState.submittedCount ?? 0,
                    openActionState.participantCount ?? 0
                  )}{" "}
                  of {openActionState.participantCount ?? 0} submissions completed.
                  {openActionState.userHasSubmitted &&
                    (openActionState.submittedCount ?? 0) <
                      (openActionState.participantCount ?? 0) &&
                    " You're all set—waiting on your teammates."}
                  {activeWorkflowState?.teamId &&
                    (openActionState.missingParticipantNames?.length ?? 0) > 0 && (
                    <>
                      {" "}
                      Waiting on{" "}
                      {openActionState.missingParticipantNames.join(", ")}.
                    </>
                  )}
                </Typography>
              )}
              {openAction?.requiresSubmission && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
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
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                      Selected: {submissionFile.name}
                    </Typography>
                  )}
                  {submissionError && (
                    <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                      {submissionError}
                    </Typography>
                  )}
                  {Array.isArray(openActionState?.submissions) &&
                    openActionState.submissions.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Submitted files
                        </Typography>
                        {openActionState.submissions.map((submission) => (
                          <Box
                            key={`${submission.userId}-${submission.completedAt ?? submission.createdAt ?? submission.id}`}
                            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}
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
                onClick={submitAction}
                disabled={
                  !openActionState ||
                  !user?.id ||
                  openActionState.stateType === "completed" ||
                  openActionState.userHasSubmitted ||
                  (openAction?.requiresSubmission && !submissionFile)
                }
              >
                {openActionState?.requiresAllParticipants
                  ? openActionState?.userHasSubmitted
                    ? "Submitted"
                    : "Mark My Part Complete"
                  : "Mark Complete"}
              </Button>

            </Box>
          </Modal>
        </Container>
    </>);
}
