// src/components/applications/ViewableApplicationForm.js
'use client';

import DisplayField from "../common/fields/DisplayField";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link as MuiLink,
  Typography,
} from '@mui/material';
import { Close as CloseIcon, Article as DocumentIcon } from '@mui/icons-material';

/**
 * ViewableApplicationForm component for displaying a submitted job application.
 *
 * Renders candidate details, academic info, prior employment history,
 * and links to submitted resume and cover letter (if available).
 * Used by admins/reviewers to view applications in a read-only format.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.position - The job position related to the application
 * @param {Object} props.application - The candidate's submitted application data
 * @param {Function} props.onClose - Callback to close the dialog
 */
export default function ViewableApplicationForm({position, application, onClose }) {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL + process.env.NEXT_PUBLIC_API_EXTENSION + process.env.NEXT_PUBLIC_DATABASE_API_EXTENSION;

  const submittedResume = application.resume;

  const displayValues = {
    uid: application.candidateUID || 0,
    fname: application.candidateFName || '',
    lname: application.candidateLName || '',
    pronouns: application.candidatePronouns || '',
    email: application.candidateEmail || '',
    major: application.candidateMajor || '',
    year: application.candidateYear || '',
    grade: application.candidateGrade || '',
    wasPriorEmployeeForThisCourse: application.wasPriorEmployeeForThisCourse || false,
    wasPriorEmployeeForOtherCourses: application.wasPriorEmployeeForOtherCourses || false,
    priorEmploymentHistory: application.priorEmploymentHistory || 'None',
    coverLetterName: application.coverLetterName || '',
    coverLetterURL: application.coverLetterURL || '',
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h2" component="div">
          Viewing Application for {position.course.name}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <DisplayField label="Full Name" value={`${displayValues.fname} ${displayValues.lname}`} />
            <Box>
              <DisplayField label="Pronouns" value={displayValues.pronouns} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <DisplayField label="UID" value={displayValues.uid} />
            <DisplayField label="Email" value={displayValues.email} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <DisplayField label="Major" value={displayValues.major} />
            <Box>
              <DisplayField label="Year" value={displayValues.year} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <DisplayField label={`Prior TA For ${position.course.courseCode}`} value={displayValues.wasPriorEmployeeForThisCourse ? "Yes" : "No"} />
            <DisplayField label="Prior TA For Other Courses" value={displayValues.wasPriorEmployeeForOtherCourses ? "Yes" : "No"} />
          </Box><DisplayField
            label="Prior Employment History"
            value={displayValues.priorEmploymentHistory}
          />

          {submittedResume?.resumeURL && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Submitted Resume</Typography>
              <MuiLink
                href={`${backendURL}${submittedResume.resumeURL}`}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <DocumentIcon fontSize="small" />
                {submittedResume.name || 'View Submitted Resume'}
              </MuiLink>
            </Box>
          )}

          {displayValues.coverLetterURL && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Submitted Cover Letter</Typography>
              <MuiLink
                href={`${backendURL}${displayValues.coverLetterURL}`}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <DocumentIcon fontSize="small" />
                {displayValues.coverLetterName || 'View Submitted Cover Letter'}
              </MuiLink>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={(theme) => ({
          background: theme.palette.mode === 'dark'
            ? ""
            : "white"
        })}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}