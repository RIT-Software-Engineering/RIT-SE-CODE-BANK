import { useCallback, useEffect, useState } from "react";
import { Accordion, Button, Form,} from "react-bootstrap";
import { CMTJsonFetch } from "../utils/api";
import { workflowsFetch } from "../backend/utils/workflows/api";
import { ActionModal, DeleteModal, WorkflowComponent, WorkflowModal } from "../components/workflows/Builder";


/**
 * A component that acts as the main page for the Workflow Builder.
 * On load, gets our template actions and the nested actions within those actions
 * Then displays the generic components from Builder with our metadata loaded
 *
 * @export
 */
export function BuilderPage(){
    const [workflows, setWorkflows] = useState([]); // An array of objects. Each object may have child arrays of objects (which are actions)
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

    /**
     * Function that's called on load to get all the workflows for our template
     * Our template workflows have special codes that allow them to be easily grabbed from the DB
     * Once the template workflow is received, gets the actions within each template and sets them 
     * Once all that is done, sets the workflows in alphabetical order.
     */
    const update = useCallback(async () => {
        return CMTJsonFetch("GET", "/workflow/workflowTemplate").then(async response => {
            const data = await response.json();
            const workflowPromises = data.workflows.map(async workflow => {
                const info = workflow.baseAction;
                let actions = [];
                if (workflow.rootActionId){
                    const actionResponse = await CMTJsonFetch("GET", `workflow/actionTemplate/workflow/${workflow.id}`)
                    const returnedActions = await actionResponse.json();
                    actions = returnedActions.actions;
                }
                return {
                    id: info.id,
                    attributeId: workflow.id,
                    name: info.name,
                    description: info.description,
                    actions: actions || [],
                    metadata: info.metadata,
                    tags: workflow.tags?.filter(tag => tag !== "WorkflonyFirstTheRestNowhere_CMT_Template"), // Remove the special tag so it's not modifiable in any way
                }
            });
            const resolvedWorkflows = await Promise.all(workflowPromises);
            setWorkflows(resolvedWorkflows.sort((a, b) => a.name.localeCompare(b.name)));
            setLoading(false);
        });
    }, [])
    useEffect(() => void update(), [update])
    
    // Helper function so we can pass in less information
    function setWorkflowModalAsOpen(){
        setWorkflowModalOpen(true);
        setIsEdit(true);
    }

    // Strips any numbers at the end of the string if there's any metadata and metadata codes
    function renderMetadataCodes(){
        if (curAction.metadata){
            return curAction.metadata.code?.replace(/_[\d]+$/, '');
        }
    }

    /** 
     * Helper function that loads our relevant data in the {@link ActionModal}.
     * Other projects may not use metadata, so this stuff is set in here.
     * Passed into the {@link ActionModal} component.
     */
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

    /** 
     * Helper function that clears our relevant data in the {@link ActionModal}.
     * Other projects may not use metadata, so this stuff is cleared in here.
     * Passed into the {@link ActionModal} component.
     */
    function clearActionForm(){
        setCode(availCodes[0][0]); 
        setValidation([]);
        setPlaceholder('');
        setRequired(false);
    }

    /** 
     * Helper function that loads our relevant data in the {@link WorkflowModal}.
     * Other projects may not use metadata, so this stuff is loaded in here.
     * Passed into the {@link WorkflowModal} component.
     */
    function loadWorkflowForm(){
        setMetaWorkflow(curAction.metadata?.code);
    }

    /** 
     * Helper function that clears our relevant data in the {@link WorkflowModal}.
     * Other projects may not use metadata, so this stuff is loaded in here.
     * Passed into the {@link WorkflowModal} component.
     */
    function clearWorkflowForm(){
        setMetaWorkflow('None');
    }

    return (
    loading ? <><h1>Loading...</h1></> :
    <>
        <Button onClick={()=>setWorkflowModalOpen(true)}>Add new Workflow</Button>

        <WorkflowModal isOpen={workflowModalOpen} setIsOpen={setWorkflowModalOpen} workflows={workflows} 
        setWorkflows={setWorkflows} WorkflowSubmit={workflowSubmit} isEdit={isEdit} curWorkflow={curAction}
        setIsEdit={setIsEdit} workflowEditSubmit={workflowEditSubmit} extraData={{metaWorkflow}}
        loadFunction={loadWorkflowForm} clearFunction={clearWorkflowForm}>

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
        workflows={workflows} setWorkflows={setWorkflows}
        actionDelete={deleteStandardAction} workflowDelete={deleteWorkflow} refresh={update}/>

        <Accordion>
        {workflows ? Array.from({length: workflows.length}, (_, i) => {
            /* For each workflow we create a workflow component, which is our workflow template */
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
 * A dynamic component that is rendered within the {@link ActionModal}
 * Depending on the metadata code, dynamically renders specific validation options
 *
 * @param {Object} props
 * @param {string} props.code - The metadata code that needs to be rendered. These are CMT-specific and have different kinds of placeholders and validation for each code
 * @param {(placeholer: string) => void} props.setPlaceholder - If there's a placeholder for the action set it. E.g. Placeholder 30 for number of students
 * @param {Array} props.validation - An array that contains values that the user input is constrained to. Used here to set the proper array if needed.
 * @param {(Array) => void} props.setValidation - Sets the validation array. Called onChange and sets it.
 * @param {Boolean} props.isEdit - Whether the user is editing or creating. Used to check and load curAction if it is an edit
 * @param {Object} props.curAction - The current action. Only used during editing, sets default values if there are any
 * 
 * @return {React.ReactElement} returnOutput - the react html that will be rendered
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
            // Validation for number of students is a 2D array (min and max)
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
            // Validation for semesters is a 2D array (array of years and seasons)
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
            // Validation for sessions is a 2D array (start and end number)
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
 * Helper function to help upload validation
 * Our validation are just objects inside of the metadata, so we do setting here
 * Depending on the code, returns one standardized array of objects to add to our metadata
 *
 * @param {string} code - The code of our action
 * @param {boolean} isRequired - Whether the action is required or not
 * @param {string} placeholder - A placeholder if it exists. Not all actions have placeholders.
 * @param {Array} validation - The validation for the action if it exists. Not all actions have validation.
 * @returns {Array} output - a unified array of objects that contains our output for the renderers in courses
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
                    break;

                // Our validation here is the max length of the string
                output[0]['validation'] = {maxLength: validation[0]}
                // Add a placeholder if the placeholder fits the given constraints
                if (placeholder && (placeholder.length <= parseInt(validation[0]))) 
                    output[0]['placeholder'] = placeholder
                else if (placeholder)
                    throw new Error("Length of placeholder string must be less than validation length.s")
            } 
            else {
                if (placeholder)
                    output[0]['placeholder'] = placeholder;
            }
            break;
        
        case "NUMBER_STUDENTS":
            output = [{
                name: "Number of Students",
                key: "students",
                type: "number",
                isRequired: isRequired
            }]

            // Our validation is a 2d array containing one element each. The first one is min and second is max
            if (validation[0][0] && validation[1][0]) {
                if (validation[0][0] > validation[1][0])
                    // Just skip and don't set validation if the min is greater than the max
                    throw new Error("Max must be greater than min.")

                output[0]['validation'] = {
                max: validation[1][0],
                min: validation[0][0]
                }

                // If the placeholder fits within the validation constraints
                if (placeholder && ((parseInt(placeholder) >= parseInt(validation[0][0]) && parseInt(placeholder) <= parseInt(validation[1][0]))))
                    output[0]['placeholder'] = placeholder;
                else if (placeholder)
                    throw new Error("Placeholder must fall between validation options.")
            }
            else {
                if (placeholder)
                    output[0]['placeholder'] = placeholder;
            }
            break;

        case "COURSE_SEMESTER":
            // We have 2 outputs for this since we have years and seasons
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
                // Since the years are user-given, if there's any spaces we get rid of them
                output[0]['validation'] = {options: validation[0].split(/, ?/).map(year => parseInt(year))};
                output[1]['validation'] = {options: validation[1]};
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
            if (validation[1])
                output[0]['toSessionNum'] = validation[1][0];
            break;

        default:
            // We set output to null in case we get something we don't know how to deal with.
            output=null;
            break;
    }

    return output;
}

/**
 * A Helper function that renders metadata stuff
 * Not all projects use metadata, so we need to seperate that and pass it into the {@link WorkflowComponent} and {@link ComplexRenderer}.
 * In other projects, if there's data we don't use then they can render that for their simple actions.
 * 
 * For us, we display the code, and all the outputs if there are any. There's always a code so that should always display, but there isn't always every output.
 *
 * @param {Object} action - The simple action that needs metadata rendered
 * @returns {React.ReactElement} - The code to render the action's metadata code and outputs.
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
 * A helper function to submit template workflows
 * Because we have our CMT-specific special tag and our own endpoint, we pass this into the {@link WorkflowModal}.
 * Makes a POST request to add the workflow template and updates our workflows if successful.
 *
 * @async
 * @param {string} name - The name of the workflow
 * @param {string} description - The description of the workflow
 * @param {Array} tags - An array of strings of the tags of the workflow
 * @param {Array} workflows - An array containing all of the workflows
 * @param {(workflows: Array) => void} setWorkflows - The state setter to set all our workflows
 * @param {Object} extraData - Any extra data, which is metadata/the meta workflow in our case
 * @param {(error:string) => void} setError - Sets a display error in the {@link WorkflowModal} if it fails to add the workflow for any reason
 */
async function workflowSubmit(name, description, tags, workflows, setWorkflows, extraData, setError){
    // We define extraData to have a metaWorkflow attribute, but just in case it can be set to null.
    const metaWorkflow = extraData?.metaWorkflow;

    if (!name)
        name = 'New Workflow';
    if (!description)
        description = 'No description provided.'

    const workflow = {
        name: name,
        description: description,
        actions: [],
        tags: [...tags, "WorkflonyFirstTheRestNowhere_CMT_Template"], // We use all the given tags and add our special tag
        metadata: {
            code: metaWorkflow, 
        },
    };

    // We have a return value in case our request fails for some reason. It's mainly so the WorkflowModal knows to clear and close everything or not.
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
        }].sort((a, b) => a.name.localeCompare(b.name))); // Just sort them
        returnVal = "Good";
    }).catch(async error => {
        const data = await error.response.json();
        setError(data.error);
        returnVal = "Bad";
    });
    // Finally does not return our value so we just return it after our request
    return returnVal;
}

