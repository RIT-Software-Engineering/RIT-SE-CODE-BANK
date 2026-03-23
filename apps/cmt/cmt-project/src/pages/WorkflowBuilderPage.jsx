import { useCallback, useEffect, useState } from "react";
import { Accordion, Button, Card, Form, FormLabel, Modal } from "react-bootstrap";
import { CMTFetch } from "../utils/api";
import { workflowsFetch } from "../backend/utils/workflows/api";
import { Edit, Trash2 } from "lucide-react";


/**
 * CMT-Specific function
 *
 * @export
 */
export function BuilderPage(){
    const [workflows, setWorkflows] = useState([]);
    const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [index, setIndex] = useState(-1);
    const availCodes = [["COURSE_SECTION", "Course Section"], 
    ["NUMBER_STUDENTS", "Number of Students"], 
    ["COURSE_SEMESTER", "Course Semester"],
    ["CHECKBOX", "Checkbox"],
    ["SESSION", "Sessions"]];
    const [loading, setLoading] = useState(true);
    const [parentId, setParentId] = useState("");
    const [depthLevel, setDepthLevel] = useState(0);
    const [curAction, setCurAction] = useState({});
    const [isEdit, setIsEdit] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [metaWorkflow, setMetaWorkflow] = useState('None');

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
                        metadata: info.metadata,
                        tags: workflow.tags?.filter(tag => tag !== "WorkflonyFirstTheRestNowhere_CMT_Template"),
                    }
                });
                const resolvedWorkflows = await Promise.all(workflowPromises);
                setWorkflows(resolvedWorkflows.sort());
                console.log("Resolved workflows:", resolvedWorkflows)
                setLoading(false);
            });
        }, [])
        useEffect(() => void update(), [update])
    
    function setWorkflowModalAsOpen(){
        setWorkflowModalOpen(true);
        setIsEdit(true);
    }

    return (
    loading ? <><h1>Loading...</h1></> :
    <>
        <Button onClick={()=>setWorkflowModalOpen(true)}>Add new Workflow</Button>

        <WorkflowModal isOpen={workflowModalOpen} setIsOpen={setWorkflowModalOpen} workflows={workflows} 
        setWorkflows={setWorkflows} WorkflowSubmit={workflowSubmit} isEdit={isEdit} curWorkflow={curAction}
        setIsEdit={setIsEdit} workflowEditSubmit={workflowEditSubmit} metaWorkflow={metaWorkflow} setMetaWorkflow={setMetaWorkflow}>
            <Form.Label>What Meta-workflow should this be used for?</Form.Label>
            <Form.Select onChange={e=>setMetaWorkflow(e.target.value)} value={metaWorkflow}>
                <option>None</option>
                <option>Course Creation Workflow</option>
            </Form.Select>
        </WorkflowModal>

        <ActionModal isOpen={actionModalOpen} setIsOpen={setActionModalOpen} index={index} workflows={workflows} setWorkflows={setWorkflows} 
        availCodes={availCodes} parentId={parentId} depthLevel={depthLevel} setDepthLevel={setDepthLevel}
        isEdit={isEdit} setIsEdit={setIsEdit} curAction={curAction} outputHelper={BuilderOutputsHelper} refresh={update}
        addAction={addStandardAction} addWorkflowAction={addWorkflowAction} editAction={editStandardAction} editWorkflowActionFunction={editWorkflowAction}/>
        
        <DeleteModal isOpen={deleteOpen} setIsOpen={setDeleteOpen} action={curAction} 
        actionDelete={deleteStandardAction} workflowDelete={deleteWorkflow} refresh={update}/>

        <Accordion>
        {workflows ? Array.from({length: workflows.length}, (_, i) => {
            return (<div key={i} className="pt-2" onClick={()=>setIndex(i)}>
                <WorkflowComponent loading={loading} index={i} workflows={workflows} 
                setIsOpen={setActionModalOpen} setParentId={setParentId} depthLevel={0} 
                setDepthLevel={setDepthLevel} setIsEdit={setIsEdit} 
                setCurAction={setCurAction} setWorkflowModalEdit={setWorkflowModalAsOpen} setDeleteOpen={setDeleteOpen}/>
                </div>)
        }) : <></>}
        </Accordion>
    </>);
}

