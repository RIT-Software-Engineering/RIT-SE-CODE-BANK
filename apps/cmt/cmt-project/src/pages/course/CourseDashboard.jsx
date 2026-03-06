import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WorkflowRenderer } from '../../components/workflows/WorkflowRenderer'
import { CMTFetch } from '../../utils/api'
import { Edit, X, Check, ArrowLeft } from 'lucide-react'
import { Button, Form} from 'react-bootstrap'
import { OutputRenderer } from '../../components/workflows/OutputRenderers'
import {Session} from './Session';
import { InlineActionRenderer } from '../../components/workflows/ActionRenderers/InlineActionRenderer'
import { InlineFormHoverable } from '../../components/forms/InlineForms'
import { flattenActionsWithContext } from '../../utils/workflows'
import { ArrowLeft, Edit } from 'lucide-react'
import { Accordion, Button, Card, Form, Modal, Table} from 'react-bootstrap'
import { RichTextEditor } from '../../components/RichTextEditor'
import { CheckmarkActionRenderer } from '../../components/workflows/ActionRenderers/GenericActionRenderer'

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
    /** @type [ActionWithContext[], any] */
    const [actionsWithContext, setactionWithContexts] = useState([])
    /** @type [WorkflowsWorkflow, any] */
    const [workflow, setWorkflow] = useState(null)
    const [sessionCount, setSessionCount] = useState(0)
    const [sessions, setSessions] = useState([]);

    const update = useCallback(async () => {
        return CMTFetch('GET', `course/${id}`).then(async response => {
            const data = await response.json()
            setCourse(data.course)
            setactionWithContexts(data.actionWithContexts)
            setWorkflow(data.workflow)
        })
    }, [id])
    useEffect(() => void update(), [id, update])

    /** @type FetchToCallback */
    const fetchToCallback = useCallback(
        (callback, outputValues) => CMTFetch('PUT', callback, outputValues),
        []
    )

    /** @type IsCheckmark */
    const isCheckmark = useCallback(
        code => code === "CHECKBOX" || code.includes("SESSION_"),
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
            <p className="text-4xl pb-2 border-b">Workflow Info</p>
            <div className="flex justify-center">
                <div className="max-w-screen-xl w-full">
                    <WorkflowRenderer
                        workflow={workflow}
                        actionsWithContext={actionsWithContext}
                        previousValues={course}
                        refresh={update}
                        fetchToCallback={fetchToCallback}
                        isCheckmark={isCheckmark}
                    />
                </div>
            </div>

            <div>
                <Session 
                    sessionCount={sessionCount} setSessionCount={setSessionCount}
                    sessions={sessions} setSessions={setSessions}
                    sessionActions={sessionActions}
                    updateWorkflow={update}
                    fetchToCallback={fetchToCallback}
                />
                <div className='flex justify-end pt-4'>
                    <Button onClick={() => {
                        /** Makes a post request to add the session with no material.
                         * ID is the class ID to identify where it belongs in the future
                         */
                       CMTFetch('POST', 'session', {sessionCount, id}).then(async response=>{
                        const data = await response.json();
                        setSessionCount(sessionCount+1);
                        setSessions([...sessions, data.session])
                    })
                    }}>Add session</Button>
                </div>
            </div>
        </>
    )
}

function CourseInfo({ course, actionsWithContext, refresh, fetchToCallback }) {

    const [newCourseName, setNewCourseName] = useState(course.name)
    const [newCourseCode, setNewCourseCode] = useState(course.classId)
    const navigate = useNavigate();

    function updateCourseName(e) {
        e.preventDefault()
        return CMTFetch('PUT', `course/${course.id}`, { courseName: newCourseName }).then(async () => await refresh())
    }
    function updateCourseCode(e) {
        e.preventDefault()
        return CMTFetch('PUT', `course/${course.id}`, { courseCode: newCourseCode }).then(async () => await refresh())
        
    }
    return (
        <>
            <div className='flex justify-between w-full pb-3 items-center'>
                <Button onClick={() => navigate('/courses')}><div className='flex'><ArrowLeft/>Back</div></Button>
            </div>
            <h1 style={{ backgroundColor: course.color }} className='p-2'>
                Course Info
            </h1>
            <div className='flex items-center hover:bg-gray-200 group pl-2'>
                <InlineFormHoverable
                    label={'Course Name'}
                    value={course.name}
                    onSubmit={e => updateCourseName(e)}
                    onChange={e => setNewCourseName(e.target.value)}
                />
            </div>
            <div className='flex items-center hover:bg-gray-200 group pl-2'>
                <InlineFormHoverable
                    label={'Course Code'}
                    value={course.classId}
                    onSubmit={e => updateCourseCode(e)}
                    onChange={e => setNewCourseCode(e.target.value)}
                />
            </div>
                {actionsWithContext.map(awc => 
                    <InlineActionRenderer
                        previousValues={course}
                        actionWithContext={awc}
                        refresh={refresh}
                        fetchToCallback={fetchToCallback}
                    />   
                )}
        </>
    )
}

