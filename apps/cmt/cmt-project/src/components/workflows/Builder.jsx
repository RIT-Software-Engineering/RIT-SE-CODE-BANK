import { Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { Accordion, Button, Card, Form, Modal } from "react-bootstrap";

/**
 * Component for top-level workflows
 * This component has a modal that can act as both a creation modal and editing modal
 * Since different projects have different needs, extra data can be passed in 
 * This also means that custom functions to submit and edit need to be passed in
 *
 * @param {Object} props
 * @param {Boolean} props.isOpen - whether the modal is open or not
 * @param {(isOpen: Boolean) => void} props.setIsOpen - state setter for the modal being open
 * @param {Array} props.workflows - the top-level workflows 
 * @param {(workflows: Array) => void} props.setWorkflows - state setter for the top-level workflows
 * @param {Function} props.WorkflowSubmit - function to submit the workflow
 * @param {Object} props.curWorkflow - the current workflow, used for editing purposes. null if not editing
 * @param {Boolean} props.isEdit - whether the user is currently editing
 * @param {(isEdit: Boolean) => void} props.setIsEdit - state setter for whether the user is editing
 * @param {Function} props.workflowEditSubmit - function to edit the workflow
 * @param {Object} props.extraData - any extra data that may need to be passed in when submitting
 * @param {() => void} props.clearFunction - function to clear any extra data when exiting the modal
 * @param {() => void} props.loadFunction - function to load any extra data when loading the modal while editing
 * @param {*} props.children - customizable part of the form for any extra data
 */
export function WorkflowModal( {isOpen, setIsOpen, workflows, setWorkflows, 
    WorkflowSubmit, curWorkflow ,isEdit, setIsEdit, 
    workflowEditSubmit, extraData, loadFunction, clearFunction, children} ){

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');

    // Called when finished submitting or exiting the modal
    function clearForm(){
        setName('');
        setDescription('');
        setTags('');
        setIsEdit(false);
        setError('');
        clearFunction();
    }

    // Loads data from the current workflow. Only called on edit.
    function loadForm(){
        setName(curWorkflow.name?.trim());
        setDescription(curWorkflow.description?.trim());
        setTags(curWorkflow.tags?.join(", "));
        loadFunction();
    }

    async function submitWorkflow(){
        // Splits the tags by commas (and the spaces if there are any)
        const uploadTags = tags ? tags.split(/, ?/).map(tag => tag.trim()) : [];
        const submission = await WorkflowSubmit(name, description, uploadTags, workflows, setWorkflows, extraData, setError);
        // Only clear the form and close the modal if we succeeded in our submission
        if (submission === "Good"){
            clearForm();
            setIsOpen(false);
        }
    }

    async function editWorkflow(){
        // Splits the tags by commas (and the spaces if there are any)
        const uploadTags = tags ? tags?.split(/, ?/).map(tag => tag.trim()) : [];
        const submission = await workflowEditSubmit(name, description, uploadTags, workflows, setWorkflows, extraData, setError, curWorkflow);
        // Only clear the form and close the modal if we succeeded in our edit
        if (submission === "Good"){
            clearForm();
            setIsOpen(false);
        }
    }

    return (<>
    <Modal size="lg" show={isOpen} onShow={()=>{if (isEdit){loadForm()}}} centered onHide={()=>{setIsOpen(false); clearForm()}} onExit={()=>{setIsOpen(false);clearForm()}}>
        <Modal.Header closeButton>{isEdit ? 'Edit': 'New'} Workflow</Modal.Header>
        <Modal.Body>
            {error ? 
            <div className="alert alert-danger">
                {error}
            </div>
            : <></>}
            <Form>
                <div>
                    <Form.Label>Workflow Name</Form.Label>
                    <Form.Control required onChange={e=>setName(e.target.value)} defaultValue={isEdit ? curWorkflow.name : ""}/>
                    <Form.Label>Workflow Description</Form.Label>
                    <Form.Control required onChange={e=>setDescription(e.target.value)} defaultValue={isEdit ? curWorkflow.description : ""}/>
                    <Form.Label>Workflow Tags (Seperate by commas)</Form.Label>
                    <Form.Control required onChange={e=>setTags(e.target.value)} defaultValue={isEdit ? curWorkflow.tags : ""}/>
                    {children}
                </div>
                
                <div className="flex pt-2 justify-end">
                    <Button type="submit" onClick={(e) => {
                        e.preventDefault();
                        if (isEdit)
                            editWorkflow();
                        else
                            submitWorkflow();
                    }}>{isEdit ? "Submit" : "Add Workflow"}</Button>
                </div>
            </Form>
        </Modal.Body>
    </Modal>
    </>)
}

/**
 * Component for all things actions. Works for simple, complex, and workflow actions (branching actions are not supported.)
 * This component has a modal that can act as both a creation modal and an editing modal
 * Since different projects have different needs, extra data can be passed in
 * This also mean that custom functions to submit and edit need to be passed in
 * 
 * @param {Object} props
 * @param {Boolean} props.isOpen - whether the modal is open or not
 * @param {(isOpen: Boolean) => void} props.setIsOpen - state setter for the modal being open
 * @param {Number} props.index - the current top-level workflow the user is working in
 * @param {Array} props.workflows - the top-level workflows
 * @param {(workflows: Array) => void} props.setWorkflows - state setter for the top-level workflows
 * @param {string} props.parentId - the ID of the parent where the action is being created (may be null)
 * @param {Number} props.depthLevel - the depth level of the action being created. Needed to prevent too many layers and going too deep into a workflow
 * @param {(depthLevel: Number) => void} props.setDepthLevel - state setter for the depth level
 * @param {Boolean} props.isEdit - whether the user is currently editing
 * @param {(isEdit: Boolean) => void} props.setIsEdit - state setter for whether the user is editing
 * @param {Object} props.curAction - the current action. Used for editing purposes, will be null if not editing.
 * @param {() => void} props.refresh - a function to refresh the page. Can be used to avoid tricky logic and rely on the API
 * @param {Function} props.addAction - function to submit a simple or complex action
 * @param {Function} props.addWorkflowAction - function to submit a workflow action
 * @param {Function} props.editAction - function to edit a simple or complex action
 * @param {Function} props.editWorkflowActionFunction - function to edit a workflow action
 * @param {() => void} props.loadFunction - function to load any extra data when loading the modal while editing
 * @param {() => void} props.clearFunction - function to clear any extra data when exiting the modal
 * @param {Object} props.extraData - any extra data that may need to be passed in when submitting
 * @param {*} props.children - customizable part of the form for any extra data
 */
export function ActionModal({isOpen, setIsOpen, index, workflows, setWorkflows, parentId, 
    depthLevel, setDepthLevel, isEdit, setIsEdit, curAction, refresh,
    addAction, addWorkflowAction, editAction, editWorkflowActionFunction,
    loadFunction, clearFunction, extraData, children}){

    const [actionType, setActionType] = useState("simple");
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false); // Used to prevent double-submitting for actions that may take longer to submit
    const [error, setError] = useState('');

    // Called when finished submitting or exiting the modal
    function clearForm(){
        setName('');
        setDescription('');
        setActionType('simple');
        setDepthLevel(depthLevel-1); // Remove a depth layer of one since we're done in the modal
        setError('');
        clearFunction();
    }

    /** Loads data from the current action. Only called on edit. */
    function loadForm(){
        setName(curAction.name);
        setDescription(curAction.description);
        setActionType(curAction.actionType);
        loadFunction();
    }


    async function addStandardAction(e){
        e.preventDefault();
        setLoading(true);
        // TODO maybe make more generic so it's an almost empty function being passed?
        const submission = await addAction(index, workflows, setWorkflows, name, description, actionType, parentId, extraData, setError, refresh);
        setLoading(false);
        if (submission === "Good"){
            clearForm();
            setIsOpen(false);
        }
    }

    async function editSimpleOrComplexAction(e){
        e.preventDefault();
        setLoading(true);
        // TODO maybe make more generic so it's an almost empty function being passed?
        const submission = await editAction(name, description, curAction, extraData, setError, refresh);
        setLoading(false);
        if (submission === "Good"){
            clearForm();
            setIsOpen(false);
        }
    }

    async function createWorkflowAction(e){
        e.preventDefault();
        setLoading(true);
        // TODO maybe make more generic so it's an almost empty function being passed?
        await addWorkflowAction(index, name, description, workflows, setWorkflows, parentId, refresh).then(()=>{
            clearForm();
            setIsOpen(false);
            setLoading(false);
        })
    }

    async function editWorkflowAction(e){
        e.preventDefault();
        setLoading(true);
        // TODO maybe make more generic so it's an almost empty function being passed?
        await editWorkflowActionFunction(name, description, curAction, refresh).then(() => {
            clearForm();
            setIsOpen(false);
            setLoading(false);
        })
    }

    return (<>
    <Modal size="lg" centered show={isOpen} onShow={()=> {if (isEdit) {loadForm();}}} 
    onHide={()=>{setIsOpen(false); clearForm(); setIsEdit(false);}} onExit={()=>{setIsOpen(false); clearForm(); setIsEdit(false);}}>
        <Modal.Header closeButton>{isEdit ? 'Edit' : 'New'} Action</Modal.Header>
        <Modal.Body>
            {error ? 
            <div className="alert alert-danger">
                {error}
            </div>
            : <></>}

            <Form>
                <Form.Label>Action Name</Form.Label>
                <Form.Control required onChange={e=>setName(e.target.value)} defaultValue={isEdit ? curAction.name : ''}/>

                <Form.Label>Action Description</Form.Label>
                <Form.Control required onChange={e=>setDescription(e.target.value)} defaultValue={isEdit ? curAction.description : ''}/>

                
                {!isEdit ? // I refuse to let the user edit the action type. That would cause so many problems (e.g. complex => simple).
                <><Form.Label>Action Type</Form.Label>
                <Form.Select onChange={e=>setActionType(e.target.value)} defaultValue={isEdit ? curAction.actionType : ''}>
                    <option key="simple" value="simple">Simple</option>
                    {/* it's tested you can make up to 7 children before the workflows API fails to return. Though it says 6 in reality it is indeed 7 layers */}
                    <option key="complex" value="complex" disabled={depthLevel>=6}>Complex</option>
                    <option key="workflow" value="workflow" disabled={depthLevel>=6}>Workflow</option>
                </Form.Select>
                </>
                : <></>}   
                {actionType === "simple" ? // if simple action
                <>
                {children}
                <div className="flex justify-end pt-2">
                    <Button disabled={loading} type="submit" onClick={(e) => isEdit ? editSimpleOrComplexAction(e) : addStandardAction(e)}>{isEdit ? 'Edit' : 'Add'} action</Button>
                </div>
                </> : 
                actionType === "complex" ? // if complex action 
                <div className="flex justify-end pt-2">
                    <Button disabled={loading} type="submit" onClick={(e) => isEdit ? editSimpleOrComplexAction(e) : addStandardAction(e)}>{isEdit ? 'Edit' : 'Add'} action</Button>
                </div> : 
                // if workflow action
                <div className="flex justify-end pt-2">
                    <Button disabled={loading} type="submit" onClick={(e) => isEdit ? editWorkflowAction(e) : createWorkflowAction(e)}>{isEdit ? 'Edit' : 'Add'} action</Button>
                </div>
                }
            </Form>
        </Modal.Body>
    </Modal>
    </>)
}

