import { Badge, Form, ListGroup } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import StudentPageLayout, { semesterLabel } from "../../components/student/StudentPageLayout.jsx";
import useStudentData from "../../hooks/useStudentData.js";

export default function StudentTeamsPage() {
    const courses = useStudentData("me/courses", "enrollments");
    const teams = useStudentData("me/teams", "memberships");
    const [search, setSearch] = useSearchParams();
    const enrollments = courses.data?.enrollments || [];
    const courseMap = new Map(enrollments.map(({course}) => [String(course.id), course]));
    const requestedCourse = search.get("courseId");
    const selectedCourse = courseMap.has(requestedCourse) ? requestedCourse : "";
    const memberships = (teams.data?.memberships || []).filter(item => {
        const courseId = String(item.enrollment.courseId);
        return courseMap.has(courseId) && item.enrollment.courseId === item.tbteam.teamSet.courseId &&
            (!selectedCourse || courseId === selectedCourse);
    });
    const grouped = new Map();
    for (const item of memberships) {
        const courseId = String(item.enrollment.courseId);
        if (!grouped.has(courseId)) grouped.set(courseId, []);
        grouped.get(courseId).push(item);
    }
    const refresh = () => { void courses.refresh(); void teams.refresh(); };

    return <StudentPageLayout title="My Teams" loading={courses.loading || teams.loading}
        error={courses.error || teams.error} refresh={refresh}>
        <Form.Group className="mb-4" style={{maxWidth: 480}} controlId="student-team-course">
            <Form.Label>Course</Form.Label>
            <Form.Select value={selectedCourse} onChange={event => setSearch(event.target.value ? {courseId: event.target.value} : {})}>
                <option value="">All courses</option>
                {enrollments.map(({course}) => <option key={course.id} value={course.id}>
                    {course.classId} - Section {course.section || "Not specified"} - {semesterLabel(course)}
                </option>)}
            </Form.Select>
        </Form.Group>
        {!memberships.length && <p role="status" className="text-secondary py-3">No published team assignments{selectedCourse ? " for this course" : ""}.</p>}
        {[...grouped].map(([courseId, items]) => {
            const course = courseMap.get(courseId);
            return <section key={courseId} className="mb-4" aria-labelledby={`student-team-course-${courseId}`}>
                <h2 id={`student-team-course-${courseId}`} className="h5 mb-1 text-break">{course.classId}: {course.name}</h2>
                <p className="text-secondary small text-break">Section {course.section || "Not specified"} | {semesterLabel(course)}</p>
                <ListGroup variant="flush">
                    {items.map(item => <ListGroup.Item key={item.id} className="px-0 py-3 bg-transparent">
                        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                            <div style={{minWidth: 0}}>
                                <h3 className="h6 mb-1 text-break">{item.tbteam.name}</h3>
                                <span className="text-secondary text-break">{item.tbteam.teamSet.name}</span>
                            </div>
                            <div className="text-break">Role: <Badge bg="secondary" className="text-wrap text-break">{item.role || "Not assigned"}</Badge></div>
                        </div>
                    </ListGroup.Item>)}
                </ListGroup>
            </section>;
        })}
    </StudentPageLayout>;
}
