import { useCallback, useEffect, useState } from "react";
import { Accordion, Button, Card, Form, Modal } from "react-bootstrap";
import { CMTFetch } from "../utils/api";
import { workflowsFetch } from "../backend/utils/workflows/api";


export function BuilderPage(){
    const [workflows, setWorkflows] = useState([]);
    const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [index, setIndex] = useState(-1);
    const availCodes = [["COURSE_SECTION", "Course Section"], 
    ["NUMBER_STUDENTS", "Number of Students"], 
    ["COURSE_SEMESTER", "Course Semester"],
    ["CHECKBOX", "Checkbox"]];
    const [loading, setLoading] = useState(true);
    const [parentId, setParentId] = useState("");
    const [depthLevel, setDepthLevel] = useState(0);

    const update = useCallback(async () => {
        return CMTFetch("GET", "/workflony/workflowTemplate").then(async response => {
                const data = await response.json();
                console.log("data:", data)
                const workflowPromises = data.workflows.map(async workflow => {
                    console.log("Workflow:", workflow)
                    const info = workflow.baseAction;
                    let actions = [];
                    if (workflow.rootActionId){
                        const actionResponse = await CMTFetch("GET", `workflony/actionTemplate/workflow/${workflow.id}`)
                        const returnedActions = await actionResponse.json();
                        console.log("actions: ", returnedActions.actions)
                        actions = returnedActions.actions;
                    }
                    return {
                        id: info.id,
                        attributeId: workflow.id,
                        name: info.name,
                        description: info.description,
                        actions: actions || [],
                    }
                });
                const resolvedWorkflows = await Promise.all(workflowPromises);
                setWorkflows(resolvedWorkflows.sort());
                console.log("Resolved workflows:", resolvedWorkflows)
                setLoading(false);
            });
        }, [])
        useEffect(() => void update(), [update])
    

    return (
    loading ? <><h1>Loading...</h1></> :
    <>
        <Button onClick={()=>setWorkflowModalOpen(true)}>Add new Workflow</Button>
        <WorkflowModal isOpen={workflowModalOpen} setIsOpen={setWorkflowModalOpen} workflows={workflows} 
        setWorkflows={setWorkflows} WorkflowSubmit={workflowSubmit}/>
        <ActionModal isOpen={actionModalOpen} setIsOpen={setActionModalOpen} index={index} workflows={workflows} setWorkflows={setWorkflows} 
        availCodes={availCodes} parentId={parentId} depthLevel={depthLevel} setDepthLevel={setDepthLevel}
        outputHelper={BuilderOutputsHelper} addAction={addStandardAction} addWorkflowAction={addWorkflowAction}/>
        <Accordion>
        {workflows ? Array.from({length: workflows.length}, (_, i) => {
            return (<div key={i} className="pt-2" onClick={()=>setIndex(i)}><WorkflowComponent loading={loading} index={i} workflows={workflows} setIsOpen={setActionModalOpen} setParentId={setParentId} depthLevel={0} setDepthLevel={setDepthLevel}/></div>)
        }) : <></>}
        </Accordion>
    </>);
}