/**
 * Component to delete workflows and actions. 
 * It can be a top level workflow or a workflow action, this modal can delete them all!
 * Functions for the deletion need to be passed in.
 *
 * @param {Object} props
 * @param {Boolean} props.isOpen - whether the modal is open or not
 * @param {(isOpen: Boolean) => void} props.setIsOpen - state setter for the modal being open
 * @param {Object} props.action - the action that will be deleted
 * @param {Array} props.workflows - the top-level workflows
 * @param {(workflows: Array) => void} props.setWorkflows - state setter for the top-level workflows 
 * @param {Function} props.actionDelete - function to delete simple or complex actions
 * @param {Function} props.workflowDelete - function to delete workflows/workflow actions
 * @param {() => void} props.refresh - a function to refresh the page. Can be used to avoid tricky logic and rely on the API
 * 
 */
export function DeleteModal({isOpen, setIsOpen, action, workflows, setWorkflows, actionDelete, workflowDelete, refresh}){

    async function deleteAction(){
        // Top level workflows don't actually have the actionType key/value pair, so we can also check if it's undefined.
        if (action.actionType === 'workflow' || !action.actionType){
            await workflowDelete(workflows, setWorkflows, action, refresh).then(() => setIsOpen(false))
        }
        else {
            await actionDelete(action, refresh).then(() => setIsOpen(false)) 
        }
    }

    return (<Modal centered show={isOpen} onHide={()=>setIsOpen(false)} onExit={()=>setIsOpen(false)}>
        <Modal.Header>Delete Action</Modal.Header>
        <Modal.Body>
            <div className="alert alert-danger">
                <p>You are about to permanently delete a{action?.attributeId ? ' workflow' : 'n action'}!</p> 
                <p>Are you sure you'd like to delete "{action?.name}"? This cannot be undone!</p>
            </div>
            <div className="flex justify-between pt-4">
                <Button onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button variant="danger" className="justify-end" onClick={() => deleteAction()}>Confirm</Button>
            </div>
        </Modal.Body>
    </Modal>)
}

