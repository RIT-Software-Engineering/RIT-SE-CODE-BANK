"use client";
import React, { useState, useEffect } from 'react';
import Header from '@components/Header';
import { Container, Typography, Paper, Table, TableHead, TableCell, TableRow, TableBody, Button } from '@mui/material';



export default function ViewScooployees() {
  const [employees, setEmployees] = useState([]);
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

  const filteredEmployees =
        filter === "all"
            ? employees
            : employees.filter((employee) => employee.status === filter);
  return (
    <>
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
                                                  onClick={() => handleOpen(app)}
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
    </>
  );
}
