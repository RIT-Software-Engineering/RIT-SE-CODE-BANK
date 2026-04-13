import { Edit } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Accordion, Card, Button, Offcanvas, Form, Table, Alert } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { ReadOnlyEditor, RichTextEditor } from "../../components/RichTextEditor/RichTextEditor";
import { useLinkDetection } from "../../components/RichTextEditor/useLinkDetection";
import { CheckmarkActionRenderer } from "../../components/workflows/ActionRenderers/GenericActionRenderer";
import { CMTJsonFetch } from "../../utils/api";
import { CMTDangerAlert, LogError } from "../../utils/error";

/**
 * A session component, maintains sessionData, whether the session modal is open, and the current session selected.
 * The session component is an accordion that dynamically adds more items the higher the count. 
 * Displays a modal (when opened) and a table of uploaded resources. 
 *
 * @param {{ sessionCount: number; setSessionCount: any; sessions:Object; setSessions:any; sessionActions:any, updateWorkflow: () => void, fetchToCallback: import("../../components/workflows/typedefs").FetchToCallback, courseId: number }} param0
 * sessionCount - the number of sessions a user has created
 * courseId - the identifier for which sessionData to obtain
 * @returns {*} the session accordion as HTML
 */
export function Session({sessionCount, setSessionCount, sessions, setSessions, sessionActions, updateWorkflow, fetchToCallback, courseId}) {
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
        <Accordion>
        <SessionModal sessionNum={sessionNum} sessionData={sessionData} setSessionData={setSessionData} isOpen={isOpen} setIsOpen={setIsOpen} sessions={sessions} courseId={courseId}/>
        <SessionEditModal sessionData={sessionData} setSessionData={setSessionData} materialId={curSessionId} isEditOpen={isEditOpen} setIsEditOpen={setIsEditOpen} courseId={courseId}/>
        {
            Array.from({ length: sessionCount }, (_, i) => {
                const sessionAction = sessionActions?.find(sessionAction => sessionAction.action.metadata.code === `SESSION_${i}`)
                
                return (
                    <Accordion.Item eventKey={`${i}`} onClick={()=>setSessionNum(i)}>
                        <Accordion.Header>
                            <div className="flex items-center gap-2" id={`WORKFLOW_JUMPPOINT_SESSION_${i}`}>
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
                                            <div><ReadOnlyEditor value={sessionData.find(data => data.sessionNum === i && data.type==="Personal Notes").label} /></div>
                                            <div className='justify-end size-12 opacity-0 group-hover:!opacity-100 group-hover:text-white'><Button variant='outline-dark' onClick={(e) => {
                                                setCurSessionId(sessionData.find(material => material.type === "Personal Notes" && material.sessionNum === i).id);
                                                setIsEditOpen(true);
                                                e.currentTarget.style.opacity = "100";
                                            }}><Edit /></Button></div>
                                        </div>
                                    </Card.Title>
                                    <Card.Text>
                                        <ReadOnlyEditor value={sessionData.find(data => data.sessionNum === i && data.type==="Personal Notes").body} />
                                    </Card.Text>
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
export function SessionModal({ sessionNum, sessionData, setSessionData, isOpen, setIsOpen, sessions, courseId }) {
    const [itemLabel, setItemLabel] = useState('')
    const [itemBody, setItemBody] = useState('')
    const [itemType, setItemType] = useState('Topic/Lecture')
    const [error, setError] = useState('')
    const [titleEditor, setTitleEditor] = useState(null);
    const hasLinksInTitle = useLinkDetection(titleEditor);

    const uploadSessionMaterial = useCallback(() => {
        const id = sessions.find(session => session.sessionNum === sessionNum + 1).id
        CMTJsonFetch('POST', `/session/${id}`, { itemType, itemLabel, itemBody: hasLinksInTitle ? undefined : itemBody, sessionNum })
            .then(async response => {
                const data = await response.json()
                setSessionData(sessionData => [...sessionData, data.material])
            })
            .catch(error => LogError("Error uploading material", error, setError))
    }, [hasLinksInTitle, itemBody, itemLabel, itemType, sessionNum, sessions, setSessionData])

    function resetForm() {
        setItemType('Topic/Lecture')
        setItemLabel('')
        setItemBody('')
        setError('')
    }

    function handleClose() {
        setIsOpen(false)
        resetForm()
    }

    return (
        <Offcanvas
            show={isOpen}
            onHide={handleClose}
            placement="end"
            style={{ width: '100%', maxWidth: '1040px' }}
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Add Material</Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body className="overflow-auto">
                <Form onSubmit={uploadSessionMaterial}>
                    <div className='flex'>
                        <div className='w-full'>
                            <div className="mb-3">
                                <Form.Label>Material Type</Form.Label>
                                <Form.Select onChange={e => setItemType(e.target.value)} value={itemType}>
                                    <option>Topic/Lecture</option>
                                    <option>Class Activity</option>
                                    <option>Reading/Resources</option>
                                    <option>Projects & Practica</option>
                                    <option>Group Assignment</option>
                                    <option>Individual Assignment</option>
                                    {!sessionData.find(data => data.sessionNum === sessionNum && data.type === 'Personal Notes') ? <option>Personal Notes</option> : <></>}
                                </Form.Select>
                            </div>

                            <div className="mb-3">
                                <Form.Label>Title (Required)</Form.Label>
                                <RichTextEditor 
                                    value={itemLabel} 
                                    onChange={setItemLabel} 
                                    courseId={courseId} 
                                    isBody={false} 
                                    onEditor={setTitleEditor}
                                />
                            </div>

                            <div className="mb-3">
                                <Form.Label>Content</Form.Label>
                                <RichTextEditor 
                                    value={itemBody} 
                                    onChange={setItemBody} 
                                    courseId={courseId} 
                                    isBody={true}
                                    disabled={hasLinksInTitle}
                                />
                                {hasLinksInTitle && <Alert variant="warning" className="my-2">Content editor is disabled because the title contains links. If a title contains a link, material content will be ignored.</Alert>}
                            </div>
                        </div>
                    </div>
                    
                    <CMTDangerAlert error={error} />
                    <div className='flex justify-end pt-3'>
                        <Button
                            type='submit'
                            onClick={e => {
                                e.preventDefault()
                                if (itemLabel) {
                                    uploadSessionMaterial()
                                    setIsOpen(false)
                                    resetForm()
                                } else setError("Please create a title for the material!")
                            }}
                        >
                            Submit
                        </Button>
                    </div>
                </Form>
            </Offcanvas.Body>
        </Offcanvas>
    )
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
    const curMaterial = sessionData.find(material => material.id === materialId);
    
    const [itemLabel, setItemLabel] = useState(curMaterial?.label ?? "");
    const [itemBody, setItemBody] = useState(curMaterial?.body ?? "");
    const [warningVisible, setWarningVisible] = useState(false);
    const [titleEditor, setTitleEditor] = useState(null);
    const hasLinksInTitle = useLinkDetection(titleEditor);

    // we need use effect for the body otherwise it may load the incorrect body
    // it works fine without the label though
    useEffect(() => {
        setItemBody(curMaterial?.body ?? "")
    }, [curMaterial, materialId])

    function resetForm(){
        setWarningVisible(false);
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
        <Offcanvas
            onShow={() => {
                setItemLabel(curMaterial?.label ?? "")
                setItemBody(curMaterial?.body ?? "")
            }}
            show={isEditOpen}
            onHide={() => { setIsEditOpen(false); resetForm(); }}
            placement="end"
            style={{ width: '100%', maxWidth: '1040px' }}
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Edit Material</Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body className="overflow-auto">
        
                    <div className={`alert alert-danger ${warningVisible ? 'block' : 'hidden'}`}>Material needs to have a title!</div>
                    <Form onSubmit={updateMaterial}>
                        <div className='flex'>
                            <div className='w-full'>
                                <div>
                                    <Form.Label>Title</Form.Label>
                                    <RichTextEditor 
                                        value={itemLabel} 
                                        onChange={setItemLabel} 
                                        courseId={courseId} 
                                        isBody={false}
                                        onEditor={setTitleEditor}
                                    />
                                </div>
                                <div>
                                    <Form.Label>Content</Form.Label>
                                    <RichTextEditor 
                                        value={itemBody} 
                                        onChange={setItemBody} 
                                        courseId={courseId} 
                                        isBody={true}
                                        disabled={hasLinksInTitle}
                                    />
                                    {hasLinksInTitle && <Alert variant="warning" className="my-2">Content editor is disabled because the title contains links. If a title contains a link, material content will be ignored.</Alert>}
                                </div>
                            </div>
                        </div>
                        <div className='flex justify-end pt-3'>
                            <Button type="submit" onClick={(e) => {
                            e.preventDefault();
                            // basically if we match any actual text
                            if (!itemLabel.startsWith("<p>") || !itemLabel.replace(/<p>.+<\/p>/, "")){
                                updateMaterial();
                                setIsEditOpen(false);
                                resetForm();
                            }
                            else setWarningVisible(true);
                            }}>Submit</Button>
                        </div>
                    </Form>
                    </Offcanvas.Body>
                </Offcanvas>
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
     * Helper function to get the raw content of the corresponding material's label
     *
     * @param {number} col the column of the item
     * @param {number} index the current index of the item
     * @returns raw html that can be fed into an editor
     */
    function getLabelContent(col, index) {
        const labels = sessionData.filter(data => data.type === allCols[col] && data.sessionNum === sessionNum);

        if (labels[index])
            return labels[index].label
        return ""
    }

    function openEditModal(text, col){
        // Not a foolproof way to find ID but it should match closely. It'd take a bunch of refactoring to be exact...
        const id = sessionData.find(session => session.sessionNum === sessionNum && session.label === text && session.type === allCols[col])?.id;
        if (!id)
            return;
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
                        {cols[0] ? (
                            getLabelContent(0, i) ? (
                            <td 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => openEditModal(getLabelContent(0, i), 0)}
                                title="Click to edit material"
                            >
                                <div className="p-2">
                                    <ReadOnlyEditor value={getLabelContent(0, i)} />
                                </div>
                            </td>
                            ) : <td></td>
                        ) : <></>}
                        {cols[1] ? (
                         getLabelContent(1, i) ? (
                            <td 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => openEditModal(getLabelContent(1, i), 1)}
                                title="Click to edit material"
                            >
                                <div className="p-2">
                                    <ReadOnlyEditor value={getLabelContent(1, i)} />
                                </div>
                            </td>
                        ) : <td></td>
                        ) : <></>}
                        {cols[2] ? (
                            getLabelContent(2, i) ? (
                            <td 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => openEditModal(getLabelContent(2, i), 2)}
                                title="Click to edit material"
                            >
                                <div className="p-2">
                                    <ReadOnlyEditor value={getLabelContent(2, i)} />
                                </div>
                            </td>
                            ) : <td></td>
                        ) : <></>}
                        {cols[3] ? (
                            getLabelContent(3, i) ? (
                            <td 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => openEditModal(getLabelContent(3, i), 3)}
                                title="Click to edit material"
                            >
                                <div className="p-2">
                                    <ReadOnlyEditor value={getLabelContent(3, i)} />
                                </div>
                            </td>
                            ) : <td></td>
                        ) : <></>}
                        {cols[4] ? (
                            getLabelContent(4, i) ? (
                            <td 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => openEditModal(getLabelContent(4, i), 4)}
                                title="Click to edit material"
                            >
                                <div className="p-2">
                                    <ReadOnlyEditor value={getLabelContent(4, i)} />
                                </div>
                            </td>
                            ) : <td></td>
                        ) : <></>}
                        {cols[5] ? (
                            getLabelContent(5, i) ? (
                            <td 
                                className={"cursor-pointer hover:bg-gray-100"}
                                onClick={() => openEditModal(getLabelContent(5, i), 5)}
                                title="Click to edit material"
                            >
                                <div className="p-2">
                                    <ReadOnlyEditor value={getLabelContent(5, i)} />
                                </div>
                            </td>
                            ) : <td></td>
                        ) : <></>}
                    </tr>
                    ))}
                </tbody>
            </Table>
    )
}