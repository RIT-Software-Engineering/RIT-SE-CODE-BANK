import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { Users } from "lucide-react";
import { CMTJsonFetch } from "../../utils/api.js";
import { CMTDangerAlert, createErrorHandler } from "../../utils/error.jsx";

export default function TeachingStaff({course}) {
    const [open, setOpen] = useState(false);
    const [staff, setStaff] = useState([]);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("TA");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        const data = await CMTJsonFetch("GET", `/teaching/sections/${course.id}/staff`);
        setStaff(data.staff);
    }, [course.id]);
    useEffect(() => {
        if (open) void refresh().catch(createErrorHandler("Unable to load teaching staff.", setError));
    }, [open, refresh]);

    async function save(event) {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await CMTJsonFetch("POST", `/teaching/sections/${course.id}/staff`, {email, role});
            setEmail("");
            await refresh();
        } catch (err) { createErrorHandler("Unable to assign teaching staff.", setError)(err); }
        finally { setBusy(false); }
    }

    async function remove(member) {
        setBusy(true);
        setError(null);
        try {
            await CMTJsonFetch("DELETE", `/teaching/sections/${course.id}/staff/${member.role}/${member.id}`);
            await refresh();
        } catch (err) { createErrorHandler("Unable to remove teaching assignment.", setError)(err); }
        finally { setBusy(false); }
    }

    if (!course.capabilities?.manageStaff) return null;
    return <>
        <Button variant="outline-secondary" onClick={() => {setError(null); setOpen(true);}}>
            <span className="d-inline-flex align-items-center gap-2"><Users size={16} />Teaching staff</span>
        </Button>
        <Modal show={open} onHide={() => !busy && setOpen(false)} centered size="lg">
            <Modal.Header closeButton={!busy}><Modal.Title>Teaching staff</Modal.Title></Modal.Header>
            <Modal.Body>
                <CMTDangerAlert error={error} />
                <Table responsive>
                    <thead><tr><th>Name</th><th>RIT email</th><th>Role</th><th /></tr></thead>
                    <tbody>{staff.map(member => <tr key={`${member.role}-${member.profile.id}`}>
                        <td>{[member.profile.fname, member.profile.lname].filter(Boolean).join(" ") || "—"}</td>
                        <td>{member.profile.email}</td>
                        <td><Badge bg="secondary">{{OWNER: "Owner", INSTRUCTOR: "Instructor", TA: "TA"}[member.role]}</Badge></td>
                        <td>{member.role !== "OWNER" && <Button variant="outline-danger" size="sm" disabled={busy}
                            aria-label={`Remove ${member.profile.email} teaching assignment`} onClick={() => void remove(member)}>Remove</Button>}</td>
                    </tr>)}</tbody>
                </Table>
                <Form onSubmit={save}>
                    <Form.Group className="mb-3" controlId="section-staff-email">
                        <Form.Label>RIT email</Form.Label>
                        <Form.Control type="email" required value={email} disabled={busy} onChange={event => setEmail(event.target.value)} />
                        <Form.Text>Use an existing instructor or student profile.</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="section-staff-role">
                        <Form.Label>Section role</Form.Label>
                        <Form.Select value={role} disabled={busy} onChange={event => setRole(event.target.value)}>
                            <option value="TA">TA</option><option value="INSTRUCTOR">Instructor</option>
                        </Form.Select>
                    </Form.Group>
                    <Button type="submit" disabled={busy}>{busy ? <Spinner size="sm" animation="border" /> : "Add teaching assignment"}</Button>
                </Form>
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Close</Button></Modal.Footer>
        </Modal>
    </>;
}