/**
 * The component that renders all of the actions and workflows! 
 * Starts with the top level workflows and its' actions then builds down recursively through {@link ComplexRenderer}
 *
 * @param {Object} props 
 * @param {Number} props.index - the index of the top-level workflow in the giant top-level workflows array
 * @param {Array} props.workflows - an array of the top-level workflows
 * @param {(isOpen: Boolean) => void} props.setIsOpen - state setter for the action modal for creating/editing actions being open
 * @param {Boolean} props.loading - whether all workflows stuff is being loaded. We have this to prevent display errors and to prevent the user from creating a workflow when still getting
 * @param {(parentId: string) => void} props.setParentId - sets the parent ID. We do this for workflows too, even though they aren't actually parents. There should be logic in the action adders to address this
 * @param {Number} props.depthLevel - the depth level of the selected action. Needed to prevent too many layers and going too deep into a workflow
 * @param {(depthLevel: Number) => void} props.setDepthLevel - state setter for the depth level
 * @param {(isEdit: Boolean) => void} props.setIsEdit - state setter for whether or not things are edits
 * @param {(curAction: Object) => void} props.setCurAction - state setter to set the current action. Used mainly for edits
 * @param {() => void} props.setWorkflowModalEdit - function to open the workflow modal as an edit. We do this since it's one less thing to pass in
 * @param {(deleteOpen: Boolean) => void} props.setDeleteOpen - state setter for whether the deletion modal is open or not
 * @param {(action: Object) => React.ReactElement} props.simpleExtraDataRenderer - We have basic rendering for simple actions, but this is used for any extra data that not all projects may use.
 */
