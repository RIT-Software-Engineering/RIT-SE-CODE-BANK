import { useState } from "react";
import { CMTJsonFetch } from "../utils/api";
import { formatTime } from "./PendingNotification";
import { Alert, Button, Form, Table } from "react-bootstrap";
import { extractUserFacingError } from "@se-code-bank/cmt-shared-utilities";

function PreviewTable({title, rows}){
    return (
        <>
            <h4 className="text-base mt-3 mb-2">{title}</h4>
            {rows.length === 0 ? (
                <p className="text-sm text-gray-500">No notifications to be sent.</p>
            ) : (
                <Table size="sm" bordered className="mb-3 bg-white">
                    <thead>
                        <tr>
                            <th>Message</th>
                            <th>Sends at</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td>{row.context?.subject ?? row.event}</td>
                                <td>{formatTime(row.sendAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </>
    );
}

export function NotificationPreview({courseId}){
    const [day, setDay] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function preview(){
        setLoading(true);
        setError(null);
        try{
            const notifs = await CMTJsonFetch('POST', '/notifications/preview', {courseId, until: day});
            setResult({dueNow: notifs.dueNow ?? [], upcoming: notifs.upcoming ?? []});
        } catch(error){
            setResult({dueNow: [], upcoming: []});
            setError(extractUserFacingError(error));
        } finally{
            setLoading(false);
        }
    }

    return (
        <section className="mb-4" aria-label="Notification preview">
            <h3 className="text-lg mb-2">Preview Notifications</h3>
            <p className="text-gray-500">
                See a list of notifications that would be sent up to the end of a day. NOTE: nothing is actually sent
            </p>

            <Form className="d-flex gap-2 align-items-center" onSubmit={e => { e.preventDefault(); preview(); }}>
                <Form.Control type="date" value={day} style={{maxWidth: 200}}
                    onChange={e => setDay(e.target.value)} aria-label="Preview up to this day" />
                <Button type="submit" disabled={!day || loading}>
                    {loading ? 'Loading...' : 'Preview'}
                </Button>
            </Form>

            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

            {result && (
                <>
                    <PreviewTable title="Would send right away" rows={result.dueNow} />
                    <PreviewTable title="Would send later, by the end of that day" rows={result.upcoming} />
                </>
            )}
        </section>
    )
}