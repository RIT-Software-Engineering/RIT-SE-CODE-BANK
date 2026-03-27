// src/components/applications/EditableApplicationForm.js
'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { applyForJobPosition, applyForJobPositionWithNewUploads } from '../../services/db-apis';
import { gradeEnumToStringValue, letterToGradeValue } from '@/constants/gradeConstants';
import { useNotification } from '@/contexts/NotificationContext';
import DisplayField from '../common/fields/DisplayField';
import GradeSelector from '../common/fields/GradeSelector';

import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { Close as CloseIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';

/**
 * EditableApplicationForm component for candidates to apply for a job position.
 *
 * Displays user and course information, validates grade and employment history,
 * allows uploading or selecting a resume, and optionally attaching a cover letter.
 * Submits the application via API calls and triggers parent callbacks.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.user - The currently logged-in user (candidate)
 * @param {Object} props.position - The job position being applied for
 * @param {Function} props.onClose - Callback to close the form dialog
 * @param {Function} props.onApplySuccess - Callback fired after successful application
 */
export default function EditableApplicationForm({ user, position, onClose, onApplySuccess }) {
    const { showNotification } = useNotification();
    const existingResumes = user?.candidate?.resumes.filter(resume => !resume.isSoftDeleted) || [];
    const primaryResume = existingResumes.find(r => r.isPrimary) || existingResumes[0];

    const initialValues = {
        uid: user?.uid || 0,
        fname: user?.fname || '',
        lname: user?.lname || '',
        pronouns: user?.pronouns || '',
        email: user?.email || '',
        major: user?.candidate?.major || '',
        year: user?.candidate?.year || '',
        grade: user?.candidate?.courseHistory?.find(ch => ch.courseCode === position.courseCode)?.grade || '',
        wasPriorEmployeeForThisCourse: user?.candidate?.courseHistory?.find(ch => ch.courseCode === position.courseCode)?.wasPriorEmployee || false,
        wasPriorEmployeeForOtherCourses: user?.candidate?.courseHistory?.some(ch => ch.courseCode !== position.courseCode && ch.wasPriorEmployee) || false,
        priorEmploymentHistory: user?.candidate?.courseHistory?.filter(ch => ch.wasPriorEmployee)?.map(ch => ({
            courseCode: ch.courseCode
        })),
        resumeId: primaryResume ? String(primaryResume.id) : 'new',
        resumeName: '',
        coverLetterName: '',
    };

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        getValues,
    } = useForm({
        defaultValues: initialValues,
    });

    const selectedResumeId = useWatch({ control, name: 'resumeId' });
    const resumeFile = useWatch({ control, name: 'resumeFile' });
    const coverLetterFile = useWatch({ control, name: 'coverLetterFile' });

    const onSubmit = async (formData) => {
        try {
            const isUploadingNewResume = formData.resumeId === 'new';
            const isUploadingCoverLetter = formData.coverLetterFile && formData.coverLetterFile.length > 0;

            if (formData.grade === '') {
                formData.grade = null;
            }

            if (isUploadingNewResume || isUploadingCoverLetter) {
                if (isUploadingNewResume && (!formData.resumeFile || formData.resumeFile.length === 0)) {
                    showNotification("Please select a resume file to upload.", "error");
                    return;
                }

                const data = new FormData();
                data.append('candidateUsername', user.username);
                data.append('jobPositionId', position.id);

                if (isUploadingNewResume) {
                    data.append('resumeFile', formData.resumeFile[0]);
                    data.append('resumeName', formData.resumeName);
                } else {
                    data.append('resumeId', parseInt(formData.resumeId, 10));
                }

                if (isUploadingCoverLetter) {
                    data.append('coverLetterFile', formData.coverLetterFile[0]);
                    data.append('coverLetterName', formData.coverLetterName);
                }

                const { resumeFile, resumeId, resumeName, coverLetterFile, coverLetterName, ...restOfFormData } = formData;
                data.append('jobPositionApplicationFormData', JSON.stringify(restOfFormData));

                await applyForJobPositionWithNewUploads(data);

            } else {
                const { resumeFile, resumeName, coverLetterFile, coverLetterName, ...restOfFormData } = formData;
                const applicationDetails = {
                    candidateUsername: user.username,
                    jobPositionId: position.id,
                    resumeId: parseInt(formData.resumeId, 10),
                    jobPositionApplicationFormData: JSON.stringify(restOfFormData),
                };
                await applyForJobPosition(applicationDetails);
            }

            onApplySuccess();
            showNotification('Application submitted successfully.', 'success');
            onClose();
        } catch (err) {
            console.error("Submission failed:", err);
            showNotification(err.message || 'Failed to submit application.', 'error');
        }
    };

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h2" component="div">
                    Apply for {position.course.name}
                </Typography>
                <IconButton onClick={onClose} disabled={isSubmitting}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box component="form" id="application-form" onSubmit={handleSubmit(onSubmit)}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                            <DisplayField label="Full Name" value={`${initialValues.fname} ${initialValues.lname}`} />
                            <Box>
                                <DisplayField label="Pronouns" value={initialValues.pronouns} />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                            <DisplayField label="UID" value={initialValues.uid} />
                            <DisplayField label="Email" value={initialValues.email} />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                            <DisplayField label="Major" value={initialValues.major} />
                            <Box>
                                <DisplayField label="Year" value={initialValues.year} />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                            <DisplayField label={`Prior TA For ${position.course.courseCode}`} value={initialValues.wasPriorEmployeeForThisCourse ? "Yes" : "No"} />
                            <DisplayField label="Prior TA For Other Courses" value={initialValues.wasPriorEmployeeForOtherCourses ? "Yes" : "No"} />
                        </Box>
                        <DisplayField label="Prior TA History" value={initialValues.priorEmploymentHistory.length > 0 ? initialValues.priorEmploymentHistory.map(item => item.courseCode).join(', ') : 'None'} />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Controller
                            name="grade"
                            control={control}
                            rules={{
                                required: position.gradeRequirement ? "Your grade for this course is required" : false,
                                validate: (enteredGradeEnum) => {
                                    if (!position.gradeRequirement || !enteredGradeEnum) return true;
                                    const enteredValue = letterToGradeValue[gradeEnumToStringValue[enteredGradeEnum]];
                                    const requiredValue = letterToGradeValue[position.gradeRequirement];
                                    if (enteredValue === undefined) return "Please enter a valid grade.";
                                    if (enteredValue < requiredValue) {
                                        return `A grade of ${position.gradeRequirement} or higher is required.`;
                                    }
                                    return true;
                                }
                            }}
                            render={({ field, fieldState }) => (
                                <GradeSelector
                                    {...field}
                                    id="courseGrade"
                                    label={`Grade for ${position.course.courseCode}`}
                                    isOptional={!position.gradeRequirement}
                                    error={fieldState.error}
                                />
                            )}
                        />

                        <FormControl fullWidth>
                            <InputLabel id="resume-select-label">Resume</InputLabel>
                            <Select
                                sx={(theme) => ({
                                    background: theme.palette.mode === 'dark'
                                        ? "" : "white"
                                })}
                                labelId="resume-select-label"
                                id="resumeId"
                                label="Resume"
                                {...register("resumeId")}
                                defaultValue={initialValues.resumeId}

                            >
                                {existingResumes.map(resume => (
                                    <MenuItem key={resume.id} value={String(resume.id)} >
                                        {`${resume.name}${resume.isPrimary ? ' (Primary)' : ''}`}
                                    </MenuItem>
                                ))}
                                <MenuItem value="new">Upload a new resume...</MenuItem>
                            </Select>
                        </FormControl>

                        {selectedResumeId === 'new' && (
                            <>
                                <TextField
                                    fullWidth
                                    label="New Resume Name"
                                    {...register("resumeName", { required: "Resume name is required." })}
                                    error={!!errors.resumeName}
                                    helperText={errors.resumeName?.message}
                                    placeholder="e.g., General Purpose Resume"
                                    variant="filled"
                                    sx={(theme) => ({
                                        "& .MuiFilledInput-root": {
                                            backgroundColor: theme.palette.mode === "dark" ? "" : "white",
                                            "&:hover": {
                                                backgroundColor: theme.palette.mode === "dark" ? "" : "white",
                                            },
                                            "&.Mui-focused": {
                                                backgroundColor: theme.palette.mode === "dark" ? "" : "white",
                                            },
                                            "&:before, &:after": {
                                                borderBottomColor: "inherit",
                                            },
                                        },
                                    })}
                                />
                                <Box>
                                    <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth sx={(theme) => ({
                                        backgroundColor:
                                            theme.palette.mode === "dark"
                                                ? ""
                                                : "white",


                                        "&:hover": {
                                            backgroundColor:
                                                theme.palette.mode === "dark"
                                                    ? ""
                                                    : "#f5f5f5"
                                        }
                                    })}>
                                        {resumeFile && resumeFile[0] ? resumeFile[0].name : 'Upload Resume (PDF)'}
                                        <input type="file" 
                                            hidden
                                            accept=".pdf"
                                            {...register("resumeFile", {
                                                validate: {
                                                    required: (v) => 
                                                        v.length > 0 || "A PDF resume is required.",
                                                    filesize: (v) =>
                                                        !v[0] || v[0].size <= 5*1024*1024 || "File size must be less than 5MB"
                                                }
                                            })}
                                        />
                                    </Button>
                                    {errors.resumeFile && <Typography color="error" variant="caption" sx={{ ml: 2 }}>{errors.resumeFile.message}</Typography>}
                                </Box>
                            </>
                        )}

                        <TextField
                            fullWidth

                            variant="filled"
                            label="Cover Letter Name (Optional)"
                            {...register("coverLetterName", {
                                validate: (v) => (getValues("coverLetterFile")?.length > 0 && !v) ? "Name is required for cover letter." : true
                            })}
                            sx={(theme) => ({
                                "& .MuiFilledInput-root": {
                                    backgroundColor: theme.palette.mode === "dark" ? "" : "white",
                                    "&:before, &:after": {
                                        borderBottomColor: "inherit",
                                    },
                                },
                            })}
                            error={!!errors.coverLetterName}
                            helperText={errors.coverLetterName?.message}
                            placeholder="e.g., Application for SWEN-261"

                        />
                        <Box>
                            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth
                                sx={(theme) => ({
                                    backgroundColor:
                                        theme.palette.mode === "dark"
                                            ? ""
                                            : "white",


                                    "&:hover": {
                                        backgroundColor:
                                            theme.palette.mode === "dark"
                                                ? ""
                                                : "#f5f5f5"
                                    }
                                })}
                            >
                                {coverLetterFile && coverLetterFile[0] ? coverLetterFile[0].name : 'Upload Cover Letter (PDF)'}
                                <input type="file" 
                                    hidden
                                    accept=".pdf"
                                    {...register("coverLetterFile", {
                                        validate: {
                                            required: (v) => 
                                                (getValues("coverLetterName") && v.length === 0) ? "File is required for cover letter." : true,
                                            filesize: (v) =>
                                                !v[0] || v[0].size <= 5*1024*1024 || "File size must be less than 5MB"
                                        }
                                    })}
                                />
                            </Button>
                            {errors.coverLetterFile && <Typography color="error" variant="caption" sx={{ ml: 2 }}>{errors.coverLetterFile.message}</Typography>}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" form="application-form" variant="contained" color="primary" disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} /> : 'Submit Application'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}