function BuilderOutputRenderer({code, setPlaceholder, validation, setValidation}){
    const [hasValidation, setHasValidation] = useState(false);
    let returnOutput;
    switch (code) {
        case "COURSE_SECTION":
            returnOutput = <>
            <Form.Label>Placeholder?</Form.Label>
            <Form.Control placeholder="e.g. 1" onChange={e=>setPlaceholder(e.target.value)}/>
            <div className="flex">
                <Form.Label>Has Validation?</Form.Label>
                <Form.Check className="pl-2" onChange={(e)=>setHasValidation(e.target.checked)}/>
            </div>
            {hasValidation ? <>
            <Form.Label>Max Length?</Form.Label>
            <Form.Control type="number" placeholder="e.g. 30" onChange={e=>setValidation([e.target.value])}/>
            </>
            : <></>}
            </>
            break;

        case "NUMBER_STUDENTS":
            if (validation.length === 0)
                setValidation([[],[]]);
            returnOutput = <>
            <Form.Label>Has a Placeholder?</Form.Label>
            <Form.Control placeholder="e.g. 1" onChange={e=>setPlaceholder(e.target.value)}/>
            <div className="flex">
                <Form.Label>Has Validation?</Form.Label>
                <Form.Check className="pl-2" onChange={(e)=>setHasValidation(e.target.checked)}/>
            </div>
            {hasValidation ? <>
            <div className="flex">
                <div>
                <Form.Label>Min: </Form.Label>
                <Form.Control type="number" placeholder="e.g. 10" onChange={(e)=>setValidation(prev => [[e.target.value], prev[1]])}/>
                </div>
                <div className="pl-10">
                <Form.Label>Max:</Form.Label>
                <Form.Control type="number" placeholder="e.g. 100" onChange={e=>setValidation(prev => [prev[0], [e.target.value]])}/>
                </div>
            </div>
            </>
            : <></>}
            </>
            break;

        case "COURSE_SEMESTER":
            if (validation.length === 0)
                setValidation([[], []]);
            returnOutput = <>
            <div className="flex pt-2">
                <Form.Label>Validation?</Form.Label>
                <Form.Check className="pl-2" onChange={(e)=>setHasValidation(e.target.checked)}/>
            </div>
            {hasValidation ? <>
            <div className="flex ">
                <div className="w-2/5">
                <Form.Label>Year Options (seperate each by a comma)</Form.Label>
                <Form.Control placeholder="e.g. 2027, 2028, 2029, 2030" onChange={e => {
                    setValidation(prev => [e.target.value.split(/, ?/).map(Number), prev[1]])
                }}/>
                </div>
                <div className="pl-10 w-3/5">
                <Form.Label>Season Options (seperate each by a comma)</Form.Label>
                <Form.Control placeholder="e.g Fall, Spring, Summer 1, Summer 2, Summer 3" onChange={e => {
                    setValidation(prev => [prev[0], e.target.value.split(/, ?/)])
                }}/>
                </div>
            </div>
            </>
            : <></>}
            </>
            break;

        default:
            returnOutput = <></>
    }
    return returnOutput
}

function BuilderOutputsHelper(code, isRequired, placeholder, validation){
    let output;
    switch (code) {
        case "COURSE_SECTION":
            output = [{
                name: "Course Section",
                key: "section",
                type: "text",
                isRequired: isRequired
            }]
            if (placeholder) output[0]['placeholder'] = placeholder
            if (validation) output[0]['validation'] = {maxLength: validation[0]}
            break;
        
        case "NUMBER_STUDENTS":
            output = [{
                name: "Number of Students",
                key: "students",
                type: "number",
                isRequired: isRequired
            }]
            if (placeholder) output[0]['placeholder'] = placeholder;
            if (validation) output[0]['validation'] = {
                max: validation[1][0],
                min: validation[0][0]
            }
            break;

        case "COURSE_SEMESTER":
            output = [{
                name: "Year",
                key: "year",
                type: "select",
                isRequired: isRequired,
            },
            {
                name: "Season",
                key: "season",
                type: "select",
                isRequired: isRequired
            }]
            if (validation){
                console.log(validation)
                let yearIndex = output.findIndex(obj => obj.name === "Year");
                output[yearIndex]['validation'] = {options: validation[0]};
                let seasonIndex = output.findIndex(obj => obj.name === "Season");
                output[seasonIndex]['validation'] = {options: validation[1]};
            }
            break;

        case "CHECKBOX":
            output = null;
            break;

        default:
            output=null;
            break;
    }

    return output;
}

async function workflowSubmit(name, description, workflows, setWorkflows){
    const workflow = {
        name: name,
        description: description,
        actions: [],
        tags: ["CMT_Template"]
    };
    CMTFetch("POST", "/workflony/workflowTemplate", {workflow}).then(async response => {
        const data = await response.json();
        setWorkflows([...workflows, {
            id: data.workflow.baseActionId,
            attributeId: data.workflow.id, // The ID is for the WorkflowAttribute, not the actual workflow
            name: name,
            description: description,
            actions: [],
        }]);
        console.log(data)
    });
}

