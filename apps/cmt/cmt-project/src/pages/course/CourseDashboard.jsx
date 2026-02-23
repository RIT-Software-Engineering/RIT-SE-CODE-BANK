import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { WorkflowRenderer } from '../../components/workflows/WorkflowRenderer'
import { CMTFetch } from '../../utils/api'
import { Edit, X, Check } from 'lucide-react'
import { Button, Form } from 'react-bootstrap'
import { metadataArrayToObject, metadataObjectToState } from '../../utils/workflows'
import { GenericActionRenderer } from '../../components/workflows/ActionRenderers'

export function CourseDashboard() {
    const { id } = useParams()

    const [course, setCourse] = useState(null)
    const [actionsWithCallbacks, setActionsWithCallbacks] = useState([])
    const [actionStates, setActionStates] = useState(null)
    const [workflow, setWorkflow] = useState(null)

    const update = useCallback(() => {
        return CMTFetch('GET', `course/${id}`).then(async response => {
            const data = await response.json()
            setCourse(data.course)
            setActionsWithCallbacks(data.actionsWithCallbacks)
            setActionStates(data.actionStates)
            setWorkflow(data.workflow)
        })
    }, [id])
    useEffect(() => void update(), [id, update])

    if (course === null || actionStates === null) return <p> Loading </p>

    return (
        <>
            <CourseInfo course={course} actionsWithCallbacks={actionsWithCallbacks} refresh={update} />
            <div className="h-10"></div>
            <p className="text-4xl pb-2 border-b">Workflow Info</p>
            <WorkflowRenderer
                workflow={workflow}
                actionsWithCallbacks={actionsWithCallbacks}
                workflowState={actionStates}
                refresh={update}
            />
        </>
    )
}

function CourseInfo({ course, actionsWithCallbacks, refresh }) {

    const [newCourseName, setNewCourseName] = useState(course.name)
    const [newCourseCode, setNewCourseCode] = useState(course.classId)

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
            <h1 style={{ backgroundColor: course.color }} className='p-2'>
                {' '}
                Course Info{' '}
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
                {actionsWithCallbacks.map(actionWithCallback => 
                    <InlineActionRenderer
                        course={course}
                        actionWithCallback={actionWithCallback}
                        refresh={refresh}
                    />
                )}
        </>
    )
}

function InlineForm({ label, value, onReset, onChange, onSubmit }) {
    return (
        <Form onSubmit={onSubmit} onReset={onReset} className='flex items-center gapw'>
            <Form.Label className='text-xl my-2 w-4/5'>{label}:</Form.Label>
            <Form.Control defaultValue={value} onChange={onChange}></Form.Control>
            <div className='flex'>
                <Button className='mx-1' variant='outline-danger' type='reset'>
                    <X />
                </Button>
                <Button className='mx-1' variant='outline-success' type='submit'>
                    <Check />
                </Button>
            </div>
        </Form>
    )
}

function InlineFormHoverable({ label, value, onChange, onSubmit }) {
    const [editing, setEditing] = useState(false)

    return editing ? (
        <InlineForm
            label={label}
            value={value}
            onReset={() => setEditing(false)}
            onChange={onChange}
            onSubmit={async (e) => {
                await onSubmit(e)
                setEditing(false)
            }}
        />
    ) : (
        <div className="flex items-center gap-20">
            <div className=''>
                <p className={`text-xl my-2`}>
                    {' '}
                    {label}: {value}{' '}
                </p>
            </div>
            <div className='hidden group-hover:block'>
                <Button size='sm' title='Edit Course' variant='outline-secondary' onClick={() => setEditing(true)}>
                    <Edit className='size-6' />
                </Button>
            </div>
        </div>
    )
}

function InlineActionRenderer({ actionWithCallback, course, refresh }) {
    
    const metadata = metadataArrayToObject(actionWithCallback.action.metadata)
    const [outputValues, setOutputValues] = useState(metadataObjectToState(metadata))

    function submitAction(e) {
        e.preventDefault()
        CMTFetch('PUT', actionWithCallback.callback, outputValues).then(() => {
            setTimeout(async () => {
                await refresh()
                setIsEditing(false)
            }, 500)
        })
    }

    const [isEditing, setIsEditing] = useState(false)
    return (
        <>
            {isEditing ? (
                <div>
                    <Form className='flex items-center gap-6' onSubmit={submitAction}>
                        <GenericActionRenderer
                            actionWithCallback={actionWithCallback}
                            metadata={metadata}
                            outputValues={outputValues}
                            setOutputValues={setOutputValues}
                        />
                        <Button
                            variant='outline-danger'
                            type='reset'
                            onClick={() => {
                                setIsEditing(false)
                            }}
                        >
                            <X />
                        </Button>
                        <Button variant='outline-success' type='submit'>
                            <Check />
                        </Button>
                    </Form>
                </div>
            ) : (
                metadata.outputs.map(output => (
                    <div className='flex items-center hover:bg-gray-200 group pl-2'>
                        <div className='w-1/5'>
                            <p className='text-xl my-2'>
                                {' '}
                                {output.name} {course[output.key] ?? 'TBD'}{' '}
                            </p>
                        </div>
                        <div className='hidden group-hover:block'>
                            <Button size='sm' title='Edit Course' variant='outline-secondary' onClick={() => setIsEditing(true)}>
                                <Edit size={24} />
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </>
    )
}
