// TODO this file is basically a copy of CourseDashboard.jsx
// In the future it would be nice to get rid of this or remove a lot of the functionality so it's not total copy + paste

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CMTFormFetch, CMTJsonFetch } from '../../utils/api.js'
import { Session } from '../course/Session.jsx'
import { flattenActionsWithContexts } from '../../utils/workflows.js'
import { ArrowLeft } from 'lucide-react'
import { Button} from 'react-bootstrap'
import { ResourceManager } from '../../components/resources/ResourceManager.jsx'
import { CMTWorkflow } from '../../components/workflows/workflow.jsx'
import { CMTDangerAlert, createErrorHandler } from '../../utils/error.jsx'

/**
 * @import { FetchToCallback, WorkflowsWorkflow, ActionWithContexts } from "@se-code-bank/workflows-ecosystem"
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
export function TemplateDashboard() {
    const { id } = useParams()
    const navigate = useNavigate();

    const [course, setCourse] = useState(null)
    /** @type [ActionWithContexts[], function] */
    const [actionsWithContexts, setActionsWithContexts] = useState([])
    /** @type [WorkflowsWorkflow, function] */
    const [workflow, setWorkflow] = useState(null)
    const [sessionCount, setSessionCount] = useState(0)
    const [sessions, setSessions] = useState([]);
    const [error, setError] = useState(null)

    const update = useCallback(async () => {
        return CMTJsonFetch('GET', `course/${id}`).then(async json => {
            // Manually override it in the display since we never actually set a color.
            json.course.color = '#0484c9';
            setCourse(json.course)
            setSessions(json.course.sessions)
            setActionsWithContexts(json.actionsWithContexts)
            setWorkflow(json.workflow)
        }).catch(createErrorHandler("Failed to fetch course details.", setError))
    }, [id])
    useEffect(() => void update(), [id, update])

    /** @type FetchToCallback */
    const fetchToCallback = useCallback(
        (callback, outputValues) => {
            if (outputValues.syllabusName)
                return CMTFormFetch('POST', callback, outputValues.syllabusName)
            else
                return CMTJsonFetch('PUT', callback, outputValues)
        },
        []
    )

    const sessionActions = useMemo(
        () => flattenActionsWithContexts(actionsWithContexts).filter(
            awc => awc?.processedAction?.parsedMetadata?.code?.includes("SESSION_")
        ),
        [actionsWithContexts]
    )

    return (
        <>
            <div className='flex items-center mb-4'>
                <Button onClick={() => navigate('/templates')}><div className='flex items-center'><ArrowLeft/>Back</div></Button>
            </div>
            {error
            ? <CMTDangerAlert error={error} />
            : course === null
            ? <p> Loading </p>
            : <>
            <CourseInfo course={course}/>
            <div className="h-10"></div>
            <div className="flex justify-center">
                <div className="max-w-screen-xl w-full">
                    {workflow && <CMTWorkflow 
                        workflow={workflow}
                        actionsWithContexts={actionsWithContexts}
                        course={course}
                        refresh={update}
                        fetchToCallback={fetchToCallback}
                    /> }
                </div>
            </div>
            <div className="h-10"></div>
            <ResourceManager courseId={course.id} />
             <div className='mb-5 border-b mt-10'>
                <span className="text-3xl" id="sessions">Sessions</span>
                <p>Sessions are a single ocurrence of a class lecture. Each session appears as a row in the course site.</p>
            </div>
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
                    <div className='flex justify-end pt-4 mb-4'>
                        <Button onClick={() => {
                            /** Makes a post request to add the session with no material.
                             * ID is the class ID to identify where it belongs in the future
                             */
                        CMTJsonFetch('POST', 'session', {sessionCount, id}).then(async json =>{
                            setSessionCount(sessionCount+1);
                            setSessions(prevSessions => [...prevSessions, json.session])
                        })
                        }}>Add extra session</Button>
                    </div>
                </div>
            </div>
            </>
            }
        </>
    )
}

function CourseInfo({ course}) {
    return (
        <>
            <div className="flex items-end gap-14 mt-2 w-100 p-6 pb-4 rounded-t-lg text-xl" style={{ borderBottomWidth: "6px", borderBottomColor: course.color, backgroundColor: `color-mix(in oklab, #fff 85%, ${course.color})` }}>
                <div>
                    <p className="text-4xl mb-0">{course.classId}</p>
                    <div className="flex gap-10 text-gray-600">
                        <p className="mb-0">{course.name}</p>
                    </div>
                </div>
                <div className="flex gap-10">
                    <p className="mb-0">Semester: {course.season ?? "TBD"}</p>
                    <p className="mb-0">Start Date: {course.startDate ?? "TBD"} </p>
                </div>
            </div>
        </>
    )
}

