import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { ResourceManager } from '../../components/resources/ResourceManager.jsx'
import { CMTWorkflow } from '../../components/workflows/workflow.jsx'
import { CMTJsonFetch } from '../../utils/api.js'
import { flattenActionsWithContexts } from '../../utils/workflows.js'
import { Session } from './Session.jsx'

/**
 * @import { FetchToCallback } from "@se-code-bank/workflows-ecosystem"
 */

export function CourseDashboard() {
    const { id } = useParams()

    const [course, setCourse] = useState(null)
    const [actionsWithContexts, setActionsWithContexts] = useState([])
    const [workflow, setWorkflow] = useState(null)
    const [sessionCount, setSessionCount] = useState(0)
    const [sessions, setSessions] = useState([]);

    const update = useCallback(async () => {
        return CMTJsonFetch('GET', `course/${id}`).then(async response => {
            const data = await response.json()
            setCourse(data.course)
            setActionsWithContexts(data.actionsWithContexts ?? [])
            setWorkflow(data.workflow)
        })
    }, [id])
    useEffect(() => void update(), [id, update])

    /** @type FetchToCallback - This annotation is purely cosmetic and not needed! */
    const fetchToCallback = useCallback(
        (callback, outputValues) => CMTJsonFetch('PUT', callback, outputValues),
        []
    )

    if (course === null) return <p> Loading </p>

    const sessionActions = flattenActionsWithContexts(actionsWithContexts).filter(
        awc => awc?.action?.metadata?.code?.includes("SESSION_")
    )

    return (
        <>
            
            <CourseInfo course={course} />
            <div className="h-10"></div>
            <ResourceManager courseId={course.id} />
            <div className="h-10"></div>
            <p className="text-3xl pb-2 border-b">Course Creation Workflow</p>
            <div className="flex justify-center">
                <div className="max-w-screen-xl w-full">
                    <CMTWorkflow refresh={update} fetchToCallback={fetchToCallback} actionsWithContexts={actionsWithContexts} course={course} workflow={workflow}/>
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

function CourseInfo({ course }) {
    const navigate = useNavigate();

    return (
        <>
            <div className='flex items-center mb-4'>
                <Button onClick={() => navigate('/courses')}><div className='flex items-center'><ArrowLeft/>Back</div></Button>
            </div>
            <div className="flex items-end gap-14 mt-2 w-max p-6 pb-4 rounded-t-lg text-xl" style={{ borderBottomWidth: "6px", borderBottomColor: course.color, backgroundColor: `color-mix(in oklab, #fff 85%, ${course.color})` }}>
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

