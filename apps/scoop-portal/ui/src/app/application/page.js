"use client";
import React, { useState, useEffect } from "react";
import {
    TextField, FormControl, Select, Button, FormLabel,
    FormControlLabel, FormGroup, RadioGroup, Radio,
    Dialog, DialogTitle, DialogContent, DialogActions,
    MenuItem, Typography, Box, Paper, FormHelperText,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
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

function ApplicationPage() {
    const router = useRouter();
    const [formValues, setFormValues] = useState({});
    const [modalOpen, setModalOpen] = useState(MODAL_STATUS.CLOSED);
    const [errors, setErrors] = useState({});
    const [semesterData, setSemesterData] = useState([]);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup`)
            .then((res) => res.json())
            .then((data) => setSemesterData(data))
            .catch((err) => console.error("Failed to fetch semesters:", err));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === "file" && files?.[0]) {
            const file = files[0];

            if (file.size > 8 * 1024 * 1024) {
                setErrors((prev) => ({ ...prev, resumeFile: "File is too large. Maximum 8MB." }));
                e.target.value = "";
                return;
            }

            const allowedTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];
            if (!allowedTypes.includes(file.type)) {
                setErrors((prev) => ({ ...prev, resumeFile: "Invalid file type. Upload a PDF or Word document." }));
                e.target.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormValues((prev) => ({
                    ...prev,
                    resumeFile: reader.result,
                    resumeFileName: file.name,
                }));
                setErrors((prev) => ({ ...prev, resumeFile: undefined }));
            };
            reader.readAsDataURL(file);
            return;
        }

        const parsedValue = value === "true" ? true : value === "false" ? false : value;
        setFormValues((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : parsedValue,
        }));
    };

    const handleDropdownChange = (name, value) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (modalOpen) return;

        setErrors({});

        const validationErrors = {};
        if (!formValues.lastName?.trim()) validationErrors.lastName = "Last name is required.";
        if (!formValues.firstName?.trim()) validationErrors.firstName = "First name is required.";
        if (!formValues.ritEmail?.trim()) {
            validationErrors.ritEmail = "RIT email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.ritEmail.trim())) {
            validationErrors.ritEmail = "Please enter a valid email address.";
        }
        if (!formValues.userID?.trim()) validationErrors.userID = "UID is required.";
        if (!formValues.coopSearchStartDate?.trim()) validationErrors.coopSearchStartDate = "Co-op search start date is required.";
        if (!formValues.coopSearchPlatforms?.trim()) validationErrors.coopSearchPlatforms = "Co-op search platforms are required.";
        if (formValues.pendingOffers === "" || formValues.pendingOffers === undefined || formValues.pendingOffers === null) {
            validationErrors.pendingOffers = "Pending offers response is required.";
        }
        if (formValues.rejectionLetters === "" || formValues.rejectionLetters === undefined || formValues.rejectionLetters === null) {
            validationErrors.rejectionLetters = "Rejection letters response is required.";
        }
        // Fixed: coopsCompleted can be 0, so check explicitly
        if (formValues.coopsCompleted === undefined || formValues.coopsCompleted === null || formValues.coopsCompleted === "") {
            validationErrors.coopsCompleted = "Number of co-op blocks completed is required.";
        }
        if (!formValues.startSemester) validationErrors.startSemester = "Start semester is required.";
        if (!formValues.SEcoopReferral) validationErrors.SEcoopReferral = "How you heard about SCOOP is required.";
        if (formValues.jobSearchAcknowledgment !== true) {
            validationErrors.jobSearchAcknowledgment = "You must agree to continue your job search.";
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors({ ...validationErrors, _form: "Please fill out all required fields." });
            return;
        }

        const user_id = formValues.ritEmail.includes("@")
            ? formValues.ritEmail.split("@")[0]
            : formValues.firstName.toLowerCase() + formValues.lastName.toLowerCase();

        try {
            const userCheckResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/users/${user_id}`
            );
            if (userCheckResponse.status === 404) {
                setErrors({ _form: "You are not registered in our system. Please contact the SE Department." });
                return;
            }
            if (!userCheckResponse.ok) {
                setErrors({ _form: "Unable to verify your account. Please try again later." });
                return;
            }
            const userCheckData = await userCheckResponse.json();
            if (userCheckData?.type !== "prospect") {
                setErrors({ _form: "You are not eligible to submit an application. Please contact the SE Department." });
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/application`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formValues, applicant_id: user_id }),
            });

            const result = await response.json();

            if (response.ok) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "applicant" }),
                });

                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        date: new Date().toISOString(),
                        sender_id: user_id,
                        notes: `${formValues.firstName} ${formValues.lastName} submitted an application for SCOOP.`,
                        recipient_ids: [],
                        topic_id: user_id,
                        semester_GroupId: null,
                        previous_entryid: null,
                        entry_type: "AUTOMATED",
                        visibility_level: 1,
                        privacy_level: "PUBLIC",
                    }),
                });

                setModalOpen(MODAL_STATUS.SUCCESS);
            } else {
                setModalOpen(MODAL_STATUS.FAIL);
                if (result?.errors) {
                    const newErrors = {};
                    result.errors.forEach((err) => { newErrors[err.param] = err.msg; });
                    setErrors(newErrors);
                }
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
                            ? "Your application has been received."
                            : "We were unable to submit your application."}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeModal} autoFocus>Close</Button>
                </DialogActions>
            </Dialog>

            <Box sx={{ maxWidth: 600, mx: "auto", mt: 4, bgcolor: "background.default", borderRadius: 2, boxShadow: 3, overflow: "hidden" }}>
                <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", px: 3, py: 2, textAlign: "center" }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Application for Unpaid SE Co-op Alternative
                    </Typography>
                </Box>

                <Paper sx={{ p: 4, backgroundColor: "common.white", borderRadius: 0 }}>
                    <Typography variant="body1" gutterBottom>
                        This form is meant for use by invitation only and is for SE students who have been
                        in contact with the SE Department regarding potential delayed graduation due to
                        unfulfilled Co-op requirements. It is imperative that you keep looking for paid co-op employment.
                    </Typography>

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
                            <FormLabel required error={!!errors.coopSearchStartDate}>When did you start searching for co-ops?</FormLabel>
                            <TextField name="coopSearchStartDate" value={formValues.coopSearchStartDate || ""}
                                onChange={handleChange} error={!!errors.coopSearchStartDate}
                                helperText={errors.coopSearchStartDate} />
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <FormLabel required error={!!errors.coopSearchPlatforms}>
                                What methods/platforms have you used to find this co-op? Name as many as you can recall
                                that you could provide evidence for if needed (e.g. email/RIT Career Connect/Indeed etc.)
                            </FormLabel>
                            <TextField name="coopSearchPlatforms" value={formValues.coopSearchPlatforms || ""}
                                onChange={handleChange} error={!!errors.coopSearchPlatforms}
                                helperText={errors.coopSearchPlatforms} />
                        </FormControl>

                        <FormControl error={!!errors.pendingOffers}>
                            <FormLabel required error={!!errors.pendingOffers}>
                                Do you have any pending/open employer replies you are waiting to hear back from?
                            </FormLabel>
                            <RadioGroup name="pendingOffers" value={formValues.pendingOffers ?? ""} onChange={handleChange}>
                                <FormControlLabel value={true} control={<Radio />} label="Yes" />
                                <FormControlLabel value={false} control={<Radio />} label="No" />
                            </RadioGroup>
                            {errors.pendingOffers && <FormHelperText>{errors.pendingOffers}</FormHelperText>}
                            {formValues.pendingOffers === true && (
                                <TextField fullWidth multiline name="pendingOffersDetails"
                                    label="Name each employer, position, location, and last date of contact."
                                    value={formValues.pendingOffersDetails || ""} onChange={handleChange}
                                    error={!!errors.pendingOffersDetails} />
                            )}
                        </FormControl>

                        <FormControl error={!!errors.rejectionLetters}>
                            <FormLabel required error={!!errors.rejectionLetters}>
                                Have you received formal rejection letters/responses?
                            </FormLabel>
                            <RadioGroup name="rejectionLetters" value={formValues.rejectionLetters ?? ""} onChange={handleChange}>
                                <FormControlLabel value="true" control={<Radio />} label="Yes" />
                                <FormControlLabel value="false" control={<Radio />} label="No" />
                            </RadioGroup>
                            {errors.rejectionLetters && <FormHelperText>{errors.rejectionLetters}</FormHelperText>}
                            {formValues.rejectionLetters === true && (
                                <TextField fullWidth multiline name="rejectionLettersDetails"
                                    label="Approximately how many? Name companies and approximate dates."
                                    value={formValues.rejectionLettersDetails ?? ""} onChange={handleChange}
                                    error={!!errors.rejectionLettersDetails} />
                            )}
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <FormLabel required error={!!errors.coopsCompleted}>Number of Co-op blocks completed?</FormLabel>
                            <Select name="coopsCompleted" value={formValues.coopsCompleted ?? ""}
                                onChange={(e) => handleDropdownChange("coopsCompleted", e.target.value)}
                                error={!!errors.coopsCompleted}>
                                <MenuItem value={0}>None</MenuItem>
                                <MenuItem value={1}>1</MenuItem>
                                <MenuItem value={2}>2</MenuItem>
                                <MenuItem value={3}>3+</MenuItem>
                            </Select>
                            {errors.coopsCompleted && <FormHelperText error>{errors.coopsCompleted}</FormHelperText>}
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <FormLabel required error={!!errors.startSemester}>Which semester did you start at RIT?</FormLabel>
                            <Select name="startSemester" value={formValues.startSemester || ""}
                                onChange={(e) => handleDropdownChange("startSemester", e.target.value)}
                                error={!!errors.startSemester}>
                                {semesterData.map((s) => (
                                    <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                                ))}
                            </Select>
                            {errors.startSemester && <FormHelperText error>{errors.startSemester}</FormHelperText>}
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <FormLabel required error={!!errors.SEcoopReferral}>How did you hear about the SCOOP program?</FormLabel>
                            <Select name="SEcoopReferral" value={formValues.SEcoopReferral ?? ""}
                                onChange={(e) => handleDropdownChange("SEcoopReferral", e.target.value)}
                                error={!!errors.SEcoopReferral}>
                                <MenuItem value="Academic Advisor">Academic Advisor</MenuItem>
                                <MenuItem value="Faculty">Faculty</MenuItem>
                                <MenuItem value="Friend">Friend</MenuItem>
                                <MenuItem value="Co-op & Career Services">Co-op & Career Services</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                            </Select>
                            {errors.SEcoopReferral && <FormHelperText error>{errors.SEcoopReferral}</FormHelperText>}
                            {formValues.SEcoopReferral === "Other" && (
                                <TextField fullWidth margin="normal" label="Please specify:"
                                    name="SEcoopReferralDetails" value={formValues.SEcoopReferralDetails ?? ""}
                                    onChange={handleChange} error={!!errors.SEcoopReferralDetails} />
                            )}
                        </FormControl>

                        <FormControl error={!!errors.jobSearchAcknowledgment}>
                            <FormLabel required error={!!errors.jobSearchAcknowledgment}>
                                It is imperative that you continue your search between now and the beginning of your
                                SCOOP term. Students often find jobs at the very last minute. Please acknowledge this:
                            </FormLabel>
                            <RadioGroup name="jobSearchAcknowledgment" value={formValues.jobSearchAcknowledgment ?? ""}
                                onChange={handleChange}>
                                <FormControlLabel value={true} control={<Radio />}
                                    label="I agree that I will continue my job search until the beginning of my SCOOP term." />
                                <FormControlLabel value={false} control={<Radio />} label="Other" />
                            </RadioGroup>
                            {errors.jobSearchAcknowledgment && <FormHelperText>{errors.jobSearchAcknowledgment}</FormHelperText>}
                            {formValues.jobSearchAcknowledgment === false && (
                                <TextField fullWidth margin="normal" multiline label="Please specify:"
                                    name="jobSearchAcknowledgmentDetails"
                                    value={formValues.jobSearchAcknowledgmentDetails ?? ""}
                                    onChange={handleChange} error={!!errors.jobSearchAcknowledgmentDetails} />
                            )}
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <FormLabel>Is there anything else you'd like to share about your search or summer availability?</FormLabel>
                            <TextField fullWidth margin="normal" name="additionalComments" multiline rows={4}
                                value={formValues.additionalComments || ""} onChange={handleChange} />
                        </FormControl>

                        <Button component="label" variant="contained" tabIndex={-1} startIcon={<FileUploadOutlinedIcon />}>
                            Upload Resume
                            <VisuallyHiddenInput type="file" name="resumeURL" accept=".pdf,.doc,.docx" onChange={handleChange} />
                        </Button>
                        {errors.resumeFile && (
                            <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.resumeFile}</Typography>
                        )}

                        {errors._form && (
                            <Typography color="error" variant="body2" sx={{ mt: 2 }}>{errors._form}</Typography>
                        )}

                        <Box mt={2} textAlign="center">
                            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                                Submit Application
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </>
    );
}

export default ApplicationPage;