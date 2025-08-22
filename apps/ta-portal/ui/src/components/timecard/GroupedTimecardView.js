// components/timecard/GroupedTimecardView.js
'use client';

import React from 'react';
import TimecardHistory from './TimecardHistory';
import { 
    Accordion,
    AccordionSummary, 
    AccordionDetails, 
    Typography,
    Box
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * GroupedTimecardView is a client-side component responsible for displaying
 * a nested accordion view of timecards, grouped by user.
 * It is designed to be reusable for both Admin and Employer pages.
 * @param {Object} props - The component's props.
 * @param {Array} props.groupedData - The pre-grouped array of timecard data.
 * Each element should be an object like: { user: {...}, timecards: [...] }.
 */
export default function GroupedTimecardView({ groupedData }) {
    // A safeguard to prevent errors if no data is passed.
    // Provides error message if no data is available.
    if (!groupedData || groupedData.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography color="text.secondary">No timecard data to display.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {groupedData.map(({ user, timecards }) => {
                const employeeId = timecards[0]?.jobPositionHistory?.employee?.id;

                return (
                    <Accordion key={user.username}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6" fontWeight={600}>
                                {`${user.fname} ${user.lname}`}
                                {employeeId && (
                                    <Typography component="span" color="text.secondary" sx={{ ml: 1, fontWeight: 400, fontSize: '1rem' }}>
                                        | Employee ID: {employeeId}
                                    </Typography>
                                )}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {timecards.map(timecard => (
                                <Accordion key={timecard.id}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography>
                                            Week of {new Date(timecard.weekStartDate).toLocaleDateString()}
                                            {timecard.jobPositionHistory?.jobPosition?.courseCode && (
                                                <Typography component="span" color="text.secondary" sx={{ ml: 2, fontSize: '0.875rem' }}>
                                                    (Position: {timecard.jobPositionHistory.jobPosition.courseCode}-{timecard.jobPositionHistory.jobPosition.sectionNumber})
                                                </Typography>
                                            )}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TimecardHistory timecard={timecard} user={user} />
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </Box>
    );
}