import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WorkflowRenderer } from '../../components/workflows/WorkflowRenderer'
import { CMTJsonFetch } from '../../utils/api'
import { InlineActionRenderer } from '../../components/workflows/ActionRenderers/InlineActionRenderer'
import { InlineFormHoverable } from '../../components/forms/InlineForms'
import { flattenActionsWithContext } from '../../utils/workflows'
import { ArrowLeft, Edit } from 'lucide-react'
import { Accordion, Button, Card, Form, Modal, Table} from 'react-bootstrap'
import { RichTextEditor } from '../../components/RichTextEditor'
import { CheckmarkActionRenderer } from '../../components/workflows/ActionRenderers/GenericActionRenderer'
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
    /** @type [ActionWithContext[], any] */
    const [actionsWithContext, setactionWithContexts] = useState([])
    /** @type [WorkflowsWorkflow, any] */
    const [workflow, setWorkflow] = useState(null)
    const [sessionCount, setSessionCount] = useState(0)
    const [sessions, setSessions] = useState([]);

    const update = useCallback(async () => {
        return CMTJsonFetch('GET', `course/${id}`).then(async response => {
            const data = await response.json()
            setCourse(data.course)
            setactionWithContexts(data.actionWithContexts)
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
            <ResourceManager courseId={course.id} />
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
        </>
    )
}

function CourseInfo({ course, actionsWithContext, refresh, fetchToCallback }) {

    const [newCourseName, setNewCourseName] = useState(course.name)
    const [newCourseCode, setNewCourseCode] = useState(course.classId)
    const navigate = useNavigate();

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

/**
 * A session component, maintains sessionData, whether the session modal is open, and the current session selected.
 * The session component is an accordion that dynamically adds more items the higher the count. 
 * Displays a modal (when opened) and a table of uploaded resources. 
 *
 * @param {{ sessionCount: number; setSessionCount: any; sessions:Object; setSessions:any; sessionActions:any, updateWorkflow: () => void, fetchToCallback: FetchToCallback, courseId: number }} param0
 * sessionCount - the number of sessions a user has created
 * courseId - the identifier for which sessionData to obtain
 * @returns {*} the session accordion as HTML
 */
function Session({sessionCount, setSessionCount, sessions, setSessions, sessionActions, updateWorkflow, fetchToCallback, courseId}) {
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

    /**
     * Initial GET request upon loading the page
     * Sets the correct amount of sessions and the actual sessions themselves with useful data
     * Also gets material if there is any and puts it in each session
     */
    const update = useCallback(() => {
        return CMTJsonFetch('GET', `session/${id}`).then(async response => {
            const data = await response.json()
            setSessionCount(data.sessions.length)
            setSessions(data.sessions);
            const materialsArray = data.sessionMaterials.filter(m => m.material).map(m => m.material);
            setSessionData(materialsArray.flat());
        })
    }, [id, setSessions, setSessionCount])
    useEffect(() => void update(), [id, update])

    return (
        <Accordion alwaysOpen>
        <SessionModal sessionNum={sessionNum} sessionData={sessionData} setSessionData={setSessionData} isOpen={isOpen} setIsOpen={setIsOpen} sessions={sessions} courseId={courseId}/>
        <SessionEditModal sessionData={sessionData} setSessionData={setSessionData} materialId={curSessionId} isEditOpen={isEditOpen} setIsEditOpen={setIsEditOpen} courseId={courseId}/>
        {
            Array.from({ length: sessionCount }, (_, i) => {
                const sessionAction = sessionActions?.find(sessionAction => sessionAction.action.metadata.code === `SESSION_${i}`)
                
                return (
                    <Accordion.Item eventKey={`${i}`} onClick={()=>setSessionNum(i)}>
                        <Accordion.Header>
                            <div className="flex items-center gap-2">
                                {/* TODO: completion should be tracked in the DB in case a professor wants to create more sessions than required */}
                                {sessionAction && <CheckmarkActionRenderer actionWithContext={sessionAction} refresh={updateWorkflow} fetchToCallback={fetchToCallback}/>}
                                <span className='text-2xl'>Session {i+1}</span>
                            </div>
                        </Accordion.Header>
                        <Accordion.Body>
                            { sessionData.find(data => data.sessionNum === i) ?
                            <SessionTable sessionData={sessionData} sessionNum={i} setIsEditOpen={setIsEditOpen} setSessionId={setCurSessionId}/> :
                            <div className='flex justify-center'><p className='text-xl'>Nothing here yet!</p></div>
                            }
                            { sessionData.find(data => data.sessionNum === i && data.type==="Personal Notes") ?
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
                            <div className='flex justify-end pt-3'>
                                <Button onClick={() => setIsOpen(true)}>Add Material</Button>
                            </div>
                        </Accordion.Body>
                    </Accordion.Item>
                )
            })
        }
      </Accordion>
  );
}

/**
 * The modal to create session material. 
 * The modal makes the user select the material type, material title and they can add material content.
 *
 * @param {{ sessionNum: any; sessionData: any; setSessionData: any; isOpen: any; setIsOpen: any; sessions: any; courseId: number;}} param0 
 * sessionNum - the number of the session (used as an identifier in sessionData)
 * sessionData - the data of sessions in a course. Used to check if a user has created a personal note or not since we restrict to 1 note per session
 * setSessionData - function to set the sessionData. Used upon upload to keep track of the session
 * isOpen - whether the modal is open
 * setIsOpen - open/close the modal
 * courseId - the course ID for resource linking
 * @returns {*} the modal as HTML
 */
function SessionModal({ sessionNum, sessionData, setSessionData, isOpen, setIsOpen, sessions, courseId}){
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
        CMTJsonFetch("POST", `/session/${id}`, {itemType, itemLabel, itemBody, sessionNum}).then(async (response) => {
        const data = await response.json();
        setSessionData(sessionData => [...sessionData, data.material]);
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
                                {!sessionData.find(data => data.sessionNum === sessionNum && data.type==="Personal Notes") ? <option>Personal Notes</option> : <></>} 
                                </Form.Select>
                                </div>
                                <div>
                                <Form.Label>Title (Required)</Form.Label>
                                <Form.Control placeholder={"My Title"} onChange={(e)=>setItemLabel(e.target.value)} required></Form.Control>
                                </div>
                                <div>
                                <Form.Label>Content</Form.Label>
                                <RichTextEditor value={itemBody} onChange={setItemBody} courseId={courseId}/>
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
 * @param {{ sessionData: any; setSessionData: any; materialId: any; isEditOpen: any; setIsEditOpen: any; courseId: number }} props 
 * sessionData - the data of material in sessions. Used to get the existing content for editing
 * setSessionData - sets the material for a session; in this case it updates it
 * materialId - the ID of the material. Used mainly for the PUT request to know which item to update
 * isEditOpen - whether the edit modal is open or not
 * setIsEditOpen - sets the edit modal to be either opened or closed
 * @returns {*} the modal as HTML
 */
function SessionEditModal({ sessionData, setSessionData, materialId, isEditOpen, setIsEditOpen, courseId }){
    const [itemLabel, setItemLabel] = useState('');
    const [itemBody, setItemBody] = useState('');
    const [warningVisible, setWarningVisible] = useState(false);
    const curMaterial = sessionData.find(material => material.id === materialId);

    function resetForm(){
        setItemLabel('');
        setItemBody('');
        setWarningVisible(false);
    }

    function setItems(){
        setItemLabel(curMaterial.label);
        setItemBody(curMaterial.body);
    }

    function updateMaterial(){
        CMTJsonFetch("PUT", `/session/material/${materialId}`, {itemLabel, itemBody}).then(() => {
            const sessionDataCopy = sessionData.map(material => {
                if (material.id === materialId) 
                    return {...material, label: itemLabel, body: itemBody}
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
                                <RichTextEditor value={itemBody} onChange={setItemBody} courseId={courseId}/>
                                </div>
                            </div>
                        </div>
                        <div className='flex justify-end pt-3'>
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
                    </Form>
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
            const result = sessionData.filter(data => data.sessionNum === sessionNum && data.type === col).length;
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
        const labels = sessionData.filter(data => data.type === allCols[col] && data.sessionNum === sessionNum);
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