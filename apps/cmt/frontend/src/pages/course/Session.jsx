import { Edit, Info, Trash2 } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Accordion, Card, Button, Offcanvas, Form, Table, Alert, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { CheckmarkAction} from "@se-code-bank/workflows-ecosystem/components";
import { ReadOnlyEditor, RichTextEditor } from "../../components/RichTextEditor/RichTextEditor";
import { useLinkDetection } from "../../components/RichTextEditor/useLinkDetection";
import { CMTJsonFetch } from "../../utils/api";
import { CMTDangerAlert, createErrorHandler } from "../../utils/error";

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
    const [defaultMaterialType, setDefaultMaterialType] = useState('Topic/Lecture');
    const [error, setError] = useState(null)

    /**
     * Initial GET request upon loading the page
     * Sets the correct amount of sessions and the actual sessions themselves with useful data
     * Also gets material if there is any and puts it in each session
     */
    const update = useCallback(() => 
        CMTJsonFetch('GET', `session/${id}`)
            .then(async json => {
                setSessionCount(json.sessions.length)
                setSessions(json.sessions);
                const materialsArray = json.sessionMaterials.filter(m => m.material).map(m => m.material);
                setSessionData(materialsArray.flat());
            })
            .catch(createErrorHandler("Failed to fetch session details", setError)),
    [id, setSessions, setSessionCount])
    useEffect(() => void update(), [id, update])

    if (error) return <CMTDangerAlert error={error} />

    return (
        <Accordion>
        <SessionModal sessionNum={sessionNum} sessionData={sessionData} setSessionData={setSessionData} 
        isOpen={isOpen} setIsOpen={setIsOpen} sessions={sessions} 
        courseId={courseId} defaultMaterialType={defaultMaterialType} setDefaultMaterialType={setDefaultMaterialType}/>
        <SessionEditModal sessionData={sessionData} setSessionData={setSessionData} materialId={curMaterialId} 
        isEditOpen={isEditOpen} setIsEditOpen={setIsEditOpen} courseId={courseId} 
        setDeleteOpen={setIsDeleteOpen} setMaterialId={setCurMaterialId} sessionCount={sessionCount} sessions={sessions}/>
        <DeleteModal deleteOpen={isDeleteOpen} setDeleteOpen={setIsDeleteOpen} sessionData={sessionData} setSessionData={setSessionData} setMaterialId={setCurMaterialId}
        materialId={curMaterialId} setEditModalOpen={setIsEditOpen} courseId={id} sessionNum={sessionNum}/>
        {
            Array.from({ length: sessionCount }, (_, i) => {
                const sessionAction = sessionActions?.find(sessionAction => sessionAction.processedAction.parsedMetadata.code === `SESSION_${i}`)
                let numMaterials = sessionData.filter(material => material.sessionNum === i).length;

                return (
                    <Accordion.Item eventKey={`${i}`} onClick={()=>setSessionNum(i)}>
                        <Accordion.Header>
                            <div className="flex items-center gap-2" id={`WORKFLOW_JUMPPOINT_SESSION_${i}`}>
                                {/* TODO: completion should be tracked for ALL actions in the DB in case a professor wants to create more sessions than required.
                                Currently the one type that's tracked are the additional sessions. */}
                                {sessionAction ? (
                                    <CheckmarkAction
                                        actionWithContexts={sessionAction}
                                        refresh={updateWorkflow}
                                        fetchToCallback={fetchToCallback}
                                        renderers={sessionCheckmarkRenderers}
                                        disabled={numMaterials===0}
                                    />
                                ) : <Button
                                    size="sm"
                                    variant={!sessionData.find(material => material.sessionNum === i) ? 
                                        sessions.find(session => session.sessionNum === i)?.completed ? 'outline-secondary' : 'secondary' 
                                        : sessions.find(session => session.sessionNum === i)?.completed ? 'outline-primary' : 'primary'}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        CMTJsonFetch("PUT", 
                                            `session/${sessions.find(session => session.sessionNum === i)?.id}`, 
                                            {completed: !sessions.find(session => session.sessionNum === i)?.completed}).then(() => {
                                            setSessions(sessions.map(session => {
                                                if (session.sessionNum === i){
                                                    session.completed = !session.completed;
                                                } 
                                                return session;
                                            }));
                                            })
                                    }}
                                    disabled={!sessionData.find(material => material.sessionNum === i)}
                                >
                                    {sessions.find(session => session.sessionNum === i)?.completed ? 'Mark as In-Progress' : 'Mark as Completed'}
                                </Button>}
                                <span className='text-2xl'>
                                    Session {i+1} {' '}
                                    <span className="text-xl text-gray-400">
                                        ({numMaterials > 0 ? 
                                        (numMaterials > 1 ? `${numMaterials} items` : `${numMaterials} item`) 
                                        : "No materials"})
                                    </span>
                                </span>
                            </div>
                        </Accordion.Header>
                        <Accordion.Body>
                            { sessionData.find(data => data.sessionNum === i) ?
                            <SessionTable sessionData={sessionData} sessionNum={i} setIsCreateOpen={setIsOpen} 
                            setIsEditOpen={setIsEditOpen} setMaterialId={setCurMaterialId} setDefaultMaterialType={setDefaultMaterialType}/> :
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
                variant={props.disabled ? 
                    props.checked ? 'outline-secondary' : 'secondary' 
                    : props.checked ? 'outline-primary' : 'primary'}
                onClick={props.onClick}
                disabled={props.disabled}
            >
                {props.checked ? 'Mark as In-Progress' : 'Mark as Completed'}
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
 * @param {React.Dispatch<SetStateAction<boolean>>} props.setIsOpen - open/close the modal
 * @param {Array} props.sessions - the sessions the user has created
 * @param {string} props.courseId - the course ID for resource linking
 * @param {string} props.defaultMaterialType - What the material type dropdown should start as. Default is Topic/Lecture
 * @param {React.Dispatch<SetStateAction<string>>} props.setDefaultMaterialType - state setter for defaultMaterialType
 * @returns {React.ReactElement} the modal as HTML
 */
export function SessionModal({ sessionNum, sessionData, setSessionData, 
    isOpen, setIsOpen, sessions, 
    courseId, defaultMaterialType, setDefaultMaterialType }) {
    const [itemLabel, setItemLabel] = useState('');
    const [itemBody, setItemBody] = useState('');
    const [itemType, setItemType] = useState(defaultMaterialType);
    const [error, setError] = useState('');
    const [titleEditor, setTitleEditor] = useState(null);
    const hasLinksInTitle = useLinkDetection(titleEditor);

    const resetForm = useCallback(() => {
        setDefaultMaterialType('Topic/Lecture');
        setItemLabel('');
        setItemBody('');
        setError('');
    }, [setDefaultMaterialType])

    const uploadSessionMaterial = useCallback(() => {
        const id = sessions.find(session => session.sessionNum === sessionNum + 1).id
        return CMTJsonFetch('POST', `/session/${id}`, { itemType, itemLabel, itemBody: hasLinksInTitle ? undefined : itemBody, sessionNum })
            .then(async json => {
                setSessionData(sessionData => [...sessionData, json.material])
                setIsOpen(false)
                resetForm()
            })
            .catch(createErrorHandler("Error uploading material", setError))
    }, [hasLinksInTitle, itemBody, itemLabel, itemType, resetForm, sessionNum, sessions, setIsOpen, setSessionData])

    function handleClose() {
        setIsOpen(false);
        resetForm();
    }

    const titleTip = (
        <Tooltip>
            On your course site, the title will be a link and lead to your content. If you add a resource or a link, it'll act as an external link that leads to a new page.
        </Tooltip>
    );

    const contentTip = (
        <Tooltip>
            On your course site, a non-linked title will display as a link and when clicked, it'll open a page that contains the content as HTML.
        </Tooltip>
    );

    return (
        <Offcanvas
            show={isOpen}
            onShow={() => setItemType(defaultMaterialType)}
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
                                <Form.Label>Material Column</Form.Label>
                                <Form.Select onChange={e => setItemType(e.target.value)} value={itemType} defaultValue={defaultMaterialType}>
                                    <option>Topic/Lecture</option>
                                    <option>Class Activity</option>
                                    <option>Reading/Resources</option>
                                    <option>Projects & Practica</option>
                                    <option>Group Assignment</option>
                                    <option>Individual Assignment</option>
                                    {!sessionData.find(data => data.sessionNum === sessionNum && data.type === 'Personal Notes') ? <option value="Personal Notes">Your Personal Notes (Hidden from students)</option> : <></>}
                                </Form.Select>
                            </div>

                            <div className="mb-3">
                                <Form.Label className="flex gap-1 items-center">
                                    Title (Required) 
                                    <OverlayTrigger delay={100} trigger={'hover'} placement="bottom" overlay={titleTip}>
                                        <Info size={18}/>
                                    </OverlayTrigger>
                                </Form.Label>
                                <RichTextEditor 
                                    value={itemLabel} 
                                    onChange={setItemLabel} 
                                    courseId={parseInt(courseId)} 
                                    isBody={false} 
                                    onEditor={setTitleEditor}
                                />
                            </div>

                            <div className="mb-3">
                                <Form.Label className="flex gap-1 items-center">
                                    Page Content 
                                    <OverlayTrigger delay={100} trigger={'hover'} placement="bottom" overlay={contentTip}>
                                        <Info size={18}/>
                                    </OverlayTrigger>
                                </Form.Label>
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
                            onClick={async e => {
                                e.preventDefault()
                                if (itemLabel) {
                                    uploadSessionMaterial()
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
    const [error, setError] = useState(null)
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
        const sessionId = sessions.find(session => session.sessionNum === (realSessionNum+1))?.id;
        CMTJsonFetch("PUT", `/session/material/${materialId}`, {itemLabel, itemBody: realItemBody, itemType, sessionNum: realSessionNum, sessionId})
            .then(() => {
                const sessionDataCopy = sessionData.map(material => {
                    if (material.id === materialId) 
                        return {...material, label: itemLabel, body: realItemBody, type: itemType, sessionNum: realSessionNum, sessionId}
                    return material
                });
                setSessionData(sessionDataCopy);
                setIsEditOpen(false);
                resetForm();
            })
            .catch(createErrorHandler("Error updating resource", setError))
    }

    const titleTip = (
        <Tooltip>
            On your course site, the title will be a link and lead to your content. If you add a resource or a link, it'll act as an external link that leads to a new page.
        </Tooltip>
    );

    const contentTip = (
        <Tooltip>
            On your course site, a non-linked title will display as a link and when clicked, it'll open a page that contains the content as HTML.
        </Tooltip>
    );

    return (
        <Offcanvas
            onShow={() => {
                setItemLabel(curMaterial?.label ?? "");
                setItemBody(curMaterial?.body ?? "");
                setItemType(curMaterial?.type ?? "Topic/Lecture");
                setSessionNum(`Session ${(curMaterial?.sessionNum ?? 0) + 1}`);
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
                    <CMTDangerAlert error={error} />
                    <Form onSubmit={updateMaterial}>
                        <div className='flex'>
                            <div className='w-full'>
                                <div className={`${sessionData.find(material => material.id === materialId && material.type === "Personal Notes") ? 'hidden' : ''}`}>
                                    <div>
                                        <Form.Label>Material Column</Form.Label>
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
                                    <Form.Label className="flex gap-1 items-center">
                                        Title (Required) 
                                        <OverlayTrigger delay={100} trigger={'hover'} placement="bottom" overlay={titleTip}>
                                            <Info size={18}/>
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <RichTextEditor 
                                        value={itemLabel} 
                                        onChange={setItemLabel} 
                                        courseId={parseInt(courseId)} 
                                        isBody={false}
                                        onEditor={setTitleEditor}
                                    />
                                </div>
                                <div className="mb-3">
                                    <Form.Label className="flex gap-1 items-center">
                                        Page Content 
                                        <OverlayTrigger delay={100} trigger={'hover'} placement="bottom" overlay={contentTip}>
                                            <Info size={18}/>
                                        </OverlayTrigger>
                                    </Form.Label>
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
 * @param {(isCreateOpen: Boolean) => void} props.setIsCreateOpen - opens/closes the creation modal. We only open here.
 * @param {(isEditOpen: Boolean) => void} props.setIsEditOpen - opens/closes the edit modal. We only open here.
 * @param {(materialId: Number) => void} props.setMaterialId - sets the id of the material we're working with.
 * @param {(defaultMaterialType: string) => void} props.setDefaultMaterialType - sets the default material type depending on where the user clicked. Used for the creation modal.
 * @returns {React.ReactElement} the table in HTML
 */
function SessionTable( {sessionData, sessionNum, setIsCreateOpen, setIsEditOpen, setMaterialId, setDefaultMaterialType } ) {
    const [cols, setCols] = useState(Array.of(0,0,0,0,0,0,0));
    const allCols = useMemo(() => ["Topic/Lecture", "Class Activity", "Reading/Resources", "Projects & Practica", "Group Assignment", "Individual Assignment"], []);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

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
        return isPreviewMode ? 1 : maxRows;
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

        if (index === -1)
            return labels.map(label => label.label).join('\n');

        if (labels[index])
            return labels[index].label
        return ""
    }

    function openSessionModal(text, col){
        // Not a foolproof way to find ID but it should match closely. It'd take a bunch of refactoring to be exact...
        const id = sessionData.find(session => session.sessionNum === sessionNum && session.label === text && session.type === allCols[col])?.id;
        if (!id){
            setDefaultMaterialType(allCols[col]);
            setIsCreateOpen(true);
        }
        else {
            setIsEditOpen(true);
            setMaterialId(id);
        }
    }

    return (
        <>
        <div className="flex justify-end mb-3">
            <Button variant="info" onClick={() => setIsPreviewMode(prev => !prev)}>{isPreviewMode ? 'Edit View' : 'Preview View'}</Button>
        </div>
        <Table bordered>
            <thead className={`${isPreviewMode ? '[&>tr>th]:text-white [&>tr>th]:font-bold [&>tr>th]:bg-[#0484c9] text-center' : ''}`}>
                <tr>
                    {isPreviewMode && <th>Session</th>}
                    {(cols[0] || !isPreviewMode) && <th>Topic/Lecture</th> }
                    {(cols[1] || !isPreviewMode) && <th>Class Activity</th> }
                    {(cols[2] || !isPreviewMode) && <th>Reading/Resources</th> }
                    {(cols[3] || !isPreviewMode) && <th>Projects & Practica</th>}
                    {(cols[4] || !isPreviewMode) && <th>Group Assignment</th> }
                    {(cols[5] || !isPreviewMode) && <th>Individual Assignment</th> }
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: determineRows() }, (_, i) => (
                <tr> 
                    {isPreviewMode && <td className="font-bold text-center">{sessionNum+1}</td>}
                    {(cols[0] || !isPreviewMode) ? ( // Topic/Lecture
                        <td 
                            className={`${!isPreviewMode ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                            onClick={() => {if (!isPreviewMode) openSessionModal(getLabelContent(0, i), 0)}}
                            title="Click to edit material"
                        >
                            <div className="p-2">
                                <ReadOnlyEditor value={getLabelContent(0, (isPreviewMode ? -1 : i))} />
                            </div>
                        </td>
                    ) : <></>}
                    {(cols[1] || !isPreviewMode) ? ( // Class Activity
                        <td 
                            className={`${!isPreviewMode ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                            onClick={() => {if (!isPreviewMode) openSessionModal(getLabelContent(1, i), 1)}}
                            title="Click to edit material"
                        >
                            <div className="p-2">
                                <ReadOnlyEditor value={getLabelContent(1, (isPreviewMode ? -1 : i))} />
                            </div>
                        </td>
                    ) : <></>}
                    {(cols[2] || !isPreviewMode) ? ( // Reading/Resources
                        <td 
                            className={`${!isPreviewMode ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                            onClick={() => {if (!isPreviewMode) openSessionModal(getLabelContent(2, i), 2)}}
                            title="Click to edit material"
                        >
                            <div className="p-2">
                                <ReadOnlyEditor value={getLabelContent(2, (isPreviewMode ? -1 : i))} />
                            </div>
                        </td>
                    ) : <></>}
                    {(cols[3] || !isPreviewMode) ? ( // Projects & Practica
                        <td 
                            className={`${!isPreviewMode ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                            onClick={() => {if (!isPreviewMode) openSessionModal(getLabelContent(3, i), 3)}}
                            title="Click to edit material"
                        >
                            <div className="p-2">
                                <ReadOnlyEditor value={getLabelContent(3, (isPreviewMode ? -1 : i))} />
                            </div>
                        </td>
                    ) : <></>}
                    {(cols[4] || !isPreviewMode) ? ( // Group Assignment
                        <td 
                            className={`${!isPreviewMode ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                            onClick={() => {if (!isPreviewMode) openSessionModal(getLabelContent(4, i), 4)}}
                            title="Click to edit material"
                        >
                            <div className="p-2">
                                <ReadOnlyEditor value={getLabelContent(4, (isPreviewMode ? -1 : i))} />
                            </div>
                        </td>
                    ) : <></>}
                    {(cols[5] || !isPreviewMode) ? ( // Individual Assignment
                        <td 
                            className={`${!isPreviewMode ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                            onClick={() => {if (!isPreviewMode) openSessionModal(getLabelContent(5, i), 5)}}
                            title="Click to edit material"
                        >
                            <div className="p-2">
                                <ReadOnlyEditor value={getLabelContent(5, (isPreviewMode ? -1 : i))} />
                            </div>
                        </td>
                    ) : <></>}
                </tr>
                ))}
            </tbody>
        </Table>
        </>
    )
}