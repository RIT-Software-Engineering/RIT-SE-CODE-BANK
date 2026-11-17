import { Alert, Button, Container, Spinner } from "react-bootstrap";
import { RefreshCw } from "lucide-react";
import logo from "../../images/se_logo_new.png";

export function semesterLabel(course) {
    return [course.season, course.year].filter(value => value !== null && value !== undefined && value !== "").join(" ") || "Not specified";
}

export default function StudentPageLayout({title, loading, error, refresh, empty, emptyMessage, children}) {
    return <Container className="py-4">
        <div className="d-flex align-items-center justify-content-between gap-3 border-bottom pb-3 mb-4">
            <div className="d-flex align-items-center gap-3" style={{minWidth: 0}}>
                <img src={logo} width="40" height="40" alt="Software Engineering" className="flex-shrink-0" />
                <h1 className="h3 mb-0 text-break">{title}</h1>
            </div>
            <Button variant="outline-secondary" onClick={refresh} disabled={loading}
                aria-label={`Refresh ${title.toLowerCase()}`} title={`Refresh ${title.toLowerCase()}`}
                className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
                style={{width: 40, height: 40, padding: 0}}>
                <RefreshCw size={18} aria-hidden="true" />
            </Button>
        </div>
        {loading ? <div role="status" className="d-flex align-items-center gap-2 py-3">
            <Spinner animation="border" size="sm" aria-hidden="true" />Loading...
        </div> : error ? <Alert variant="danger">
            <p>Unable to load {title.toLowerCase()}.</p>
            <Button variant="outline-secondary" size="sm" onClick={refresh}><RefreshCw size={16} className="me-2" />Retry</Button>
        </Alert> : empty ? <Alert variant="secondary">{emptyMessage}</Alert> : children}
    </Container>;
}
