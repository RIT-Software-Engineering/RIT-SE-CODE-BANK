import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Accordion, Button, Card, Form, Modal } from "react-bootstrap";

/**
 * Generic component applicable to all applications
 *
 * @param {{ isOpen: any; setIsOpen: any; workflows: any; setWorkflows: any; 
 * WorkflowSubmit: any; curWorkflow: any; isEdit: any; setIsEdit: any; 
 * workflowEditSubmit: any; metaWorkflow: any; setMetaWorkflow: any; children : any; }} param0 
 */
export function WorkflowModal( {isOpen, setIsOpen, workflows, setWorkflows, 
    WorkflowSubmit, curWorkflow ,isEdit, setIsEdit, 
    workflowEditSubmit, metaWorkflow, setMetaWorkflow, children} ){
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');

    function clearForm(){
        setName('');
        setDescription('');
        setTags('');
        setIsEdit(false);
        setMetaWorkflow('None');
        setError('');
    }

    function loadForm(){
        setName(curWorkflow.name?.trim());
        setDescription(curWorkflow.description?.trim());
        setTags(curWorkflow.tags?.join(", "));
        setMetaWorkflow(curWorkflow.metadata?.code);
    }

    async function submitWorkflow(){
        const uploadTags = tags ? tags.split(",").map(tag => tag.trim()) : [];
        const submission = await WorkflowSubmit(name, description, uploadTags, metaWorkflow, workflows, setWorkflows, setError);
        if (submission === "Good"){
            clearForm();
            setIsOpen(false);
        }
    }

    async function editWorkflow(){
        const uploadTags = tags ? tags?.split(",").map(tag => tag.trim()) : [];
        const submission = await workflowEditSubmit(name, description, uploadTags, metaWorkflow, workflows, setWorkflows, setError, curWorkflow);
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
 * Generic component applicable to all applications
 *
 * @param {{ isOpen: any; setIsOpen: any; index: any; workflows: any; setWorkflows: any; 
 * parentId: any; depthLevel: any; setDepthLevel: any;
 * isEdit: any; setIsEdit: any; curAction: any; refresh: ()=>void;
 * addAction: any; addWorkflowAction: any; editAction: any; editWorkflowActionFunction: any;
 * loadFunction: ()=>void; clearFunction: ()=>void; extraData: Object; children: any;}} param0 
 */
export function ActionModal({isOpen, setIsOpen, index, workflows, setWorkflows, parentId, 
    depthLevel, setDepthLevel, isEdit, setIsEdit, curAction, refresh,
    addAction, addWorkflowAction, editAction, editWorkflowActionFunction,
    loadFunction, clearFunction, extraData, children}){
    const [actionType, setActionType] = useState("simple");
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    function clearForm(){
        setName('');
        setDescription('');
        setActionType('simple');
        setDepthLevel(depthLevel-1);
        clearFunction();
    }

    /** Loads data from the current action. Only called on edit. */
    function loadForm(){
        setName(curAction.name);
        setDescription(curAction.description);
        setActionType(curAction.actionType);
        loadFunction();
    }

    async function createSimpleAction(e){
        e.preventDefault();
        await addAction(index, workflows, setWorkflows, name, description,"simple", parentId, extraData).then(() => {
            clearForm();
            setIsOpen(false);
        })
    }

    async function editSimpleAction(e){
        e.preventDefault();
        await editAction(name, description, curAction, extraData, refresh).then(() => {
            clearForm();
            setIsOpen(false);
        })
    }

    async function createComplexAction(e) {
        e.preventDefault();
        await addAction(index, workflows, setWorkflows, name, description, "complex", parentId, extraData).then(()=>{
            clearForm();
            setIsOpen(false);
        })
    }

    async function editComplexAction(e){
        e.preventDefault();
        await editAction(name, description, curAction, extraData, refresh).then(() => {
            clearForm();
            setIsOpen(false);
        })
    }

    async function createWorkflowAction(e){
        e.preventDefault();
        await addWorkflowAction(index, name, description, workflows, setWorkflows, parentId).then(()=>{
            clearForm();
            setIsOpen(false);
        })
    }

    async function editWorkflowAction(e){
        e.preventDefault();
        await editWorkflowActionFunction(name, description, curAction, refresh).then(() => {
            clearForm();
            setIsOpen(false);
        })
    }

    return (<>
    <Modal size="lg" centered show={isOpen} onShow={()=> {if (isEdit) {loadForm();}}} 
    onHide={()=>{setIsOpen(false); clearForm(); setIsEdit(false);}} onExit={()=>{setIsOpen(false); clearForm(); setIsEdit(false);}}>
        <Modal.Header closeButton>{isEdit ? 'Edit' : 'New'} Action</Modal.Header>
        <Modal.Body>
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
                    <Button type="submit" onClick={(e) => isEdit ? editSimpleAction(e) : createSimpleAction(e)}>{isEdit ? 'Edit' : 'Add'} action</Button>
                </div>
                </> : 
                actionType === "complex" ? // if complex action 
                <div className="flex justify-end pt-2">
                    <Button type="submit" onClick={(e) => isEdit ? editComplexAction(e) : createComplexAction(e)}>{isEdit ? 'Edit' : 'Add'} action</Button>
                </div> : 
                // if workflow action
                <div className="flex justify-end pt-2">
                    <Button type="submit" onClick={(e) => isEdit ? editWorkflowAction(e) : createWorkflowAction(e)}>{isEdit ? 'Edit' : 'Add'} action</Button>
                </div>
                }
            </Form>
        </Modal.Body>
    </Modal>
    </>)
}

/**
 * Generic component applicable to all applications
 *
 * @param {{ isOpen: any; setIsOpen: (boolean)=>void; action: any; actionDelete: any; workflowDelete: any; refresh: ()=>void}} param0 
 */
export function DeleteModal({isOpen, setIsOpen, action, actionDelete, workflowDelete, refresh}){

    async function deleteAction(){
        if (action.actionType === 'workflow'){
            await workflowDelete(action, refresh).then(() => setIsOpen(false))
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
 * Generic component applicable to all applications
 *
 * @param {{ index: any; workflows: any; setIsOpen: any; loading: any; 
 * setParentId: any; depthLevel: any; setDepthLevel: any; setIsEdit: any; 
 * setCurAction: any; setWorkflowModalEdit: any; setDeleteOpen: any; simpleExtraDataRenderer: (action: Object) => React.ReactElement;}} param0 
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
 * Generic component applicable to all applications
 *
 * @param {{ workflows: any; index: any; actions: any; setIsOpen: any; 
 * setParentId: any; depthLevel: any; setDepthLevel: any; 
 * setCurAction: any; setIsEdit: any; setDeleteOpen: any; simpleExtraDataRenderer: (action: Object) => React.ReactElement;}} param0 
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