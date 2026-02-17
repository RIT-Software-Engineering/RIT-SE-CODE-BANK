import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { WorkflowRenderer } from "../../components/workflows/WorkflowRenderer";
import { CMTFetch } from "../../utils/api";
import {Edit,} from "lucide-react";
import { Button, Col, Row } from "react-bootstrap";

export function CourseDashboard() {
    const { id } = useParams()

    const [course, setCourse] = useState(null)
    const [actionsWithCallbacks, setActionsWithCallbacks] = useState([])
    const [workflowState, setWorkflowState] = useState(null)
    const [workflow, setWorkflow] = useState(null)

    function update() {
        CMTFetch("GET", `course/${id}`).then(async response => {
            const data = await response.json()
            setCourse(data.course)
            setActionsWithCallbacks(data.actionsWithCallbacks)
            setWorkflowState(data.actionStates)
            setWorkflow(data.workflow)
        })
    }
    useEffect(update, [id])

    if (course === null || workflowState === null) return <p> Loading </p>

    return (<>
        <CourseInfo course={course} />
        <WorkflowRenderer actionsWithCallbacks={actionsWithCallbacks} workflowState={workflowState} workflow={workflow} refresh={update} />
    </>)
}

function CourseInfo({ course }) {
    var isEditHidden = true;
    return (<>
        <h1 style={{ backgroundColor: course.color }} > Course Info </h1>
        <Row className="flex items-center hover:bg-gray-200">
            <Col>
                <p className="text-lg"> Course Name: {course.name} </p>
            </Col>
            <Col>
                <Button size="sm" title="Edit Course" variant="outline-secondary">
                    <Edit size={24} />
                </Button>
            </Col>
        </Row>
        <Row className="flex inline-block hover:bg-gray-200">
            <Col>
                <p className="text-lg"> Class Id: {course.classId} </p>
            </Col>
            <Col>
                <Button size="sm" title="Edit Course" variant="outline-secondary">
                    <Edit size={24} />
                </Button>
            </Col>
        </Row>
        <Row className="flex inline hover:bg-gray-200" onMouseEnter={() => {isEditHidden = false;}} onMouseLeave={() => {isEditHidden = true;}}>
            <Col>
                <p className="text-lg"> Session number: {course.section ?? "TBD"} </p>
            </Col>
            <Col>
                <Button size="sm" title="Edit Course" variant="outline-secondary" className={`${isEditHidden ? 'invisible' : 'visible'}`}>
                    <Edit size={24} />
                </Button>
            </Col>
        </Row>
    </>)
}