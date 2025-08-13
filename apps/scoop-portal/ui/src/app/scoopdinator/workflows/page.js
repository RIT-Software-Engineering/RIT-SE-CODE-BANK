'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Container, Grid, Paper,
  Button, Modal, TextField,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import Header from '@components/Header';

const userId = '1'; // Hardcoded for testing and demo purposes

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 24,
  p: 4,
};

export default function WorkflowsList() {
  const router = useRouter();

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedStepsMap, setCompletedStepsMap] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const baseUrl = process.env.NEXT_PUBLIC_WORKFLOWS_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

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
            link: `/scoopdinator/workflows/${ws.workflowId}`,
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

    fetchData();
  }, [baseUrl]);

  const handleOpen = () => {
    setModalOpen(true);
    setCreateError(null);
  };

  const handleClose = () => {
    if (creating) return;
    setModalOpen(false);
    setName('');
    setDescription('');
    setTags('');
    setCreateError(null);
  };

  // New: create action and link it as rootActionId to the workflow after creation
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError('Workflow name is required');
      return;
    }
    setCreating(true);
    setCreateError(null);

    try {
      // Step 1: Create the workflow
      const workflowResponse = await fetch(`${baseUrl}/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: name.trim(),
          description: description.trim(),
          tags: tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean),
          // no rootActionId here, per your backend limitation
        }),
      });

      if (!workflowResponse.ok) {
        throw new Error('Failed to create workflow');
      }

      const workflow = await workflowResponse.json();

      // Step 2: Create the root action
      const actionResponse = await fetch(`${baseUrl}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: `${name.trim()} Root Action`, // or any name convention
          description: `Root action for workflow ${name.trim()}`,
          metadata: {},
        }),
      });

      if (!actionResponse.ok) {
        throw new Error('Failed to create root action');
      }

      const action = await actionResponse.json();

      // Step 3: Attach rootActionId to the workflow via PUT request
      const updateResponse = await fetch(`${baseUrl}/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootActionId: action.id,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update workflow with rootActionId');
      }

      // Step 4: Create workflow state for the user
      const stateResponse = await fetch(`${baseUrl}/states/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          workflowId: workflow.id,
          actionStates: [
            {
              actionId: action.id,
              stateType: 'not_started',
            },
          ],
        }),
      });
      
      if (!stateResponse.ok) {
        throw new Error('Failed to create workflow state');
      }

      // Close modal and refresh workflows list
      handleClose();
      // Refresh the workflows list after creation to reflect the new data
      setLoading(true);
      setError(null);
      setWorkflows([]);
      setCompletedStepsMap({});
      // Re-fetch workflows after creation
      const fetchDataAgain = async () => {
        try {
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
              link: `/scoopdinator/workflows/${ws.workflowId}`,
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

      fetchDataAgain();

    } catch (err) {
      setCreateError(err.message || 'Error creating workflow');
      setCreating(false);
    }
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading workflows...</Typography>;
  if (error) return <Typography sx={{ p: 4, color: 'red' }}>{error}</Typography>;

  return (
    <Box sx={{ fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif', color: '#212121' }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, maxWidth: '1280px' }}>
        <Typography variant="h1" sx={{ mb: 5 }}>
          Workflows Dashboard
        </Typography>

        <Button
          variant="contained"
          sx={{ backgroundColor: '#F76902', mb: 3 }}
          onClick={handleOpen}
        >
          + Add Workflow
        </Button>

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
                    onClick={() => router.push(`/scoopdinator/workflows/${workflow.id}`)}
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

      <Modal
        open={modalOpen}
        onClose={handleClose}
        aria-labelledby="create-workflow-modal"
        disableEscapeKeyDown={creating}
      >
        <Box sx={modalStyle} component="form" onSubmit={handleCreate}>
          <Typography id="create-workflow-modal" variant="h6" component="h2" mb={2}>
            Create New Workflow
          </Typography>

          <TextField
            label="Workflow Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            margin="normal"
            disabled={creating}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            margin="normal"
            disabled={creating}
          />

          <TextField
            label="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            fullWidth
            margin="normal"
            disabled={creating}
          />

          {createError && (
            <Typography color="error" mt={1}>
              {createError}
            </Typography>
          )}

          <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={handleClose} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Modal>

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
