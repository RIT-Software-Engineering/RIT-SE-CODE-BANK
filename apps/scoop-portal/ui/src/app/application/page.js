"use client";
import React, { useState, useEffect } from "react";
import {
  TextField,
  FormControl,
  Select,
  Button,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  CloudUploadIcon,
  VisuallyHiddenInput,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Typography,
  Box,
  Paper,
} from "@mui/material";

const MODAL_STATUS = { SUCCESS: "success", FAIL: "fail", CLOSED: false };
const APPLICATION_STATUSES = {
  SUBMITTED: "submitted",
  PENDING_REVIEW: "pending review",
  ACCEPTED: "accepted",
  DENIED: "denied",
};

function ApplicationPage() {
  // const history = useHistory();
  const [formData, setActualFormData] = useState({
    assignment_of_rights: "full_rights",
  });
  const [formFiles, setFormFiles] = useState(null);
  const [modalOpen, setModalOpen] = useState(MODAL_STATUS.CLOSED);
  const [errors, setErrors] = useState({});
  const [semesterData, setSemesterData] = useState([]);
  // const [semesterData, setSemesterData] = useState([]);

  useEffect(() => {
    // SecureFetch(config.url.API_GET_SEMESTERS)
    // .then((res) => res.json())
    // .then((data) => setSemesterData(data))
    // .catch((err) => console.error("Failed to fetch semesters:", err));

    // Temporary hardcoded dates:
    let data = [
      { semester_id: 1, name: "Fall 2025" },
      { semester_id: 2, name: "Spring 2026" },
      { semester_id: 3, name: "Summer 2026" },
      { semester_id: 3, name: "Fall 2027" },
    ];
    setSemesterData(data);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setFormFiles(files);
    } else {
      setActualFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleDropdownChange = (name, value) => {
    setActualFormData({
      ...formData,
      [name]: value,
    });
  };

  const submitApplication = async (e) => {
    e.preventDefault();

    if (modalOpen) return;

    const body = new FormData();
    Object.keys(formData).forEach((key) => body.append(key, formData[key]));
    if (formFiles) {
      for (let i = 0; i < formFiles.length; i++) {
        body.append("attachments", formFiles[i]);
      }
    }

    try {
      const response = await SecureFetch(
        config.url.API_POST_SUBMIT_APPLICATION,
        {
          method: "post",
          body,
        },
      );

      if (response.status === 200) {
        setModalOpen(MODAL_STATUS.SUCCESS);
      } else {
        setModalOpen(MODAL_STATUS.FAIL);
        const errorData = await response.json();
        if (errorData?.errors) {
          const newErrors = {};
          errorData.errors.forEach((err) => {
            newErrors[err.param] = err.msg;
          });
          setErrors(newErrors);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeModal = () => {
    if (modalOpen === MODAL_STATUS.SUCCESS) {
      setActualFormData({});
      setFormFiles(null);
      setErrors({});
    }
    setModalOpen(MODAL_STATUS.CLOSED);
  };

  return (
    <>
      <Dialog open={modalOpen !== MODAL_STATUS.CLOSED} onClose={closeModal}>
        <DialogTitle>
          {modalOpen === MODAL_STATUS.SUCCESS
            ? "Success"
            : "There was an issue"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {modalOpen === MODAL_STATUS.SUCCESS
              ? "Your application has been received."
              : "We were unable to submit your application."}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeModal} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ maxWidth: 600, mx: "auto", mt: 4, px: 5, py: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Submit An Application
        </Typography>
        <Box component="form" onSubmit={submitApplication} noValidate>
          <TextField
            required
            fullWidth
            margin="normal"
            label="Full Name"
            name="name"
            value={formData.title || ""}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
          />
          Is this your first coop?
          <FormControl>
            <FormLabel id="first coop">Is this your first coop?</FormLabel>
            <RadioGroup defaultValue="Yes" name="radio-buttons-group">
              <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="No" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
          <p>How many coop semesters have you completed?</p>
          <FormControl fullWidth>
            {/* <InputLabel id="coops-completed"></InputLabel> */}
            <Select
              required
              margin="normal"
              label="coops-completed"
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
            >
              <MenuItem value={0}>None</MenuItem>
              <MenuItem value={1}>One</MenuItem>
              <MenuItem value={2}>Two</MenuItem>
              <MenuItem value={3}>Three</MenuItem>
            </Select>
          </FormControl>
          <TextField
            select
            required
            fullWidth
            margin="normal"
            label="Semester"
            name="semester"
            value={formData.semester || ""}
            onChange={(e) => handleDropdownChange("semester", e.target.value)}
            error={!!errors.semester}
            helperText={errors.semester}
          >
            {semesterData.map((semester) => (
              <MenuItem key={semester.semester_id} value={semester.semester_id}>
                {semester.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            required
            fullWidth
            margin="normal"
            label="Status"
            name="status"
            value={formData.status || ""}
            onChange={(e) => handleDropdownChange("status", e.target.value)}
            error={!!errors.status}
            helperText={errors.status}
          ></TextField>
          Tell us about your skills and experience:
          <TextField
            required
            fullWidth
            margin="normal"
            label="skills"
            name="skills"
            value={formData.description || ""}
            multiline
            rows={4}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
          />
          Upload your resume:
          <Button
            component="label"
            variant="contained"
            tabIndex={-1}
            // startIcon={<CloudUploadIcon />}
          >
            

          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Submit App
          </Button>
        </Box>
      </Paper>
    </>
  );
}

export default ApplicationPage;
