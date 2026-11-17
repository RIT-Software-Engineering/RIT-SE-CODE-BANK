import { Badge, ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import StudentPageLayout, { semesterLabel } from "../../components/student/StudentPageLayout.jsx";
import useStudentData from "../../hooks/useStudentData.js";

export default function TeachingSectionsPage() {
    const {data, loading, error, refresh} = useStudentData("sections", "sections", "teaching");
    const sections = data?.sections || [];
    return <StudentPageLayout title="Teaching Sections" loading={loading} error={error} refresh={refresh}
        empty={!sections.length} emptyMessage="No active teaching assignments.">
        <ListGroup variant="flush">
            {sections.map(course => <ListGroup.Item key={course.id} className="px-0 py-3 bg-transparent">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <h2 className="h5 mb-1">{course.classId} — {course.name}</h2>
                        <p className="text-secondary small mb-2">Section {course.section || "TBD"} | {semesterLabel(course)}</p>
                        <Badge bg="secondary">{course.role}</Badge>
                    </div>
                    <Link className="btn btn-outline-primary" to={course.capabilities.editMaterials ? `/courses/${course.id}` : `/teaching/${course.id}`}>
                        Open section
                    </Link>
                </div>
            </ListGroup.Item>)}
        </ListGroup>
    </StudentPageLayout>;
}
