'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Grid,
  Paper,
  Checkbox,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import Header from '@components/Header';
import { useParams, useRouter } from 'next/navigation';

const truthyStrings = new Set(['true', '1', 'yes', 'y', 'on']);
const requireAllKeys = ['requireallparticipants', 'requiresallparticipants'];

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
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
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

const deriveActionStateDetails = (actionState, workflowState, currentUserId) => {
  const metadataMap = toMetadataMap(actionState?.action?.metadata);
  const requiresAllParticipants =
    actionState?.action?.requireAllParticipants === true ||
    requiresAllFromMetadata(metadataMap);
  const submissions = Array.isArray(actionState?.submissions)
    ? actionState.submissions
    : [];
  const completedSubmissions = submissions.filter(
    (submission) => submission?.completed
  );
  const participantCount =
    getParticipantIdsFromWorkflowState(workflowState).length || 1;

  return {
    metadataMap,
    requiresAllParticipants,
    userHasSubmitted: currentUserId
      ? completedSubmissions.some(
          (submission) => submission.userId === currentUserId
        )
      : false,
    submittedCount: completedSubmissions.length,
    participantCount,
  };
};

export default function WorkflowDashboard() {
  const { id: workflowId } = useParams(); // get workflowId from route param
  const router = useRouter();
  const userId = '2';

  const [workflowState, setWorkflowState] = useState(null);
  const [actionsMap, setActionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [actionStateIdsMap, setActionStateIdsMap] = useState({});

  useEffect(() => {
    const fetchWorkflowAndActions = async () => {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = process.env.NEXT_PUBLIC_WORKFLOWS_API_URL;

        const workflowUrl = new URL(`${baseUrl}/states/workflow`);
        workflowUrl.searchParams.append('userId', userId);
        workflowUrl.searchParams.append('workflowId', workflowId);

        const workflowResponse = await fetch(workflowUrl.toString());
        if (!workflowResponse.ok) throw new Error('Failed to fetch workflow state');
        const states = await workflowResponse.json();
        if (!states.length) throw new Error('No workflow state found for user');

        const state = states[0];
        setWorkflowState(state);

        const idsMap = {};
        state.actionStates.forEach(as => {
          idsMap[as.actionId] = as.id;
        });
        setActionStateIdsMap(idsMap);

        const actionIds = state.actionStates.map((as) => as.actionId);
        if (actionIds.length === 0) {
          setActionsMap({});
          setCompletedSteps(new Set());
          setLoading(false);
          return;
        }

        const actionsUrl = new URL(`${baseUrl}/actions`);
        actionsUrl.searchParams.append('ids', actionIds.join(','));

        const actionsResponse = await fetch(actionsUrl.toString());
        if (!actionsResponse.ok) throw new Error('Failed to fetch actions');

        const actions = await actionsResponse.json();

        const map = {};
        actions.forEach((action) => {
          map[action.id] = action;
        });
        setActionsMap(map);

        const completed = new Set(
          state.actionStates
            .filter((as) => {
              const details = deriveActionStateDetails(as, state, userId);
              return (
                as.stateType === 'completed' ||
                (details.requiresAllParticipants && details.userHasSubmitted)
              );
            })
            .map((as) => as.actionId)
        );
        setCompletedSteps(completed);
      } catch (err) {
        setError(err.message || 'Failed to load workflow state');
        setWorkflowState(null);
        setActionsMap({});
        setCompletedSteps(new Set());
      } finally {
        setLoading(false);
      }
    };

    if (workflowId) fetchWorkflowAndActions();
  }, [userId, workflowId]);

  const toggleComplete = async (actionId) => {
    const actionStateId = actionStateIdsMap[actionId];
    if (!actionStateId) {
      alert('No actionState ID found for this action. Cannot update.');
      return;
    }

    const actionState = workflowState?.actionStates?.find(
      (state) => state.actionId === actionId
    );
    if (!actionState) {
      alert('Unable to locate the selected action state.');
      return;
    }

    const details = deriveActionStateDetails(actionState, workflowState, userId);
    const currentlyCompleted = completedSteps.has(actionId);
    const newCompleted = !currentlyCompleted;

    try {
      let response;
      if (newCompleted) {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_WORKFLOWS_API_URL}/states/handleSubmit`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actionStateId,
              userId,
              workflowStateId: workflowState?.id,
            }),
          }
        );
      } else {
        if (details.requiresAllParticipants) {
          alert('This action tracks submissions for every teammate and cannot be unchecked.');
          return;
        }
        response = await fetch(
          `${process.env.NEXT_PUBLIC_WORKFLOWS_API_URL}/states/action/${actionStateId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stateType: 'notStarted' }),
          }
        );
      }

      const resBody = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(resBody?.message || 'Failed to update action state');
      }

      setCompletedSteps((prev) => {
        const newSet = new Set(prev);
        if (newCompleted) {
          newSet.add(actionId);
        } else {
          newSet.delete(actionId);
        }
        return newSet;
      });
    } catch (error) {
      alert(`Error updating step: ${error.message}`);
    }
  };

  const stepIndexToUrl = {
    0: 'https://rit-csm.symplicity.com/students/index.php?s=profile&ss=coop',
    1: 'https://rit.enterprise.slack.com',
    2: 'https://github.com/RIT-Software-Engineering',
    3: 'https://coopeval.rit.edu/student/evaluations',
  };

  if (!workflowId) return <Typography sx={{ p: 4 }}>No workflow ID provided.</Typography>;
  if (loading) return <Typography sx={{ p: 4 }}>Loading workflows...</Typography>;
  if (error) return <Typography sx={{ p: 4, color: 'red' }}>{error}</Typography>;
  if (!workflowState) return <Typography sx={{ p: 4 }}>No workflow state available</Typography>;

  const steps = workflowState.actionStates;

  return (
    <Box sx={{ fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif', color: '#212121' }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, maxWidth: '1280px' }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, mb: 5, color: '#fff' }}>
          Scooployee Workflow
        </Typography>

        <Grid container spacing={4} direction="column">
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  mb: 1,
                  borderBottom: '2px solid #F76902',
                  pb: 1,
                  maxWidth: 'max-content',
                }}
              >
                {
                  actionsMap[workflowState.workflow?.baseActionId]?.name
                  ?? workflowState.workflow?.name
                  ?? 'Untitled Workflow'
                }
              </Typography>

              <Box>
                {steps.map((step, index) => {
                  const prevStep = steps[index - 1];
                  const isLocked = index > 0 && !completedSteps.has(prevStep.actionId);
                  const isCompleted = completedSteps.has(step.actionId);
                  const details = deriveActionStateDetails(step, workflowState, userId);
                  const waitingOnTeam =
                    details.requiresAllParticipants &&
                    details.userHasSubmitted &&
                    step.stateType !== 'completed';
                  const checkboxDisabled =
                    isLocked ||
                    (details.requiresAllParticipants &&
                      (details.userHasSubmitted || step.stateType === 'completed'));

                  const action = actionsMap[step.actionId];

                  let metadataTitle = '';
                  if (Array.isArray(action?.metadata)) {
                    metadataTitle = action.metadata.find((m) => m.key === 'title')?.value || '';
                  } else if (action?.metadata && typeof action.metadata === 'object') {
                    metadataTitle = action.metadata.title || '';
                  }

                  return (
                    <Box
                      key={step.id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        mb: index !== steps.length - 1 ? 3 : 0,
                        flexWrap: 'nowrap',
                        opacity: isLocked ? 0.5 : 1,
                        pointerEvents: isLocked ? 'none' : 'auto',
                      }}
                    >
                      <Checkbox
                        checked={isCompleted}
                        onChange={() => toggleComplete(step.actionId)}
                        disabled={checkboxDisabled}
                        sx={{ color: '#F76902', mr: 1 }}
                        inputProps={{ 'aria-label': 'Mark step complete' }}
                      />

                      <Box
                        sx={{
                          minWidth: 32,
                          minHeight: 32,
                          borderRadius: '50%',
                          bgcolor: isCompleted ? '#4caf50' : '#F76902',
                          color: '#fff',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          userSelect: 'none',
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </Box>

                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="h3"
                          sx={{
                            fontSize: '1.25rem',
                            fontWeight: 300,
                            mb: 0.5,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            color: isCompleted ? '#888' : 'inherit',
                          }}
                          title={metadataTitle || action?.name || 'Untitled Step'}
                        >
                          {metadataTitle || action?.name || 'Untitled Step'}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            lineHeight: 1.5,
                            color: '#555',
                            whiteSpace: 'normal',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                          }}
                        >
                          {action?.description || 'No description available'}
                        </Typography>
                        {waitingOnTeam && (
                          <Typography
                            variant="caption"
                            sx={{ color: '#F76902', display: 'block', mt: 0.5 }}
                          >
                            Waiting for teammates (
                            {Math.min(
                              details.submittedCount ?? 0,
                              details.participantCount ?? 0
                            )}
                            /
                            {details.participantCount ?? 0})
                          </Typography>
                        )}
                      </Box>

                      <Button
                        variant="contained"
                        disabled={isLocked}
                        sx={{
                          backgroundColor: '#F76902',
                          textTransform: 'none',
                          ml: 2,
                          flexShrink: 0,
                          '&:hover': { backgroundColor: '#d65a00' },
                        }}
                        endIcon={<ArrowForwardIosIcon fontSize="small" />}
                        onClick={() => {
                          const url = stepIndexToUrl[index];
                          if (url) {
                            window.location.href = url;
                          } else {
                            alert('No URL defined for this step');
                          }
                        }}
                      >
                        Go
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Box
        component="footer"
        sx={{
          height: '80px',
          bgcolor: '#212121',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, md: 3 },
          mt: 8,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 300 }}>
          © {new Date().getFullYear()} RIT | Powered by Scoop Software
        </Typography>
      </Box>
    </Box>
  );
}
