import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WorkflowRenderer } from '../../components/workflows/WorkflowRenderer'
import { CMTFetch } from '../../utils/api'
import { Edit, X, Check, ArrowLeft } from 'lucide-react'
import { Accordion, Button, Card, Form, Modal, Table} from 'react-bootstrap'
import { OutputRenderer } from '../../components/workflows/OutputRenderers'
import {RichTextEditor} from '../../components/RichTextEditor'

export function CourseDashboard() {
    const { id } = useParams()

    const [course, setCourse] = useState(null)
    const [actionsWithCallbacks, setActionsWithCallbacks] = useState([])
    const [workflowState, setWorkflowState] = useState(null)
    const [workflow, setWorkflow] = useState(null)
    const [sessionCount, setSessionCount] = useState(0)
    const [sessions, setSessions] = useState([]);

    const update = useCallback(() => {
        return CMTFetch('GET', `course/${id}`).then(async response => {
            const data = await response.json()
            setCourse(data.course)
            setActionsWithCallbacks(data.actionsWithCallbacks)
            setWorkflowState(data.actionStates)
            setWorkflow(data.workflow)
        })
    }, [id])
    useEffect(() => void update(), [id, update])

    if (course === null || workflowState === null) return <p> Loading </p>

    return (
        <>
            <CourseInfo course={course} actionsWithCallbacks={actionsWithCallbacks} refresh={update} />
            <div className="h-10"></div>
            <p className="text-4xl">Workflow Info</p>
            <p className="text-2xl">Next Action:</p>

            <WorkflowRenderer
                actionsWithCallbacks={actionsWithCallbacks}
                workflowState={workflowState}
                workflow={workflow}
                refresh={update}
            />

            <div>
                <Session sessionCount={sessionCount} setSessionCount={setSessionCount} sessions={sessions} setSessions={setSessions}/>
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

function CourseInfo({ course, actionsWithCallbacks, refresh }) {

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
                <Button onClick={() => navigate('/courses')}><div className='flex'><ArrowLeft/>{' '}Back</div></Button>
            </div>
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
                {actionsWithCallbacks.map(actionWithCallback => {
                    // Flatten array of objects to simplify later usage
                    let metadata = {}
                    Object.keys(actionWithCallback.action.metadata).forEach(key => {
                        metadata[key] = JSON.parse(actionWithCallback.action.metadata[key])
                    })

                    return (
                        <InlineActionRenderer
                            course={course}
                            actionWithCallback={actionWithCallback}
                            metadata={metadata}
                            refresh={refresh}
                        />
                    )
                })}
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

function InlineActionRenderer({ actionWithCallback, course, metadata, refresh }) {
    const [outputValues, setOutputValues] = useState(Object.fromEntries(metadata.outputs.map(output => [output.key, output.initialValue]))) // Initialize with array of the Workflows specified initial (or default) values

    const [submitButtonName, setSubmitButtonName] = useState('Submit')
    const [submitButtonVariant, setSubmitButtonVariant] = useState('primary')

    function submitAction(e) {
        e.preventDefault()
        CMTFetch('PUT', actionWithCallback.callback, outputValues).then(() => {
            setSubmitButtonName('Submitted!')
            setSubmitButtonVariant('success')
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
                        {metadata.outputs.map((output, i) => (
                            <OutputRenderer
                                output={output}
                                value={outputValues[i]}
                                setValue={value => setOutputValues(prevValues => ({ ...prevValues, [output.key]: value }))}
                            />
                        ))}
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
                                {actionWithCallback.action.name} {course[output.key] ?? 'TBD'}{' '}
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

/**
 * A session component, maintains sessionData, whether the session modal is open, and the current session selected.
 * The session component is an accordion that dynamically adds more items the higher the count. 
 * Displays a modal (when opened) and a table of uploaded resources. 
 *
 * @param {{ sessionCount: number; setSessionCount: any; sessions:Object; setSessions:any; }} param0
 * sessionCount - the number of sessions a user has created
 * courseId - the identifier for which sessionData to obtain
 * @returns {*} the session accordion as HTML
 */
function Session({sessionCount, setSessionCount, sessions, setSessions}) {
    /**
     * sessionData is an array of objects that holds data regarding session material. Contains:
     * sessionNum - the session the material belongs to
     * type - the column where the material should go
     * label - the title of the material
     * body - the content of the material
     */
    const [sessionData, setSessionData] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [sessionNum, setSessionNum] = useState(0);
    const { id } = useParams();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [curSessionId, setCurSessionId] = useState(0);
    const [deleteOpen, isDeleteOpen] = useState(false);

    /**
     * Initial GET request upon loading the page
     * Sets the correct amount of sessions and the actual sessions themselves with useful data
     * Also gets material if there is any and puts it in each session
     */
    const update = useCallback(() => {
        return CMTFetch('GET', `session/${id}`).then(async response => {
            const data = await response.json()
            setSessionCount(data.sessions.length)
            setSessions(data.sessions);
            const materialsArray = data.sessionMaterials.filter(m => m.material).map(m => m.material);
            setSessionData(materialsArray.flat());
        })
    }, [id, setSessions, setSessionCount])
    useEffect(() => void update(), [id, update])

    function DeleteModal(){
        return (
            <>
            <Modal show={deleteOpen} onHide={()=>isDeleteOpen(false)} centered>
            <Modal.Header>
                Delete All Session Materials
            </Modal.Header>
            <Modal.Body>
            <div className='alert alert-danger'>
                <h2>Warning!</h2>
                <p>Confirming will delete ALL of the session material you've created! Are you sure you want to continue? This cannot be undone!</p>
            </div>
            <div className='flex justify-between'>
                <Button className='justify-start' onClick={()=>isDeleteOpen(false)}>Cancel</Button>
                <Button variant='danger' className='justify-end' onClick={()=> {
                    CMTFetch('DELETE', `session/${id}/${sessionNum+1}`).then(async response => {
                        const data = await response.json();
                        const ids = data.materials.map(item => item.id)
                        const sessionDataCopy = sessionData.map(material => {
                        if (ids.includes(material.id)) 
                            return {...material, active: false}
                        return material});
                        setSessionData(sessionDataCopy);
                    });
                    isDeleteOpen(false);
                }}>Delete All Materials</Button>
            </div>
            </Modal.Body>
            </Modal>
            </>
        )
    }

    return (
        <Accordion alwaysOpen>
        <SessionModal sessionNum={sessionNum} sessionData={sessionData} setSessionData={setSessionData} isOpen={isOpen} setIsOpen={setIsOpen} sessions={sessions}/>
        <SessionEditModal sessionData={sessionData} setSessionData={setSessionData} materialId={curSessionId} isEditOpen={isEditOpen} setIsEditOpen={setIsEditOpen}/>
        <DeleteModal />
        {
            Array.from({ length: sessionCount }, (_, i) => (
                <Accordion.Item eventKey={`${i}`} onClick={()=>setSessionNum(i)}>
                    <Accordion.Header>
                        <Form.Check onClick={(e)=>e.stopPropagation()} className='mr-3 text-xl'></Form.Check>
                        <span className='text-2xl'>Session {i+1}</span>
                        </Accordion.Header>
                    <Accordion.Body>
                        { sessionData.find(data => data.sessionNum === i && data.active) ?
                        <SessionTable sessionData={sessionData} sessionNum={i} setIsEditOpen={setIsEditOpen} setSessionId={setCurSessionId}/> :
                        <div className='flex justify-center'><p className='text-xl'>Nothing here yet!</p></div>
                        }
                        { sessionData.find(data => data.sessionNum === i && data.type==="Personal Notes" && data.active) ?
                        <Card>
                            <Card.Body className='group max-h-96 overflow-y-scroll'>
                                <Card.Title>
                                    <div className='flex justify-between'>
                                        <div>{sessionData.find(data => data.sessionNum === i && data.type==="Personal Notes").label} (Notes)</div>
                                        <div className='justify-end size-12 opacity-0 group-hover:!opacity-100'><Button variant='outline-dark' onClick={(e) => {
                                            setCurSessionId(sessionData.find(material => material.type === "Personal Notes" && material.sessionNum === i).id);
                                            setIsEditOpen(true);
                                            e.currentTarget.style.opacity = "100";
                                        }}><Edit /></Button></div>
                                    </div>
                                </Card.Title>
                                <Card.Text>
                                    <span className="prose" dangerouslySetInnerHTML={{__html: sessionData.find(data => data.sessionNum === i && data.type==="Personal Notes").body}}></span></Card.Text>
                            </Card.Body>
                        </Card> : <></>
                        }
                        <div className='flex justify-between pt-3'>
                        <div className={`justify-start ${sessionData.find(data => data.sessionNum === i && data.active) ? 'visible' : 'invisible'}`}>
                            <Button variant='danger' onClick={()=>isDeleteOpen(true)}>Delete All Material</Button>
                        </div>
                        <div className='justify-end'>
                            <Button onClick={() => setIsOpen(true)}>Add Material</Button>
                        </div>
                        </div>
                    </Accordion.Body>
                </Accordion.Item>
            ))
        }
      </Accordion>
  );
}

/**
 * The modal to create session material. 
 * The modal makes the user select the material type, material title and they can add material content.
 *
 * @param {{ sessionNum: any; sessionData: any; setSessionData: any; isOpen: any; setIsOpen: any; sessions: any;}} param0 
 * sessionNum - the number of the session (used as an identifier in sessionData)
 * sessionData - the data of sessions in a course. Used to check if a user has created a personal note or not since we restrict to 1 note per session
 * setSessionData - function to set the sessionData. Used upon upload to keep track of the session
 * isOpen - whether the modal is open
 * setIsOpen - open/close the modal
 * @returns {*} the modal as HTML
 */
function SessionModal({ sessionNum, sessionData, setSessionData, isOpen, setIsOpen, sessions}){
    const [itemLabel, setItemLabel] = useState('');
    const [itemBody, setItemBody] = useState('');
    const [itemType, setItemType] = useState('Topic/Lecture');
    const [warningVisible, setWarningVisible] = useState(false);

    /** Makes a post request and updates the session data.
     * Is it a little weird that it uses id and sessionNum? Yeah probably but it works
     * If prisma has views you can use that but I wasn't aware of them if so when writing this
     */
    function uploadSessionMaterial(){
        const id = sessions.find(session => session.sessionNum === (sessionNum+1)).id
        CMTFetch("POST", `/session/${id}`, {itemType, itemLabel, itemBody, sessionNum}).then(async response => {
        const data = await response.json();
        setSessionData(sessionData => [...sessionData, data.material])
        })
    }

    function resetForm(){
        setItemType('Topic/Lecture');
        setItemLabel('');
        setItemBody('');
        setWarningVisible(false);
    }

    return (
            <Modal show={isOpen} onHide={() => {setIsOpen(false); 
            resetForm();}} centered size='lg'>
                <Modal.Header closeButton>Add Material</Modal.Header>
                <Modal.Body>
                    <div className={`alert alert-danger ${warningVisible ? 'block' : 'hidden'}`}>Please create a title for the material!</div>
                    <Form onSubmit={uploadSessionMaterial}>
                        <div className='flex'>
                            <div className='w-full'>
                                <div>
                                <Form.Label>Material Type</Form.Label>
                                <Form.Select onChange={(e)=>setItemType(e.target.value)}>
                                <option>Topic/Lecture</option>
                                <option>Class Activity</option>
                                <option>Reading/Resources</option>
                                <option>Projects & Practica</option>
                                <option>Group Assignment</option>
                                <option>Individual Assignment</option>
                                {!sessionData.find(data => data.sessionNum === sessionNum && data.type==="Personal Notes" && data.active) ? <option>Personal Notes</option> : <></>} 
                                </Form.Select>
                                </div>
                                <div>
                                <Form.Label>Title (Required)</Form.Label>
                                <Form.Control placeholder={"My Title"} onChange={(e)=>setItemLabel(e.target.value)} required></Form.Control>
                                </div>
                                <div>
                                <Form.Label>Content</Form.Label>
                                <RichTextEditor value={itemBody} onChange={setItemBody}/>
                                </div>
                            </div>
                        </div>
                       
                        <div className='flex justify-end pt-3'>
                            <Button type="submit" onClick={(e) => {
                            e.preventDefault();
                            if (itemLabel){
                                uploadSessionMaterial();
                                setIsOpen(false);
                                resetForm();
                            }
                            else setWarningVisible(true);
                            }}>Submit</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
    );
}

/**
 * The modal to edit session data.
 * The user can edit the title and the body content but not the material type.
 * Maybe in the future they can edit that and which session it belongs to?
 *
 * @param {{ sessionData: any; setSessionData: any; materialId: any; isEditOpen: any; setIsEditOpen: any; }} param0 
 * sessionData - the data of material in sessions. Used to get the existing content for editing
 * setSessionData - sets the material for a session; in this case it updates it
 * materialId - the ID of the material. Used mainly for the PUT request to know which item to update
 * isEditOpen - whether the edit modal is open or not
 * setIsEditOpen - sets the edit modal to be either opened or closed
 * @returns {*} the modal as HTML
 */
function SessionEditModal({ sessionData, setSessionData, materialId, isEditOpen, setIsEditOpen }){
    const [itemLabel, setItemLabel] = useState('');
    const [itemBody, setItemBody] = useState('');
    const [warningVisible, setWarningVisible] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const curMaterial = sessionData.find(material => material.id === materialId);

    function resetForm(){
        setItemLabel('');
        setItemBody('');
        setWarningVisible(false);
        setDeleting(false);
    }

    function setItems(){
        setItemLabel(curMaterial.label);
        setItemBody(curMaterial.body);
    }

    function updateMaterial(){
        CMTFetch("PUT", `/session/material/${materialId}`, {itemLabel, itemBody}).then(() => {
            const sessionDataCopy = sessionData.map(material => {
                if (material.id === materialId) 
                    return {...material, label: itemLabel, body: itemBody}
                return material
            });
            setSessionData(sessionDataCopy);
        });
    }

    function deleteMaterial(){
        CMTFetch("DELETE", `/session/material/${materialId}`).then(() => {
            const sessionDataCopy = sessionData.map(material => {
                if (material.id === materialId) 
                    return {...material, active: false}
                return material
            });
            setSessionData(sessionDataCopy);
        });
    }

    return (
            <Modal show={isEditOpen} onShow={setItems} onHide={() => {setIsEditOpen(false); 
            resetForm();}} centered size='lg'>
                <Modal.Header closeButton>Edit Material</Modal.Header>
                <Modal.Body>
                {!deleting ? <>
                    <div className={`alert alert-danger ${warningVisible ? 'block' : 'hidden'}`}>Material needs to have a title!</div>
                    <Form onSubmit={updateMaterial}>
                        <div className='flex'>
                            <div className='w-full'>
                                <div>
                                <Form.Label>Title</Form.Label>
                                <Form.Control defaultValue={itemLabel} onChange={(e)=>setItemLabel(e.target.value)} required></Form.Control>
                                </div>
                                <div>
                                <Form.Label>Content</Form.Label>
                                <RichTextEditor value={itemBody} onChange={setItemBody}/>
                                </div>
                            </div>
                        </div>
                        <div className='flex justify-between pt-3'>
                        <div className='justify-start'>
                            <Button variant="danger" type="submit" onClick={(e)=> {
                                e.preventDefault();
                                setDeleting(true);
                            }}>Delete Item</Button>
                        </div>
                        <div className='justify-end'>
                            <Button type="submit" onClick={(e) => {
                            e.preventDefault();
                            if (itemLabel){
                                updateMaterial();
                                setIsEditOpen(false);
                                resetForm();
                            }
                            else setWarningVisible(true);
                            }}>Submit</Button>
                        </div>
                        </div>
                    </Form></> : 
                    <>
                    <div className='alert alert-danger'>
                        <h2>Warning!</h2>
                        <p>Confirming will delete the session material you've created! Are you sure you want to continue? This cannot be undone!</p>
                    </div>
                    <div className='flex justify-between'>
                        <Button className='justify-start' onClick={()=>setDeleting(false)}>Cancel</Button>
                        <Button variant='danger' className='justify-end' onClick={()=> {
                            deleteMaterial();
                            setIsEditOpen(false);
                            resetForm();}}>Delete Item</Button>
                    </div>
                    </>}
                </Modal.Body>
            </Modal>
    );
}

/**
 * A component that generates a session table
 * Displays all material/notes for one specific session
 *
 * @param {{ sessionData: Array; sessionNum: number; setIsEditOpen: any; setSessionId: any;}} param0 
 *  sessionData the data that contains the materials
 *  sessionNum  the identifying session number to only get data from that specific session
 * @returns {*} the table in HTML
 */
function SessionTable( {sessionData, sessionNum, setIsEditOpen, setSessionId} ) {
    const [cols, setCols] = useState(Array.of(0,0,0,0,0,0,0));
    const tdClass = "hover:underline hover:text-blue-500 cursor-pointer";
    const allCols = ["Topic/Lecture", "Class Activity", "Reading/Resources", "Projects & Practica", "Group Assignment", "Individual Assignment"];
    // TODO: maybe... change how this works, currently updates all columns for every session but that may be ok.
    // It'll look a bit more clumped, but it is closer to realistic for what a prof. may want.
    
    /** Checks if there's any data in any of the columns and show them.
     * There's a bunch of columns so it's mainly just to reduce how much is shown
     */
    function determineCols(){
        sessionData.map(data => {
            const i = allCols.indexOf(data.type);
            if (cols[i] === 0)
            setCols([...cols.slice(0, i), 1, ...cols.slice(i+1)]) ;
            return null;}
        )
    }

    /**
     * Helper function to determine the total amount of rows there'll be in one session
     *
     * @returns {number} the max rows in one session
     */
    function determineRows(){
        var maxRows = 1;
        allCols.forEach(col => {
            const result = sessionData.filter(data => data.sessionNum === sessionNum && data.type === col && data.active).length;
            if (result > maxRows)
                maxRows = result;
        });
        return maxRows;
    }

    /**
     * Helper function to display the items labels/titles 
     * Could technically be inline, but you can't define variables in the return so it gets annoying
     *
     * @param {number} col the column of the item
     * @param {number} index the current index of the item
     * @returns {string} the title of the item, or a blank string if it doesn't exist
     */
    function displayLabel(col, index){
        const labels = sessionData.filter(data => data.type === allCols[col] && data.sessionNum === sessionNum && data.active);
        if (labels[index])
            return labels[index].label;
        return '';
    }

    function openEditModal(text, col){
        // Not a foolproof way to find ID but it should match closely. It'd take a bunch of refactoring to be exact...
        const id = sessionData.find(session => session.sessionNum === sessionNum && session.label === text && session.type === allCols[col]).id
        setIsEditOpen(true);
        setSessionId(id);
    }

    determineCols();

    return (
            <Table bordered>
                <thead className='[&>tr>th]:text-white [&>tr>th]:font-bold [&>tr>th]:bg-[#0484c9]'>
                    <tr>
                        {cols[0] ? <th>Topic/Lecture</th> : <></>}
                        {cols[1] ? <th>Class Activity</th> : <></>}
                        {cols[2] ? <th>Reading/Resources</th> : <></>}
                        {cols[3] ? <th>Projects & Practica</th> : <></>}
                        {cols[4] ? <th>Group Assignment</th> : <></>}
                        {cols[5] ? <th>Individual Assignment</th> : <></>}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: determineRows() }, (_, i) => (
                    <tr>
                        {cols[0] ? <td><span className={`${tdClass}`} onClick={(e) => openEditModal(e.currentTarget.textContent, 0)}>{displayLabel(0,i)}</span></td> : <></>}
                        {cols[1] ? <td><span className={`${tdClass}`} onClick={(e) => openEditModal(e.currentTarget.textContent, 1)}>{displayLabel(1,i)}</span></td> : <></>}
                        {cols[2] ? <td><span className={`${tdClass}`} onClick={(e) => openEditModal(e.currentTarget.textContent, 2)}>{displayLabel(2,i)}</span></td> : <></>}
                        {cols[3] ? <td><span className={`${tdClass}`} onClick={(e) => openEditModal(e.currentTarget.textContent, 3)}>{displayLabel(3,i)}</span></td> : <></>}
                        {cols[4] ? <td><span className={`${tdClass}`} onClick={(e) => openEditModal(e.currentTarget.textContent, 4)}>{displayLabel(4,i)}</span></td> : <></>}
                        {cols[5] ? <td><span className={`${tdClass}`} onClick={(e) => openEditModal(e.currentTarget.textContent, 5)}>{displayLabel(5,i)}</span></td> : <></>}
                    </tr>
                    ))}
                </tbody>
            </Table>
    )
}