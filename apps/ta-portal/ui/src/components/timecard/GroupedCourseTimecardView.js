// components/timecard/GroupdedCourseTimecardView.js
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
 * GroupedByCourseView renders a three-level accordion for the employer view:
 * 1. Course
 * 2. Employee
 * 3. Weekly Timecard
 */
export default function GroupedByCourseView({ groupedData }) {
    if (!groupedData || groupedData.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography color="text.secondary">No timecard data to display.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Level 1: Map over each COURSE group */}
            {groupedData.map(({ courseId, courseTitle, employees }) => (
                <Accordion key={courseId} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h5" fontWeight={700}>{courseTitle}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 2 }}>
                            {/* Level 2: Map over each EMPLOYEE in the course */}
                            {employees.map(({ user, timecards }) => {
                                const employeeId = timecards[0]?.jobPositionHistory?.employee?.id;

                                return (
                                    <Accordion key={user.username}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="h6" fontWeight={600}>
                                                {`${user.fname} ${user.lname}`}
                                                {employeeId && (
                                                    <Typography component="span" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
                                                        | ID: {employeeId}
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {/* Level 3: Map over each TIMECARD for the employee */}
                                                {timecards.map(timecard => (
                                                    <Accordion key={timecard.id}>
                                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                            <Typography>
                                                                Week of {new Date(timecard.weekStartDate).toLocaleDateString()}
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
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
}