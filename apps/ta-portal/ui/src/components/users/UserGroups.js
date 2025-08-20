// components/users/UserGroups.js
"use client";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ProfileInfoCard from "@/components/profile/ProfileInfoCard";
import { Box } from "@mui/material";

export default function UserGroup({ title, users, onEditUser, isEmployeeGroup = false }) {
    if (isEmployeeGroup) {
    const totalCount = Object.values(users).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <Accordion>
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
        <Accordion>
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