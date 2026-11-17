import { extractUserFacingError } from "@se-code-bank/cmt-shared-utilities";
import { CMTJsonFetch } from "../utils/api";
import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Table } from "react-bootstrap";

export const NOTIFICATIONS_CHANGED = 'notifications-changed';
export function notifyListChanged(){
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

export function formatTime(sendAt){
    return new Date(sendAt).toLocaleString([], {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    });
}

export function PendingNotifications({courseId}){
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(() => {
        return CMTJsonFetch('GET', `/notifications/course/${courseId}/pending`)
            .then(json => {
                setRows(json.pending ?? []);
                setLoadError(null);
            })
            .catch(error => setLoadError(extractUserFacingError(error)))
            .finally(() => setLoading(false));
    }, [courseId]);

    useEffect(() =>{
        load();
        const timer = setInterval(load, 30000);
        window.addEventListener(NOTIFICATIONS_CHANGED, load);
        return () => {
            clearInterval(timer);
            window.removeEventListener(NOTIFICATIONS_CHANGED, load);
        }
    }, [load]);

    async function act(row, action){
        setBusyId(row.id);
        setActionError(null);
        try{
            const result = await CMTJsonFetch('POST', `/notifications/${row.id}/${action}`);
            if (!result.success){
                setActionError(result.error ?? 'Notification may have already been sent or cancelled.');
            }else if(action === 'retry' && !result.sent){
                setActionError('Notification failed to send again. Try again later.');
            }
        } catch(error){
            setActionError(extractUserFacingError(error));
        } finally{
            setBusyId(null);
            load();
        }
    }

    if (loading) return null;
    if (rows.length === 0 && !loadError && !actionError) return null;

    const now = Date.now();
    return (
        <section className="mb-4" aria-label="Waiting notifications">
            <h3 className="text-lg mb-2">Waiting notifications</h3>
            {loadError && <Alert variant="danger">{loadError}</Alert>}
            {actionError &&
                <Alert variant="danger" dismissible onClose={() => setActionError(null)}>{actionError}</Alert>
            }
            <Table size="sm" bordered className="bg-white">
                <thead>
                    <tr><th>Message</th><th>Sends at</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                    {rows.map(row => {
                        const failed = row.status === 'FAILED';
                        const overdue = !failed && new Date(row.sendAt).getTime() < now;
                        return (
                            <tr key={row.id}>
                                <td>{row.context?.subject ?? row.event}</td>
                                <td>
                                    {formatTime(row.sendAt)}
                                    {overdue && <div className="text-sm text-gray-500">overdue, sending shortly</div>}
                                </td>
                                <td>
                                    <Badge bg={failed ? 'danger' : 'secondary'}>
                                        {failed ? 'Failed' : 'Scheduled'}
                                    </Badge>
                                </td>
                                <td className="text-end">
                                    {failed && (
                                        <Button size="sm" className="me-2" title="Try sending this again now"
                                            disabled={busyId === row.id}
                                            onClick={() => act(row, 'retry')}>Retry</Button>
                                    )}
                                    <Button size="sm" variant="outline-secondary"
                                        disabled={busyId === row.id}
                                        onClick={() => act(row, 'cancel')}>
                                        {failed ? 'Dismiss' : 'Cancel'}
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </section>
    )

}