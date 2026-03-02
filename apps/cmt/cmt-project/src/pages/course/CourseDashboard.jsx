import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WorkflowRenderer } from '../../components/workflows/WorkflowRenderer'
import { CMTFetch } from '../../utils/api'
import { ArrowLeft } from 'lucide-react'
import { Button } from 'react-bootstrap'
import { InlineActionRenderer } from '../../components/workflows/ActionRenderers/InlineActionRenderer'
import { InlineFormHoverable } from '../../components/forms/InlineForms'
import { flattenActionsWithContext } from '../../utils/workflows'

export function CourseDashboard() {
    const { id } = useParams()

    const [course, setCourse] = useState(null)
    const [actionsWithContext, setactionWithContexts] = useState([])
    const [workflow, setWorkflow] = useState(null)

    const update = useCallback(async () => {
        return CMTFetch('GET', `course/${id}`).then(async response => {
            const data = await response.json()
            setCourse(data.course)
            setactionWithContexts(data.actionWithContexts)
            setWorkflow(data.workflow)
        })
    }, [id])
    useEffect(() => void update(), [id, update])

    if (course === null || workflow === null) return <p> Loading </p>

    return (
        <>
            <CourseInfo course={course} actionsWithContext={actionsWithContext} refresh={update} />
            <div className="h-10"></div>
            <p className="text-4xl pb-2 border-b">Workflow Info</p>
            <div className="flex justify-center">

                <div className="max-w-screen-xl w-full">
                    <WorkflowRenderer
                        workflow={workflow}
                        actionsWithContext={actionsWithContext}
                        data={course}
                        refresh={update}
                    />
                </div>
            </div>
        </>
    )
}

function CourseInfo({ course, actionsWithContext, refresh }) {

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

    // Only keep actions if they correspond to certain codes
    const courseInfoKeys = ["COURSE_SECTION", "NUMBER_STUDENTS", "COURSE_SEMESTER"]
    const courseInfoActions = flattenActionsWithContext(actionsWithContext).filter(
        awc => courseInfoKeys.includes(awc.action.metadata.code)
    )

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
                {courseInfoActions.map(actionWithContext => 
                    <InlineActionRenderer
                        data={course}
                        actionWithContext={actionWithContext}
                        refresh={refresh}
                    />
                )}
        </>
    )
}
