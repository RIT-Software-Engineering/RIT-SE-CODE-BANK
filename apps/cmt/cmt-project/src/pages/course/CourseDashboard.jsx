import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WorkflowRenderer } from '../../components/workflows/WorkflowRenderer'
import { CMTJsonFetch } from '../../utils/api'
import { Session } from './Session';
import { InlineActionRenderer } from '../../components/workflows/ActionRenderers/InlineActionRenderer'
import { InlineFormHoverable } from '../../components/forms/InlineForms'
import { UseCMTOnNavigateFactory, flattenActionsWithContext } from '../../utils/workflows'
import { ArrowLeft } from 'lucide-react'
import { Button} from 'react-bootstrap'
import { ResourceManager } from '../../components/resources/ResourceManager'

/**
 * @import { IsCheckmark, FetchToCallback, WorkflowsWorkflow, ActionWithContext } from "../../components/workflows/typedefs"
 */

/**
 * This component heavily utilizes the Workflows Components.
 * 
 * To act as an example, JSDoc annotations are used with Workflows-related variables to add context to their usage.
 * If you hover over the Type name in the comment, you can see a description of the type's meaning.
 * 
 * If you wish to also use Workflows Components, these JSDoc annotations are **NOT NECCESARY**, because a function's types
 * can often be implied. If you pass in the wrong type to a Workflows Component, it will give you an error in the component's attributes,
 * assuming your environment is set up correctly.
 */
export function CourseDashboard() {
    const { id } = useParams()

    const [course, setCourse] = useState(null)
    /** @type [ActionWithContext[], function] */
    const [actionsWithContext, setActionsWithContext] = useState([])
    /** @type [WorkflowsWorkflow, function] */
    const [workflow, setWorkflow] = useState(null)
    const [sessionCount, setSessionCount] = useState(0)
    const [sessions, setSessions] = useState([]);

    const update = useCallback(async () => {
        return CMTJsonFetch('GET', `course/${id}`).then(async response => {
            const data = await response.json()
            console.log(data)
            setCourse(data.course)
            setActionsWithContext(data.actionsWithContext)
            setWorkflow(data.workflow)
        })
    }, [id])
    useEffect(() => void update(), [id, update])

    /** @type FetchToCallback */
    const fetchToCallback = useCallback(
        (callback, outputValues) => CMTJsonFetch('PUT', callback, outputValues),
        []
    )

    /** @type IsCheckmark */
    const isCheckmark = useCallback(
        code => code.includes("CHECKMARK") || code.includes("SESSION_"),
        []
    )

    if (course === null || workflow === null) return <p> Loading </p>

    const sessionActions = flattenActionsWithContext(actionsWithContext).filter(
        awc => awc?.action?.metadata?.code?.includes("SESSION_")
    )

    const courseInfoKeys = ["COURSE_SECTION", "NUMBER_STUDENTS", "COURSE_SEMESTER"]
    const courseInfoActions = flattenActionsWithContext(actionsWithContext).filter(
        awc => courseInfoKeys.includes(awc.action.metadata.code)
    )

    return (
        <>
            
            <CourseInfo course={course} actionsWithContext={courseInfoActions} refresh={update} fetchToCallback={fetchToCallback}/>
            <div className="h-10"></div>
            <ResourceManager courseId={course.id} />
            <div className="h-10"></div>
            <p className="text-3xl pb-2 border-b">Course Creation Workflow</p>
            <div className="flex justify-center">
                <div className="max-w-screen-xl w-full">
                    <WorkflowRenderer
                        workflow={workflow}
                        actionsWithContext={actionsWithContext}
                        previousValues={course}
                        refresh={update}
                        fetchToCallback={fetchToCallback}
                        isCheckmark={isCheckmark}
                        onNavigateFactory={UseCMTOnNavigateFactory}
                    />
                </div>
            </div>
            <p className="text-3xl pb-2 border-b mt-10">Sessions</p>
            <div className="flex justify-center">
                <div className="max-w-screen-xl w-full">
                    <Session
                        sessionCount={sessionCount} setSessionCount={setSessionCount}
                        sessions={sessions} setSessions={setSessions}
                        sessionActions={sessionActions}
                        updateWorkflow={update}
                        fetchToCallback={fetchToCallback}
                        courseId={course.id}
                    />
                    <div className='flex justify-end pt-4'>
                        <Button onClick={() => {
                            /** Makes a post request to add the session with no material.
                             * ID is the class ID to identify where it belongs in the future
                             */
                        CMTJsonFetch('POST', 'session', {sessionCount, id}).then(async response=>{
                            const data = await response.json();
                            setSessionCount(sessionCount+1);
                            setSessions([...sessions, data.session])
                        })
                        }}>Add session</Button>
                    </div>
                </div>
            </div>
        </>
    )
}

function CourseInfo({ course, actionsWithContext, refresh, fetchToCallback }) {
    const navigate = useNavigate();

    const [newCourseName, setNewCourseName] = useState(course.name)
    const [newCourseCode, setNewCourseCode] = useState(course.classId)

    function updateCourseName(e) {
        e.preventDefault()
        return CMTJsonFetch('PUT', `course/${course.id}`, { courseName: newCourseName }).then(async () => await refresh())
    }
    function updateCourseCode(e) {
        e.preventDefault()
        return CMTJsonFetch('PUT', `course/${course.id}`, { courseCode: newCourseCode }).then(async () => await refresh())
    }

    return (
        <>
            <div className='flex items-center mb-4'>
                <Button onClick={() => navigate('/courses')}><div className='flex items-center'><ArrowLeft/>Back</div></Button>
            </div>
            <div className="flex items-end gap-14 mt-2 w-100 p-6 pb-4 rounded-t-lg text-xl" style={{ borderBottomWidth: "6px", borderBottomColor: course.color, backgroundColor: `color-mix(in oklab, #fff 85%, ${course.color})` }}>
                <div>
                    <p className="text-4xl mb-0">{course.classId}</p>
                    <div className="flex gap-10 text-gray-600">
                        <p className="mb-0">{course.name}</p>
                    </div>
                </div>
                <div className="flex gap-10">
                    <p className="mb-0">Section: {course.section ?? "TBD"} </p>
                    <p className="mb-0">Semester: {course.season ?? "TBD"} {course.year}</p>
                    <p className="mb-0">Number of Students: {course.students ?? "TBD"}</p>
                </div>
            </div>
        </>
    )
}

