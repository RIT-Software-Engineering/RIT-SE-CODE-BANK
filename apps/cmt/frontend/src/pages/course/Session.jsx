import { Edit, Trash2 } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Accordion, Card, Button, Offcanvas, Form, Table, Alert, Modal } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { CheckmarkAction} from "@se-code-bank/workflows-ecosystem/components";
import { ReadOnlyEditor, RichTextEditor } from "../../components/RichTextEditor/RichTextEditor";
import { useLinkDetection } from "../../components/RichTextEditor/useLinkDetection";
import { CMTJsonFetch } from "../../utils/api";
import { CMTDangerAlert, LogError } from "../../utils/error";

/**
 * @import { FetchToCallback } from "@se-code-bank/workflows-ecosystem"
 * @import { SetStateAction } from "react"
 */

/**
 * A session component, maintains sessionData, whether the session modal is open, and the current session selected.
 * The session component is an accordion that dynamically adds more items the higher the count. 
 * Displays a modal (when opened) and a table of uploaded resources. 
 *
 * @param {Object} props
 * @param {Number} props.sessionCount - the number of sessions a user has created
 * @param {(sessionCount: Number) => void} props.setSessionCount - sets the number of sessions the user has created
 * @param {Array} props.sessions - the sessions
 * @param {(sessions: Array) => void} props.setSessions - sets the sessions the user has created
 * @param {any} props.sessionActions
 * @param {() => void} props.updateWorkflow 
 * @param {FetchToCallback} props.fetchToCallback 
 * @param {string} props.courseId - the identifier for which sessionData to obtain
 * @returns {React.ReactElement} the session accordion as HTML
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
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [curMaterialId, setCurMaterialId] = useState(0);

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
        <SessionEditModal sessionData={sessionData} setSessionData={setSessionData} materialId={curMaterialId} 
        isEditOpen={isEditOpen} setIsEditOpen={setIsEditOpen} courseId={courseId} 
        setDeleteOpen={setIsDeleteOpen} setMaterialId={setCurMaterialId} sessionCount={sessionCount} sessions={sessions}/>
        <DeleteModal deleteOpen={isDeleteOpen} setDeleteOpen={setIsDeleteOpen} sessionData={sessionData} setSessionData={setSessionData} setMaterialId={setCurMaterialId}
        materialId={curMaterialId} setEditModalOpen={setIsEditOpen} courseId={id} sessionNum={sessionNum}/>
        {
            Array.from({ length: sessionCount }, (_, i) => {
                const sessionAction = sessionActions?.find(sessionAction => sessionAction.processedAction.parsedMetadata.code === `SESSION_${i}`)
                
                return (
                    <Accordion.Item eventKey={`${i}`} onClick={()=>setSessionNum(i)}>
                        <Accordion.Header>
                            <div className="flex items-center gap-2" id={`WORKFLOW_JUMPPOINT_SESSION_${i}`}>
                                {/* TODO: completion should be tracked in the DB in case a professor wants to create more sessions than required */}
                                {sessionAction && (
                                    <CheckmarkAction
                                        actionWithContexts={sessionAction}
                                        refresh={updateWorkflow}
                                        fetchToCallback={fetchToCallback}
                                        renderers={sessionCheckmarkRenderers}
                                    />
                                )}
                                <span className='text-2xl'>Session {i+1}</span>
                            </div>
                        </Accordion.Header>
                        <Accordion.Body>
                            { sessionData.find(data => data.sessionNum === i) ?
                            <SessionTable sessionData={sessionData} sessionNum={i} setIsEditOpen={setIsEditOpen} setMaterialId={setCurMaterialId}/> :
                            <div className='flex justify-center'><p className='text-xl'>Nothing here yet!</p></div>
                            }
                            { sessionData.find(data => data.sessionNum === i && data.type==="Personal Notes") ?
                            <Card>
                                <Card.Body className='group max-h-96 overflow-y-scroll'>
                                    <Card.Title>
                                        <div className='flex justify-between'>
                                            <div><ReadOnlyEditor value={sessionData.find(data => data.sessionNum === i && data.type==="Personal Notes").label} /></div>
                                            <div className='flex justify-end size-10 opacity-0 group-hover:!opacity-100 group-hover:text-white'>
                                                <Button variant='outline-dark' onClick={(e) => {
                                                setCurMaterialId(sessionData.find(material => material.type === "Personal Notes" && material.sessionNum === i).id);
                                                setIsEditOpen(true);
                                                e.currentTarget.style.opacity = "100";
                                                }}><Edit /></Button>
                                                <Button className="ml-3" variant="outline-danger" onClick={(e) => {
                                                setCurMaterialId(sessionData.find(material => material.type === "Personal Notes" && material.sessionNum === i).id);
                                                setIsDeleteOpen(true);
                                                e.currentTarget.style.opacity = "100";
                                                }}><Trash2 /></Button>
                                            </div>
                                        </div>
                                    </Card.Title>
                                    <Card.Text>
                                        <ReadOnlyEditor value={sessionData.find(data => data.sessionNum === i && data.type==="Personal Notes").body} />
                                    </Card.Text>
                                </Card.Body>
                            </Card> : <></>
                            }
                            <div className='flex justify-between pt-3'>
                                <div className={`justify-start ${sessionData.find(data => data.sessionNum === i) ? 'visible' : 'invisible'}`}>
                                    <Button variant='outline-danger' onClick={()=>setIsDeleteOpen(true)}>Delete All Material</Button>
                                </div>
                                <div className="justify-end">
                                    <Button onClick={() => setIsOpen(true)}>Add Material</Button>
                                </div>
                            </div>
                        </Accordion.Body>
                    </Accordion.Item>
                )
            })
        }
      </Accordion>
  );
}

