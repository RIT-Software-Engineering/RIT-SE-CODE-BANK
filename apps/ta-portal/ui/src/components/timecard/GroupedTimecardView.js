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
        return <div className="text-center py-10 text-gray-500">No timecard data to display.</div>;
    }

    return (
        <div className="space-y-4">
            {groupedData.map(({ user, timecards }) => {
                const employeeId = timecards[0]?.jobPositionHistory?.employee?.id;

                return (
                    <Accordion key={user.username}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6" fontWeight={600}>
                                {`${user.fname} ${user.lname}`}
                                {employeeId && (
                                    <span className="text-gray-500 font-normal text-base ml-2">
                                        | Employee ID: {employeeId}
                                    </span>
                                )}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div className="space-y-2">
                            {timecards.map(timecard => (
                                <Accordion key={timecard.id}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography>
                                            Week of {new Date(timecard.weekStartDate).toLocaleDateString()}
                                            {timecard.jobPositionHistory?.jobPosition?.courseCode && (
                                                <span className="text-gray-500 text-sm ml-4">
                                                    (Position: {timecard.jobPositionHistory.jobPosition.courseCode}-{timecard.jobPositionHistory.jobPosition.sectionNumber})
                                                </span>
                                            )}
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
    );
}