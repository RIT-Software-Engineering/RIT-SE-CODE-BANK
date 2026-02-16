import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { WorkflowRenderer } from "../../components/workflows/WorkflowRenderer";
import { CMTFetch } from "../../utils/api";

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

    if (course === null || workflowState === null) return <p> Loading lol </p>

    return (<>
        <CourseInfo course={course} />
        <WorkflowRenderer actionsWithCallbacks={actionsWithCallbacks} workflowState={workflowState} workflow={workflow} refresh={update} />
    </>)
}

function CourseInfo({ course }) {
    return (<>
        <h1 style={{ backgroundColor: course.color }}> Course Info </h1>
        <p> Course Name: {course.name} </p>
        <p> Class Id: {course.classId} </p>
        <p> Session number: {course.section ?? "TBD"} </p>
    </>)
}