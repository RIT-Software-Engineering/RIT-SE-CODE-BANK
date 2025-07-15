"use client";
import React, { useState, useEffect } from 'react';
import Header from '@components/Header';
import { Container, Typography, Paper, Table, TableHead, 
    TableCell, TableRow, TableBody, Button, Dialog, DialogTitle, DialogContent, Box,
    DialogActions } from '@mui/material';



export default function ViewScooployees() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filter, setFilter] = useState("all"); 

  useEffect(() => {
          const fetchEmployees = async () => {
              try {
                  const res = await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL}/api/users/employees`
                  );
                  const data = await res.json();
                  setEmployees(data);
              } catch (err) {
                  console.error("Failed to fetch employees:", err);
              }
          };

        fetchEmployees();
    }, []);

    const handleOpen = (emp) => {
        setSelectedEmployee({ ...emp, hasBeenRead: true });
        setEmployees((prev) =>
            prev.map((e) => (e.id === emp.id ? { ...e, hasBeenRead: true } : e))
        );

        console.log("opening employee:", selectedEmployee.firstName); //needs useEffect outside of function
    };

    const handleClose = () => setSelectedEmployee(null);


  const filteredEmployees =
        filter === "all"
            ? employees
            : employees.filter((employee) => employee.status === filter);


            
  return (
    <>
    <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
                    View Scooployees
                </Typography>
      <Paper elevation={1}>
                          <Table>
                              <TableHead sx={{ backgroundColor: "#F76902" }}>
                                  <TableRow>
                                      <TableCell sx={{ color: "#fff" }}>
                                          First Name
                                      </TableCell>
                                      <TableCell sx={{ color: "#fff" }}>
                                          Last Name
                                      </TableCell>
                                      <TableCell sx={{ color: "#fff" }}>
                                          Email
                                      </TableCell>
                                    
                                      <TableCell sx={{ color: "#fff" }}>
                                          Project
                                      </TableCell>
                                      <TableCell sx={{ color: "#fff" }} align="right">
                                          Actions
                                      </TableCell>
                                  </TableRow>
                              </TableHead>
                              <TableBody>
                                  {filteredEmployees.map((employee) => (
                                      <TableRow
                                          key={employee.id}
                                          sx={{
                                              opacity: employee.hasBeenRead ? 0.6 : 1,
                                              transition: "opacity 0.3s",
                                              "&:hover": {
                                                  backgroundColor: "#fafafa",
                                              },
                                          }}
                                      >
                                          <TableCell>{employee.fname}</TableCell>
                                          <TableCell>{employee.lname}</TableCell>
                                          <TableCell>{employee.email}</TableCell>
                                          <TableCell>{employee.project}</TableCell>
                                          <TableCell align="right">
                                              <Button
                                                  variant="outlined"
                                                  onClick={() => handleOpen(employee)}
                                                  sx={{
                                                      borderColor: "#F76902",
                                                      color: "#F76902",
                                                      "&:hover": {
                                                          backgroundColor: "#F76902",
                                                          color: "#fff",
                                                      },
                                                  }}
                                              >
                                                  View
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </Paper>

                      <Dialog
                                          open={!!selectedEmployee}
                                          onClose={handleClose}
                                          maxWidth="sm"
                                          fullWidth
                                      >
                                          {selectedEmployee && (
                                              <>
                                                  <DialogTitle
                                                      sx={{
                                                          bgcolor: "#F76902",
                                                          color: "#fff",
                                                          fontWeight: 600,
                                                      }}
                                                  >
                                                      Employee:{" "}
                                                      {selectedEmployee.fname} {selectedEmployee.lname}
                                                  </DialogTitle>
                                                  <DialogContent dividers>
                                                      <Typography>
                                                          <strong>Email:</strong>{" "}
                                                          {selectedEmployee.email}
                                                      </Typography>
                                                      <Typography>
                                                          <strong>Semester Hired:</strong>{" "}
                                                          {selectedEmployee.semesterGroup}
                                                      </Typography>
                                                      <Typography mt={2} sx={{ fontStyle: "italic" }}>
                                                          {JSON.stringify(selectedEmployee)}
                                                      </Typography>
                      
                                                  </DialogContent>

                                                  <DialogActions sx={{ px: 3, py: 2 }}>
                                                      <Button
                                                          variant="contained"
                                                        //   onClick={() =>
                                                        //     //   message function
                                                        
                                                        //   }
                                                          sx={{
                                                              bgcolor: "#84BD00",
                                                              "&:hover": { bgcolor: "#6da400" },
                                                          }}
                                                      >
                                                          Message
                                                      </Button>
                                                      <Button
                                                          variant="contained"
                                                        //   onClick={() =>
                                                        //       //open journal function
                                                              
                                                        //   }
                                                          sx={{
                                                              bgcolor: "#84BD00",
                                                              "&:hover": { bgcolor: "#6da400" },
                                                          }}
                                                      >
                                                          Journal
                                                      </Button>
                                                      <Button
                                                          onClick={handleClose}
                                                          variant="outlined"
                                                          color="inherit"
                                                      >
                                                          Close
                                                      </Button>
                                                  </DialogActions>
                                              </>
                                          )}
                                      </Dialog>
    </>
  );
}
