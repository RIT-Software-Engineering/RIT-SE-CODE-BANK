'use client';
import React, {useState, useEffect } from 'react';
import Header from '@components/Header';
import {
  Box, Typography, Container, Button, Grid, Paper, Chip, Modal,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';



export default function bubbled(){
  
  const [maybeWorkflows, setMaybe] = useState([]);
  const [open, setOpen] = useState(false);
  const [openWorkflow, setOpenWorkflow] = useState([]);

  useEffect(() => {
    async function getActions() {

      const res = await fetch(`http://localhost:5001/actions`);
      const data = await res.json();
      setMaybe(data);
    }
    getActions();
  },[]);

  const handleOpen = (workflow) => {
    setOpenWorkflow(workflow);
    setOpen(true);
  };

  const handleClose = () => {
    setOpenWorkflow([]);
    setOpen(false);
  };

  const bubbleColor = (actionState) => {
    if(actionState != null && actionState.length >= 1){
      const firstState = actionState[0];
      switch(firstState.stateType){
        case "completed":
          return { backgroundColor: '#4caf50', color: '#fff' };
        case "inProgress":
          return { backgroundColor: '#f7df1e', color: '#fff' };
        default:
          return { backgroundColor: '#9e9e9e', color: '#fff' };
      }
    }
    else{
      return { backgroundColor: '#9e9e9e', color: '#fff' };
    }
  };
  //displaying first 30 actions for now
  return (
    <>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4, maxWidth: "1280px" }}>
          <Grid container spacing={4}>
            {maybeWorkflows.slice(0, 30).map((maybeWorkflow) => (
              <Chip
                key={maybeWorkflow.id}
                label={maybeWorkflow.name}
                sx={bubbleColor(maybeWorkflow.actionStates)}
                onClick={() => handleOpen(maybeWorkflow)}
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
              <Typography variant="h6">{openWorkflow.description}</Typography>

            </Box>
          </Modal>
        </Container>
    </>);
}