/**
 * A helper function to edit template workflows
 * Because we have our CMT-specific special tag and our own endpoint, we pass this into the {@link WorkflowModal}.
 * Makes a PUT request to add the workflow template and updates our workflows if successful.
 *
 * @async
 * @param {string} name - The name of the workflow
 * @param {string} description - The description of the workflow
 * @param {Array} tags - An array of strings of the tags of the workflow
 * @param {Array} workflows - An array containing all of the workflows
 * @param {(workflows: Array) => void} setWorkflows - The state setter to set all our workflows
 * @param {Object} extraData - Any extra data, which is metadata/the meta workflow in our case
 * @param {(error:string) => void} setError - Sets a display error in the {@link WorkflowModal} if it fails to add the workflow for any reason
 * @param {Object} workflowToUpdate - Our workflow that is being edited/updated. We mainly use its data since the PUT doesn't return useful stuff for us
 */
async function workflowEditSubmit(name, description, tags, workflows, setWorkflows, extraData, setError, workflowToUpdate){
    // Add our special tag if we have any tags
    if (tags)
        tags.push("WorkflonyFirstTheRestNowhere_CMT_Template");

    if (!name)
        name = 'New Workflow';
    if (!description)
        description = 'No description provided.'

    // Only add metadata if we have the meta workflow so we don't override previous metadata
    let metadata;
    if (extraData.metaWorkflow)
        metadata = {code: extraData.metaWorkflow};

    // We have a return value in case our request fails for some reason. It's mainly so the WorkflowModal knows to clear and close everything or not.
    let returnVal;
    await CMTJsonFetch("PUT", `/workflow/workflowTemplate/${workflowToUpdate.attributeId}`, {name, description, tags, metadata}).then(async response => {
        const data = await response.json();
        // If we have tags then we remove our special tag so the user can't mess with it
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
                        code: extraData.metaWorkflow,
                    },
                    }
        })
        setWorkflows(workflowsCopy);
        returnVal = "Good";
    }).catch(async error => {
        const data = await error.response.json();
        setError(data.error);
        returnVal = data.error;
    });
    // Finally does not return our value so we just return it after our request
    return returnVal;
}

