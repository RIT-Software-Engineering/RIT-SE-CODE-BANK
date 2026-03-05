"use client";
import React, { useState, useEffect } from "react";
import {
    TextField,
    FormControl,
    Select,
    Button,
    FormLabel,
    InputLabel,
    FormControlLabel,
    FormGroup,
    helperText,
    RadioGroup,
    Radio,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Typography,
    Box,
    Paper,
    Grid,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { redirect, RedirectType, useRouter } from 'next/navigation';



const MODAL_STATUS = { SUCCESS: "success", FAIL: "fail", CLOSED: false };
const APPLICATION_STATUSES = {
    SUBMITTED: "submitted",
    PENDING_REVIEW: "pending review",
    ACCEPTED: "accepted",
    DENIED: "denied",
};

function ApplicationPage() {
    const router = useRouter();
    // const history = useHistory();
    const [formValues, setActualformValues] = useState({
        assignment_of_rights: "full_rights",
    });
    // const [completeFormData, setCompleteFormData] = useState({});
    const [formFiles, setFormFiles] = useState(null);
    const [modalOpen, setModalOpen] = useState(MODAL_STATUS.CLOSED);
    const [errors, setErrors] = useState({});
    const [semesterData, setSemesterData] = useState([]);
    const [courseData, setCourseData] = useState([]);

    useEffect(() => {
        fetch(process.env.NEXT_PUBLIC_API_URL + "/api/semestergroup")
            .then((res) => res.json())
            .then((data) => setSemesterData(data))
            .catch((err) => console.error("Failed to fetch semesters:", err));
    }, []);

    useEffect(() => {
        // Temporary hardcoded courses:
        let data = [
            { course_id: 1, name: "SWEN-261 Intro to SE" },
            { course_id: 2, name: "SWEN-262 SW Subsystems" },
            { course_id: 3, name: "SWEN-256 Process & Prj Mgmt" },
            { course_id: 4, name: "SWEN-331 Secure SW" },
            { course_id: 5, name: "SWEN-344 Web Eng" },
            { course_id: 6, name: "SWEN-440 Architectures" },
            { course_id: 7, name: "SWEN-444 Human-Centered" },
        ];
        setCourseData(data);
    }, []);

    const handleChange = async (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === "file" && files?.[0]) {
            const file = files[0];
            
            // Validate file size (8MB limit)
            if (file.size > 8 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    resumeFile: "File is too large. Please upload a file smaller than 8MB."
                }));
                e.target.value = ''; // Clear the file input
                return;
            }
            
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    resumeFile: "Invalid file type. Please upload a PDF or Word document."
                }));
                e.target.value = ''; // Clear the file input
                return;
            }
            
            const reader = new FileReader();
            
            reader.onloadend = () => {
                setActualformValues(prev => ({
                    ...prev,
                    resumeFile: reader.result,
                    resumeFileName: file.name
                }));
                // Clear any previous errors
                setErrors(prev => ({
                    ...prev,
                    resumeFile: undefined
                }));
            };
            
            reader.readAsDataURL(file);
        } else {
            //handle boolean if any 
            let parsedValue =
                value === "true" ? true : value === "false" ? false : value;

            setActualformValues({
                ...formValues,
                [name]: type === "checkbox" ? checked : parsedValue,
            });
        }
    };

    const handleDropdownChange = (name, value) => {
        setActualformValues({
            ...formValues,
            [name]: value,
        });
    };

    async function postFormData(data) {
        const response = await fetch(
            process.env.NEXT_PUBLIC_API_URL + "/api/application",
            {
                method: "POST",
                body: JSON.stringify({
                    ...data,
                    resumeFile: formValues.resumeFile
                }),
                headers: { "Content-Type": "application/json" },
            }
        );
        console.log("Submitting application with data:", data);

        return response;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (modalOpen) return;

        const selectedCourses = courseData
            .filter((course) => formValues[course.name])
            .map((course) => course.name)
            .join(", ");

        let user_id = ""
        if (!formValues.ritEmail.includes('@')) {
            user_id = formValues.firstName.toLowerCase() + formValues.lastName.toLowerCase()
        }
        else{
            user_id = formValues.ritEmail.split('@')[0];
        }

        const completeFormData = {
            ...formValues,
            coursesTaken: selectedCourses,
            applicant_id: user_id,
        };

        try {
            //check that user exists in DB and has role 'prospect' before submitting
            const userCheckResponse = await fetch(
                process.env.NEXT_PUBLIC_API_URL + `/api/users/${user_id}`,
                { method: "GET" }
            );
            if (userCheckResponse.status === 404) {
                setErrors({ _form: "You are not registered in our system. Please contact the SE Department to be added before applying." });
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

            const response = await postFormData(completeFormData);
            const result = await response.json();
            console.log("Response from server:", result);
            console.log("Response status:", response.status);

            if (response.status === 200) {
                try{
                    //see if the user exists
                    const userResponse = await fetch(
                        process.env.NEXT_PUBLIC_API_URL + `/api/users/${user_id}`,
                        { method: "GET" }
                    );
                    if (userResponse.status === 404){ 
                        const createUserRes = await fetch(
                            process.env.NEXT_PUBLIC_API_URL + "/api/users",
                            {
                                method: "POST",
                                body: JSON.stringify({
                                    id: user_id,
                                    fname: formValues.firstName,
                                    lname: formValues.lastName,
                                    email: formValues.ritEmail,
                                    type: "applicant",
                                    createdAt: new Date().toISOString(),
                                    semester_group: "null",
                                    project: "null",
                                    active: "",
                                    last_login: "null",
                                    prev_login: "null",
                                }),
                                headers: { "Content-Type": "application/json" },
                            }
                        );   
                    }

                    try{
                        const entry = {
                            date: new Date().toISOString(), 
                            sender_id: user_id,
                            notes: formValues.firstName + " " + formValues.lastName + " submitted an application for SCOOP.",
                            recipient_ids: [],
                            topic_id: user_id,
                            semester_GroupId: null,
                            previous_entryid: null,
                            entry_type: "AUTOMATED",
                            visibility_level: 1,
                            privacy_level: "PUBLIC",
                        };
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(entry),
                        });
                    }catch(err){
                        console.error("Error creating journal entry:", err);
                    }
                }catch(err){
                    console.error("Error creating user:", err);
                }
                setModalOpen(MODAL_STATUS.SUCCESS);
                redirect("/", RedirectType.replace);


            } else {
                setModalOpen(MODAL_STATUS.FAIL);
                const errorData = result;
                if (errorData?.errors) {
                    const newErrors = {};
                    errorData.errors.forEach((err) => {
                        newErrors[err.param] = err.msg;
                    });
                    setErrors(newErrors);
                }
                router.refresh();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const closeModal = () => {
        if (modalOpen === MODAL_STATUS.SUCCESS) {
            setActualformValues({});
            setFormFiles(null);
            setErrors({});
            redirect("/", RedirectType.replace);
    
            setModalOpen(MODAL_STATUS.CLOSED);
        } else if (modalOpen === MODAL_STATUS.FAIL) {             
             setModalOpen(MODAL_STATUS.CLOSED);       
        }
        
    };

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

    return (
        <>
            <Dialog
                open={modalOpen !== MODAL_STATUS.CLOSED}
                onClose={closeModal}
            >
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

            <Paper
                component={Grid}
                sx={{ maxWidth: 600, mx: "auto", mt: 4, px: 5, py: 3 }}
            >
                <Typography variant="h4" gutterBottom align="center">
                    Application for Unpaid SE Co-op Alternative
                </Typography>
                <Typography variant="body2" gutterBottom>
                    This form is meant for use by invitation only and is for SE
                    students who have been in contact with the SE Department
                    regarding potential delayed graduation due to unfulfilled
                    Co-op requirements. We want to learn more about you and your
                    specific situation to see if we can help. That said, it is
                    imperative that you keep looking for paid co-op employment.
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        required
                        fullWidth
                        margin="normal"
                        label="Last Name"
                        name="lastName"
                        value={formValues.lastName || ""}
                        onChange={handleChange}
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                    />
                    <TextField
                        required
                        fullWidth
                        margin="normal"
                        label="First Name"
                        name="firstName"
                        value={formValues.firstName || ""}
                        onChange={handleChange}
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                    />

                    <TextField
                        required
                        fullWidth
                        margin="normal"
                        label="RIT Email"
                        name="ritEmail"
                        value={formValues.ritEmail || ""}
                        onChange={handleChange}
                        error={!!errors.ritEmail}
                    />
                    <FormControl fullWidth margin="normal">
                        <FormLabel required >Number of Co-op blocks completed?</FormLabel>
                        <Select
                            required
                            // margin="normal"
                            label="coopsCompleted"
                            name="coopsCompleted"
                            value={formValues["coopsCompleted"] || ""}
                            onChange={(e) =>
                                handleDropdownChange(
                                    "coopsCompleted",
                                    e.target.value
                                )
                            }
                            error={!!errors.description}
                            // helperText={errors.description}
                        >
                            <MenuItem value={0}>None</MenuItem>
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={2}>2</MenuItem>
                            <MenuItem value={3}>3</MenuItem>
                            <MenuItem value={4}>4</MenuItem>
                            <MenuItem value={5}>5</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                        <FormLabel required id="semester-label">
                            Which semester did you start at RIT?
                        </FormLabel>
                        <Select
                            required
                            label="startSemester"
                            name="startSemester"
                            value={formValues.startSemester || ""}
                            onChange={(e) =>
                                handleDropdownChange(
                                    "startSemester",
                                    e.target.value
                                )
                            }
                            error={!!errors.startSemester}
                            // helperText={errors.semester}
                        >
                            {semesterData.map((startSemester) => (
                                <MenuItem
                                    key={startSemester.id}
                                    value={startSemester.name}
                                >
                                    {startSemester.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl
                        sx={{ m: 3 }}
                        component="fieldset"
                        variant="standard"
                    >
                        <FormLabel component="legend">
                            Which courses have you already taken or are about to
                            complete this term?
                        </FormLabel>

                        <FormGroup value={formValues.coursesTaken || ""}>
                            {courseData.map((course) => (
                                <FormControlLabel
                                    key={course.course_id}
                                    control={
                                        <Checkbox
                                            name={course.name}
                                            onChange={handleChange}
                                            checked={
                                                formValues[course.name] || false
                                            }
                                        />
                                    }
                                    label={course.name}
                                />
                            ))}
                        </FormGroup>
                    </FormControl>

                    <TextField
                        required
                        fullWidth
                        margin="normal"
                        label="When did you start searching for this co-op?"
                        name="coopSearchStartDate"
                        value={formValues.coopSearchStartDate || ""}
                        onChange={handleChange}
                        error={!!errors.coopSearchStartDate}
                    />

                    <FormControl fullWidth margin="normal">
                        <FormLabel required id="coopSearchPlatforms-label">
                            {" "}
                            What methods/platforms have you used in order to try
                            and get this co-op? Name as many as you can recall
                            that you would be able to provide evidence if needed
                            (e.g. email/RIT Career Connect/Indeed etc.){" "}
                        </FormLabel>
                        <TextField
                            fullWidth
                            label=""
                            name="coopSearchPlatforms"
                            value={formValues.coopSearchPlatforms || ""}
                            onChange={handleChange}
                            error={!!errors.coopSearchPlatforms}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel required id="pending-offers-label">
                            Do you have any pending/open employer replies that
                            you are waiting to hear back from at this time?
                        </FormLabel>
                        <RadioGroup
                            aria-labelledby="pending-offers-buttons-group-label"
                            name="pendingOffers"
                            onChange={handleChange}
                        >
                            <FormControlLabel
                                value={true}
                                control={<Radio />}
                                label="Yes"
                            />
                            <FormControlLabel
                                value={false}
                                control={<Radio />}
                                label="No"
                            />
                        </RadioGroup>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                        <FormLabel required id="pending-offers-list-label">
                            {" "}
                            If Yes, and these as a result of an interview, name
                            each employer and your last date of contact for
                            each. If possible provide Company/position and
                            location. (e.g. 1.- Microsoft/Intern Seattle, WA
                            April 2nd 2025, 2.- Paychex/SE co-op Webster,
                            NY){" "}
                        </FormLabel>
                        <TextField
                            fullWidth
                            label=""
                            name="pendingOffersDetails"
                            value={formValues.pendingOffersDetails || ""}
                            onChange={handleChange}
                            error={!!errors.pendingOffersDetails}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel required id="rejection-letters-label">
                            Have you received formal rejection
                            letters/responses?
                        </FormLabel>
                        <RadioGroup
                            aria-labelledby="rejection-letters-buttons-group-label"
                            name="rejectionLetters"
                            onChange={handleChange}
                        >
                            <FormControlLabel
                                value="true"
                                control={<Radio />}
                                label="Yes"
                            />
                            <FormControlLabel
                                value="false"
                                control={<Radio />}
                                label="No"
                            />
                        </RadioGroup>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                        <FormLabel required id="rejection-letters-details-label">
                            {" "}
                            If Yes, approximately how many? Name as many as you
                            can recall that you would be able to provide
                            evidence if needed. Companies/Employers and
                            approximate date. (e.g. 1.- Google, January 16th
                            2025, 2.- Meta, February 18th 2025){" "}
                        </FormLabel>
                        <TextField
                            fullWidth
                            label=""
                            name="rejectionLettersDetails"
                            value={formValues.rejectionLettersDetails || ""}
                            onChange={handleChange}
                            error={!!errors.rejectionLettersDetails}
                        />
                    </FormControl>

                    <FormControl margin="normal">
                        <FormLabel required id="SE-coop-interest-label">
                            SE does not currently have a co-op option for this
                            summer. However, IF an approved unpaid opportunity
                            became available, would you be interested in
                            pursuing it?
                        </FormLabel>
                        <RadioGroup
                            aria-labelledby="SE-coop-interest-buttons-group-label"
                            name="SEcoopInterest"
                            onChange={handleChange}
                        >
                            <FormControlLabel
                                value="true"
                                control={<Radio />}
                                label="Yes"
                            />
                            <FormControlLabel
                                value="false"
                                control={<Radio />}
                                label="No"
                            />
                        </RadioGroup>
                    </FormControl>

                    <FormControl margin="normal">
                        <FormLabel required id="SEcoopAvailability-label">
                            If an option were to become available, would you be
                            able to participate in-person at RIT or are your
                            circumstances such that you would be unable to for
                            the duration of the co-op?
                        </FormLabel>
                        <RadioGroup
                            aria-labelledby="SEcoopAvailability-buttons-group-label"
                            name="SEcoopAvailability"
                            onChange={handleChange}
                        >
                            <FormControlLabel
                                value="true"
                                control={<Radio />}
                                label="Yes"
                            />
                            <FormControlLabel
                                value="false"
                                control={<Radio />}
                                label="No"
                            />
                        </RadioGroup>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                        <FormLabel required id="remoteAbility-label">
                            {" "}
                            If Unable, please confirm that you can be remote by
                            stating your capabilities (e.g.
                            laptop/desktop/webcam/mic specifications and
                            provider/connection type){" "}
                        </FormLabel>
                        <TextField
                            fullWidth
                            label=""
                            name="remoteAbility"
                            value={formValues.remoteAbility || ""}
                            onChange={handleChange}
                            error={!!errors.remoteAbility}
                        />
                    </FormControl>

                    {/* <FormControl>
                        <FormLabel>Have you completed a coop before?</FormLabel>
                        <RadioGroup
                            defaultValue="Yes"
                            name="radio-buttons-group"
                        >
                            <FormControlLabel
                                value="Yes"
                                control={<Radio />}
                                label="Yes"
                            />
                            <FormControlLabel
                                value="No"
                                control={<Radio />}
                                label="No"
                            />
                        </RadioGroup>
                    </FormControl> */}

                    <FormControl fullWidth margin="normal">
                        <FormLabel required>
                            Is there anything else you&apos;d like to share with us
                            about your search efforts or about your summer
                            availability?
                        </FormLabel>
                        <TextField
                            required
                            fullWidth
                            margin="normal"
                            // label="skills"
                            name="additionalComments"
                            value={formValues.additionalComments || ""}
                            multiline
                            rows={4}
                            onChange={handleChange}
                            error={!!errors.additionalComments}
                            // helperText={errors.description}
                        />
                    </FormControl>

                    <Button
                        // required
                        component="label"
                        variant="contained"
                        tabIndex={-1}
                        startIcon={<FileUploadOutlinedIcon />}
                    >
                        Upload Resume
                        <VisuallyHiddenInput
                            type="file"
                            name="resumeURL"
                            accept=".pdf,.doc,.docx"
                            onChange={handleChange}
                        />
                    </Button>

                    {errors._form && (
                        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                            {errors._form}
                        </Typography>
                    )}

                    <Box mt={2} textAlign="center">
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 2 }}
                        >
                            Submit Application
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </>
    );
}

export default ApplicationPage;