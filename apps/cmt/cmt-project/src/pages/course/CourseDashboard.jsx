import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { WorkflowRenderer } from "../../components/workflows/WorkflowRenderer";
import { CMTFetch } from "../../utils/api";
import {Edit,} from "lucide-react";
import { Button } from "react-bootstrap";

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
    return (<>
        <h1 style={{ backgroundColor: course.color }} > Course Info </h1>
        <div className="flex inline gap">
            <p className="text-lg"> Course Name: {course.name} </p>
            <Button size="sm" title="Edit Course">
                <Edit size={24} />
            </Button>
        </div>
        <div className="flex inline gap">
            <p> Class Id: {course.classId} </p>
             <Button size="sm" title="Edit Course">
                <Edit size={24} />
            </Button>
        </div>
        <div className="flex inline gap">
            <p> Session number: {course.section ?? "TBD"} </p>
             <Button size="sm" title="Edit Course">
                <Edit size={24} />
            </Button>
        </div>
    </>)
}