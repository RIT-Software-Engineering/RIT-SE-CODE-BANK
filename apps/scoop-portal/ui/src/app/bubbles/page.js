'use client';
import React, {useState, useEffect } from 'react';
import Header from '@components/Header';
import {
  Box, Typography, Container, Button, Grid, Paper, Chip, Modal,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useUser } from "../utils/user-context/page";



export default function bubbled(){
  
  const [workflowStates, setWorkflowStates] = useState([]);
  const [actionStates, setActionStates] = useState([]);
  const [open, setOpen] = useState(false);
  const [openActionState, setOpenActionState] = useState([]);
  const [openAction, setOpenAction] = useState([]);
  const [refresh, forceRefresh] = useState(0);
  const {user} = useUser();

  useEffect(() => {
    async function getActions() {
      if(user == null || user.id == null){
        return;
      }
      const res = await fetch(`http://localhost:5001/states/workflow?userId=${user.id}`);
      const data = await res.json();
      setWorkflowStates(data);
      setActionStates(data.flatMap(workflowState => workflowState.actionStates));
      
    }
    getActions();
  },[refresh, user]);

  const handleOpen = (actionState) => {
    setOpenActionState(actionState);
    setOpenAction(actionState.action)
    setOpen(true);
  };

  const handleClose = () => {
    setOpenAction([]);
    setOpen(false);
  };


  const submitAction = async () => {
    try {
      const res = await fetch('http://localhost:5001/states/handleSubmit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionStateId: openActionState.id,
        }),
      });
      forceRefresh(previous => previous + 1);
    } catch (e) {console.error('Error handling submit:', e);}
    handleClose();

  };

  const bubbleColor = (actionState) => {
      switch(actionState.stateType){
        case "completed":
          return { backgroundColor: '#4caf50', color: '#fff' };
        case "inProgress":
          return { backgroundColor: '#f7df1e', color: '#fff' };
        default:
          return { backgroundColor: '#9e9e9e', color: '#fff' };
      }
  };
  return (
    <>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4, maxWidth: "1280px" }}>
          <Grid container spacing={4}>
            {actionStates.map((actionState) => (
              <Chip
                key={actionState.id}
                label={actionState.action.name}
                sx={bubbleColor(actionState)}
                onClick={() => handleOpen(actionState)}
                />
            ))}
          </Grid>
          <Modal open={open} onClose={handleClose}>
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
              <Typography variant="h6">{openAction.description}</Typography>
              <Button onClick={submitAction}>Submit</Button>

            </Box>
          </Modal>
        </Container>
    </>);
}