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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import Header from '@components/Header';
import { useParams, useRouter } from 'next/navigation';

export default function WorkflowPage() {
  const { id: workflowId } = useParams(); 
  const router = useRouter();
  const userId = '1';

  const [workflowState, setWorkflowState] = useState(null);
  const [actionsMap, setActionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [actionStateIdsMap, setActionStateIdsMap] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [newActionDescription, setNewActionDescription] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActionId, setEditingActionId] = useState(null);
  const [editingActionName, setEditingActionName] = useState('');
  const [editingActionDescription, setEditingActionDescription] = useState('');

  //this is so i can edit and the users I assign to my workflow
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState([]);
  
  //this is for the selected workflow data
  const [workflowData, setWorkflowData] = useState(null);

  const baseUrl = process.env.NEXT_PUBLIC_WORKFLOWS_API_URL;
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;

// fetching all users
  useEffect(()=>{
    const fetchUsers = async() => {
        try{
            const res = await fetch(`${publicApiUrl}/api/users`);
            const data = await res.json();
            setAllUsers(data);
        }catch(e){
            console.log("faield to fetch users in scoopdinator/workflow/[id]/page.js");
        }
    };
    fetchUsers();
  }, [])

  // fetching all workflow states for this workflow so we know who its asssigned to
  useEffect(() => {
    if(!workflowId){
        return;
    }
    const fetchAssigned = async() =>{
        try{
            const res = await fetch(`${baseUrl}/states/workflow?workflowId=${workflowId}`);
            const data = await res.json();
            //each state has a user id, we gotta catch'em all!
            setAssignedUsers(Array.isArray(data) ? data.map(e => e.userId):[]);
        }catch(e){
            console.log("faield to fetch workflow states in scoopdinator/workflow/[id]/page.js");
        }
    };
    fetchAssigned();
  },[workflowId, baseUrl]);


  const fetchWorkflowAndActions = async () => {
    try {
      setLoading(true);
      setError(null);

      const workflowUrl = new URL(`${baseUrl}/states/workflow`);
      workflowUrl.searchParams.append('userId', userId);
      workflowUrl.searchParams.append('workflowId', workflowId);

      const workflowResponse = await fetch(workflowUrl.toString());
      if (!workflowResponse.ok) throw new Error('Failed to fetch workflow state');
      const states = await workflowResponse.json();
      
      if (!states.length) throw new Error('No workflow state found for user');

      const state = states[0];
      setWorkflowState(state);
      const workflowRes = await fetch(`${baseUrl}/workflows/${workflowId}`);
      if(workflowRes.ok){
        const workflow_data = await workflowRes.json();
        setWorkflowData(workflow_data);
      }

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

  useEffect(() => {
    if (workflowId) fetchWorkflowAndActions();
  }, [userId, workflowId]);

  const toggleComplete = async (actionId) => {
    const actionStateId = actionStateIdsMap[actionId];
    if (!actionStateId) {
      alert('No actionState ID found for this action. Cannot update.');
      return;
    }

    const currentlyCompleted = completedSteps.has(actionId);
    const newCompleted = !currentlyCompleted;

    try {
      let response;
      if (newCompleted) {
        response = await fetch(`${baseUrl}/states/handleSubmit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionStateId,
            userId,
            workflowStateId: workflowState?.id,
          }),
        });
      } else {
        response = await fetch(`${baseUrl}/states/action/${actionStateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stateType: 'notStarted' }),
        });
      }

      const resBody = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(resBody?.message || 'Failed to update action state');
      }

      setCompletedSteps((prev) => {
        const rootActionId = workflowData?.rootActionId;
        const newSet = new Set(prev);
        if (newCompleted) newSet.add(actionId);
        else newSet.delete(actionId);

        if(rootActionId){
            const nonRootSteps = workflowState.actionStates.filter(s => s.actionId !== rootActionId);
            const completed = nonRootSteps.every(s => newSet.has(s.actionId));
            if(completed && nonRootSteps.length > 0){
                newSet.add(rootActionId);
                const rootStateActionId = actionStateIdsMap[rootActionId];
                if(rootStateActionId){
                    fetch(`${baseUrl}/states/handleSubmit`, {
                        method: "POST",
                        headers: {"Content-Type":"application/json"},
                        body:JSON.stringify({
                            actionStateId: rootStateActionId, userId,
                            workflowStateId: workflowState?.id
                        })
                    }).catch(console.error);
                }
            }else{
                newSet.delete(rootActionId);
            }
        }
        return newSet;
      });
    } catch (error) {
      alert(`Error updating step: ${error.message}`);
    }
  };

  // This will handle the adding of multiple users
  const handleAddAssignee = async (user) =>{
    try{
        const rootActionId = workflowState.actionStates[0].actionId;
        const res = await fetch(`${baseUrl}/states/workflow`, {
            method:"POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: user.id,
                workflowId,
                actionStates: workflowState.actionStates.map(a => ({
                    actionId: a.actionId,
                    stateType: "not_started"
                })) 
            }),
        });
        if(!res.ok){
            throw new Error("Failed to assign user in scoopdinator/workflow/[id]/page.js");
        }
        setAssignedUsers(prev => [...prev, user.id]);
    }catch(e){
        alert(e.message);
    }
  };

