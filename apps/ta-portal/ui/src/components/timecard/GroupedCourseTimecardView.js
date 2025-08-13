// components/timecard/GroupdedCourseTimecardView.js
'use client';

import React from 'react';
import TimecardHistory from './TimecardHistory';
import { 
    Accordion,
    AccordionSummary, 
    AccordionDetails, 
    Typography 
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
        return <div className="text-center py-10 text-gray-500">No timecard data to display.</div>;
    }

    return (
        <div className="space-y-4">
            {/* Level 1: Map over each COURSE group */}
            {groupedData.map(({ courseId, courseTitle, employees }) => (
                <Accordion key={courseId} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h5" fontWeight={700}>{courseTitle}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div className="space-y-3 pl-4">
                            {/* Level 2: Map over each EMPLOYEE in the course */}
                            {employees.map(({ user, timecards }) => {
                                const employeeId = timecards[0]?.jobPositionHistory?.employee?.id;

                                return (
                                    <Accordion key={user.username}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="h6" fontWeight={600}>
                                                {`${user.fname} ${user.lname}`}
                                                {employeeId && (
                                                    <span className="text-gray-500 font-normal text-base ml-2">
                                                        | ID: {employeeId}
                                                    </span>
                                                )}
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <div className="space-y-2">
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
                                            </div>
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            })}
                        </div>
                    </AccordionDetails>
                </Accordion>
            ))}
        </div>
    );
}