"use client";
import React, { useState, useEffect, useMemo } from "react";
import Header from '@components/Header';
import {
  Box, Typography, Container, Button, Grid, Paper, Chip, Modal,
} from '@mui/material';
import { useUser } from "../utils/user-context/page";



export default function bubbled(){
  
  const [workflowStates, setWorkflowStates] = useState([]);
  const [teamsById, setTeamsById] = useState({});
  const [usersById, setUsersById] = useState({});
  const [open, setOpen] = useState(false);
  const [openActionState, setOpenActionState] = useState(null);
  const [openAction, setOpenAction] = useState(null);
  const [activeWorkflowState, setActiveWorkflowState] = useState(null);
  const [refresh, forceRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const {user} = useUser();
  const workflowsApiUrl = process.env.NEXT_PUBLIC_WORKFLOWS_API_URL || "http://localhost:5001";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

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

  const handleOpen = (actionState, workflowState) => {
    setOpenActionState(actionState);
    setOpenAction(actionState.action);
    setActiveWorkflowState(workflowState);
    setOpen(true);
  };

  const handleClose = async(shouldPromote = true) => {
    if(shouldPromote && openActionState?.stateType != "completed"){
      try {
      const res = await fetch(`${workflowsApiUrl}/states/handleSubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionStateId: openActionState.id,
          stateType: "inProgress",
        }),
      });
      forceRefresh(previous => previous + 1);
    } catch (e) {console.error('Error handling submit:', e);}
    }
    setOpenAction(null);
    setOpenActionState(null);
    setActiveWorkflowState(null);
    setOpen(false);
  };


  const submitAction = async () => {
    if (!openActionState) {
      return;
    }
    try {
      const res = await fetch(`${workflowsApiUrl}/states/handleSubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionStateId: openActionState.id,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to submit action state (${res.status})`);
      }
      forceRefresh(previous => previous + 1);
    } catch (e) {console.error('Error handling submit:', e);}
    handleClose(false);
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

    return sortedStates.map((actionState) => (
      <Grid item key={actionState.id}>
        <Chip
          label={actionState.action?.name || "Task"}
          sx={bubbleColor(actionState)}
          onClick={() => handleOpen(actionState, workflowState)}
        />
      </Grid>
    ));
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
              <Button onClick={submitAction}>Submit</Button>

            </Box>
          </Modal>
        </Container>
    </>);
}
