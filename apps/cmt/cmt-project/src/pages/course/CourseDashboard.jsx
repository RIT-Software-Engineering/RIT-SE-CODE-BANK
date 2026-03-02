import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WorkflowRenderer } from '../../components/workflows/WorkflowRenderer'
import { CMTFetch } from '../../utils/api'
import { InlineActionRenderer } from '../../components/workflows/ActionRenderers/InlineActionRenderer'
import { InlineFormHoverable } from '../../components/forms/InlineForms'
import { flattenActionsWithContext } from '../../utils/workflows'
import { ArrowLeft } from 'lucide-react'
import { Accordion, Button, Card, Form, Modal, Table } from 'react-bootstrap'

export function CourseDashboard() {
    const { id } = useParams()

    const [course, setCourse] = useState(null)
    const [actionsWithContext, setactionWithContexts] = useState([])
    const [workflow, setWorkflow] = useState(null)
    const [sessionCount, setSessionCount] = useState(0)

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

            <div>
                <Session sessionCount={sessionCount} courseId={course.courseId}/>
                <div className='flex justify-end pt-4'>
                    <Button onClick={() => {
                       setSessionCount(sessionCount+1)
                    }}>Add session</Button>
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
                {actionsWithContext.map(awc => 
                    <InlineActionRenderer
                        data={course}
                        actionWithContext={awc}
                        refresh={refresh}
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
 * @param {{ sessionCount: number; courseId: number; }} param0
 * sessionCount - the number of sessions a user has created
 * courseId - the identifier for which sessionData to obtain
 * @returns {*} the session accordion as HTML
 */
function Session({sessionCount, courseId}) {
    //TODO add implementation with the backend to hold and maintain session data

    /**
     * sessionData is an array of objects that holds data regarding session material. Contains:
     * sessionNum - the session the material belongs to
     * column - the column where the material should go
     * label - the title of the material
     * body - the content of the material
     */
    const [sessionData, setSessionData] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [sessionNum, setSessionNum] = useState(0);

    //TODO add GET request to set the session data
    function getSessionData(){

    }

    return (
        <Accordion alwaysOpen>
        <SessionModal sessionNum={sessionNum} sessionData={sessionData} setSessionData={setSessionData} isOpen={isOpen} setIsOpen={setIsOpen}/>
        {
            Array.from({ length: sessionCount }, (_, i) => (
                <Accordion.Item eventKey={`${i}`} onClick={()=>setSessionNum(i)}>
                    <Accordion.Header>
                        <Form.Check onClick={(e)=>e.stopPropagation()} className='mr-3 text-xl'></Form.Check>
                        <span className='text-2xl'>Session {i+1}</span>
                        </Accordion.Header>
                    <Accordion.Body>
                        { sessionData.find(data => data.sessionNum === i) ?
                        <SessionTable sessionData={sessionData} sessionNum={i}/> :
                        <div className='flex justify-center'><p className='text-xl'>Nothing here yet!</p></div>
                        }
                        { sessionData.find(data => data.sessionNum === i && data.column==="Personal Notes") ?
                        <Card>
                            <Card.Body>
                                <Card.Title>{sessionData.find(data => data.sessionNum === i && data.column==="Personal Notes").label} (Notes)</Card.Title>
                                <Card.Text>{sessionData.find(data => data.sessionNum === i && data.column==="Personal Notes").body}</Card.Text>
                            </Card.Body>
                        </Card> : <></>
                        }
                        <div className='flex justify-end pt-3'>
                            <Button onClick={() => setIsOpen(true)}>Add Material</Button>
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
 * @param {{ sessionNum: any; sessionData: any; setSessionData: any; isOpen: any; setIsOpen: any; }} param0 
 * sessionNum - the number of the session (used as an identifier in sessionData)
 * sessionData - the data of sessions in a course. Used to check if a user has created a personal note or not since we restrict to 1 note per session
 * setSessionData - function to set the sessionData. Used upon upload to keep track of the session
 * isOpen - whether the modal is open
 * setIsOpen - open/close the modal
 * @returns {*} the modal as HTML
 */
function SessionModal({ sessionNum, sessionData, setSessionData, isOpen, setIsOpen}){
    const [itemLabel, setItemLabel] = useState('');
    const [itemBody, setItemBody] = useState('');
    const [itemType, setItemType] = useState('Topic/Lecture');
    const [warningVisible, setWarningVisible] = useState(false);

    //TODO Make POST request to save session material
    function uploadSessionMaterial(){
        setSessionData(sessionData => [...sessionData, {
            sessionNum: sessionNum,
            column: itemType,
            label: itemLabel,
            body: itemBody,
        }]);
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
                                {!sessionData.find(data => data.sessionNum === sessionNum && data.column==="Personal Notes") ? <option>Personal Notes</option> : <></>} 
                                </Form.Select>
                                </div>
                                <div>
                                <Form.Label>Title (Required)</Form.Label>
                                <Form.Control placeholder={"My Title"} onChange={(e)=>setItemLabel(e.target.value)} required></Form.Control>
                                </div>
                                <div>
                                <Form.Label>Content</Form.Label>
                                <Form.Control as="textarea" onChange={(e)=>setItemBody(e.target.value)}>
                                    {/* TODO Replace this with Rich Text Editor */}
                                </Form.Control>
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
 * A component that generates a session table
 * Displays all material/notes for one specific session
 *
 * @param {{ sessionData: Array; sessionNum: number; }} param0 
 *  sessionData the data that contains the materials
 *  sessionNum  the identifying session number to only get data from that specific session
 * @returns {*} the table in HTML
 */
function SessionTable( {sessionData, sessionNum} ) {
    const [cols, setCols] = useState(Array.of(0,0,0,0,0,0,0));
    const allCols = ["Topic/Lecture", "Class Activity", "Reading/Resources", "Projects & Practica", "Group Assignment", "Individual Assignment"];
    // TODO: maybe... change how this works, currently updates all columns for every session but that may be ok.
    // It'll look a bit more clumped, but it is closer to realistic for what a prof. may want.
    
    /** Checks if there's any data in any of the columns and show them.
     * There's a bunch of columns so it's mainly just to reduce how much is shown
     */
    function determineCols(){
        sessionData.map(data => {
            const i = allCols.indexOf(data.column);
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
            const result = sessionData.filter(data => data.sessionNum === sessionNum && data.column === col).length;
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
        const labels = sessionData.filter(data => data.column === allCols[col] && data.sessionNum === sessionNum);
        if (labels[index])
            return labels[index].label;
        return '';
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
                        {cols[0] ? <td>{displayLabel(0,i)}</td> : <></>}
                        {cols[1] ? <td>{displayLabel(1,i)}</td> : <></>}
                        {cols[2] ? <td>{displayLabel(2,i)}</td> : <></>}
                        {cols[3] ? <td>{displayLabel(3,i)}</td> : <></>}
                        {cols[4] ? <td>{displayLabel(4,i)}</td> : <></>}
                        {cols[5] ? <td>{displayLabel(5,i)}</td> : <></>}
                    </tr>
                    ))}
                </tbody>
            </Table>
    )
}