const sessionCheckmarkRenderers = {
    NavigateButton: function SessionNavigateButton(props) {
        return <Button onClick={props.onClick}>{props.children}</Button>
    },
    CheckmarkAction: function SessionCheckmarkButton(props) {
        return (
            <Button
                size="sm"
                variant={props.checked ? 'outline-secondary' : 'primary'}
                onClick={props.onClick}
            >
                {props.checked ? 'Done' : 'Mark Done'}
            </Button>
        )
    }
}

/**
 * Modal to delete session material.
 * Will either delete all material for a singular session, or a single session material item.
 *
 * @param {Object} props 
 * @param {Boolean} props.deleteOpen - Boolean to check if the modal is open
 * @param {(deleteOpen: Boolean) => void} props.setDeleteOpen - State setter to hide the modal
 * @param {Array} props.sessionData - Session Data. Used for removing the recently deleted elements
 * @param {(sessionData: Array) => void} props.setSessionData - State setter for session data
 * @param {(materialId: Number) => void} props.setMaterialId - Setter for the current material (if any)
 * @param {Number} props.materialId - Delete a single session material. Will have a number if deleting an item, but will be 0 otherwise
 * @param {(editModalOpen: Boolean) => void} props.setEditModalOpen - Used to close the edit modal if deleting a single item
 * @param {string} props.courseId - Used to delete all of a session's material. Unused if deleting a single item
 * @param {Number} props.sessionNum - Used to delete all of a session's material. Unused if deleting a single item
 * @returns {React.ReactElement} 
 */
function DeleteModal({deleteOpen, setDeleteOpen, sessionData, setSessionData, setMaterialId,
    materialId, setEditModalOpen, 
    courseId, sessionNum}){
    const deleteSeveral = () => {
        console.log('deleting multiple items!')
         CMTJsonFetch('DELETE', `session/${courseId}/${sessionNum+1}`).then(async response => {
            const data = await response.json();
            const ids = data.materials.map(item => item.id)
            const sessionDataCopy = sessionData.map(material => {
                if (ids.includes(material.id)) 
                    return {};

                return material;
            });
            setSessionData(sessionDataCopy);
        });
        setDeleteOpen(false);
    };

    const deleteSingle = () => {
        console.log("deleting a single item")
         CMTJsonFetch("DELETE", `/session/material/${materialId}`).then(() => {
            const sessionDataCopy = sessionData.map(material => {
                if (material.id === materialId) 
                    return {};

                return material;
            });
            setSessionData(sessionDataCopy);
        });
        setEditModalOpen(false);
        setDeleteOpen(false);
        setMaterialId(0);
    };

    return (<>
    <Modal show={deleteOpen} onHide={() => setDeleteOpen(false)} centered>
        <Modal.Header>Delete Material</Modal.Header>
        <Modal.Body>
            <Alert variant="danger">
                <h2>Warning!</h2>
                <p>
                    Confirming will delete {!materialId ? 'ALL of' : ''} the session material you've created! 
                    Are you sure you want to continue?
                    This cannot be undone!
                </p>
            </Alert>
            <div className="flex justify-between">
                <Button className="justify-start" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button className="justify-end" variant="danger"
                onClick={() => {
                    if (!materialId)
                        deleteSeveral();
                    else
                        deleteSingle();
                }}>Delete {!materialId ? 'All Materials' : 'Item'}</Button>
            </div>
        </Modal.Body>
    </Modal>
    </>)
}