/**
 * CMT-Specific function
 *
 * @param {{ code: any; setPlaceholder: any; validation: any; setValidation: any; isEdit: any; curAction: any; }} param0 
 * 
 */
function BuilderOutputRenderer({code, setPlaceholder, validation, setValidation, isEdit, curAction}){
    // Why do this complicated mess? Because curAction and isEdit will definitely will be set while validation may not be :)
    const [hasValidation, setHasValidation] = useState(curAction && curAction.metadata?.outputs ? Object.keys(curAction.metadata.outputs[0]?.validation).length > 0 : false);
    // We only use this in the sessions tab
    const [multipleSessions, setMultipleSessions] = useState(false);
    let returnOutput;
    switch (code) {
        case "COURSE_SECTION":
            returnOutput = <>
            <Form.Label>Placeholder?</Form.Label>
            <Form.Control placeholder="e.g. 1" onChange={e=>setPlaceholder(e.target.value)} defaultValue={curAction && curAction.metadata?.outputs ? curAction.metadata.outputs[0]?.placeholder : ''}/>
            <div className="flex">
                <Form.Label>Has Validation?</Form.Label>
                <Form.Check className="pl-2" checked={hasValidation} onChange={(e)=>setHasValidation(e.target.checked)} defaultChecked={true}/>
            </div>
            {hasValidation ? <>
            <Form.Label>Max Length?</Form.Label>
            <Form.Control type="number" placeholder="e.g. 30" onChange={e=>setValidation([e.target.value])} defaultValue={isEdit ? validation[0] : ''}/>
            </>
            : <></>}
            </>
            break;

        case "NUMBER_STUDENTS":
            if (validation.length === 0)
                setValidation([[],[]]);
            returnOutput = <>
            <Form.Label>Has a Placeholder?</Form.Label>
            <Form.Control placeholder="e.g. 30" onChange={e=>setPlaceholder(e.target.value)} defaultValue={curAction && curAction.metadata?.outputs ? curAction.metadata.outputs[0]?.placeholder : ''}/>
            <div className="flex">
                <Form.Label>Has Validation?</Form.Label>
                <Form.Check className="pl-2" checked={hasValidation} onChange={(e)=>setHasValidation(e.target.checked)} defaultChecked={true}/>
            </div>
            {hasValidation ? <>
            <div className="flex">
                <div>
                <Form.Label>Min: </Form.Label>
                <Form.Control type="number" placeholder="e.g. 10" 
                onChange={(e)=>setValidation(prev => [[e.target.value], prev[1]])} defaultValue={isEdit ? validation[0] : ''}/>
                </div>
                <div className="pl-10">
                <Form.Label>Max:</Form.Label>
                <Form.Control type="number" placeholder="e.g. 100" 
                onChange={e=>setValidation(prev => [prev[0], [e.target.value]])} defaultValue={isEdit ?  (validation.length > 1 ? validation[1] : '') : ''}/>
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
                <Form.Check className="pl-2" checked={hasValidation} onChange={(e)=>setHasValidation(e.target.checked)} defaultChecked={true}/>
            </div>
            {hasValidation ? <>
            <div className="flex ">
                <div className="w-2/5">
                <Form.Label>Year Options (seperate each by a comma)</Form.Label>
                <Form.Control placeholder={`e.g. ${[0,1,2,3].map(i => {return new Date().getFullYear()+i}).join(', ')}`} onChange={e => {
                    setValidation(prev => [e.target.value.split(/, ?/).map(Number), prev[1]])
                }} defaultValue={isEdit ? validation[0] : ''}/>
                </div>
                <div className="pl-10 w-3/5">
                <Form.Label>Season Options (seperate each by a comma)</Form.Label>
                <Form.Control placeholder="e.g Fall, Spring, Summer 1, Summer 2, Summer 3" onChange={e => {
                    setValidation(prev => [prev[0], e.target.value.split(/, ?/)])
                }} defaultValue={isEdit ? (validation.length > 1 ? validation[1] : '') : ''}/>
                </div>
            </div>
            </>
            : <></>}
            </>
            break;
        
        case "SESSION":
            if (validation.length === 0)
                setValidation([[],[]]);
            returnOutput = <>
            <Form.Label>{multipleSessions ? 'From ' : ''}Session Number:</Form.Label>
            <Form.Control type="number" placeholder="e.g. 1" onChange={e=>setValidation(prev => [[e.target.value], prev[1]])} defaultValue={isEdit ? validation[0] : ''}/>
            {multipleSessions && !isEdit ? // If we had multiple sessions that would definitely cause issues. They can just delete and regenerate them.
            <> 
                <Form.Label>To Session Number:</Form.Label>
                <Form.Control type="number" placeholder="e.g. 5" onChange={e=>setValidation(prev => [prev[0], [e.target.value]])}/>
                <span className="text-red-500"> Please note that the name you put in will be overwritten and auto-generated names will replace it.</span>
            </>
            : <></>}
            {!isEdit ? 
            <div className="flex">
                <Form.Label>Multiple sessions?</Form.Label>
                <Form.Check className="pl-2" checked={multipleSessions} onChange={(e)=>setMultipleSessions(e.target.checked)}/>
            </div> : <></>}
            </>
            break;

        default:
            console.log(code)
            returnOutput = <></>
    }
    return returnOutput
}

/**
 * CMT-Specific function
 *
 * @param {*} code 
 * @param {*} isRequired 
 * @param {*} placeholder 
 * @param {*} validation 
 * @returns {Array} 
 */
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
            output = [{isRequired: isRequired}];
            break;

        case "SESSION":
            output = [{
                isRequired: isRequired,
                fromSessionNum: validation[0][0]
            }];
            if (validation.length > 1)
                output[0]['toSessionNum'] = validation[1][0];
            break;

        default:
            output=null;
            break;
    }

    return output;
}

