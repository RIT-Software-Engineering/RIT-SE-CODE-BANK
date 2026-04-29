'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Container, Grid, Paper,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import Header from '@components/Header';
import { useUser } from '../../utils/user-context/page';

export default function WorkflowsList() {
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedStepsMap, setCompletedStepsMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = process.env.NEXT_PUBLIC_WORKFLOWS_API_URL;

        const workflowsRes = await fetch(`${baseUrl}/workflows`);
        if (!workflowsRes.ok) throw new Error('Failed to fetch workflows');
        const workflowsData = await workflowsRes.json();

        const statesUrl = new URL(`${baseUrl}/states/workflow`);
        statesUrl.searchParams.append('userId', userId);
        const workflowStatesRes = await fetch(statesUrl.toString());
        if (!workflowStatesRes.ok) throw new Error('Failed to fetch workflow states');
        const workflowStatesData = await workflowStatesRes.json();

        const allActionIdsSet = new Set();
        workflowStatesData.forEach(ws => {
          ws.actionStates.forEach(as => allActionIdsSet.add(as.actionId));
        });
        const allActionIds = Array.from(allActionIdsSet);

        let actionsMap = {};
        if (allActionIds.length > 0) {
          const actionsRes = await fetch(`${baseUrl}/actions?ids=${allActionIds.join(',')}`);
          if (!actionsRes.ok) throw new Error('Failed to fetch actions');
          const actionsData = await actionsRes.json();
          actionsData.forEach(a => {
            actionsMap[a.id] = a;
          });
        }

        const workflowsById = {};
        workflowsData.forEach(wf => {
          workflowsById[wf.id] = wf;
        });

        const workflowsWithSteps = workflowStatesData.map(ws => {
          const wf = workflowsById[ws.workflowId];
          const wfName = wf?.name || actionsMap[wf?.baseActionId]?.name || 'Untitled Workflow';

          const steps = ws.actionStates.map(as => ({
            actionId: as.actionId,
            title: actionsMap[as.actionId]?.name || 'Untitled Step',
            link: `/scooployee/workflows/${ws.workflowId}`,
          }));

          return {
            id: ws.workflowId,
            name: wfName,
            steps,
          };
        });

        setWorkflows(workflowsWithSteps);

        const completedMap = {};
        workflowStatesData.forEach(ws => {
          const completedSet = new Set(
            ws.actionStates
              .filter(as => as.stateType === 'completed')
              .map(as => as.actionId)
          );
          completedMap[ws.workflowId] = completedSet;
        });
        setCompletedStepsMap(completedMap);

      } catch (err) {
        setError(err.message || 'Error loading workflows');
      } finally {
        setLoading(false);
      }
    };

    if (!userId) {
      setWorkflows([]);
      setCompletedStepsMap({});
      setLoading(false);
      return;
    }

    fetchData();
  }, [userId]);

  if (loading) return <Typography sx={{ p: 4 }}>Loading workflows...</Typography>;
  if (!userId) {
    return (
      <Typography sx={{ p: 4, color: 'red' }}>
        No user selected. Please choose a user to view workflows.
      </Typography>
    );
  }
  if (error) return <Typography sx={{ p: 4, color: 'red' }}>{error}</Typography>;

  return (
    <Box sx={{ fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif', color: '#212121' }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, maxWidth: '1280px' }}>
        <Typography variant="h1" sx={{ mb: 5 }}>
          Workflows Dashboard
        </Typography>

        {workflows.length === 0 ? (
          <Typography sx={{ p: 4 }}>No workflows found.</Typography>
        ) : (
          <Grid container spacing={4} direction="column">
            {workflows.map((workflow) => {
              const completedSet = completedStepsMap[workflow.id] || new Set();

              return (
                <Grid item xs={12} key={workflow.id}>
                  <Paper
                    elevation={1}
                    onClick={() => router.push(`/scooployee/workflows/${workflow.id}`)}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 6,
                        bgcolor: '#fff3e0',
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 700,
                        borderBottom: '2px solid #F76902',
                        pb: 1,
                        maxWidth: 'max-content',
                      }}
                    >
                      {workflow.name}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {workflow.steps.map((step, index) => {
                        const completed = completedSet.has(step.actionId);
                        return (
                          <Box
                            key={`${workflow.id}-step-${index}`}
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: completed ? '#4caf50' : '#bbb',
                              transition: 'background-color 0.3s ease',
                            }}
                            title={step.title}
                          />
                        );
                      })}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
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