export function WorkflowComponent({index, workflows, setIsOpen, loading, 
    setParentId, depthLevel, setDepthLevel, setIsEdit, 
    setCurAction, setWorkflowModalEdit, setDeleteOpen, simpleExtraDataRenderer}){

    if (loading)
        return <><h1>Loading...</h1></> // Here so a lot of stuff just doesn't break while it loads everything

    else
    return (<>
    <Accordion.Item eventKey={workflows[index].id}>
        <Accordion.Header className="w-full">
            <div className="flex w-full justify-between">
            <span className="text-4xl">{workflows[index].name} {workflows[index]?.metadata?.code === "None" ? "(Inactive)" : (workflows[index]?.metadata?.code ? `(${workflows[index]?.metadata?.code})` : '')}</span>
            <div className="mr-4">
            <Button className="justify-end" variant="outline-dark" 
            onClick={(e) => {
                e.stopPropagation();
                setCurAction(workflows[index]);
                setWorkflowModalEdit();
            }}><Edit /></Button>
            <Button variant="outline-danger" className="ml-2" onClick={(e) => {
                e.stopPropagation();
                setCurAction(workflows[index]);
                setDeleteOpen(true);
            }}><Trash2 /></Button>
            </div>            
            </div>
        </Accordion.Header>
        <Accordion.Body>
            <div className="text-3xl">
                <p>Description: {workflows[index].description}</p>
            </div>
            <div className="text-2xl">
                Tags: {workflows[index].tags?.length > 0 ? workflows[index].tags.join(", ") : 'None'}
            </div>
            {(workflows[index].actions || []).map(actione => {
                let action = actione.action;
                let value;
                if (!action.parentActionId)
                switch (action.actionType) {
                    case "simple":
                        value = <Card className="border-2 mt-2">
                            <Card.Header className="text-xl">
                                <div className="flex justify-between">
                                <span>{action.name} (Simple Action)</span>
                                <div>
                                    <Button variant="outline-secondary" onClick={() => {
                                        setCurAction(action);
                                        setIsOpen(true);
                                        setIsEdit(true);
                                    }}><Edit /></Button>
                                    <Button variant="outline-danger" className="ml-2" onClick={()=> {
                                        setCurAction(action);
                                        setDeleteOpen(true);
                                    }}><Trash2 /></Button>
                                </div>
                                </div>
                                </Card.Header>
                            <Card.Body>
                                <div><p>Description: {action.description}</p></div>
                                {simpleExtraDataRenderer(action)}
                            </Card.Body>
                        </Card>
                        break;
                    case "workflow": // basically the same as a complex action
                    case "complex":
                        value = 
                        <Accordion className="mt-2">
                            <Accordion.Item eventKey={action.id}>
                            <Accordion.Header className="w-full">
                                <div className="flex w-full justify-between">
                                <span className="text-3xl">{action.name} {action.actionType === 'complex' ? '(Complex Action)' : '(Workflow)'}</span>
                                <div className="mr-4">
                                <Button className="justify-end" variant="outline-dark" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEdit(true);
                                    setCurAction(action);
                                    setIsOpen(true);
                                }}><Edit /></Button>
                                <Button variant="outline-danger" className="ml-2" onClick={(e) => {
                                    e.stopPropagation();
                                    setCurAction(action);
                                    setDeleteOpen(true);
                                }}><Trash2 /></Button>
                                </div>
                                </div>
                            </Accordion.Header>
                            <Accordion.Body>
                                <div className="text-2xl"><p>Description: {action.description}</p></div>
                                <ComplexRenderer 
                                workflows={workflows}
                                index={index}
                                actions={action.childActions}
                                setIsOpen={setIsOpen} 
                                setParentId={setParentId}
                                depthLevel={depthLevel+1}
                                setDepthLevel={setDepthLevel}
                                setCurAction={setCurAction}
                                setIsEdit={setIsEdit}
                                setDeleteOpen={setDeleteOpen}
                                simpleExtraDataRenderer={simpleExtraDataRenderer}/>
                                <div className="flex justify-end pt-3">
                                    <Button onClick={()=>{setIsOpen(true);setParentId(action.id);setDepthLevel(depthLevel+1);}}>Add New Child Action</Button>
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                        </Accordion>
                        break;
                    default:
                        value = <p>Unknown Type {action.actionType}</p>
                        break;
                }
                return value;
            })}
            <div className="flex justify-end pt-3">
                <Button onClick={()=>{setIsOpen(true);setParentId(null);setDepthLevel(depthLevel+1);setCurAction(null);}}>Add New Action</Button>
            </div>
        </Accordion.Body>
    </Accordion.Item>
    </>);
}