//This will handle the removing of multiple users
const handleRemoveAssignee = async (userId) => {
    try{
        //find the workflow state for this user and delete it
        const res = await fetch(`${baseUrl}/states/workflow?userId=${userId}&workflowId=${workflowId}`);
        const data = await res.json();
        const stateToDelete = data[0];
        if(!stateToDelete){
            throw new Error("No workflow state found for user");
        }

        const deleteRes = await fetch(`${baseUrl}/states/workflow/${stateToDelete.id}`, {method: "DELETE"});
        if(!deleteRes){
            throw new Error("Failed to remove user in scoopdinator/workflow/[id]/pages, in handleRemoveAssignee");
        }
        setAssignedUsers(prev => prev.filter(id => id !== userId));
    }catch(e){
        alert(e.message);
    }
}

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewActionName('');
    setNewActionDescription('');
  };

  const handleOpenEditModal = (action) => {
    setEditingActionId(action.id);
    setEditingActionName(action.name || '');
    setEditingActionDescription(action.description || '');
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingActionId(null);
    setEditingActionName('');
    setEditingActionDescription('');
  };
  
  //This function used actionMaps which fetches asyncronasly, but now instead we will fetch directly from the db, so the 
  //newly added data is can't be linked and finding the tail of the list is difficult, but now we start from the head and build
  //the list from there so each and every tail is correctly set, and so no linking is messed up.
  const handleCreateAction = async () => {
    if (!newActionName.trim()) return;
    if (!workflowState?.id) return alert('No workflow state loaded');

    try {
        const rootActionId = workflowData?.rootActionId;
        const baseActionId = workflowData?.baseActionId;

        //Fetches actions from the server doesn't rely on actionMaps anymore.
        const nonRootStates = workflowState.actionStates.filter(
            s => s.actionId !== rootActionId && s.actionId !== baseActionId
        );
        const actionIds = nonRootStates.map(s => s.actionId);

        let freshActionsMap = {};
        if(actionIds.length > 0){
            const actionsUrl = new URL(`${baseUrl}/actions`);
            actionsUrl.searchParams.append('ids', actionIds.join(','));
            const res = await fetch(actionsUrl.toString());
            const freshActions = await res.json();
            freshActions.forEach(a => {freshActionsMap[a.id] = a;});
        }

        //Walks through the linked list from root to find the tailm instead of relying on state to hold previous tail.
        let tailActionId = rootActionId;
        const rootAction = await fetch(`${baseUrl}/actions/${rootActionId}`).then(r => r.json());
        let currentId = rootAction?.nextActionId;

        while(currentId && freshActionsMap[currentId]){
            tailActionId = currentId;
            currentId = freshActionsMap[currentId]?.nextActionId ?? null;
        }

        //Creates the new action
        const response = await fetch(`${baseUrl}/actions`,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workflowId,
                name: newActionName.trim(),
                description: newActionDescription.trim(),
                userId,
                metadata: {title: newActionName.trim()}
            })
        });
        if (!response.ok) throw new Error('Failed to create action');
        const newAction = await response.json();

        //(Link tail) goes to (new action) which goes to (nothing yet)
        await fetch(`${baseUrl}/actions/${tailActionId}`,{
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({nextActionId: newAction.id})
        });
        await fetch(`${baseUrl}/actions/${newAction.id}`,{
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({parentActionId: tailActionId})
        });

        //Attaches to the workflow state and refreshs, so the data updates
        // After attaching to workflow state and before fetchWorkflowAndActions()
        const attachRes = await fetch(`${baseUrl}/states/workflow/${workflowState.id}`,{
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
        });
        if (!attachRes.ok) throw new Error('Failed to attach action to workflow state');

        //syncing new action to ALL assigned users workflow states
        const allStatesRes = await fetch(`${baseUrl}/states/workflow?workflowId=${workflowId}`);
        if (allStatesRes.ok) {
            const allStates = await allStatesRes.json();
            await Promise.all(
                allStates
                    .filter(s => s.id !== workflowState.id) //skipping current user
                    .map(s => fetch(`${baseUrl}/states/workflow/${s.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            newActionState: {
                                actionId: newAction.id,
                                stateType: 'notStarted'
                            }
                        })
                    }))
            );
        }

        await fetchWorkflowAndActions();
        handleCloseModal();
    }catch (error){
        console.error('Error creating action:', error);
        alert(error.message);
    }
  };

  const handleUpdateAction = async () => {
    if (!editingActionId || !editingActionName.trim()) return;

    try {
      const response = await fetch(`${baseUrl}/actions/${editingActionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingActionName.trim(),
          description: editingActionDescription.trim(),
          metadata: { title: editingActionName.trim() }
        }),
      });

      if (!response.ok) throw new Error('Failed to update action');

      await fetchWorkflowAndActions();
      handleCloseEditModal();
    } catch (error) {
      alert(`Error updating action: ${error.message}`);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!id) return alert('No workflow ID found');
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const res = await fetch(`${baseUrl}/workflows/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete workflow');
      alert('Workflow deleted');
      router.push('/scoopdinator/workflows');
    } catch (err) {
      alert(err.message);
    }
  };

  const stepIndexToUrl = {
    0: '/scoopdinator/applications',
    1: '/scoopdinator/scooployees',
    2: '/scoopdinator/teams',
    3: '/projects/assign',
    4: 'https://example.com/placeholder',
  };

  if (!workflowId) return <Typography sx={{ p: 4 }}>No workflow ID provided.</Typography>;
  if (loading) return <Typography sx={{ p: 4 }}>Loading workflows...</Typography>;
  if (error) return <Typography sx={{ p: 4, color: 'red' }}>{error}</Typography>;
  if (!workflowState) return <Typography sx={{ p: 4 }}>No workflow state available</Typography>;

  const rootActionId = workflowData?.rootActionId;
  const baseActionId = workflowData?.baseActionId;
  const userSteps = workflowState.actionStates.filter(
    s => s.actionId !== rootActionId && s.actionId !== baseActionId
  );
  const sortedSteps = [];
  if (userSteps.length > 0) {
    const stepsByActionId = {};
    userSteps.forEach(s => { stepsByActionId[s.actionId] = s; });
    const rootAction = actionsMap[rootActionId];
    let currentActionId = rootAction?.nextActionId;
    while (currentActionId && stepsByActionId[currentActionId]) {
        sortedSteps.push(stepsByActionId[currentActionId]);
        currentActionId = actionsMap[currentActionId]?.nextActionId ?? null;
    }
    userSteps.forEach(s => {
        if (!sortedSteps.find(ss => ss.id === s.id)) sortedSteps.push(s);
    });
   }
   const steps = sortedSteps;
   
//    console.log('userSteps count:', userSteps.length);
// console.log('sortedSteps count:', sortedSteps.length);

  return (
    <Box
      sx={{
        fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
        color: (theme) => theme.palette.text.primary,
        backgroundColor: (theme) => theme.palette.grey[100],
        minHeight: '100vh',
      }}
    >
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, maxWidth: '1280px' }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, mb: 5, color: 'text.primary' }}>
          Workflow Dashboard
        </Typography>

        <Grid container spacing={4} direction="column">
          <Grid item xs={12}>
            <Paper
              elevation={1}
              sx={{
                p: 3,
                backgroundColor: (theme) => theme.palette.background.paper,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
              >
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
                {workflowData?.baseAction?.name ?? 'Untitled Workflow'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ textTransform: 'none', borderColor: '#F76902', color: '#F76902' }}
                  onClick={handleOpenModal}
                >
                  Add Action
                </Button>

                {/** This is the button that will add users to workflows */}
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ textTransform: 'none' }}
                  onClick={() => setAssignModalOpen(true)}
                >
                  Manage Users
                </Button>
              </Box>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  sx={{ textTransform: 'none' }}
                  onClick={() => handleDeleteWorkflow(workflowId)}
                >
                  Delete
                </Button>

              {/* Steps rendering */}
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
                          if (url?.startsWith('http')) window.open(url, '_blank');
                          else router.push(url);
                        }}
                      >
                        Open
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ textTransform: 'none', ml: 1 }}
                        onClick={() => handleOpenEditModal(action)}
                      >
                        Edit
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Add Action Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle>Add Action</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Action Name"
            fullWidth
            value={newActionName}
            onChange={(e) => setNewActionName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newActionDescription}
            onChange={(e) => setNewActionDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleCreateAction} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Action Modal */}
      <Dialog open={isEditModalOpen} onClose={handleCloseEditModal}>
        <DialogTitle>Edit Action</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Action Name"
            fullWidth
            value={editingActionName}
            onChange={(e) => setEditingActionName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editingActionDescription}
            onChange={(e) => setEditingActionDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Cancel</Button>
          <Button onClick={handleUpdateAction} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignModalOpen} onClose={() => setAssignModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Users</DialogTitle>
        <DialogContent>
            {/** This includes current assignes with remove button next to them */}
            <Typography variant='subtitle2' sx={{mb:1, fontWeight: 600}}>Currently Assigned</Typography>
            {assignedUsers.length === 0 && (
                <Typography variant='body2' color="secondary" sx={{mb:2}}>No one is assigned yet</Typography>
            )}
            {assignedUsers.map(uid => {
                const user = allUsers.find(u => u.id === uid);
                if(!user){
                    return null;
                }
                return(
                    <Box key={uid} sx={{display:"flex", justifyContent:"space-between", alignItems: "center", mb: 1}}>
                        <Typography>{user.fname} {user.lname}</Typography>
                        <Button size="small" color='error' variant='contained' onClick={()=>handleRemoveAssignee(uid)}>
                            Remove
                        </Button>
                    </Box>
                );
            })}

            {/** drop down of all users, to add new users */}
            <Typography variant='subtitle2' sx={{mt:2, mb:1, fontWeight:600}}>Add Users</Typography>
            <Autocomplete
                options={allUsers.filter(u => !assignedUsers.includes(u.id))}
                getOptionLabel={(u) => `${u.fname} ${u.lname}`}
                onChange={(e, selected) => {if(selected){
                    handleAddAssignee(selected);
                }}}
                componentsProps={{
                    popper: {
                    placement: 'bottom-start',
                    modifiers: [{ name: 'flip', enabled: false }],
                    }
                }}
                renderInput={(params) => <TextField {...params} label="Select a SCOOPloyee" size='small'/>}
            />
            
        </DialogContent>
        <Button onClick={() => {setAssignModalOpen(false); setUserSearch('');}}>Close</Button>
      </Dialog>
    </Box>
  );
}
