import { useEffect, useState } from "react";
import { Accordion, Alert, Badge, Form } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import StudentPageLayout from "../../components/student/StudentPageLayout.jsx";
import { ReadOnlyEditor } from "../../components/RichTextEditor/RichTextEditor";
import useStudentData from "../../hooks/useStudentData.js";
import { CMTJsonFetch } from "../../utils/api.js";

const statuses = {NOT_STARTED: "Not started", IN_PROGRESS: "In progress", COMPLETED: "Completed"};
const colors = {NOT_STARTED: "secondary", IN_PROGRESS: "warning", COMPLETED: "success"};

export default function TeachingSectionPage() {
    const {id} = useParams();
    const {data, loading, error, refresh} = useStudentData(`sections/${id}`, "sessions", "teaching");
    const [saving, setSaving] = useState(null);
    const [saveError, setSaveError] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    useEffect(() => {
        const recheck = () => { if (!document.hidden) void refresh(); };
        window.addEventListener("focus", recheck);
        return () => window.removeEventListener("focus", recheck);
    }, [refresh]);

    async function updateStatus(block, status) {
        setSaving(block.id);
        setSaveError(false);
        try {
            await CMTJsonFetch("PATCH", `/teaching/sections/${id}/blocks/${block.id}/status`, {status});
            await refresh();
        } catch {
            setSaveError(true);
            await refresh();
        } finally { setSaving(null); }
    }

    return <StudentPageLayout title={data ? `${data.course.classId} — Section ${data.course.section || "TBD"}` : "Teaching Section"}
        loading={loading} error={error} refresh={refresh}>
        <Link to="/teaching" className="btn btn-outline-secondary mb-3">Back to teaching sections</Link>
        {saveError && <Alert variant="danger">Unable to update block status. Your section access may have changed.</Alert>}
        {data && <>
            <p>{data.course.name} <Badge bg="secondary">{data.role}</Badge></p>
            {!data.sessions.length && <p className="text-secondary">No sessions scheduled.</p>}
            <Accordion activeKey={activeSession} onSelect={setActiveSession}>
                {data.sessions.map(session => <Accordion.Item key={session.id} eventKey={String(session.id)}>
                    <Accordion.Header>
                        <span className="d-flex align-items-center flex-wrap gap-2">
                            Session {session.sessionNum} {session.date && `— ${session.date}`}
                            {session.canceled && <Badge bg="danger">Canceled</Badge>}
                        </span>
                    </Accordion.Header>
                    <Accordion.Body>
                        {session.blocks.map(block => <section key={block.id} className="border rounded p-3 mb-3">
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                                <h3 className="h6 mb-0">{block.name}</h3>
                                <Form.Select aria-label={`${block.name} status`} value={block.status}
                                    className={`bg-${colors[block.status]} text-white`} style={{width: "auto"}}
                                    disabled={!data.capabilities.updateProgress || saving !== null}
                                    onChange={event => void updateStatus(block, event.target.value)}>
                                    {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}
                                        className="bg-secondary text-white">{label}</option>)}
                                </Form.Select>
                            </div>
                            <Materials items={session.material.filter(item => item.blockId === block.id)} />
                        </section>)}
                        <Materials items={session.material.filter(item => !item.blockId)} />
                        {!session.blocks.length && !session.material.length && <p className="text-secondary mb-0">No planned materials.</p>}
                    </Accordion.Body>
                </Accordion.Item>)}
            </Accordion>
        </>}
    </StudentPageLayout>;
}

function Materials({items}) {
    return items.map(item => <div key={item.id} className="mb-3">
        <span className="small text-secondary">{item.type}</span>
        <ReadOnlyEditor value={item.label} />
        {item.body && <ReadOnlyEditor value={item.body} />}
    </div>);
}