/**
 * The modal to create session material. 
 * The modal makes the user select the material type, material title and they can add material content.
 *
 * @param {Object} props 
 * @param {Number} props.sessionNum - the number of the session (used as an identifier in sessionData)
 * @param {Array} props.sessionData - the data of sessions in a course. Used to check if a user has created a personal note or not since we restrict to 1 note per session
 * @param {React.Dispatch<SetStateAction<Object[]>>} props.setSessionData - function to set the sessionData. Used upon upload to keep track of the session
 * @param {Boolean} props.isOpen - whether the modal is open
 * @param {(isOpen: Boolean) => void} props.setIsOpen - open/close the modal
 * @param {Array} props.sessions - the sessions the user has created
 * @param {string} props.courseId - the course ID for resource linking
 * @returns {React.ReactElement} the modal as HTML
 */
export function SessionModal({ sessionNum, sessionData, setSessionData, isOpen, setIsOpen, sessions, courseId }) {
    const [itemLabel, setItemLabel] = useState('');
    const [itemBody, setItemBody] = useState('');
    const [itemType, setItemType] = useState('Topic/Lecture');
    const [error, setError] = useState('');
    const [titleEditor, setTitleEditor] = useState(null);
    const hasLinksInTitle = useLinkDetection(titleEditor);

    const uploadSessionMaterial = useCallback(() => {
        const id = sessions.find(session => session.sessionNum === sessionNum + 1).id
        CMTJsonFetch('POST', `/session/${id}`, { itemType, itemLabel, itemBody: hasLinksInTitle ? undefined : itemBody, sessionNum })
            .then(async response => {
                const data = await response.json();
                setSessionData(sessionData => [...sessionData, data.material]);
            })
            .catch(error => LogError("Error uploading material", error, setError))
    }, [hasLinksInTitle, itemBody, itemLabel, itemType, sessionNum, sessions, setSessionData])

    function resetForm() {
        setItemType('Topic/Lecture');
        setItemLabel('');
        setItemBody('');
        setError('');
    }

    function handleClose() {
        setIsOpen(false);
        resetForm();
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
                                    courseId={parseInt(courseId)} 
                                    isBody={false} 
                                    onEditor={setTitleEditor}
                                />
                            </div>

                            <div className="mb-3">
                                <Form.Label>Content</Form.Label>
                                <RichTextEditor 
                                    value={itemBody} 
                                    onChange={setItemBody} 
                                    courseId={parseInt(courseId)} 
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
 * @param {Object} props 
 * @param {Array} props.sessionData - the data of material in sessions. Used to get the existing content for editing
 * @param {(sessionData: Array) => void} props.setSessionData - sets the material for a session; in this case it updates it
 * @param {Number} props.materialId - the ID of the material. Used mainly for the PUT request to know which item to update
 * @param {Boolean} props.isEditOpen - whether the edit modal is open or not
 * @param {(isEditOpen: Boolean) => void} props.setIsEditOpen - sets the edit modal to be either opened or closed
 * @param {string} props.courseId - the course ID for resource linking
 * @param {(deleteOpen: Boolean) => void} props.setDeleteOpen - sets the delete modal to be either opened or closed
 * @param {(materialId: Number) => void} props.setMaterialId - sets the material id we're working with. We turn it to 0 upon closing.
 * @param {Number} props.sessionCount 
 * @param {Array} props.sessions
 * @returns {React.ReactElement} the modal as HTML
 */
function SessionEditModal({ sessionData, setSessionData, materialId, 
    isEditOpen, setIsEditOpen, courseId, 
    setDeleteOpen, setMaterialId, sessionCount, sessions }){
    const curMaterial = sessionData.find(material => material.id === materialId);
    
    const [itemLabel, setItemLabel] = useState(curMaterial?.label ?? "");
    const [itemBody, setItemBody] = useState(curMaterial?.body ?? "");
    const [itemType, setItemType] = useState(curMaterial?.type ?? "Topic/Lecture");
    const [sessionNum, setSessionNum] = useState(`Session ${(curMaterial?.sessionNum ?? 0) + 1}`);
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
        setMaterialId(0); // reset so we don't delete only one material upon mass deletion
    }

    function updateMaterial(){
        const realItemBody = hasLinksInTitle ? '' : itemBody;
        const realSessionNum = parseInt(sessionNum.replace("Session ", ""))-1;
        const sessionId = sessions.find(session => session.sessionNum === realSessionNum)?.id;
        CMTJsonFetch("PUT", `/session/material/${materialId}`, {itemLabel, itemBody: realItemBody, itemType, sessionNum: realSessionNum, sessionId}).then(() => {
            const sessionDataCopy = sessionData.map(material => {
                if (material.id === materialId) 
                    return {...material, label: itemLabel, body: realItemBody, type: itemType, sessionNum: realSessionNum, sessionId}
                return material
            });
            setSessionData(sessionDataCopy);
        });
    }

    return (
        <Offcanvas
            onShow={() => {
                setItemLabel(curMaterial?.label ?? "");
                setItemBody(curMaterial?.body ?? "");
                setItemType(curMaterial?.type ?? "Topic/Lecture");
                setSessionNum(`Session ${(curMaterial?.sessionNum ?? 0) + 1}`);
                console.log(`Session ${(curMaterial?.sessionNum ?? 0) + 1}`)
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
        
                    <Alert variant="danger" className={`${warningVisible ? 'block' : 'hidden'}`}>Material needs to have a title!</Alert>
                    <Form onSubmit={updateMaterial}>
                        <div className='flex'>
                            <div className='w-full'>
                                <div className={`${sessionData.find(material => material.id === materialId && material.type === "Personal Notes") ? 'hidden' : ''}`}>
                                    <div>
                                        <Form.Label>Material Type</Form.Label>
                                        <Form.Select onChange={e => setItemType(e.target.value)} value={itemType}>
                                            <option>Topic/Lecture</option>
                                            <option>Class Activity</option>
                                            <option>Reading/Resources</option>
                                            <option>Projects & Practica</option>
                                            <option>Group Assignment</option>
                                            <option>Individual Assignment</option>
                                        </Form.Select>
                                    </div>

                                    <div className="mb-3">
                                        <Form.Label>Session</Form.Label>
                                        <Form.Select onChange={e => setSessionNum(e.target.value)} value={sessionNum}>
                                            {Array.from({ length: sessionCount }, (_, i) => {
                                                return <option>Session {i+1}</option>
                                            })}
                                        </Form.Select>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <Form.Label>Title</Form.Label>
                                    <RichTextEditor 
                                        value={itemLabel} 
                                        onChange={setItemLabel} 
                                        courseId={parseInt(courseId)} 
                                        isBody={false}
                                        onEditor={setTitleEditor}
                                    />
                                </div>
                                <div className="mb-3">
                                    <Form.Label>Content</Form.Label>
                                    <RichTextEditor 
                                        value={itemBody} 
                                        onChange={setItemBody} 
                                        courseId={parseInt(courseId)} 
                                        isBody={true}
                                        disabled={hasLinksInTitle}
                                    />
                                    {hasLinksInTitle && <Alert variant="warning" className="my-2">Content editor is disabled because the title contains links. If a title contains a link, material content will be ignored.</Alert>}
                                </div>
                            </div>
                        </div>
                        <div className='flex justify-between pt-4'>
                            <div className="justify-start">
                                <Button variant="danger" type="submit"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setDeleteOpen(true);
                                }}>Delete Item</Button>
                            </div>
                            <div className="justify-end">
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
 * @param {Object} props 
 * @param {Array} props.sessionData - the data that contains the materials
 * @param {Number} props.sessionNum - the identifying session number to only get data from that specific session
 * @param {(isEditOpen: Boolean) => void} props.setIsEditOpen - opens/closes the edit modal. We only open here.
 * @param {(materialId: Number) => void} props.setMaterialId - sets the id of the material we're working with.
 * @returns {React.ReactElement} the table in HTML
 */
function SessionTable( {sessionData, sessionNum, setIsEditOpen, setMaterialId} ) {
    const [cols, setCols] = useState(Array.of(0,0,0,0,0,0,0));
    const allCols = useMemo(() => ["Topic/Lecture", "Class Activity", "Reading/Resources", "Projects & Practica", "Group Assignment", "Individual Assignment"], []);
    
    /** Checks if there's any data in any of the columns and show them.
     * There's a bunch of columns so it's mainly just to reduce how much is shown
     */
    useEffect(() => {
        sessionData.forEach(data => {
            const i = allCols.indexOf(data.type);
            if (cols[i] === 0)
                setCols([...cols.slice(0, i), 1, ...cols.slice(i+1)]);
        }
        )
    }, [sessionData, allCols, cols, setCols])

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
        setMaterialId(id);
    }

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
                        {cols[0] ? ( // Topic/Lecture
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
                        {cols[1] ? ( // Class Activity
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
                        {cols[2] ? ( // Reading/Resources
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
                        {cols[3] ? ( // Projects & Practica
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
                        {cols[4] ? ( // Group Assignment
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
                        {cols[5] ? ( // Individual Assignment
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