/**
 * A helper function to help find the parent workflow/action
 * Used for the action adders to find if the parentId is a complex or workflow action. 
 * Goes through one branch of the tree at a time.
 *
 * @param {Array} actions - the child actions of a parent action. They may or may not be the action we are looking for.
 * @param {string} parentActionId - the ID of the parent that we want to match
 */
function findParent(actions, parentActionId){
    let result = null;
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
 * A recursive function to add the actions back up into the workflows array
 * Despite it's name, it does not always set the next action since we have complex actions, but it will build the action object back up
 *
 * @async
 * @param {Object} action - The current action we are looking at
 * @param {Array} actions - An array of actions
 * @param {string} workflowId - The parent/workflow ID that we are looking for
 * @param {string} id - the ID of our base action we have just added
 * @param {string} name - the name of the action we just added
 * @param {string} description - the description of the action we just added
 * @param {string} actionType - the action type of the action we just added
 * @param {string} parentActionId - the parentActionId of the action we just added (if any)
 * @param {Object} metadata - the metadata of the action we just added
 */
async function setNextActionInfo(action, actions, workflowId, id, name, description, actionType, parentActionId, metadata){
    
    // If the current action we're looking at is the parent, we take all the previous actions except the last one and put it in an array
    // If it's not a complex action, we make a PUT request to set the next action (since complex actions don't have next actions)
    // After we take the last previous action and put it back in there, and add our latest action
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
 * A helper function to submit simple and complex actions
 * Because we have our CMT-specific endpoints and metadata, we pass this into the {@link ActionModal}
 * Makes a POST request to add the workflow template and updates our workflows if successful
 *
 * @async
 * @param {Number} index - The index of the current workflow template. Used to make things go faster when setting the workflows
 * @param {Array} workflows - the array of our workflows templates
 * @param {(workflows: Array) => void} setWorkflows - the state setter for our workflows
 * @param {string} name - the name of the action
 * @param {string} description - the description of the action
 * @param {string} actionType - the action type. We either pass in "simple" or "complex"
 * @param {string} parentActionId - the parentActionId if it exists. We leave it at that for complex parents, but if it's a "workflow parent", we do some work on it
 * @param {Object} extraData - Extra data that was passed into {@link WorkflowComponent} and {@link ComplexRenderer} that was passed into the {@link ActionModal}. In this case, it's metadata stuff.
 * @param {(error: String) => void} setError - Error that will be displayed on the ActionModal component if something goes wrong
 * @param {() => void} refresh - function that would avoid tricky logic, but we don't use it here since the logic has already been completed. Used mainly to maintain abstraction. 
*/
async function addStandardAction(index, workflows, setWorkflows, name, description, actionType, parentActionId, extraData, setError, refresh) {
    let code, outputs;
    // Since complex actions don't have any codes or outputs, we only set it for simple actions
    if (actionType === 'simple'){
        code = extraData.code;
        try {
            outputs = BuilderOutputsHelper(code, extraData.required, extraData.placeholder, extraData.validation)
        } catch (error) {
            setError(error.message);
            return "Bad";   
        }
    }

    if (!name)
        name = 'New Action';
    if (!description)
        description = 'No description provided.'

    let metadata = {};

    // Ok here's the other stuff we do if the parentAction is NOT a complex action
    // So workflows don't have child actions, but it's a lot easier to lie and say that they do for rendering sake
    // We need to check if the action is a direct descendant of a workflow or not
    // We also set the parent to be the workflow template we're working in
    // Also despite its name, isWorkflowsChild is FALSE if the action is a direct descendant of our template workflow
    let isWorkflowChild = false;
    let workflowParent = workflows[index];
    if (parentActionId){
        // If we do have a parent action, we do a very basic search of the top level actions in our parent
        workflowParent = workflows[index].actions.find(action => action.action.id === parentActionId)?.action;

        // If we our parent isn't one of those top level actions, we then iterate through the child actions of those top level actions in an attempt to find the parent
        if (!workflowParent){
            for (let j = 0; j < workflows[index].actions.length; j++) {
                const actions = workflows[index].actions[j];
                if (!workflowParent)
                    workflowParent = findParent(actions.action?.childActions, parentActionId)
            }
        }

        // Once we found our parent, we set whether or not it's a direct descendant of a workflow or not (it would be a complex parent otherwise)
        isWorkflowChild = workflowParent?.actionType === "workflow";
    }

    if (code)
        metadata.code = code;

    if (outputs){
        // We check if our outputs from the BuilderOutputsHelper has the fromSessionNum key (a session type simple action)
        if (outputs[0].fromSessionNum){
            // If it does and it ALSO has a to session num, then we iterate from the from -1 exclusively to the toSessionNum and recurisvely call this function to add the simple action
            // We also have to set the code since we have to keep it abstract and also we're changing the code for each iteration
            if (outputs[0].toSessionNum){
                const fromSessionNum = parseInt(outputs[0].fromSessionNum)-1;
                const toSessionNum = parseInt(outputs[0].toSessionNum)-1;
                for (let j = fromSessionNum; j <= toSessionNum; j++) {
                    extraData.code = `SESSION_${j}`;
                    extraData.validation = [[`${j+1}`]]
                    await addStandardAction(index, workflows, setWorkflows,
                        `Create Session ${j+1}`, description, "simple", parentActionId, extraData, setError, refresh
                    )
                }
                // We call the function a bunch of times but don't want to create a duplicate once completed
                return;
            }
            // If we do NOT have a toSessionNum (or we're already in the iterative loop), then we just set the code and outputs manually
            else{
                metadata.code = `SESSION_${parseInt(outputs[0].fromSessionNum)-1}`;
                outputs = [{isRequired: outputs[0].isRequired, validation: {sessionNum: outputs[0].fromSessionNum}}];
            }
            
        }
        metadata.outputs = outputs;
    }

    if (code === "SESSION" && metadata.code === code){
        setError("Please input a session number.");
        return "Bad";
    }

    let returnVal;
    await CMTJsonFetch("POST", "/workflow/actionTemplate/action", {name, description, actionType, metadata, parentActionId: !isWorkflowChild ? parentActionId : null}).then(async response => {
        const data = await response.json();

        let workflowsCopy = [];
        for (let j = 0; j < workflows.length; j++) {
        if (j !== index)
            // We don't do anything special the workflow isn't the template workflow we're working in
            workflowsCopy.push(workflows[j])
        else {
            let workflowActions = [];
            // If our new action is a direct descendant of the template workflow, we get the previous actions and just set prevAction here instead of the function
            if (workflowParent.id === workflows[index].id){
                // We take all the previous actions except the last one so we can set the next action for our previous action. Once that's done we add it back to our actions
                const actions = workflows[index].actions.slice(0,-1);
                if (workflows[index].actions.length > 0){
                    let prevAction = workflows[index].actions[workflows[index].actions.length - 1];
                    prevAction.action.nextActionId = data.action.id;
                    await CMTJsonFetch("PUT", `/workflow/actionTemplate/nextAction/${prevAction.action.id}`, {name: prevAction.action.name, description: prevAction.action.description, nextActionId: data.action.id});
                    actions.push({...prevAction});
                }
                // Now that all our actions are put back together we add our newly created action
                workflowActions = actions;
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
                // Check if our parent has any other child actions/descendants
                // If so, we go through our top level actions and recursively build our actions back up
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
                    // If our parent doesn't have any childActions or descendants, we just add them directly
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
            // Once we've done all our work, we add our template workflow back in with the associated actions
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

        if (!isWorkflowChild){
            // If this is the first action then we set the root action
            if (workflowsCopy[index].actions.length === 1 && workflowParent.id === workflowsCopy[index].id)
                await workflowsFetch("PUT", `workflows/${workflows[index].attributeId}`, {
                rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
            else 
                setWorkflows(workflowsCopy);
        }
        else {
            // Check if we have more childActions than the one we just created. If not, we set the root action ID of our parent workflow to be the newly created action's id.
            if (workflowParent.childActions.length > 1)
                setWorkflows(workflowsCopy);
            else {
                await workflowsFetch("PUT", `workflows/action/${workflowParent.id}`, {
                rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
            }
        }
        returnVal = "Good";
    }).catch(async error => {
        const data = await error.response.json();
        setError(data.error);
        returnVal = "Bad";
    });
    return returnVal;
}

/**
 * A helper function to edit simple and complex actions
 * Because we have our CMT-specific endpoints and metadata, we pass this into the {@link ActionModal}
 * Makes a PUT request to add the workflow template and updates our workflows if successful
 *
 * @async
 * @param {string} name - the name of our action 
 * @param {string} description - the description of our action
 * @param {Object} actionToUpdate - the action we are updating
 * @param {Object} extraData - Extra data that was passed into {@link WorkflowComponent} and {@link ComplexRenderer} that was passed into the {@link ActionModal}. In this case, it's metadata stuff.
 * @param {(error: String) => void} setError - Error that will be displayed on the ActionModal component if something goes wrong
 * @param {() => void} refresh - Function to refresh the page upon completion. Used so we don't have to do complicated logic and let the API handle stuff
 */
async function editStandardAction(name, description, actionToUpdate, extraData, setError, refresh){
    let code, outputs;
    // Since complex actions don't have any codes or outputs, we only set it for simple actions
    if (actionToUpdate.actionType === 'simple'){
        code = extraData.code;
        try {
            outputs = BuilderOutputsHelper(code, extraData.required, extraData.placeholder, extraData.validation)
        } catch (error) {
            setError(error.message);
            return "Bad";
        }
        
    }

    if (!name)
        name = 'New Action';
    if (!description)
        description = 'No description provided.';

    let metadata = {};

    if (code)
        metadata.code = code;
    if (outputs){
        if (outputs[0].fromSessionNum){
            metadata.code = `SESSION_${parseInt(outputs[0].fromSessionNum)-1}`;
            outputs = [{isRequired: outputs[0].isRequired, validation: {sessionNum: outputs[0].fromSessionNum}}];
        }
        metadata.outputs = outputs;
    }

    let returnVal;
    await CMTJsonFetch("PUT", `/workflow/actionTemplate/action/${actionToUpdate.id}`, {name, description, metadata}).then(async _ => {
            await refresh();
            returnVal = "Good";
    }).catch(async error => {
        const data = await error.response.json();
        setError(data.error);
        returnVal = "Bad";
    });

    return returnVal;
}

/**
 * A helper function to delete simple and complex actions
 * Because we have our CMT-specific endpoints and metadata, we pass this into the {@link DeleteModal}
 * Makes a DELETE request to add the workflow template and updates our workflows if successful
 *
 * @async
 * @param {Object} actionToDelete - the action that will be deleted
 * @param {() => void} refresh - Function to refresh the page upon completion. Used so we don't have to do complicated logic and let the API handle stuff
 */
async function deleteStandardAction(actionToDelete, refresh){
    // TODO works with simple and complex actions, but for complex actions does not delete child actions. We may want that so we don't have stranded child actions in the DB as cleanup.
    await CMTJsonFetch("DELETE", `workflow/actionTemplate/action/${actionToDelete.id}`).then(async _ => await refresh());
}

/**
 * A helper function to submit workflow actions
 * Because we have our CMT-specific endpoints, we pass this into the {@link ActionModal}
 * Makes a POST request to add the workflow template and updates our workflows if successful
 *
 * @async
 * @param {Number} index - The index of the current workflow template. Used to make things go faster when setting the workflows
 * @param {string} name - the name of the action
 * @param {string} description - the name of the description
 * @param {Array} workflows - the array of our workflows templates
 * @param {(workflows: Array) => void} setWorkflows - the state setter for our workflows
 * @param {string} parentActionId - the parentActionId if it exists. We leave it at that for complex parents, but if it's a "workflow parent", we do some work on it
 * @param {() => void} refresh - function that would avoid tricky logic, but we don't use it here since the logic has already been completed. Used mainly to maintain abstraction. 
*/
async function addWorkflowAction(index, name, description, workflows, setWorkflows, parentActionId, refresh){
    const workflow = {
        name: name,
        description: description,
        actionType: "workflow",
        childActions: []
    };

    // Ok here's the other stuff we do if the parentAction is NOT a complex action
    // So workflows don't have child actions, but it's a lot easier to lie and say that they do for rendering sake
    // We need to check if the action is a direct descendant of a workflow or not
    // We also set the parent to be the workflow template we're working in
    // Also despite its name, isWorkflowsChild is FALSE if the action is a direct descendant of our template workflow
    let isWorkflowChild = false;
    let workflowParent = workflows[index];
    if (parentActionId){
         // If we do have a parent action, we do a very basic search of the top level actions in our parent
        workflowParent = workflows[index].actions.find(action => action.action.id === parentActionId)?.action;

        // If we our parent isn't one of those top level actions, we then iterate through the child actions of those top level actions in an attempt to find the parent
        if (!workflowParent){
            for (let j = 0; j < workflows[index].actions.length; j++) {
                const actions = workflows[index].actions[j];
                if (!workflowParent)
                    workflowParent = findParent(actions.action?.childActions, parentActionId)
            }
        }
        
        // Once we found our parent, we set whether or not it's a direct descendant of a workflow or not (it would be a complex parent otherwise)
        isWorkflowChild = workflowParent?.actionType === "workflow";
    }
    await CMTJsonFetch("POST", "workflow/actionTemplate/workflow", {workflow, parentActionId:!isWorkflowChild ? parentActionId : null}).then(async response => {
        const data = await response.json();
        let workflowsCopy = [];
        for (let j = 0; j < workflows.length; j++) {
        if (j !== index)
            // We don't do anything special the workflow isn't the template workflow we're working in
            workflowsCopy.push(workflows[j])
        else {
            let workflowActions = [];
            // If our new action is a direct descendant of the template workflow, we get the previous actions and just set prevAction here instead of the function
            if (workflowParent.id === workflows[index].id){
                // We take all the previous actions except the last one so we can set the next action for our previous action. Once that's done we add it back to our actions
                const actions = workflows[index].actions.slice(0,-1);
                if (workflows[index].actions.length > 0){
                    let prevAction = workflows[index].actions[workflows[index].actions.length - 1];
                    prevAction.action.nextActionId = data.action.id;
                    await CMTJsonFetch("PUT", `workflow/actionTemplate/nextAction/${prevAction.action.id}`, {name: null, description: null, nextActionId: data.action.id});
                    actions.push({...prevAction});
                }
                // Now that all our actions are put back together we add our newly created action
                workflowActions = actions
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
                // Check if our parent has any other child actions/descendants
                // If so, we go through our top level actions and recursively build our actions back up
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
                    // If our parent doesn't have any childActions or descendants, we just add them directly
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
            // Once we've done all our work, we add our template workflow back in with the associated actions
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

        if (!isWorkflowChild){
            // If this is the first action then we set the root action
            if (workflowsCopy[index].actions.length === 1)
                await workflowsFetch("PUT", `workflows/${workflows[index].attributeId}`, {
                rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
            else 
                setWorkflows(workflowsCopy);
        }
        else {
            // Check if we have more childActions than the one we just created. If not, we set the root action ID of our parent workflow to be the newly created action's id.
            if (workflowParent.childActions.length > 1)
                setWorkflows(workflowsCopy);
            else 
                await workflowsFetch("PUT", `workflows/action/${workflowParent.id}`, {
                rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
        }
    })
}

/**
 * A helper function to edit workflow actions
 * Because we have our CMT-specific endpoints, we pass this into the {@link ActionModal}
 * Makes a PUT request to add the workflow template and updates our workflows if successful
 *
 * @async
 * @param {string} name - the name of the action
 * @param {string} description - the description of the action
 * @param {Object} workflowToUpdate - the workflow action we are updating
 * @param {() => void} refresh - Function to refresh the page upon completion. Used so we don't have to do complicated logic and let the API handle stuff
 */
async function editWorkflowAction(name, description, workflowToUpdate, refresh){
    if (!name)
        name = 'New Action';
    if (!description)
        description = 'No description provided.';

    await CMTJsonFetch("PUT", `/workflow/actionTemplate/workflow/${workflowToUpdate.id}`, {name, description}).then(async _ => await refresh());
}

/**
 * A helper function to delete simple and complex actions
 * Because we have our CMT-specific endpoints, we pass this into the {@link DeleteModal}
 * Makes a DELETE request to add the workflow template and updates our workflows if successful
 *
 * @async
 * @param {Array} workflows - the top-level workflows
 * @param {(workflows: Array) => void} setWorkflows - state setter for the top-level workflows
 * @param {Object} workflowToDelete - the workflow we are deleting. Can be either a workflow action or a template workflow
 * @param {() => void} refresh - Function to refresh the page upon completion. Used so we don't have to do complicated logic and let the API handle stuff
 */
async function deleteWorkflow(workflows, setWorkflows, workflowToDelete, refresh){
    // TODO deletes but does not cleanup any actions with the workflow
    if (workflowToDelete.attributeId)
        await CMTJsonFetch("DELETE", `workflow/workflowTemplate/${workflowToDelete.attributeId}`).then(async _ => {
            const workflowsCopy = [];
            for (let index = 0; index < workflows.length; index++) {
                if (workflows[index].attributeId !== workflowToDelete.attributeId)
                    workflowsCopy.push(workflows[index]);
            }
            setWorkflows(workflowsCopy);
        });
    else
        await CMTJsonFetch("DELETE", `workflow/actionTemplate/workflow/${workflowToDelete.id}`).then(async _ => refresh());
}

