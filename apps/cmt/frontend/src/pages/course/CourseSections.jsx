import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CMTJsonFetch } from "../../utils/api";
import { CMTDangerAlert, createErrorHandler } from "../../utils/error";

const SectionContext = createContext({hasRelatedSections: false, refreshSync: () => {}});
export const useSectionSync = () => useContext(SectionContext);

export function CourseSections({course, children}) {
    const navigate = useNavigate();
    const [sync, setSync] = useState({sections: [course], issues: []});
    const [error, setError] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [section, setSection] = useState("");
    const [progress, setProgress] = useState("reset");
    const [submitting, setSubmitting] = useState(false);
    const seen = useRef(new Set());
    const mounted = useRef(false);
    const request = useRef(0);
    const editing = useRef(false);
    editing.current = createOpen || removeOpen;

    const refreshSync = useCallback(async () => {
        const current = ++request.current;
        try {
            const data = await CMTJsonFetch("GET", `/course/${course.id}/section-sync`);
            if (!mounted.current || current !== request.current) return;
            setSync(data);
            setError(null);
            const unseen = data.issues.filter(issue => !issue.dismissedAt && !seen.current.has(`${issue.id}:${issue.occurrence}`));
            if (unseen.length && !editing.current) {
                unseen.forEach(issue => seen.current.add(`${issue.id}:${issue.occurrence}`));
                setDetailsOpen(true);
            }
        } catch (err) {
            if (mounted.current && current === request.current)
                createErrorHandler("Failed to check section sync.", setError)(err);
        }
    }, [course.id]);

    useEffect(() => {
        mounted.current = true;
        void refreshSync();
        const check = () => { if (!document.hidden) void refreshSync(); };
        const timer = setInterval(check, 20000);
        window.addEventListener("focus", check);
        return () => {
            mounted.current = false;
            clearInterval(timer);
            window.removeEventListener("focus", check);
        };
    }, [refreshSync]);

    const hasRelatedSections = sync.sections.length > 1;
    const closeDetails = async () => {
        setSubmitting(true);
        try {
            await Promise.all(sync.issues.filter(issue => !issue.dismissedAt).map(issue =>
                CMTJsonFetch("POST", `/course/${course.id}/section-sync/${issue.id}/dismiss`, {occurrence: issue.occurrence})
            ));
            setDetailsOpen(false);
            await refreshSync();
        } catch (err) {
            createErrorHandler("Failed to dismiss sync warning.", setError)(err);
        } finally {
            setSubmitting(false);
        }
    };

    const createSection = async event => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const result = await CMTJsonFetch("POST", `/course/${course.id}/sections`, {section, progress});
            setCreateOpen(false);
            navigate(`/courses/${result.course.id}`);
        } catch (err) {
            createErrorHandler("Failed to create section.", setError)(err);
        } finally {
            setSubmitting(false);
        }
    };

    const removeSection = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await CMTJsonFetch("DELETE", `/course/${course.id}`);
            const result = await CMTJsonFetch("GET", `/course/${course.id}/sections`);
            const remaining = result.sections.find(item => item.id !== course.id);
            setRemoveOpen(false);
            navigate(remaining ? `/courses/${remaining.id}` : "/courses");
        } catch (err) {
            createErrorHandler("Failed to remove section.", setError)(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SectionContext.Provider value={{hasRelatedSections, refreshSync}}>
            <div className="flex flex-wrap items-center gap-3 py-3 border-bottom">
                <Form.Label htmlFor="related-section" className="mb-0">Section</Form.Label>
                <Form.Select
                    id="related-section"
                    style={{width: "auto", maxWidth: "100%", minWidth: "150px"}}
                    value={course.id}
                    onChange={event => navigate(`/courses/${event.target.value}`)}
                >
                    {sync.sections.map(item => (
                        <option key={item.id} value={item.id}>{item.section || `Section ${item.id} (TBD)`}</option>
                    ))}
                </Form.Select>
                <Button variant="outline-primary" onClick={() => {setSection(""); setProgress("reset"); setError(null); setCreateOpen(true);}}>
                    <span className="inline-flex items-center gap-1"><Plus size={16} />Add section</span>
                </Button>
                <Button variant="outline-danger" disabled={course.active === false} onClick={() => {setError(null); setRemoveOpen(true);}}>
                    <span className="inline-flex items-center gap-1"><Trash2 size={16} />Remove section</span>
                </Button>
                {hasRelatedSections && (
                    <>
                        <Badge bg={sync.issues.length ? "warning" : "success"} text={sync.issues.length ? "dark" : "light"}>
                            {sync.issues.length ? "Out of sync" : "In sync"}
                        </Badge>
                        {sync.issues.length > 0 && <Button variant="outline-secondary" onClick={() => setDetailsOpen(true)}>Review differences</Button>}
                    </>
                )}
            </div>
            {!createOpen && !removeOpen && !detailsOpen && <CMTDangerAlert error={error} />}
            {children}

            <Modal show={createOpen} onHide={() => !submitting && setCreateOpen(false)} centered>
                <Form onSubmit={createSection}>
                    <Modal.Header closeButton={!submitting}><Modal.Title>Add section</Modal.Title></Modal.Header>
                    <Modal.Body>
                        <CMTDangerAlert error={error} />
                        <Form.Group className="mb-3" controlId="new-section-number">
                            <Form.Label>Section number</Form.Label>
                            <Form.Control value={section} onChange={event => setSection(event.target.value)} required maxLength={30} autoFocus />
                        </Form.Group>
                        <Form.Group controlId="section-progress">
                            <Form.Label>Progress</Form.Label>
                            <Form.Select value={progress} onChange={event => setProgress(event.target.value)}>
                                <option value="reset">Start with all blocks not started</option>
                                <option value="copy">Copy current section progress</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" disabled={submitting} onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={submitting || !section.trim()}>
                            {submitting ? <><Spinner size="sm" animation="border" /> Creating...</> : "Create section"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={removeOpen} onHide={() => !submitting && setRemoveOpen(false)} centered>
                <Modal.Header closeButton={!submitting}>
                    <Modal.Title>Remove section {course.section || "(TBD)"}?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CMTDangerAlert error={error} />
                    <p>This section will be archived and removed from active sections and sync comparisons.</p>
                    <p className="mb-0">Its schedule and materials will be kept. You can restore it from the Archived tab in My Courses.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" disabled={submitting} onClick={() => setRemoveOpen(false)}>Keep section</Button>
                    <Button variant="danger" disabled={submitting} onClick={removeSection}>
                        {submitting ? "Removing..." : "Remove section"}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={detailsOpen} onHide={() => !submitting && void closeDetails()} centered size="lg">
                <Modal.Header closeButton={!submitting}><Modal.Title>Section sync</Modal.Title></Modal.Header>
                <Modal.Body style={{maxHeight: "65vh", overflowY: "auto"}}>
                    <CMTDangerAlert error={error} />
                    {sync.issues.length === 0 ? <Alert variant="success">Sections are back in sync.</Alert> : sync.issues.map(issue => (
                        <div key={issue.id} className="mb-3 pb-3 border-bottom">
                            <p className="font-semibold mb-1">{issue.details.label}</p>
                            <p>{issue.details.message}</p>
                            <Table size="sm" responsive>
                                <thead><tr><th>Section</th><th>Session</th><th>Week</th><th>Status</th></tr></thead>
                                <tbody>{issue.details.sections.map(item => (
                                    <tr key={item.courseId}>
                                        <td>{item.section}</td><td>{item.sessionNum ?? "-"}</td><td>{item.week ?? "TBD"}</td>
                                        <td>{item.missing ? "Missing" : item.status ? {NOT_STARTED: "Not started", IN_PROGRESS: "In progress", COMPLETED: "Completed"}[item.status] : "Planned"}</td>
                                    </tr>
                                ))}</tbody>
                            </Table>
                            <Button variant="outline-primary" disabled={submitting} onClick={async () => {
                                await closeDetails();
                                const {reviewCourseId, reviewSessionNum} = issue.details;
                                navigate(`/courses/${reviewCourseId}${reviewSessionNum ? `?session=${reviewSessionNum}#sessions` : "#sessions"}`);
                            }}>Review affected session</Button>
                        </div>
                    ))}
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" disabled={submitting} onClick={closeDetails}>Dismiss</Button></Modal.Footer>
            </Modal>
        </SectionContext.Provider>
    );
}

export function SectionApplyScope({value, onChange, disabled = false}) {
    const {hasRelatedSections} = useSectionSync();
    if (!hasRelatedSections || disabled) return null;
    return (
        <Form.Group className="mb-3">
            <Form.Label>Apply to</Form.Label>
            <Form.Select aria-label="Apply to sections" value={value ? "all" : "current"} onChange={event => onChange(event.target.value === "all")}>
                <option value="current">This section</option>
                <option value="all">All sections</option>
            </Form.Select>
        </Form.Group>
    );
}