/**
 * Component that renders actions! 
 * Used in {@link WorkflowComponent} for the complex and workflow actions.
 * Also recursively calls itself for complex and workflow actions inside. 
 * We have this as its own function since what we deal with here is slightly different than the workflows at the top-level.
 *
 * @param {Object} props 
 * @param {Array} props.workflows - an array of the top-level workflows
 * @param {Number} props.index - the index of the top-level workflow in the giant top-level workflows array
 * @param {Array} props.actions - The next subset of actions we're working with. When called, the current iteration of the action's childActions are passed in 
 * @param {(isOpen: Boolean) => void} props.setIsOpen - state setter for the action modal for creating/editing actions being open
 * @param {(parentId: string) => void} props.setParentId - sets the parent ID. We do this for workflows too, even though they aren't actually parents. There should be logic in the action adders to address this
 * @param {Number} props.depthLevel - the depth level of the selected action. Needed to prevent too many layers and going too deep into a workflow
 * @param {(depthLevel: Number) => void} props.setDepthLevel - state setter for the depth level
 * @param {(curAction: Object) => void} props.setCurAction - state setter to set the current action. Used mainly for edits
 * @param {(isEdit: Boolean) => void} props.setIsEdit - state setter for whether or not things are edits
 * @param {(deleteOpen: Boolean) => void} props.setDeleteOpen - state setter for whether the deletion modal is open or not
 * @param {(action: Object) => React.ReactElement} props.simpleExtraDataRenderer - We have basic rendering for simple actions, but this is used for any extra data that not all projects may use.
 */