/**
 * Recursive function to find a workflow.
 * Used for the action adders to find if the parentId is a complex or workflow action. 
 *
 * @param {Array} actions
 * @param {string} parentActionId 
 */
function findParent(actions, parentActionId){
    let result = null;
    for (let index = 0; index < actions.length; index++) {
        const action = actions[index];
        if (action.id === parentActionId){
            result = action;
            break;
        }
        else {
            if (action.childActions) {
                result = findParent(action.childActions, parentActionId);
                if (result)
                    break
            }
        }
    }
    return result;
}

async function setNextActionInfo(action, actions, workflowId, id, name, description, actionType, parentActionId, metadata){
    if (action.id === workflowId) {
        const actionList = action.childActions.slice(0,-1);
        if (action.childActions?.length > 0){
            let prevAction = action.childActions[action.childActions.length - 1];
            prevAction.nextActionId = id;
            await CMTFetch("PUT", `workflony/actionTemplate/action/${prevAction.id}`, {name: null, description: null, nextActionId: id});
            actionList.push({...prevAction});
        }
        actionList.push({
            id: id,
            name: name,
            description: description,
            actionType: actionType,
            nextActionId: null,
            parentActionId: parentActionId,
            metadata: metadata
        })
        actions = actionList;
    } 
    // AI-modified code
    else {
        if (action.childActions && action.childActions.length > 0) {
            for (let index = 0; index < action.childActions.length; index++) {
                action.childActions[index].childActions = await setNextActionInfo(
                    action.childActions[index], 
                    action.childActions[index].childActions || [], 
                    workflowId, id, name, description, actionType, parentActionId, metadata
                );
            }
        }
        actions = action.childActions || []; 
    }
    
    return actions;
}