/**
 * CMT-Specific function
 *
 * @async
 * @param {*} name 
 * @param {*} description 
 * @param {*} workflows 
 * @param {*} setWorkflows 
 * @param {(error:string) => void} setError
 */
async function workflowSubmit(name, description, tags, metaWorkflow, workflows, setWorkflows, setError){
    const workflow = {
        name: name,
        description: description,
        actions: [],
        tags: [...tags, "WorkflonyFirstTheRestNowhere_CMT_Template"],
        metadata: {
            code: metaWorkflow,
        },
    };
    let returnVal;
    await CMTFetch("POST", "/workflony/workflowTemplate", {workflow}).then(async response => {
        const data = await response.json();
        setWorkflows([...workflows, {
            id: data.workflow.baseActionId,
            attributeId: data.workflow.id, // The ID is for the WorkflowAttribute, not the actual workflow
            name: name,
            description: description,
            actions: [],
            tags: tags, // We do original tags here to not include the special tag
            metadata: {
                code: metaWorkflow
            }
        }]);
        console.log(data)
        returnVal = "Good";
    }).catch(async error => {
        const data = await error.response.json();
        setError(data.error);
        returnVal = "Bad";
    });
    return returnVal;
}

/**
 * CMT-Specific function
 *
 * @async
 * @param {*} name 
 * @param {*} description 
 * @param {*} tags 
 * @param {*} metaWorkflow 
 * @param {*} workflows 
 * @param {*} setWorkflows 
 * @param {(error:string) => void} setError
 * @param {*} workflowToUpdate 
 */
