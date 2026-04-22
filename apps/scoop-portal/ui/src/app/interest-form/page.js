"use client";
import React, { useState, useEffect } from "react";
import {
    TextField, FormControl, Select, Button, FormLabel,
    FormControlLabel, FormGroup, RadioGroup, Radio, Checkbox,
    Dialog, DialogTitle, DialogContent, DialogActions,
    MenuItem, Typography, Box, Paper, FormHelperText,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";

const MODAL_STATUS = { SUCCESS: "success", FAIL: "fail", CLOSED: false };

const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
});

function InterestFormPage() {
    const router = useRouter();
    const [formValues, setFormValues] = useState({});
    const [modalOpen, setModalOpen] = useState(MODAL_STATUS.CLOSED);
    const [errors, setErrors] = useState({});
    const [courseData, setCourseData] = useState([]);

    useEffect(() => {
        setCourseData([
            { course_id: 1, name: "SWEN-261 Intro to SE" },
            { course_id: 2, name: "SWEN-262 SW Subsystems" },
            { course_id: 3, name: "SWEN-256 Process & Prj Mgmt" },
            { course_id: 4, name: "SWEN-331 Secure SW" },
            { course_id: 5, name: "SWEN-344 Web Eng" },
            { course_id: 6, name: "SWEN-440 Architectures" },
            { course_id: 7, name: "SWEN-444 Human-Centered" },
        ]);
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormValues((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleDropdownChange = (name, value) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (modalOpen) return;

        setErrors({});

        const selectedCourses = courseData
            .filter((course) => formValues[course.name])
            .map((course) => course.name)
            .join(", ");

        const validationErrors = {};
        if (!formValues.lastName?.trim()) validationErrors.lastName = "Last name is required.";
        if (!formValues.firstName?.trim()) validationErrors.firstName = "First name is required.";
        if (!formValues.ritEmail?.trim()) {
            validationErrors.ritEmail = "RIT email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.ritEmail.trim())) {
            validationErrors.ritEmail = "Please enter a valid email address.";
        }
        if (!formValues.userID?.trim()) validationErrors.userID = "UID is required.";
        if (!formValues.academicAdvisor) validationErrors.academicAdvisor = "Academic advisor is required.";
        if (!formValues.creditsRemaining) validationErrors.creditsRemaining = "Credits remaining is required.";
        if (!formValues.cumulativeGPA?.trim()) validationErrors.cumulativeGPA = "Cumulative GPA is required.";
        if (!selectedCourses) validationErrors.courses = "Please select at least one course.";

        if (Object.keys(validationErrors).length > 0) {
            setErrors({ ...validationErrors, _form: "Please fill out all required fields." });
            return;
        }

        const user_id = formValues.ritEmail.includes("@")
            ? formValues.ritEmail.split("@")[0]
            : formValues.firstName.toLowerCase() + formValues.lastName.toLowerCase();

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interestform`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formValues,
                    coursesTaken: selectedCourses,
                    applicant_id: user_id,
                }),
            });

            if (response.ok) {
                setModalOpen(MODAL_STATUS.SUCCESS);
            } else {
                setModalOpen(MODAL_STATUS.FAIL);
            }
        } catch (err) {
            console.error(err);
            setModalOpen(MODAL_STATUS.FAIL);
        }
    };

    const closeModal = () => {
        if (modalOpen === MODAL_STATUS.SUCCESS) {
            setModalOpen(MODAL_STATUS.CLOSED);
            router.replace("/");
        } else {
            setModalOpen(MODAL_STATUS.CLOSED);
        }
    };

    return (
        <>
            <Dialog open={modalOpen !== MODAL_STATUS.CLOSED} onClose={closeModal}>
                <DialogTitle>{modalOpen === MODAL_STATUS.SUCCESS ? "Success" : "There was an issue"}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {modalOpen === MODAL_STATUS.SUCCESS
                            ? "Your interest form has been received."
                            : "We were unable to submit your form."}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeModal} autoFocus>Close</Button>
                </DialogActions>
            </Dialog>

            <Box sx={{ maxWidth: 600, mx: "auto", mt: 4, bgcolor: "background.default", borderRadius: 2, boxShadow: 3, overflow: "hidden" }}>
                <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", px: 3, py: 2, textAlign: "center" }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        SE Co-op Alternative Interest Form
                    </Typography>
                </Box>

                <Paper sx={{ p: 4, backgroundColor: "common.white", borderRadius: 0 }}>
                    <Box component="form" onSubmit={handleSubmit} noValidate>

                        <TextField required fullWidth margin="normal" label="Last Name" name="lastName"
                            value={formValues.lastName || ""} onChange={handleChange}
                            error={!!errors.lastName} helperText={errors.lastName} />

                        <TextField required fullWidth margin="normal" label="First Name" name="firstName"
                            value={formValues.firstName || ""} onChange={handleChange}
                            error={!!errors.firstName} helperText={errors.firstName} />

                        <TextField required fullWidth margin="normal" label="RIT Email" name="ritEmail"
                            value={formValues.ritEmail || ""} onChange={handleChange}
                            error={!!errors.ritEmail} helperText={errors.ritEmail} />

                        <TextField required fullWidth margin="normal" label="UID" name="userID"
                            value={formValues.userID || ""} onChange={handleChange}
                            error={!!errors.userID} helperText={errors.userID} />

                        <FormControl fullWidth margin="normal">
                            <FormLabel required error={!!errors.academicAdvisor}>Who is your Academic Advisor?</FormLabel>
                            <Select name="academicAdvisor" value={formValues.academicAdvisor ?? ""}
                                onChange={(e) => handleDropdownChange("academicAdvisor", e.target.value)}
                                error={!!errors.academicAdvisor}>
                                <MenuItem value="Carrie Koneski">Carrie Koneski</MenuItem>
                                <MenuItem value="Sarah Mittiga">Sarah Mittiga</MenuItem>
                                <MenuItem value="Joe Rozak">Joe Rozak</MenuItem>
                            </Select>
                            {errors.academicAdvisor && <FormHelperText error>{errors.academicAdvisor}</FormHelperText>}
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <FormLabel required error={!!errors.creditsRemaining}>How many credits are remaining in your degree?</FormLabel>
                            <FormHelperText>Can be seen in SIS → Academic requirements</FormHelperText>
                            <Select name="creditsRemaining" value={formValues.creditsRemaining ?? ""}
                                onChange={(e) => handleDropdownChange("creditsRemaining", e.target.value)}
                                error={!!errors.creditsRemaining}>
                                <MenuItem value="13-30 credits">13-30 credits</MenuItem>
                                <MenuItem value="31-40 credits">31-40 credits</MenuItem>
                                <MenuItem value="40+ credits">40+ credits</MenuItem>
                            </Select>
                            {errors.creditsRemaining && <FormHelperText error>{errors.creditsRemaining}</FormHelperText>}
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <FormLabel required error={!!errors.cumulativeGPA}>What is your cumulative GPA?</FormLabel>
                            <TextField name="cumulativeGPA" value={formValues.cumulativeGPA || ""}
                                onChange={handleChange} error={!!errors.cumulativeGPA} helperText={errors.cumulativeGPA} />
                        </FormControl>

                        <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
                            <FormLabel component="legend" error={!!errors.courses}>
                                Which courses have you already taken or are about to complete this term?
                            </FormLabel>
                            <FormGroup>
                                {courseData.map((course) => (
                                    <FormControlLabel
                                        key={course.course_id}
                                        control={
                                            <Checkbox name={course.name} onChange={handleChange}
                                                checked={formValues[course.name] || false} />
                                        }
                                        label={course.name}
                                    />
                                ))}
                            </FormGroup>
                            {errors.courses && <FormHelperText error>{errors.courses}</FormHelperText>}
                        </FormControl>

                        {errors._form && (
                            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                                {errors._form}
                            </Typography>
                        )}

                        <Box mt={2} textAlign="center">
                            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                                Submit Interest Form
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </>
    );
}

export default InterestFormPage;