async function addStandardAction(outputs, index, workflows, setWorkflows, name, description, code, actionType, parentActionId) {
    let metadata = {};
    let isWorkflowChild = false;
    let workflowParent = workflows[index];
    if (parentActionId){
        workflowParent = null;
        workflowParent = workflows[index].actions.find(action => action.action.id === parentActionId)?.action;
        if (!workflowParent){
            for (let j = 0; j < workflows[index].actions.length; j++) {
                const actions = workflows[index].actions[j];
                if (!workflowParent)
                    workflowParent = findParent(actions.action?.childActions, parentActionId)
            }
        }
        
        isWorkflowChild = workflowParent?.actionType === "workflow";
    }
    if (code)
        metadata.code = code;
    if (outputs)
        metadata.outputs = outputs;
    await CMTFetch("POST", "workflony/actionTemplate/action", {name, description, actionType, metadata, parentActionId: !isWorkflowChild ? parentActionId : null}).then(async response => {
        const data = await response.json();
        console.log(data.action);
        let workflowsCopy = [];
        for (let j = 0; j < workflows.length; j++) {
        if (j !== index)
            workflowsCopy.push(workflows[j])
        else {
            let workflowActions = [];
            if (workflowParent.id === workflows[index].id){
                const actions = workflows[index].actions.slice(0,-1);
                if (workflows[index].actions.length > 0){
                    let prevAction = workflows[index].actions[workflows[index].actions.length - 1];
                    prevAction.action.nextActionId = data.action.id;
                    actions.push({...prevAction});
                }
                workflowActions = workflows[index].actions
                workflowActions.push({action: {
                        id: data.action.id,
                        name: name,
                        description: description,
                        actionType: actionType,
                        nextActionId: null,
                        parentActionId: null,
                        metadata: metadata
                }})
            }
            else {
                // Check if we have any other child actions
                if (workflowParent.childActions?.length > 0){
                    for (let j = 0; j < workflows[index].actions.length; j++) {
                        const actions = workflows[index].actions[j];
                        actions.action.childActions = await setNextActionInfo(
                            actions.action, [], workflowParent.id, data.action.id,
                            name, description, actionType, parentActionId, metadata
                        )
                        workflowActions.push(actions)
                    }
                } 
                else {
                    workflowActions = workflows[index].actions
                    workflowParent.childActions = [];
                    workflowParent.childActions.push({
                            id: data.action.id,
                            name: name,
                            description: description,
                            actionType: actionType,
                            nextActionId: null,
                            parentActionId: parentActionId,
                            metadata: metadata
                    });
                }
            }
            workflowsCopy.push({
                    id: workflows[j].id,
                    attributeId: workflows[j].attributeId,
                    name: workflows[j].name,
                    description: workflows[j].description,
                    actions: workflowActions
                });
        }}
        console.log("The copy:", workflowsCopy)
        if (!isWorkflowChild){
            // If this is the first action then we set the root action
            console.log("The thing", workflowsCopy[index])
            if (workflowsCopy[index].actions.length === 1)
                await workflowsFetch("PUT", `workflows/${workflows[index].attributeId}`, {
                rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
            else 
                setWorkflows(workflowsCopy);
        }
        else {
            console.log(workflowParent)
            if (workflowParent.childActions.length > 1)
                setWorkflows(workflowsCopy);
            else {
                await workflowsFetch("PUT", `workflows/action/${workflowParent.id}`, {
                rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
            }
        }
    });
}

async function addWorkflowAction(index, name, description, workflows, setWorkflows, parentActionId){
    const workflow = {
        name: name,
        description: description,
        actionType: "workflow",
        actions: []
    };
    let isWorkflowChild = false;
    let workflowParent = workflows[index];
    if (parentActionId){
        workflowParent = null;
        workflowParent = workflows[index].actions.find(action => action.action.id === parentActionId)?.action;
        if (!workflowParent){
            for (let j = 0; j < workflows[index].actions.length; j++) {
                const actions = workflows[index].actions[j];
                if (!workflowParent)
                    workflowParent = findParent(actions.action?.childActions, parentActionId)
            }
        }
        
        isWorkflowChild = workflowParent?.actionType === "workflow";
    }
    await CMTFetch("POST", "workflony/actionTemplate/workflow", {workflow, parentActionId:!isWorkflowChild ? parentActionId : null}).then(async response => {
        const data = await response.json();
        console.log(data.action);
        let workflowsCopy = [];
        for (let j = 0; j < workflows.length; j++) {
        if (j !== index)
            workflowsCopy.push(workflows[j])
        else {
            let workflowActions = [];
            if (workflowParent.id === workflows[index].id){
                const actions = workflows[index].actions.slice(0,-1);
                if (workflows[index].actions.length > 0){
                    let prevAction = workflows[index].actions[workflows[index].actions.length - 1];
                    prevAction.action.nextActionId = data.action.id;
                    actions.push({...prevAction});
                }
                workflowActions = workflows[index].actions
                workflowActions.push({action: {
                        id: data.action.id,
                        name: name,
                        description: description,
                        actionType: 'workflow',
                        nextActionId: null,
                        parentActionId: null,
                    }})
            }
            else {
                // Check if we have any other child actions
                if (workflowParent.childActions?.length > 0){
                    for (let j = 0; j < workflows[index].actions.length; j++) {
                        const actions = workflows[index].actions[j];
                        actions.action.childActions = await setNextActionInfo(
                            actions.action, [], workflowParent.id, data.action.id,
                            name, description, "workflow", parentActionId, null
                        )
                        workflowActions.push(actions)
                    }
                } 
                else {
                    workflowActions = workflows[index].actions
                    workflowParent.childActions = [];
                    workflowParent.childActions.push({
                            id: data.action.id,
                            name: name,
                            description: description,
                            actionType: "workflow",
                            nextActionId: null,
                            parentActionId: parentActionId
                    });
                }
            }
            workflowsCopy.push({
                    id: workflows[j].id,
                    attributeId: workflows[j].attributeId,
                    name: workflows[j].name,
                    description: workflows[j].description,
                    parentActionId: parentActionId,
                    actions: workflowActions
                });
        }}
        console.log("The copy:", workflowsCopy)
        if (!isWorkflowChild){
            // If this is the first action then we set the root action
            if (workflowsCopy[index].actions.length === 1)
                await workflowsFetch("PUT", `workflows/${workflows[index].attributeId}`, {
                rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
            else 
                setWorkflows(workflowsCopy);
        }
        else {
            console.log(workflowParent)
            if (workflowParent.actions.length > 1)
                setWorkflows(workflowsCopy);
            else 
                await workflowsFetch("PUT", `workflows/${workflowParent.attributeId}`, {
                rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
        }
    })
}

function WorkflowModal( {isOpen, setIsOpen, workflows, setWorkflows, WorkflowSubmit} ){
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    function clearForm(){
        setName('');
        setDescription('');
    }

    async function submitWorkflow(){
        await WorkflowSubmit(name, description, workflows, setWorkflows);
    }

    return (<>
    <Modal size="lg" show={isOpen} centered onHide={()=>{setIsOpen(false); clearForm()}} onExit={()=>setIsOpen(false)}>
        <Modal.Header closeButton>New Workflow</Modal.Header>
        <Modal.Body>
            <Form>
                <div>
                    <Form.Label>Workflow Name</Form.Label>
                    <Form.Control required onChange={e=>setName(e.target.value)} />
                    <Form.Label>Workflow Description</Form.Label>
                    <Form.Control required onChange={e=>setDescription(e.target.value)} />
                </div>
                
                <div className="flex pt-2 justify-end">
                    <Button type="submit" onClick={(e) => {
                        e.preventDefault();
                        clearForm();
                        setIsOpen(false);
                        submitWorkflow();
                    }}>Add Workflow</Button>
                </div>
            </Form>
        </Modal.Body>
    </Modal>
    </>)
}

function ActionModal({isOpen, setIsOpen, index, workflows, setWorkflows, availCodes, parentId, 
    depthLevel, setDepthLevel, outputHelper, addAction, addWorkflowAction}){
    const [actionType, setActionType] = useState("simple");
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [code, setCode] = useState(availCodes[0][0]);
    const [required, setRequired] = useState(false);
    const [placeholder, setPlaceholder] = useState('');
    const [validation, setValidation] = useState([]);

    function clearForm(){
        setName('');
        setDescription('');
        setActionType('simple');
        setCode(availCodes[0][0]);
        setValidation([]);
        setPlaceholder('');
        setRequired(false);
        setDepthLevel(depthLevel-1);
    }

    async function createSimpleAction(e){
        let outputs;
        outputs = outputHelper(code, required, placeholder, validation);
        e.preventDefault();
        await addAction(outputs, index, workflows, setWorkflows, name, description, code, "simple", parentId).then(() => {
            clearForm();
            setIsOpen(false);
        })
    }

    async function createComplexAction(e) {
        e.preventDefault();
        await addAction(null, index, workflows, setWorkflows, name, description, null, "complex", parentId).then(()=>{
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

    return (<>
    <Modal size="lg" show={isOpen} onHide={()=>{setIsOpen(false); clearForm()}} onExit={()=>setIsOpen(false)} centered>
        <Modal.Header closeButton>New Action</Modal.Header>
        <Modal.Body>
            <Form>
                <Form.Label>Action Name</Form.Label>
                <Form.Control required onChange={e=>setName(e.target.value)} />

                <Form.Label>Action Description</Form.Label>
                <Form.Control required onChange={e=>setDescription(e.target.value)} />

                <Form.Label>Action Type</Form.Label>
                <Form.Select onChange={e=>setActionType(e.target.value)}>
                    <option key="simple" value="simple">Simple</option>
                    {/* it's tested you can make up to 7 children before the workflows API fails to return. We'll do 6 to be safe though. */}
                    <option key="complex" value="complex" disabled={depthLevel>=6}>Complex</option>
                    <option key="workflow" value="workflow" disabled={depthLevel>=6}>Workflow</option>
                </Form.Select>
                {actionType === "simple" ? // if simple action
                <>
                {/* TODO make this part of the form not hardcoded for CMT */}
                <Form.Label>Code</Form.Label>
                <Form.Select onChange={(e)=>setCode(e.target.value)}>
                    {availCodes.map(codeInfo => {
                        return <option key={codeInfo[0]} value={codeInfo[0]}>{codeInfo[1]}</option>
                    })}
                </Form.Select>
                <div className="flex pt-2">
                    <Form.Label>Is Required?</Form.Label>
                    <Form.Check className="pl-2" onChange={(e)=>setRequired(e.target.checked)}/>
                </div>
                <BuilderOutputRenderer code={code} setPlaceholder={setPlaceholder} validation={validation} setValidation={setValidation}/>
                <div className="flex justify-end pt-2">
                    <Button type="submit" onClick={(e) => createSimpleAction(e)}>Add action</Button>
                </div>
                </> : 
                actionType === "complex" ? // if complex action 
                <div className="flex justify-end pt-2">
                    <Button type="submit" onClick={(e) => createComplexAction(e)}>Add action</Button>
                </div> : 
                // if workflow action
                <div className="flex justify-end pt-2">
                    <Button type="submit" onClick={(e) => createWorkflowAction(e)}>Add action</Button>
                </div>
                }
            </Form>
        </Modal.Body>
    </Modal>
    </>)
}

function ComplexRenderer({workflows, index, actions, setIsOpen, setParentId, depthLevel, setDepthLevel}){
    return (<>
        {(actions||[]).map((action) => {
        let value;
        switch (action.actionType) {
            case "simple":
                value = <Card className="border-2 mt-2">
                    <Card.Header className="text-xl">{action.name} (Simple Action)</Card.Header>
                    <Card.Body>
                        <div><p>Description: {action.description}</p></div>
                        {/* TODO make this not CMT-specific (e.g. no metadata) */}
                        <div>
                            <p>Code: {action.metadata.code}</p>
                            {(action.metadata.outputs||[]).map(output => {
                                return (<>
                                    <p>Required? {output.isRequired ? 'Yes' : 'No'}</p>
                                    <p>Key: {output.key}</p>
                                    <p>Name: {output.name}</p>
                                    {output.placeholder ? <p>Placeholder: {output.placeholder}</p> : <></>}
                                    <p>Type: {output.type}</p>
                                    {output.validation && Object.keys(output.validation).map(key => {
                                        const value = output.validation;
                                        const displayValue = (output.validation.options) ? value.options.join(', ') : value[key];
                                        return <p key={key}>{key}: {displayValue}</p>;
                                    })}
                                </>)
                            })}
                        </div>
                    </Card.Body>
                </Card>
                break;
            case "workflow": // basically the same as a complex action
            value = 
            <Accordion className="mt-2">
                <Accordion.Item eventKey={action.id}>
                <Accordion.Header><span className="text-3xl">{action.name} (Workflow)</span></Accordion.Header>
                <Accordion.Body>
                    <div className="text-2xl"><p>Description: {action.description}</p></div>
                    <ComplexRenderer 
                    workflows={workflows}
                    index={index}
                    actions={action.childActions}
                    setIsOpen={setIsOpen} 
                    setParentId={setParentId}
                    depthLevel={depthLevel+1}
                    setDepthLevel={setDepthLevel}/>
                    <div className="flex justify-end pt-3">
                        <Button onClick={()=>{setIsOpen(true);setParentId(action.id);setDepthLevel(depthLevel+1);}}>Add New Child Action</Button>
                    </div>
                </Accordion.Body>
            </Accordion.Item>
            </Accordion>
            break;
            case "complex":
                value = 
                <Accordion className="mt-2">
                    <Accordion.Item eventKey={action.id} className={action.id}>
                    <Accordion.Header><span className="text-3xl">{action.name} (Complex Action)</span></Accordion.Header>
                    <Accordion.Body>
                        <div className="text-2xl"><p>Description: {action.description}</p></div>
                        <ComplexRenderer 
                            workflows={workflows}
                            index={index}
                            actions={action.childActions}
                            setIsOpen={setIsOpen} 
                            setParentId={setParentId}
                            depthLevel={depthLevel+1}
                            setDepthLevel={setDepthLevel}/>
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
    </>)
}

function WorkflowComponent({index, workflows, setIsOpen, loading, setParentId, depthLevel, setDepthLevel}){
    if (loading)
        return <><h1>Loading...</h1></> // Here so a lot of stuff just doesn't break while it loads everything
    else
    return (<>
    <Accordion.Item eventKey={workflows[index].id}>
        <Accordion.Header><span className="text-4xl">{workflows[index].name}</span></Accordion.Header>
        <Accordion.Body>
            <div className="text-3xl">
                <p>Description: {workflows[index].description}</p>
            </div>
            {(workflows[index].actions || []).map(actione => {
                let action = actione.action;
                let value;
                if (!action.parentActionId)
                switch (action.actionType) {
                    case "simple":
                        value = <Card className="border-2 mt-2">
                            <Card.Header className="text-xl">{action.name} (Simple Action)</Card.Header>
                            <Card.Body>
                                <div><p>Description: {action.description}</p></div>
                                {/* TODO make this not CMT-specific (e.g. no metadata) */}
                                <div>
                                    <p>Code: {action.metadata.code}</p>
                                    {(action.metadata.outputs||[]).map(output => {
                                        return (<>
                                            <p>Required? {output.isRequired ? 'Yes' : 'No'}</p>
                                            <p>Key: {output.key}</p>
                                            <p>Name: {output.name}</p>
                                            {output.placeholder ? <p>Placeholder: {output.placeholder}</p> : <></>}
                                            <p>Type: {output.type}</p>
                                            {output.validation && Object.keys(output.validation).map(key => {
                                                const value = output.validation;
                                                const displayValue = (output.validation.options) ? value.options.join(', ') : value[key];
                                                return <p key={key}>{key}: {displayValue}</p>;
                                            })}
                                        </>)
                                    })}
                                </div>
                            </Card.Body>
                        </Card>
                        break;
                    case "workflow": // basically the same as a complex action
                    // console.log("Action within actions:", action.name, action.actions)
                    value = 
                        <Accordion className="mt-2">
                            <Accordion.Item eventKey={action.id}>
                            <Accordion.Header><span className="text-3xl">{action.name} (Workflow)</span></Accordion.Header>
                            <Accordion.Body>
                                <div className="text-2xl"><p>Description: {action.description}</p></div>
                                <ComplexRenderer 
                                workflows={workflows}
                                index={index}
                                actions={action.childActions}
                                setIsOpen={setIsOpen} 
                                setParentId={setParentId}
                                depthLevel={depthLevel+1}
                                setDepthLevel={setDepthLevel}/>
                                <div className="flex justify-end pt-3">
                                    <Button onClick={()=>{setIsOpen(true);setParentId(action.id);setDepthLevel(depthLevel+1);}}>Add New Child Action</Button>
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                        </Accordion>
                        break;
                    case "complex":
                        value = 
                        <Accordion className="mt-2">
                            <Accordion.Item eventKey={action.id}>
                            <Accordion.Header><span className="text-3xl">{action.name} (Complex Action)</span></Accordion.Header>
                            <Accordion.Body>
                                <div className="text-2xl"><p>Description: {action.description}</p></div>
                                <ComplexRenderer 
                                workflows={workflows}
                                index={index}
                                actions={action.childActions}
                                setIsOpen={setIsOpen} 
                                setParentId={setParentId}
                                depthLevel={depthLevel+1}
                                setDepthLevel={setDepthLevel}/>
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
                <Button onClick={()=>{setIsOpen(true);setParentId(null);setDepthLevel(depthLevel+1);}}>Add New Action</Button>
            </div>
        </Accordion.Body>
    </Accordion.Item>
    </>);
}