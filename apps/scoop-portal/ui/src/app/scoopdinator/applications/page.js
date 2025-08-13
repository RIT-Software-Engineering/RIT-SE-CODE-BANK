"use client";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import Header from "@components/Header";

/**
 * The statuses to filter applications by.
 */
const STATUSES = ["all", "accepted", "rejected", "unprocessed"];

export default function SupervisorApplicationsPage() {
  /**
   * The list of applications to be displayed on the page.
   */
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/application`
        );
        const data = await res.json();
        const processed = data.map((app) => ({
          ...app,
          status:
            app.accepted === true
              ? STATUSES[1] // "accepted"
              : app.accepted === false
                ? STATUSES[2] // "rejected"
                : STATUSES[3], // "unprocessed"
        }));

        setApplications(processed);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      }
    };

    fetchApps();
  }, []);

  //For testing. Runs when setSelectApp and handleOpen are called
  useEffect(() => {
    if (selectedApp) {
      console.log("opening app:", selectedApp.firstName);
    }
  }, [selectedApp]);

  /**
   * Handles the logic for opening a selected application.
   *
   * This function sets the selectedApp constant to the application that was
   * passed in and changes its hasBeenRead status to true. Next, it refelcts
   * this change in the list of applications.
   *
   * @param {*} app - The application that's been selected to be opened.
   * @returns {void}
   */
  const handleOpen = (app) => {
    setSelectedApp({ ...app, hasBeenRead: true }); //this isnt working
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, hasBeenRead: true } : a))
    );
  };

  /**
   * Handles the logic for closing a selected application.
   *
   * This function simply sets the selectedApp constant to null.
   *
   * @returns {void}
   */
  const handleClose = () => setSelectedApp(null);

  /**
   * Updates the status of an application in the database.
   *
   * This function sends a PUT request to the API to update the status of
   * a specific application. It expects the application ID to be in
   * `selectedApp.id` and the new status to be passed as `newStatus`.
   *
   * @async
   * @param {*} newStatus - The new status to set for the application.
   * @throws {Error} If the update fails
   * @returns {Promise<void>}
   */
  async function putApplicationStatus(newStatus) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/application/${selectedApp.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accepted: newStatus === STATUSES[1], // "accepted"
        }),
      }
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to update");
  }

  /**
   * Handles the logic for updating the status of a selected application.
   *
   * @param {*} status - The new status to set the application to
   * @returns {void}
   */
  const handleStatusUpdate = (status) => {
    console.log("Updating status to:", status);
    console.log("Updating status to:", status);
    if (!selectedApp) return;

    try {
      //update in database
      putApplicationStatus(status);

      //update local state
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, status } : a))
      );

      //
      setSelectedApp((prev) =>
        prev ? { ...prev, accepted: status === "accepted", status } : prev
      );
      // console.log(selectedApp.firstName, "has been", status);
      setStatus(status);

      setNotification({
        open: true,
        message: `Application for ${selectedApp.firstName} has been ${status}.`,
        severity: status === STATUSES[1] ? "success" : "error",
      });
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to update status: ${err.message}`,
        severity: "error",
      });
    }
    // console.log("app status", selectedApp.status);
  };

  const handleNotificationClose = (event, reason) => {
    if (reason === "clickaway") return;
    setNotification({ ...notification, open: false });
  };

  /**
   *
   * @param {*} data
   * @returns {Response}
   */
  async function postNewUsers(data) {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/api/users",
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }
    );
    console.log("Submitting users with data:", data);

    return response;
  }

  /**
   * Temporary data for user creation
   */
  const tempData = {
    semester_group: "default",
    project: "default",
    active: "default",
    last_login: "default",
    prev_login: "default",
  };

  /**
   *
   *
   * @param {*} app - The application providing information on the new user to create.
   * @returns {User} The new user created from the application.
   */
  const createUserFromApp = (app) => {
    return {
      fname: app.firstName,
      lname: app.lastName,
      email: app.ritEmail,
      type: "student", //change to scooployee
      semester_group: tempData.semester_group,
      project: tempData.project,
      active: tempData.active,
      last_login: tempData.last_login,
      prev_login: tempData.prev_login,
    };
  };

  // TODO: More info for doc comment
  /**
   * Handles the logic to submit accepted applicants as new users into the database.
   *
   * For each application where accepted=true, format data into user and then do users post like how you would do application post.
   * @returns {void}
   */
  const handleSubmit = () => {
    //   let data ;
    //
    const acceptedApps = applications.filter((app) => app.accepted === true);
    // console.log(acceptedApps)
    for (let app of acceptedApps) {
      // console.log(app)
      let newUser = createUserFromApp(app);
      console.log("Submitting user:", newUser);
      postNewUsers(newUser);
    }
  };

  const filteredApps =
    filter === "all"
      ? applications
      : applications.filter((app) => app.status === filter);

  return (
    <Box
      sx={{
        fontFamily: `"Helvetica Neue", "Helvetica", "Roboto", "Arial", sans-serif"`,
        bgcolor: "#f5f5f5",
        minHeight: "100vh",
        p: 4,
      }}
    >
      <Header />
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Review Applications
      </Typography>

      <Box mb={3}>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{
            bgcolor: "#fff",
            borderRadius: 2,
            minWidth: 200,
            boxShadow: 1,
          }}
        >
          {STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </MenuItem>
          ))}
        </Select>

        <Button
          onClick={() => handleSubmit()}
          sx={{
            bgcolor: "#F76902",
            color: "white",
            "&:hover": {
              bgcolor: "#d95e00",
            },
            m: 1,
          }}
        >
          Submit Accepted
        </Button>
        <Paper elevation={1}>
          <Table>
            <TableHead sx={{ backgroundColor: "#F76902" }}>
              <TableRow>
                <TableCell sx={{ color: "#fff" }}>First Name</TableCell>
                <TableCell sx={{ color: "#fff" }}>Last Name</TableCell>
                <TableCell sx={{ color: "#fff" }}>Email</TableCell>
                <TableCell sx={{ color: "#fff" }}>Submitted</TableCell>
                <TableCell sx={{ color: "#fff" }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApps.map((app) => (
                <TableRow
                  key={app.id}
                  sx={{
                    opacity: app.hasBeenRead ? 0.6 : 1,
                    transition: "opacity 0.3s",
                    "&:hover": {
                      backgroundColor: "#fafafa",
                    },
                  }}
                >
                  <TableCell>{app.firstName}</TableCell>
                  <TableCell>{app.lastName}</TableCell>
                  <TableCell>{app.ritEmail}</TableCell>
                  <TableCell>
                    {new Date(app.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outline-orange"
                      onClick={() => handleOpen(app)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* Modal */}
        <Dialog
          open={!!selectedApp}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
        >
          {selectedApp && (
            <>
              <DialogTitle
                sx={{
                  bgcolor: "#F76902",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Application: {selectedApp.firstName} {selectedApp.lastName}
              </DialogTitle>
              <DialogContent dividers>
                <Typography variant="body2">
                  Submitted on:{" "}
                  {new Date(selectedApp.createdAt).toLocaleDateString()}
                </Typography>
                <Typography margin={2}>
                  <strong>Email:</strong> <br />
                  {selectedApp.ritEmail}
                </Typography>
                <Typography margin={2}>
                  <strong>Number of Co-op blocks completed?</strong>
                  <br />
                  {selectedApp.coopsCompleted}
                </Typography>
                <Typography margin={2}>
                  <strong>Which semester did you start at RIT?</strong> <br />
                  {selectedApp.startSemester}
                </Typography>
                <Typography margin={2}>
                  <strong>
                    Which courses have you already taken or are about to
                    complete this term?
                  </strong>{" "}
                  <br />
                  {selectedApp.coursesTaken}
                </Typography>
                <Typography margin={2}>
                  <strong>When did you start searching for this co-op?</strong>{" "}
                  <br />
                  {selectedApp.coopSearchStartDate}
                </Typography>
                {/* <Typography margin={2}>
                                    <strong>Semester Started:</strong>{" "}
                                    <br />
                                    {selectedApp.startSemester}
                                </Typography> */}
                <Typography margin={2}>
                  <strong>
                    What methods/platforms have you used in order to try and get
                    this co-op? Name as many as you can recall that you would be
                    able to provide evidence if needed (e.g. email/RIT Career
                    Connect/Indeed etc.)
                  </strong>{" "}
                  <br />
                  {selectedApp.coopSearchPlatforms}
                </Typography>
                <Typography margin={2}>
                  <strong>
                    Do you have any pending/open employer replies that you are
                    waiting to hear back from at this time?
                  </strong>{" "}
                  <br />
                  {String(selectedApp.pendingOffers)}
                </Typography>
                <Typography margin={2}>
                  <strong>
                    If Yes, and these as a result of an interview, name each
                    employer and your last date of contact for each. If possible
                    provide Company/position and location. (e.g. 1.-
                    Microsoft/Intern Seattle, WA April 2nd 2025, 2.- Paychex/SE
                    co-op Webster, NY)
                  </strong>{" "}
                  <br />
                  {selectedApp.pendingOffersDetails}
                </Typography>
                <Typography margin={2}>
                  <strong>
                    Have you received formal rejection letters/responses?
                  </strong>{" "}
                  <br />
                  {selectedApp.rejectionLetters}
                </Typography>
                <Typography margin={2}>
                  <strong>
                    If Yes, approximately how many? Name as many as you can
                    recall that you would be able to provide evidence if needed.
                    Companies/Employers and approximate date. (e.g. 1.- Google,
                    January 16th 2025, 2.- Meta, February 18th 2025)
                  </strong>{" "}
                  <br />
                  {selectedApp.rejectionLettersDetails}
                </Typography>
                <Typography margin={2}>
                  <strong>
                    SE does not currently have a co-op option for this summer.
                    However, IF an approved unpaid opportunity became available,
                    would you be interested in pursuing it?
                  </strong>{" "}
                  <br />
                  {String(selectedApp.SEcoopInterest)}
                </Typography>
                <Typography margin={2}>
                  <strong>
                    If an option were to become available, would you be able to
                    participate in-person at RIT or are your circumstances such
                    that you would be unable to for the duration of the co-op?
                  </strong>{" "}
                  <br />
                  {String(selectedApp.SEcoopAvailability)}
                </Typography>
                <Typography margin={2}>
                  <strong>
                    If Unable, please confirm that you can be remote by stating
                    your capabilities (e.g. laptop/desktop/webcam/mic
                    specifications and provider/connection type)
                  </strong>{" "}
                  <br />
                  {selectedApp.remoteAbility}
                </Typography>
                <Typography margin={2}>
                  <strong>
                    Is there anything else you'd like to share with us about
                    your search efforts or about your summer availability?
                  </strong>{" "}
                  <br />
                  {selectedApp.additionalComments}
                </Typography>
                <Typography margin={2}>
                  <strong>resumeFile:</strong> <br />
                  {selectedApp.resumeFile}
                </Typography>

                <Box mt={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Current Status: {String(selectedApp.status)}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#7D55C7",
                      fontWeight: 500,
                    }}
                  >
                    {/* {application} */}
                    {/* {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)} */}
                  </Typography>
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                  variant="contained"
                  onClick={
                    () => handleStatusUpdate(STATUSES[1]) // "accepted"
                  }
                  sx={{
                    bgcolor: "#84BD00",
                    color: "white",
                    "&:hover": { bgcolor: "#6da400" },
                  }}
                >
                  Accept
                </Button>
                <Button
                  variant="contained"
                  onClick={
                    () => handleStatusUpdate(STATUSES[2]) // "rejected"
                  }
                  sx={{
                    bgcolor: "#DA291C",
                    color: "white",
                    "&:hover": { bgcolor: "#b82018" },
                  }}
                >
                  Reject
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
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
