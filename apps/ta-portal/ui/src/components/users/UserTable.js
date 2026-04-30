// components/users/UserTable.js
"use client";

import React, { useState } from 'react';

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ApplicationCard from '@/components/applications/EmployerAndAdmin/ApplicationCard';
import EditButton from '../common/buttons/EditButton';
import { TablePagination, Divider, Box, Paper, Button, Modal, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

import { useNotification } from '@/contexts/NotificationContext';
export function UserRow({ user, role, onEdit }) {

    const [isMadeOffersModalOpen, setIsMadeOffersModalOpen] = useState(false);
    const [isToMakeOffersModalOpen, setIsToMakeOffersModalOpen] = useState(false);


    const getOffersToMake = (positions) => {
        let offers = 0;
        positions?.forEach((position) => {
            if (position.jobPositionStatus === "OPEN") {
                offers = offers + position.maxTAs
                if (position.jobPositionApplicationHistory.length > 0) {
                    position.jobPositionApplicationHistory.map((application) => {
                        if (application.jobApplicationStatus === "HIRED" || application.jobApplicationStatus === "ACCEPTED_OFFER" || application.jobApplicationStatus === "PENDING_OFFER") {
                            offers = offers - 1;
                        }
                    });
                }
            };
        });
        return offers;
    };
    const getMadeOffers = (positions) => {
        let offers = 0;
        positions?.forEach((position) => {
            if (position.jobPositionApplicationHistory.length > 0) {
                position.jobPositionApplicationHistory.map((application) => {
                    if (application.jobApplicationStatus === "HIRED" || application.jobApplicationStatus === "ACCEPTED_OFFER" || application.jobApplicationStatus === "PENDING_OFFER") {
                        offers = offers + 1;
                    }
                });
            }
        });
        return offers;
    };

    const handleOffersToMakeModalContent = () => {
        setIsMadeOffersModalOpen(false);
        if (isToMakeOffersModalOpen) {
            setIsToMakeOffersModalOpen(false);
        }
        else {
            setIsToMakeOffersModalOpen(true);
        }
    };

    const handleMadeOffersModal = () => {
        setIsToMakeOffersModalOpen(false);
        if (isMadeOffersModalOpen) {
            setIsMadeOffersModalOpen(false);
        }
        else {
            setIsMadeOffersModalOpen(true);
        }
    };
    const renderOffersToMakeModalContent = (positions) => {
        if (getOffersToMake(positions) == 0) {
            return (
                <Box>
                    No open positions.
                </Box>
            )
        }
        return positions.map((position) => {
            if (position.jobPositionStatus == "OPEN") {
                let offers = 0;
                let offers_made = 0;
                offers = offers + position.maxTAs
                if (position.jobPositionApplicationHistory.length > 0) {
                    position.jobPositionApplicationHistory.forEach((application) => {
                        if (application.jobApplicationStatus == "HIRED" || application.jobApplicationStatus == "ACCEPTED_OFFER" || application.jobApplicationStatus == "PENDING_OFFER") {
                            offers = offers - 1;
                        }
                    });
                    offers_made = position.maxTAs - offers;
                    return (
                        <Paper key={position.id} elevation={3} sx={(theme) => ({ p: { xs: 2, md: 3 }, background: theme.palette.mode === 'dark' ? "" : "white" })}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                                <Box flexGrow={1}>
                                    <Typography variant="h2" component="h2" gutterBottom>
                                        {position.course.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                                        {position.id}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1 }}>
                                        <Typography variant="body2">
                                            {/*maybe change to open slots */}
                                            Offers to Make: {offers}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1 }}>
                                        <Typography variant="body2">
                                            Offers Made: {offers_made}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    );
                }
                else {
                    offers_made = position.maxTAs - offers;
                    return (
                        <Paper key={position.id} elevation={3} sx={(theme) => ({ p: { xs: 2, md: 3 }, background: theme.palette.mode === 'dark' ? "" : "white" })}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                                <Box flexGrow={1}>
                                    <Typography variant="h2" component="h2" gutterBottom>
                                        {position.course.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                                        {position.id}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1 }}>
                                        <Typography variant="body2">
                                            Offers to Make: {offers}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1 }}>
                                        <Typography variant="body2">
                                            Offers Made: {offers_made}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    );
                }
            };
        });

    };

    const renderMadeOffersModalContent = (positions) => {
        const matchingApplications = positions.flatMap((position) =>
            position.jobPositionApplicationHistory
                ?.filter((application) =>
                    ["HIRED", "ACCEPTED_OFFER", "PENDING_OFFER"].includes(
                        application.jobApplicationStatus
                    )
                )
                .map((application) => (
                    <ApplicationCard
                        currentUser={user}
                        key={application.username + application.jobPositionId}
                        jobPosition={position}
                        application={application}
                    />
                )) ?? []
        );

        if (matchingApplications.length === 0) {
            return <Box>No offers made.</Box>;
        }

        return matchingApplications;
    };

    return (
        <>
            <TableRow>
                <TableCell>{user.fname} {user.lname}</TableCell>
                <TableCell>{user.uid}</TableCell>
                <TableCell>{user.email}</TableCell>
                {/**HERE */}
                {/* employee info */}
                {role === 'EMPLOYEE' && (<>
                    <TableCell>
                        <>
                            {user.candidate.employee[0]?.jobPositionHistory.map((pos) => (
                                <Typography key={pos.jobPositionId} variant="p" component="div">
                                    {pos.jobPositionId}
                                </Typography>
                            ))}
                        </>
                    </TableCell>

                </>
                )}
                {/* employer info */}
                {role === 'EMPLOYER' && (
                    <>
                        <TableCell><Button onClick={() => handleMadeOffersModal()}>{getMadeOffers(user.employer?.jobPositions)} </Button></TableCell>
                        <TableCell><Button onClick={() => handleOffersToMakeModalContent()}>{getOffersToMake(user.employer?.jobPositions)} </Button></TableCell>
                        <Modal
                            open={isMadeOffersModalOpen}
                            onClose={handleMadeOffersModal}
                            aria-labelledby="made-offers-modal-title"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Paper
                                sx={(theme) => ({
                                    p: { xs: 2, md: 4 },
                                    width: '90%',
                                    maxWidth: '800px',
                                    maxHeight: '90vh',
                                    overflowY: 'auto',
                                    background: theme.palette.mode === 'dark'
                                        ? ""
                                        : "#e0e0e0e"
                                })}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Typography variant="h2" component="div">
                                        {user.fname} {user.lname}&apos;s Made Offers
                                    </Typography>
                                    <Divider />
                                    {renderMadeOffersModalContent(user.employer?.jobPositions)}
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button onClick={() => handleMadeOffersModal()}
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
                                        })}
                                    >
                                        Close
                                    </Button>
                                </Box>
                            </Paper>
                        </Modal>
                        <Modal
                            open={isToMakeOffersModalOpen}
                            onClose={handleOffersToMakeModalContent}
                            aria-labelledby="made-offers-modal-title"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Paper sx={{
                                p: { xs: 2, md: 4 },
                                width: '90%',
                                maxWidth: '800px',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Typography variant="h2" component="div">
                                        {user.fname} {user.lname}&apos;s Open Positions
                                    </Typography>
                                    <Divider />
                                    {renderOffersToMakeModalContent(user.employer?.jobPositions)}
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 3 }}>
                                    <Button onClick={() => handleOffersToMakeModalContent()}
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
                                        })}
                                    >
                                        Close
                                    </Button>
                                </Box>

                            </Paper>
                        </Modal>
                    </>)
                }
                <TableCell><EditButton handleOpenModal={() => onEdit(user.username)} /></TableCell>
            </TableRow >

        </>);
}
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
export default function UserTable({ title, users, role, onEdit, isEmployeeGroup = false }) {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const paginatedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const { showNotification } = useNotification();
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleCopy = async (emails) => {
        try {
            await navigator.clipboard.writeText(emails);
            showNotification("Emails copied successfully!", "success");

        } catch (err) {
            console.error('Failed to copy text: ', err);

            showNotification("Failed to copy emails", "error");
        }
    };

    return (
        <Accordion sx={(theme) => ({
            background: theme.palette.mode === 'dark'
                ? ""
                : "#e0e0e0"
        })}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={600}>
                    {title} ({users.length})
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TableContainer>
                        <Table sx={(theme) => ({
                            backgroundColor: theme.palette.background.default,
                            borderCollapse: "separate",
                            borderSpacing: 0,
                            "& th, & td": {
                                border: `1px solid ${theme.palette.divider}`,
                            },
                            "& th": {
                                backgroundColor: theme.palette.action.hover,
                                fontWeight: 600,
                            },
                        })}
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>UID</TableCell>
                                    <TableCell>Email</TableCell>
                                    {/* employer info */}
                                    {role === 'EMPLOYER' && (<>
                                        <TableCell>Offers Made</TableCell>
                                        <TableCell>Open Positions</TableCell></>)}
                                    {/* employee info */}
                                    {role === 'EMPLOYEE' && (<>
                                        <TableCell>Position</TableCell>
                                    </>
                                    )}
                                    <TableCell>Edit</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedUsers.map((user) => (
                                    <UserRow key={user.uid} user={user} role={role} onEdit={onEdit} />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <TablePagination
                            component="div"
                            count={users.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            variant='outlined'
                        />

                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Button variant='outlined' sx={(theme) => ({
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
                            })}
                                onClick={() => handleCopy(users.map((user) => user.email).join())}>Copy all emails</Button>
                        </Box>
                    </Box>
                </Box>

            </AccordionDetails>
        </Accordion>
    );
}