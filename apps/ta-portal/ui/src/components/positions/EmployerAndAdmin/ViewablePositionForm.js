// src/components/positions/EmployerAndAdmin/ViewablePositionForm.js
"use client";

import { formatDate, formatTime } from '@/utils/applicationUtils';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as ClockIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { gradeEnumToStringValue } from '@/constants/gradeConstants';

/**
 * A component that displays a label and a value
 * @param {string} label The label that describes the value
 * @param {ReactNode} children The value to be displayed
 * @returns {ReactElement}
 */
const DetailItem = ({ label, children }) => (
  <Box>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {label}
    </Typography>
    <Typography component="div" variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {children || 'N/A'}
    </Typography>
  </Box>
);

/**
 * A dialog component that displays a job position's details in a read-only format.
 * The dialog displays the position's name, description, logistics, and requirements.
 * It takes in a `position` object as a prop, which is the job position to be displayed.
 * The dialog also takes in an `onClose` function, which is called when the dialog is closed.
 * @param {Object} props - Component props
 * @param {Object} props.position - The job position to be displayed
 * @param {Function} props.onClose - Callback to close the dialog
 * @returns {ReactElement}
 */
export default function ViewablePositionForm({ position, onClose }) {
  if (!position) return null;
  console.log(position);
  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="md" >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background:"background.default"}}>
        <Box>
          <Typography variant="h2" component="div">{position.course.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {position.id}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom>Description</Typography>
          <Typography color="text.secondary">{position.course.description}</Typography>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom>Logistics</Typography>
          <Grid container spacing={2} direction="column">
            <Grid container item spacing={2}>
              <Grid item xs={12} sm={6}>
                <DetailItem label="Location">
                  <LocationIcon fontSize="small" /> {position.location} ({position.locationType})
                </DetailItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem label="Maximum TAs">{position.maxTAs}</DetailItem>
              </Grid>
            </Grid>
            <Grid container item spacing={2}>
              <Grid item xs={12} sm={6}>
                <DetailItem label="Start Date">
                  <CalendarIcon fontSize="small" /> {formatDate(position.startDate)}
                </DetailItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem label="End Date">
                  <CalendarIcon fontSize="small" /> {formatDate(position.endDate)}
                </DetailItem>
              </Grid>
            </Grid>
            <Grid container item>
              <Grid item xs={12}>
                <DetailItem label="Weekly Schedule">
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <ClockIcon fontSize="small" sx={{ mt: 0.5 }} />
                    <Box>
                      {position.jobSchedules.map((slot, i) => (
                        <Typography key={i} variant="body1">
                          <Box component="span" fontWeight="bold">{slot.dayOfWeek}:</Box>{' '}
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </DetailItem>
              </Grid>
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="h3" gutterBottom>Requirements</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <DetailItem label="Graduate Status">{position.graduateStatusRequirement}</DetailItem>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DetailItem label="Minimum Grade">{gradeEnumToStringValue[position.gradeRequirement]}</DetailItem>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DetailItem label="Must Have Taken Course">{position.courseTakenRequirement ? 'Yes' : 'No'}</DetailItem>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}