async function workflowEditSubmit(name, description, tags, metaWorkflow, workflows, setWorkflows, setError, workflowToUpdate){
    if (tags)
        tags.push("WorkflonyFirstTheRestNowhere_CMT_Template");
    let metadata;
    if (metaWorkflow)
        metadata = {code: metaWorkflow};
    let returnVal;
    await CMTFetch("PUT", `/workflony/workflowTemplate/${workflowToUpdate.attributeId}`, {name, description, tags, metadata}).then(async response => {
        const data = await response.json();
        if (tags)
            tags = tags.slice(0, -1);
        const workflowsCopy = workflows.map(workflow => {
            if (workflow.id !== data.workflow.baseActionId)
                return workflow
            else
                return {
                    id: data.workflow.baseActionId,
                    attributeId: data.workflow.id,
                    name: name,
                    description: description,
                    actions: workflowToUpdate.actions,
                    tags: tags,
                     metadata: {
                        code: metaWorkflow,
                    },
                    }
        })
        setWorkflows(workflowsCopy);
        console.log(data)
        returnVal = "Good";
    }).catch(async error => {
        const data = await error.response.json();
        setError(data.error);
        returnVal = data.error;
    });
    return returnVal;
}

/**
 * CMT-Specific function
 * Recursive function to find a workflow.
 * Used for the action adders to find if the parentId is a complex or workflow action. 
 *
 * @param {Array} actions
 * @param {string} parentActionId 
 */