function ComplexRenderer({workflows, index, actions, setIsOpen, 
    setParentId, depthLevel, setDepthLevel, 
    setCurAction, setIsEdit, setDeleteOpen, simpleExtraDataRenderer}){
    return (<>
        {(actions||[]).map((action) => {
        let value;
        switch (action.actionType) {
            case "simple":
                value = <Card className="border-2 mt-2">
                    <Card.Header className="text-xl">
                    <div className="flex justify-between">
                    <span>{action.name} (Simple Action)</span>
                    <div>
                        <Button variant="outline-secondary" onClick={() => {
                            setCurAction(action);
                            setIsOpen(true);
                            setIsEdit(true);
                        }}><Edit /></Button>
                        <Button variant="outline-danger" className="ml-2" onClick={async ()=> {
                            setCurAction(action);
                            setDeleteOpen(true);
                        }}><Trash2 /></Button>
                    </div>
                    </div>
                    </Card.Header>
                    <Card.Body>
                        <div><p>Description: {action.description}</p></div>
                        {simpleExtraDataRenderer(action)}
                    </Card.Body>
                </Card>
                break;
            case "workflow": // basically the same as a complex action
            case "complex":
                value = 
                <Accordion className="mt-2">
                    <Accordion.Item eventKey={action.id} className={action.id}>
                    <Accordion.Header className="w-full">
                        <div className="flex w-full justify-between">
                        <span className="text-3xl">{action.name} {action.actionType === 'complex' ? '(Complex Action)' : '(Workflow)'}</span>
                        <div className="mr-4">
                        <Button className="justify-end" variant="outline-dark" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEdit(true);
                            setCurAction(action);
                            setIsOpen(true);
                        }}><Edit /></Button>
                         <Button variant="outline-danger" className="ml-2" onClick={(e) => {
                            e.stopPropagation();
                            setCurAction(action);
                            setDeleteOpen(true);
                        }}><Trash2 /></Button>
                        </div>
                        </div>
                    </Accordion.Header>
                    <Accordion.Body>
                        <div className="text-2xl"><p>Description: {action.description}</p></div>
                        <ComplexRenderer 
                            workflows={workflows}
                            index={index}
                            actions={action.childActions}
                            setIsOpen={setIsOpen} 
                            setParentId={setParentId}
                            depthLevel={depthLevel+1}
                            setDepthLevel={setDepthLevel}
                            setCurAction={setCurAction}
                            setIsEdit={setIsEdit}
                            setDeleteOpen={setDeleteOpen}
                            simpleExtraDataRenderer={simpleExtraDataRenderer}/>
                        <div className="flex justify-end pt-3">
                            <Button onClick={()=>{setIsOpen(true);setParentId(action.id);setDepthLevel(depthLevel+1);setCurAction(null);}}>Add New Child Action</Button>
                        </div>
                    </Accordion.Body>
                </Accordion.Item>
                </Accordion>
                break;
            default:
                value = <p>Unknown Type {action.actionType}</p>
                break;
        }
        return value;
        })}
    </>)
}