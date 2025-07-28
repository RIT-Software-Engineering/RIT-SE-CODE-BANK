// components/users/UserGroups.js
"use client";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ProfileInfoCard from "@/components/profile/ProfileInfoCard";

export default function UserGroup({ title, users, onEditUser }) {
    return (
        <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight={600}>
            {title} ({users.length})
            </Typography>
        </AccordionSummary>
        <AccordionDetails>
            {users.map(user => (
            <ProfileInfoCard
                key={user.uid}
                profileData={user}
                isEmployerOrAdmin={user.role === "EMPLOYER" || user.role === "ADMIN"}
                isCandidateOrEmployee={user.role === "CANDIDATE" || user.role === "EMPLOYEE"}
                onEdit={() => onEditUser(user.uid)}
            />
            ))}
        </AccordionDetails>
        </Accordion>
    );
}