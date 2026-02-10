// components/users/UserGroups.js
"use client";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ProfileInfoCard from "@/components/profile/ProfileInfoCard";
import { Box } from "@mui/material";

/**
 * A reusable component for displaying a group of users in an accordion.
 * If the group is for employees, it will group the users by status (e.g. "Active", "Inactive", etc.).
 * Otherwise, it will display all the users in a single list.
 * @param {string} props.title - The title to display for the group.
 * @param {User[]} props.users - The list of users to display.
 * @param {(username: string) => void} props.onEditUser - The callback to call when a user is clicked to edit.
 * @param {boolean} [props.isEmployeeGroup=false] - Whether the group is for employees or not.
 * @returns {ReactElement}
 */
export default function UserGroup({ title, users, onEditUser, isEmployeeGroup = false }) {
    if (isEmployeeGroup) {
    const totalCount = Object.values(users).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <Accordion sx={(theme)=>({ background: theme.palette.mode === 'dark'
                    ? ""
                    : "#e0e0e0" })}
>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight={600}>
                {title} ({totalCount})
            </Typography>
            </AccordionSummary>
            <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(users).map(([status, group]) => (
                <Accordion key={status}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>
                        {status} ({group.length})
                    </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {group.map((user) => (
                        <ProfileInfoCard
                            key={user.username}
                            profileData={user}
                            isEmployerOrAdmin={false}
                            isCandidateOrEmployee
                            onEdit={() => onEditUser(user.username)}
                        />
                        ))}
                    </Box>
                    </AccordionDetails>
                </Accordion>
                ))}
            </Box>
            </AccordionDetails>
        </Accordion>
        );
    }

    // Non-employee groups
    return (
        <Accordion sx={(theme)=>({ background: theme.palette.mode === 'dark'
                    ? ""
                    : "#e0e0e0" })}
>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight={600}>
            {title} ({users.length})
            </Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {users.map((user) => (
                <ProfileInfoCard
                key={user.username}
                profileData={user}
                isEmployerOrAdmin={user.role === 'EMPLOYER' || user.role === 'ADMIN'}
                isCandidateOrEmployee={user.role === 'CANDIDATE' || user.role === 'EMPLOYEE'}
                onEdit={() => onEditUser(user.username)}
                />
            ))}
            </Box>
        </AccordionDetails>
        </Accordion>
    );
}