import { useCallback, useEffect, useState } from "react";
import { Accordion, Button, Form,} from "react-bootstrap";
import { CMTJsonFetch } from "../utils/api";
import { workflowsFetch } from "../backend/utils/workflows/api";
import { ActionModal, DeleteModal, WorkflowComponent, WorkflowModal } from "../components/workflows/Builder";


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
    ["CHECKMARK", "Checkmark"],
    ["SESSION", "Sessions"]];
    const [loading, setLoading] = useState(true);
    const [parentId, setParentId] = useState("");
    const [depthLevel, setDepthLevel] = useState(0);
    const [curAction, setCurAction] = useState({metadata: null}); // We only set this to avoid unnecessary warnings
    const [isEdit, setIsEdit] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [metaWorkflow, setMetaWorkflow] = useState('None');

    // Action modal info
    const [code, setCode] = useState(availCodes ? availCodes[0][0] : '');
    const [required, setRequired] = useState(false);
    const [placeholder, setPlaceholder] = useState('');
    const [validation, setValidation] = useState([]);
    const extraData = {code, required, placeholder, validation};

    const update = useCallback(async () => {
        return CMTJsonFetch("GET", "/workflow/workflowTemplate").then(async response => {
                const data = await response.json();
                console.log("data:", data)
                const workflowPromises = data.workflows.map(async workflow => {
                    console.log("Workflow:", workflow)
                    const info = workflow.baseAction;
                    let actions = [];
                    if (workflow.rootActionId){
                        const actionResponse = await CMTJsonFetch("GET", `workflow/actionTemplate/workflow/${workflow.id}`)
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

    function renderMetadataCodes(){
        if (curAction.metadata){
            // Strips any numbers at the end of the string
            return curAction.metadata.code?.replace(/_[\d]+$/, '');
        }
    }

    function loadActionForm(){
        if (curAction.metadata){
            setCode(renderMetadataCodes());
            const outputs = curAction.metadata.outputs;
            if (outputs){
                setRequired(outputs[0].isRequired);
                setPlaceholder(outputs[0].placeholder);
                let validation = outputs[0].validation
                if (validation && Object.keys(validation).length > 0){
                    switch (renderMetadataCodes()) {
                        case "NUMBER_STUDENTS":
                            // Sort because it starts with max then min normally while we want the opposite
                            setValidation(Object.values(validation).sort((a, b) => a-b).map(item => {return [item]}));
                            break;
                        case "SESSION":
                        case "COURSE_SECTION":
                            setValidation(Object.values(validation));
                            break;
                        case "COURSE_SEMESTER":
                            const validationArray = [];
                            validationArray.push([Object.values(outputs[0].validation.options).join(", ")]);
                            validationArray.push(Object.values(outputs[1].validation.options));
                            setValidation(validationArray);
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    function clearActionForm(){
        setCode(availCodes[0][0]); 
        setValidation([]);
        setPlaceholder('');
        setRequired(false);
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
        parentId={parentId} depthLevel={depthLevel} setDepthLevel={setDepthLevel}
        isEdit={isEdit} setIsEdit={setIsEdit} curAction={curAction} refresh={update}
        addAction={addStandardAction} addWorkflowAction={addWorkflowAction} editAction={editStandardAction} editWorkflowActionFunction={editWorkflowAction}
        loadFunction={loadActionForm} clearFunction={clearActionForm} extraData={extraData}>
            <Form.Label>Code</Form.Label>
            <Form.Select onChange={(e)=>setCode(e.target.value)} value={code}>
                {availCodes.map(codeInfo => {
                    return <option key={codeInfo[0]} value={codeInfo[0]}>{codeInfo[1]}</option>
                })}
            </Form.Select>
            <div className="flex pt-2">
                <Form.Label>Is Required?</Form.Label>
                <Form.Check className="pl-2" onChange={(e)=>setRequired(e.target.checked)} defaultChecked={isEdit ? (curAction.metadata?.outputs?.length > 0 ? curAction.metadata.outputs[0].isRequired : false) : false}/>
            </div>
            <BuilderOutputRenderer code={code} setPlaceholder={setPlaceholder} validation={validation} setValidation={setValidation} isEdit={isEdit} curAction={curAction}/>
        </ActionModal>
        
        <DeleteModal isOpen={deleteOpen} setIsOpen={setDeleteOpen} action={curAction} 
        actionDelete={deleteStandardAction} workflowDelete={deleteWorkflow} refresh={update}/>

        <Accordion>
        {workflows ? Array.from({length: workflows.length}, (_, i) => {
            return (<div key={i} className="pt-2" onClick={()=>setIndex(i)}>
                <WorkflowComponent loading={loading} index={i} workflows={workflows} 
                setIsOpen={setActionModalOpen} setParentId={setParentId} depthLevel={0} 
                setDepthLevel={setDepthLevel} setIsEdit={setIsEdit} 
                setCurAction={setCurAction} setWorkflowModalEdit={setWorkflowModalAsOpen} 
                setDeleteOpen={setDeleteOpen} simpleExtraDataRenderer={simpleActionRenderer}/>
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
    const [hasValidation, setHasValidation] = useState(curAction && curAction.metadata?.outputs && curAction.metadata?.outputs[0].validation ? Object.keys(curAction.metadata.outputs[0]?.validation).length > 0 : false);
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
                <Form.Check className="pl-2" checked={hasValidation} onChange={(e)=>{
                    setHasValidation(e.target.checked);
                    if (!e.target.checked)
                        setValidation([]);
                    }}/>
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
                <Form.Check className="pl-2" checked={hasValidation} onChange={(e)=>
                    {
                        setHasValidation(e.target.checked)
                        if (!e.target.checked)
                            setValidation([[],[]])
                    }}/>
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
                <Form.Check className="pl-2" checked={hasValidation} onChange={(e)=>{
                    setHasValidation(e.target.checked);
                    if (!e.target.checked)
                        setValidation([[],[]])
                }}/>
            </div>
            {hasValidation ? <>
            <div className="flex ">
                <div className="w-2/5">
                <Form.Label>Year Options (seperate each by a comma)</Form.Label>
                <Form.Control placeholder={`e.g. ${[0,1,2,3].map(i => {return new Date().getFullYear()+i}).join(', ')}`} onChange={e => {
                    setValidation(prev => [e.target.value, prev[1]])
                }} defaultValue={isEdit ? validation[0] : ''}/>
                </div>
                <div className="pl-10 w-3/5">
                <Form.Label>Season Options (seperate each by a comma)</Form.Label>
                {['Fall', 'Spring', 'Summer 1', 'Summer 2', 'Summer 3'].map(option =>
                (
                    <Form.Check  
                    key={option}
                    type="checkbox"
                    label={option}
                    value={option}
                    id={`checkbox-${option}`}
                    checked={validation[1].includes(option)}
                    onChange={(e) => {
                        // AI-generated code
                        const { value, checked } = e.target
                        if (checked && !validation[1].includes(value)) {
                            setValidation(prev => [prev[0], [...prev[1], value]]);
                        } else {
                            setValidation(prev => [prev[0], prev[1].filter((option) => option !== value)]);
                        }
                    }}
                    />
                ))}
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
    switch (code.replace(/_[\d]+$/, '')) {
        case "COURSE_SECTION":
            output = [{
                name: "Course Section",
                key: "section",
                type: "text",
                isRequired: isRequired
            }]
            if (validation[0]){
                if (parseInt(validation[0]) < 1)
                    // Skip validation since the user won't be able to put anything in
                    break

                output[0]['validation'] = {maxLength: validation[0]}
                if (placeholder && placeholder.length <= parseInt(validation[0])) 
                    output[0]['placeholder'] = placeholder
            } 
            break;
        
        case "NUMBER_STUDENTS":
            output = [{
                name: "Number of Students",
                key: "students",
                type: "number",
                isRequired: isRequired
            }]
            if (validation[0][0] && validation[1][0]) {
                if (validation[0][0] > validation[1][0])
                    // Just skip and don't set validation if the min is greater than the max
                    break

                output[0]['validation'] = {
                max: validation[1][0],
                min: validation[0][0]
                }

                if (placeholder && placeholder >= validation[0][0] && placeholder <= validation[1][0]) 
                    output[0]['placeholder'] = placeholder;
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
            if (validation[0].length > 0 && validation[1].length > 0){
                console.log("has validation:", validation)
                let yearIndex = output.findIndex(obj => obj.name === "Year");
                output[yearIndex]['validation'] = {options: validation[0].split(/, ?/).map(year => parseInt(year))};
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
 * @param {*} action 
 * @returns {React.ReactElement} 
 */
function simpleActionRenderer(action) {
    return <div>
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
    await CMTJsonFetch("POST", "/workflow/workflowTemplate", {workflow}).then(async response => {
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
    await CMTJsonFetch("PUT", `/workflow/workflowTemplate/${workflowToUpdate.attributeId}`, {name, description, tags, metadata}).then(async response => {
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
                await CMTJsonFetch("PUT", `/workflow/actionTemplate/nextAction/${prevAction.id}`, {name: null, description: null, nextActionId: id});
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
 * @param {*} index 
 * @param {*} workflows 
 * @param {*} setWorkflows 
 * @param {*} name 
 * @param {*} description 
 * @param {*} actionType 
 * @param {*} parentActionId 
 * @param {Object} extraData
 */
async function addStandardAction(index, workflows, setWorkflows, name, description, actionType, parentActionId, extraData) {
    let code, outputs;
    if (actionType === 'simple'){
        code = extraData.code;
        outputs = BuilderOutputsHelper(code, extraData.required, extraData.placeholder, extraData.validation)
    }
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
                for (let j = fromSessionNum; j <= toSessionNum; j++) {
                    extraData.code = `SESSION_${j}`;
                    extraData.validation = [[`${j+1}`]]
                    await addStandardAction(index, workflows, setWorkflows,
                        `Create Session ${j+1}`, description, "simple", parentActionId, extraData
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
    await CMTJsonFetch("POST", "/workflow/actionTemplate/action", {name, description, actionType, metadata, parentActionId: !isWorkflowChild ? parentActionId : null}).then(async response => {
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
                    await CMTJsonFetch("PUT", `/workflow/actionTemplate/nextAction/${prevAction.action.id}`, {name: prevAction.action.name, description: prevAction.action.description, nextActionId: data.action.id});
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
            if (workflowParent.childActions.length > 1)
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
 * @param {*} name 
 * @param {*} description 
 * @param {*} actionToUpdate 
 * @param {Object} extraData
 * @param {() => void} refresh
 */
async function editStandardAction(name, description, actionToUpdate, extraData, refresh){
    let code, outputs;
    if (actionToUpdate.actionType === 'simple'){
        code = extraData.code;
        outputs = BuilderOutputsHelper(code, extraData.required, extraData.placeholder, extraData.validation)
    }
    let metadata = {};
    if (!name)
        name = 'New Action';
    if (!description)
        description = 'No description provided.';
    if (code)
        metadata.code = code;
    if (outputs)
        metadata.outputs = outputs;

    await CMTJsonFetch("PUT", `/workflow/actionTemplate/action/${actionToUpdate.id}`, {name, description, metadata}).then(async _ => await refresh());
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
    await CMTJsonFetch("DELETE", `workflow/actionTemplate/action/${actionToDelete.id}`).then(async _ => await refresh());
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
    await CMTJsonFetch("POST", "workflow/actionTemplate/workflow", {workflow, parentActionId:!isWorkflowChild ? parentActionId : null}).then(async response => {
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
                    await CMTJsonFetch("PUT", `workflow/actionTemplate/nextAction/${prevAction.action.id}`, {name: null, description: null, nextActionId: data.action.id});
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

    await CMTJsonFetch("PUT", `/workflow/actionTemplate/workflow/${workflowToUpdate.id}`, {name, description}).then(async _ => await refresh());
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
        await CMTJsonFetch("DELETE", `workflow/workflowTemplate/workflow/${workflowToDelete.id}`).then(async _ => await refresh());
    else
        await CMTJsonFetch("DELETE", `workflow/actionTemplate/workflow/${workflowToDelete.id}`).then(async _ => await refresh())
}