function findParent(actions, parentActionId){
    let result = null;
    console.log(actions)
    for (let index = 0; index < actions?.length; index++) {
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

/**
 * CMT-Specific function
 *
 * @async
 * @param {*} action 
 * @param {*} actions 
 * @param {*} workflowId 
 * @param {*} id 
 * @param {*} name 
 * @param {*} description 
 * @param {*} actionType 
 * @param {*} parentActionId 
 * @param {*} metadata 
 */
async function setNextActionInfo(action, actions, workflowId, id, name, description, actionType, parentActionId, metadata){
    if (action.id === workflowId) {
        const actionList = action.childActions.slice(0,-1);
        if (action.childActions?.length > 0){
            let prevAction = action.childActions[action.childActions.length - 1];
            prevAction.nextActionId = id;
            if (action.actionType !== 'complex')
                await CMTFetch("PUT", `/workflony/actionTemplate/nextAction/${prevAction.id}`, {name: null, description: null, nextActionId: id});
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

/**
 * CMT-Specific function
 *
 * @async
 * @param {*} outputs 
 * @param {*} index 
 * @param {*} workflows 
 * @param {*} setWorkflows 
 * @param {*} name 
 * @param {*} description 
 * @param {*} code 
 * @param {*} actionType 
 * @param {*} parentActionId 
 */
async function addStandardAction(outputs, index, workflows, setWorkflows, name, description, code, actionType, parentActionId) {
    let metadata = {};
    let isWorkflowChild = false;
    let workflowParent = workflows[index];
    if (!name)
        name = 'New Action';
    if (!description)
        description = 'No description provided.'
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
    if (outputs){
        console.log("Output:",outputs)
        if (outputs[0].fromSessionNum){
            if (outputs[0].toSessionNum){
                const fromSessionNum = parseInt(outputs[0].fromSessionNum)-1;
                const toSessionNum = parseInt(outputs[0].toSessionNum)-1;
                outputs = [{isRequired: outputs[0].isRequired,  validation: {sessionNum: outputs[0].fromSessionNum}}];
                console.log("New outputs:", outputs)
                for (let j = fromSessionNum; j <= toSessionNum; j++) {
                    await addStandardAction(outputs, index, workflows, setWorkflows,
                        `Create Session ${j+1}`, description, `SESSION_${j}`, "simple", parentActionId
                    )
                }
                // We call the function a bunch of times but don't want to create a duplicate once completed
                return;
            }
            else{
                metadata.code = `SESSION_${parseInt(outputs[0].fromSessionNum)-1}`;
                outputs = [{isRequired: outputs[0].isRequired, validation: {sessionNum: outputs[0].fromSessionNum}}];
            }
            
        }
        metadata.outputs = outputs;
    }
    await CMTFetch("POST", "/workflony/actionTemplate/action", {name, description, actionType, metadata, parentActionId: !isWorkflowChild ? parentActionId : null}).then(async response => {
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
                    await CMTFetch("PUT", `/workflony/actionTemplate/nextAction/${prevAction.action.id}`, {name: prevAction.action.name, description: prevAction.action.description, nextActionId: data.action.id});
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
                    actions: workflowActions,
                    tags: workflows[j].tags,
                    metadata: workflows[j].metadata
                });
        }}
        console.log("The copy:", workflowsCopy)
        if (!isWorkflowChild){
            // If this is the first action then we set the root action
            console.log("The thing", workflowsCopy[index])
            if (workflowsCopy[index].actions.length === 1 && workflowParent.id === workflowsCopy[index].id)
                await workflowsFetch("PUT", `workflows/${workflows[index].attributeId}`, {
                rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
            else 
                setWorkflows(workflowsCopy);
        }
        else {
            if (workflowParent.childActions.length > 0)
                setWorkflows(workflowsCopy);
            else {
                await workflowsFetch("PUT", `workflows/action/${workflowParent.id}`, {
                rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
            }
        }
    });
}

/**
 * CMT-Specific function
 *
 * @async
 * @param {*} outputs 
 * @param {*} name 
 * @param {*} description 
 * @param {*} code 
 * @param {*} actionToUpdate 
 * @param {() => void} refresh
 */
async function editStandardAction(outputs, name, description, code, actionToUpdate, refresh){
    let metadata = {};
    if (!name)
        name = 'New Action';
    if (!description)
        description = 'No description provided.';
    if (code)
        metadata.code = code;
    if (outputs)
        metadata.outputs = outputs;

    console.log(metadata)

    await CMTFetch("PUT", `/workflony/actionTemplate/action/${actionToUpdate.id}`, {name, description, metadata}).then(async _ => await refresh());
}

/**
 * CMT-Specific function
 *
 * @async
 * @param {*} actionToDelete 
 * @param {() => void} refresh 
 */
async function deleteStandardAction(actionToDelete, refresh){
    // TODO works with simple and complex actions, but for complex actions does not delete child actions. We may want that so we don't have stranded child actions in the DB as cleanup.
    await CMTFetch("DELETE", `workflony/actionTemplate/action/${actionToDelete.id}`).then(async _ => await refresh());
}

/**
 * CMT-Specific function
 *
 * @async
 * @param {*} index 
 * @param {*} name 
 * @param {*} description 
 * @param {*} workflows 
 * @param {*} setWorkflows 
 * @param {*} parentActionId 
 */
async function addWorkflowAction(index, name, description, workflows, setWorkflows, parentActionId){
    const workflow = {
        name: name,
        description: description,
        actionType: "workflow",
        childActions: []
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
                    await CMTFetch("PUT", `workflony/actionTemplate/nextAction/${prevAction.action.id}`, {name: null, description: null, nextActionId: data.action.id});
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
                    actions: workflowActions,
                    tags: workflows[j].tags,
                    metadata: workflows[j].metadata
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
            if (workflowParent.childActions.length > 1)
                setWorkflows(workflowsCopy);
            else 
                await workflowsFetch("PUT", `workflows/action/${workflowParent.id}`, {
                rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
        }
    })
}

/**
 * CMT-Specific function
 *
 * @async
 * @param {*} name 
 * @param {*} description 
 * @param {*} workflowToUpdate 
 * @param {() => void} refresh
 */
async function editWorkflowAction(name, description, workflowToUpdate, refresh){
    if (!name)
        name = 'New Action';
    if (!description)
        description = 'No description provided.';

    await CMTFetch("PUT", `/workflony/actionTemplate/workflow/${workflowToUpdate.id}`, {name, description}).then(async _ => await refresh());
}

/**
 * CMT-Specific function
 *
 * @async
 * @param {*} workflowToDelete 
 * @param {() => void} refresh 
 */
async function deleteWorkflow(workflowToDelete, refresh){
    // TODO deletes but does not cleanup any actions with the workflow
    if (workflowToDelete.attributeId)
        await CMTFetch("DELETE", `workflony/workflowTemplate/workflow/${workflowToDelete.id}`).then(async _ => await refresh());
    else
        await CMTFetch("DELETE", `workflony/actionTemplate/workflow/${workflowToDelete.id}`).then(async _ => await refresh())
}

/**
 * Generic component applicable to all applications
 *
 * @param {{ isOpen: any; setIsOpen: any; workflows: any; setWorkflows: any; 
 * WorkflowSubmit: any; curWorkflow: any; isEdit: any; setIsEdit: any; 
 * workflowEditSubmit: any; metaWorkflow: any; setMetaWorkflow: any; children : any; }} param0 
 */
function WorkflowModal( {isOpen, setIsOpen, workflows, setWorkflows, 
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
 * availCodes: any; parentId: any; depthLevel: any; setDepthLevel: any;
 * isEdit: any; setIsEdit: any; curAction: any; outputHelper: any; refresh: ()=>void;
 * addAction: any; addWorkflowAction: any; editAction: any; editWorkflowActionFunction: any; }} param0 
 */
function ActionModal({isOpen, setIsOpen, index, workflows, setWorkflows, availCodes, parentId, 
    depthLevel, setDepthLevel, isEdit, setIsEdit, curAction, outputHelper, refresh,
    addAction, addWorkflowAction, editAction, editWorkflowActionFunction}){
    const [actionType, setActionType] = useState("simple");
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [code, setCode] = useState(availCodes ? availCodes[0][0] : ''); // Sorry SCOOPortal, CMT needs this or our lives become hell :(
    const [required, setRequired] = useState(false);
    const [placeholder, setPlaceholder] = useState('');
    const [validation, setValidation] = useState([]);

    function clearForm(){
        setName('');
        setDescription('');
        setActionType('simple');
        setCode(availCodes ? availCodes[0][0] : ''); 
        setValidation([]);
        setPlaceholder('');
        setRequired(false);
        setDepthLevel(depthLevel-1);
    }

    /** Loads data from the current action. Only called on edit. */
    function loadForm(){
        setName(curAction.name);
        setDescription(curAction.description);
        setActionType(curAction.actionType);
        // TODO remove this for generic workflow builder
        if (curAction.metadata){
            setCode(renderMetadataCodes());
            const outputs = curAction.metadata.outputs;
            if (outputs){
                setRequired(outputs[0].isRequired);
                setPlaceholder(outputs[0].placeholder);
                let validation = outputs[0].validation
                if (Object.keys(validation).length > 0){
                    switch (renderMetadataCodes()) {
                        case "NUMBER_STUDENTS":
                            // Sort because it starts with max then min normally while we want the opposite
                            setValidation(Object.values(validation).sort().map(item => {return [item]}));
                            break;
                        case "SESSION":
                        case "COURSE_SECTION":
                            console.log(Object.values(validation))
                            setValidation(Object.values(validation));
                            break;
                        case "COURSE_SEMESTER":
                            const validationArray = [];
                            for (let index = 0; index < outputs.length; index++) {
                                validationArray.push([Object.values(outputs[index].validation.options).join(", ")]);
                            }
                            setValidation(validationArray);
                            console.log(validationArray)
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    function renderMetadataCodes(){
        if (curAction.metadata){
            // Strips any numbers at the end of the string
            return curAction.metadata.code?.replace(/_[\d]+$/, '');
        }
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

    async function editSimpleAction(e){
        let outputs;
        outputs = outputHelper(code, required, placeholder, validation);
        e.preventDefault();
        await editAction(outputs, name, description, code, curAction, refresh).then(() => {
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

    async function editComplexAction(e){
        e.preventDefault();
        await editAction(null, name, description, null, curAction, refresh).then(() => {
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

                {/* TODO make this part of the form not hardcoded for CMT */}
                <Form.Label>Code</Form.Label>
                <Form.Select onChange={(e)=>setCode(e.target.value)} defaultValue={isEdit ? renderMetadataCodes() : ''}>
                    {availCodes.map(codeInfo => {
                        return <option key={codeInfo[0]} value={codeInfo[0]}>{codeInfo[1]}</option>
                    })}
                </Form.Select>
                <div className="flex pt-2">
                    <Form.Label>Is Required?</Form.Label>
                    <Form.Check className="pl-2" onChange={(e)=>setRequired(e.target.checked)} defaultChecked={isEdit ? (curAction.metadata?.outputs?.length > 0 ? curAction.metadata.outputs[0].isRequired : false) : false}/>
                </div>
                <BuilderOutputRenderer code={code} setPlaceholder={setPlaceholder} validation={validation} setValidation={setValidation} isEdit={isEdit} curAction={curAction}/>
                
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
function DeleteModal({isOpen, setIsOpen, action, actionDelete, workflowDelete, refresh}){

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
 * @param {{ workflows: any; index: any; actions: any; setIsOpen: any; 
 * setParentId: any; depthLevel: any; setDepthLevel: any; 
 * setCurAction: any; setIsEdit: any; setDeleteOpen: any;}} param0 
 */
function ComplexRenderer({workflows, index, actions, setIsOpen, 
    setParentId, depthLevel, setDepthLevel, 
    setCurAction, setIsEdit, setDeleteOpen}){
    // console.log("Actions", actions)
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
                            console.log(action)
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
                        {/* TODO make this not CMT-specific (e.g. no metadata) */}
                        <div>
                            <p>Code: {action.metadata.code}</p>
                            {(action.metadata.outputs||[]).map(output => {
                                return (<>
                                    <p>Required? {output.isRequired ? 'Yes' : 'No'}</p>
                                    {output.key? <p>Key: {output.key}</p> : <></>}
                                    {output.name? <p>Name: {output.name}</p> : <></>}
                                    {output.type? <p>Type: {output.type}</p> : <></>}
                                    {output.placeholder ? <p>Placeholder: {output.placeholder}</p> : <></>}
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
            case "complex":
                value = 
                <Accordion className="mt-2">
                    <Accordion.Item eventKey={action.id} className={action.id}>
                    <Accordion.Header className="w-full [&_.accordion-button::after]:hidden">
                        <div className="flex w-full justify-between">
                        <span className="text-3xl">{action.name} {action.actionType === 'complex' ? '(Complex Action)' : '(Workflow)'}</span>
                        <div>
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
                            setDeleteOpen={setDeleteOpen}/>
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

/**
 * Generic component applicable to all applications
 *
 * @param {{ index: any; workflows: any; setIsOpen: any; loading: any; 
 * setParentId: any; depthLevel: any; setDepthLevel: any; setIsEdit: any; 
 * setCurAction: any; setWorkflowModalEdit: any; setDeleteOpen: any;}} param0 
 */
function WorkflowComponent({index, workflows, setIsOpen, loading, 
    setParentId, depthLevel, setDepthLevel, setIsEdit, 
    setCurAction, setWorkflowModalEdit, setDeleteOpen}){
    if (loading)
        return <><h1>Loading...</h1></> // Here so a lot of stuff just doesn't break while it loads everything
    else
    return (<>
    <Accordion.Item eventKey={workflows[index].id}>
        <Accordion.Header className="w-full [&_.accordion-button::after]:hidden">
            <div className="flex w-full justify-between">
            <span className="text-4xl">{workflows[index].name} {workflows[index]?.metadata?.code === "None" ? "(Inactive)" : `(${workflows[index]?.metadata?.code})`}</span>
            <div>
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
                                        console.log(action)
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
                                {/* TODO make this not CMT-specific (e.g. no metadata) */}
                                <div>
                                    <p>Code: {action.metadata.code}</p>
                                    {(action.metadata.outputs||[]).map(output => {
                                        return (<>
                                            <p>Required? {output.isRequired ? 'Yes' : 'No'}</p>
                                            {output.key? <p>Key: {output.key}</p> : <></>}
                                            {output.name? <p>Name: {output.name}</p> : <></>}
                                            {output.type? <p>Type: {output.type}</p> : <></>}
                                            {output.placeholder ? <p>Placeholder: {output.placeholder}</p> : <></>}
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
                    case "complex":
                        value = 
                        <Accordion className="mt-2">
                            <Accordion.Item eventKey={action.id}>
                            <Accordion.Header className="w-full [&_.accordion-button::after]:hidden">
                                <div className="flex w-full justify-between">
                                <span className="text-3xl">{action.name} {action.actionType === 'complex' ? '(Complex Action)' : '(Workflow)'}</span>
                                <div>
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
                                setDeleteOpen={setDeleteOpen}/>
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