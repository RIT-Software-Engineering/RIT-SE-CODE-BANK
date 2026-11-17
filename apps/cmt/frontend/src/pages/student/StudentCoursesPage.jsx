import { Badge, ListGroup } from "react-bootstrap";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import StudentPageLayout, { semesterLabel } from "../../components/student/StudentPageLayout.jsx";
import useStudentData from "../../hooks/useStudentData.js";

export default function StudentCoursesPage() {
    const {data, loading, error, refresh} = useStudentData("me/courses", "enrollments");
    const enrollments = data?.enrollments || [];
    return <StudentPageLayout title="My Courses" loading={loading} error={error} refresh={refresh}
        empty={!enrollments.length} emptyMessage="No active course enrollments.">
        <ListGroup variant="flush">
            {enrollments.map(({id, course}) => <ListGroup.Item key={id} className="px-0 py-3 bg-transparent">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                    <div style={{minWidth: 0}}>
                        <h2 className="h5 mb-1 text-break">{course.classId}</h2>
                        <p className="mb-2 text-break">{course.name}</p>
                        <Badge bg="secondary" className="mb-2">Student</Badge>
                        <div className="d-flex flex-wrap gap-3 text-secondary small">
                            <span className="text-break">Section: {course.section || "Not specified"}</span>
                            <span className="text-break">Semester: {semesterLabel(course)}</span>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <Link to={`/student/teams?courseId=${course.id}`} className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                            aria-label={`View teams for ${course.classId}, section ${course.section || "not specified"}`}>
                            <Users size={16} aria-hidden="true" />Teams
                        </Link>
                    </div>
                </div>
            </ListGroup.Item>)}
        </ListGroup>
    </StudentPageLayout>;
}
