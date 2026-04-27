// src/components/positions/EmployerAndAdmin/SendPositionModal.js
'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    sendOfferToCandidate, getUserProfile
} from '@/services/db-apis';
import { useNotification } from '@/contexts/NotificationContext';
import {
    CircularProgress, Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Link as MuiLink,
    Typography,
} from '@mui/material';
import ConfirmationModal from '@/components/common/models/ConfirmationModal';
import InputField from '../../common/fields/InputField';
import CloseIcon from '@mui/icons-material/Close';

/** Modal for sending an offer to a student
 *
 * @param {Object} props.position - The position data to be edited
 * @param {Function} props.onClose - Callback to close the form dialog
 * @param {Function} props.onUpdateSuccess - Callback fired after successful position data update
 */
export default function SendPositionModal({ position, user, onClose, onSendSuccess }) {
    const { showNotification } = useNotification();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        reset,
    } = useForm({
        defaultValues: {
            candidateEmail: '',
            candidateFName: '',
            candidateLName: ''
        },
    });

    useEffect(() => {
        reset({
            candidateEmail: '',
            candidateFName: '',
            candidateLName: ''
        });
    }, [position, reset]);


    const onSubmit = async (data) => {
        try {
            const username = String(data.candidateEmail).split('@', 1)[0].toLowerCase()
            let candidateProfileData = await getUserProfile(username);

            const candidateInfo = {
                uid: candidateProfileData?.uid || 0,
                fname: candidateProfileData?.fname || data.candidateFName,
                lname: candidateProfileData?.lname || data.candidateLName,
                pronouns: candidateProfileData?.pronouns || 'N/A',
                email: data.candidateEmail,
                major: candidateProfileData?.candidate?.major || 'N/A',
                year: candidateProfileData?.candidate?.year || 0,
                wasPriorEmployeeForThisCourse:
                    candidateProfileData?.candidate?.courseHistory?.find(
                        ch => ch.courseCode === position.courseCode
                    )?.wasPriorEmployee || false,
                wasPriorEmployeeForOtherCourses:
                    candidateProfileData?.candidate?.courseHistory?.some(
                        ch => ch.courseCode !== position.courseCode && ch.wasPriorEmployee
                    ) || false,
                priorEmploymentHistory:
                    candidateProfileData?.candidate?.courseHistory
                        ?.filter(ch => ch.wasPriorEmployee)
                        ?.map(ch => ({ courseCode: ch.courseCode })) || [],
            };
            console.log(candidateInfo);

            const applicationDetails = {
                candidateUsername: data.candidateEmail.slice(0, data.candidateEmail.indexOf('@')),
                jobPositionId: position.id,
                employerFName: user.fname,
                employerLName: user.lname,
                jobPositionApplicationFormData: JSON.stringify(candidateInfo),
            };
            //await sendOfferToCandidate(applicationDetails);
            //send off here
            if (onSendSuccess) onSendSuccess();
            showNotification('Offer sent to student!', 'success');
            if (onClose) onClose();
        } catch (error) {
            console.error('Failed to send offer:', error);
            showNotification('Error: Could not send position to candidate.', 'error');
        }
    };

    return (
        <>
            <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h2" component="div">Send An Offer To A Student</Typography>
                        <Typography color="text.secondary">Send an offer directly to a student.</Typography>
                    </Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                                <Box component="fieldset" sx={{ border: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {/* --- EDITABLE FIELDS --- */}
                                    <InputField
                                        id="candidateFName"
                                        label="Student's First Name"
                                        placeholder="The first name of student you want to send the position to."
                                        registerProps={register("candidateFName", { required: "A first name is required." })}
                                        required={true}
                                        error={errors.candidateFName}
                                        sx={(theme) => ({
                                            "& .MuiOutlinedInput-root": {
                                                backgroundColor:
                                                    theme.palette.mode === "dark"
                                                        ? ""
                                                        : "white"
                                            }
                                        })} />
                                    <InputField
                                        id="candidateLName"
                                        label="Student's Last Name"
                                        placeholder="The last name of the student you want to send the position to."
                                        registerProps={register("candidateLName", { required: "A last name is required." })}
                                        required={true}
                                        error={errors.candidateLName}
                                        sx={(theme) => ({
                                            "& .MuiOutlinedInput-root": {
                                                backgroundColor:
                                                    theme.palette.mode === "dark"
                                                        ? ""
                                                        : "white"
                                            }
                                        })} />
                                    <InputField
                                        id="candidateEmail"
                                        label="Candidate Email"
                                        placeholder="Enter the email of the student you want to send the position to."
                                        registerProps={register("candidateEmail", { required: "An email is required." })}
                                        required={true}
                                        maxLength={15}
                                        error={errors.candidateEmail}
                                        sx={(theme) => ({
                                            "& .MuiOutlinedInput-root": {
                                                backgroundColor:
                                                    theme.palette.mode === "dark"
                                                        ? ""
                                                        : "white"
                                            }
                                        })}
                                    />
                                </Box>
                                <Box sx={{ pt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={onClose}
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
                                        })}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={isSubmitting}
                                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                                    >
                                        {isSubmitting ? 'Sending offer...' : 'Offer position'}
                                    </Button>
                                </Box>
                            </Box>
                        </form>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}