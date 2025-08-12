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

import Header from '../../_components/Header';

export default function WorkflowDashboard() {
  const [workflowState, setWorkflowState] = useState(null);
  const [actionsMap, setActionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [actionStateIdsMap, setActionStateIdsMap] = useState({});

  // Hardcoded userId and workflowId for debugging
  const userId = '1';
  const workflowId = 'bd342ea6-86d0-41e7-8192-8392e34fa0af';

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
            .filter((as) => as.stateType === 'completed')
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

    fetchWorkflowAndActions();
  }, [userId, workflowId]);

  const toggleComplete = async (actionId) => {
      const actionStateId = actionStateIdsMap[actionId];
      if (!actionStateId) {
        alert('No actionState ID found for this action. Cannot update.');
        return;
      }

      const currentlyCompleted = completedSteps.has(actionId);
      const newCompleted = !currentlyCompleted;
      const newStateType = newCompleted ? 'completed' : 'notStarted';

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WORKFLOWS_API_URL}/states/action/${actionStateId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stateType: newStateType }),
          }
        );

        if (!response.ok) {
          const resBody = await response.json().catch(() => null);
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
    0: '/scoopdinator/applications',
    1: '/scoopdinator/scooployees',
    2: '/scoopdinator/teams',
    3: '/projects/assign',
    4: 'https://example.com/placeholder',
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading workflows...</Typography>;
  if (error) return <Typography sx={{ p: 4, color: 'red' }}>{error}</Typography>;
  if (!workflowState) return <Typography sx={{ p: 4 }}>No workflow state available</Typography>;

  const steps = workflowState.actionStates;

  return (
    <Box sx={{ fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif', color: '#212121' }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, maxWidth: '1280px' }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, mb: 5, color: '#fff' }}>
          Workflow Dashboard
        </Typography>

        <Grid container spacing={4} direction="column">
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  mb: 3,
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
                        disabled={isLocked}
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
          © {new Date().getFullYear()} RIT | Contact | Terms
        </Typography>
      </Box>
    </Box>
  );
}
