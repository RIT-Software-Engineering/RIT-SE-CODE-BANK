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

    const update = useCallback(async () => {
        return CMTFetch("GET", "/workflony/workflowTemplate").then(async response => {
                const data = await response.json();
                console.log(data)
                const workflowPromises = data.workflows.map(async workflow => {
                    const info = workflow.baseAction;
                    let actions = [];
                    if (workflow.rootActionId){
                        const actionResponse = await CMTFetch("GET", `workflony/actionTemplate/${workflow.id}`)
                        const returnedActions = await actionResponse.json();
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
                console.log(resolvedWorkflows)
                setLoading(false);
            });
        }, [])
        useEffect(() => void update(), [update])
    

    return (<>
        <Button onClick={()=>setWorkflowModalOpen(true)}>Add new Workflow</Button>
        <WorkflowModal isOpen={workflowModalOpen} setIsOpen={setWorkflowModalOpen} workflows={workflows} 
        setWorkflows={setWorkflows} WorkflowSubmit={workflowSubmit}/>
        <ActionModal isOpen={actionModalOpen} setIsOpen={setActionModalOpen} index={index} 
        workflows={workflows} setWorkflows={setWorkflows} availCodes={availCodes} 
        outputHelper={BuilderOutputsHelper} simpleSubmit={simpleAdd}/>
        <Accordion>
        {workflows ? Array.from({length: workflows.length}, (_, i) => {
            return (<div className="pt-2" onClick={()=>setIndex(i)}><WorkflowComponent loading={loading} index={i} workflows={workflows} setIsOpen={setActionModalOpen}/></div>)
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

async function simpleAdd(outputs, index, workflows, setWorkflows, name, description, code, parentActionId){
    await CMTFetch("POST", "workflony/actionTemplate", {name, description, actionType: "simple", metadata: {code, outputs}, parentActionId}).then(async response => {
        const data = await response.json();
        console.log(data.action);
        let workflowsCopy = [];
        for (let j = 0; j < workflows.length; j++) {
        if (j !== index)
            workflowsCopy.push(workflows[j])
        else {
            const actions = workflows[j].actions.slice(0,-1);
            if (workflows[j].actions.length > 0){
                let prevAction = workflows[j].actions[workflows[j].actions.length - 1];
                await CMTFetch("PUT", `workflony/actionTemplate/${prevAction.id}`, {name: null, description: null, nextActionId: data.action.id});
                actions.push({...prevAction, nextActionId: data.action.id});
            }
            workflowsCopy.push({
                    id: workflows[j].id,
                    attributeId: workflows[j].attributeId,
                    name: workflows[j].name,
                    description: workflows[j].description,
                    actions: [...actions, {
                        id: data.action.id,
                        name: name,
                        description: description,
                        actionType: "simple",
                        nextActionId: null,
                        parentActionId: parentActionId,
                        metadata: {
                            code: code,
                            outputs: outputs
                        }
                    }]
                });
        }}
        console.log(workflowsCopy)
        // If this is the first action then we set the root action
        if (workflowsCopy[index].actions.length === 1)
            workflowsFetch("PUT", `workflows/${workflows[index].attributeId}`, {
            rootActionId: data.action.id}).then(()=>setWorkflows(workflowsCopy));
        else 
            setWorkflows(workflowsCopy);
    });
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

function ActionModal({isOpen, setIsOpen, index, workflows, setWorkflows, availCodes, outputHelper, simpleSubmit}){
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
    }

    async function createActionSimple(e){
        let outputs;
        outputs = outputHelper(code, required, placeholder, validation);
        e.preventDefault();
        // TODO change the null at the end to be a parentActionId if it's a complex action
        await simpleSubmit(outputs, index, workflows, setWorkflows, name, description, code, null).then(() => {
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
                    <option value="simple">Simple</option>
                    <option value="complex">Complex</option>
                    <option value="workflow">Workflow</option>
                </Form.Select>
                {actionType === "simple" ? // if simple action
                <>
                {/* TODO make this part of the form not hardcoded for CMT */}
                <Form.Label>Code</Form.Label>
                <Form.Select onChange={(e)=>setCode(e.target.value)}>
                    {availCodes.map(codeInfo => {
                        return <option value={codeInfo[0]}>{codeInfo[1]}</option>
                    })}
                </Form.Select>
                <div className="flex pt-2">
                    <Form.Label>Is Required?</Form.Label>
                    <Form.Check className="pl-2" onChange={(e)=>setRequired(e.target.checked)}/>
                </div>
                <BuilderOutputRenderer code={code} setPlaceholder={setPlaceholder} validation={validation} setValidation={setValidation}/>
                <div className="flex justify-end pt-2">
                    <Button type="submit" onClick={(e) => createActionSimple(e)}>Add action</Button>
                </div>
                </> : 
                actionType === "complex" ? // if complex action 
                <>Complex</> : 
                // if workflow action
                <>Workflow</>}
            </Form>
        </Modal.Body>
    </Modal>
    </>)
}

function WorkflowComponent({index, workflows, setIsOpen, loading}){
    if (loading)
        return <><h1>Loading...</h1></>
    else
    return (<>
    <Accordion.Item eventKey={index}>
        <Accordion.Header><span className="text-4xl">{workflows[index].name}</span></Accordion.Header>
        <Accordion.Body>
            <div className="text-3xl">
                <p>Description: {workflows[index].description}</p>
            </div>
            {(workflows[index].actions || []).map(action => {
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
                                    {action.metadata.outputs.map(output => {
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
                    case "complex":
                        break;
                    case "workflow":
                        break;
                    default:
                        value = <p>Unknown Type {action.actionType}</p>
                        break;
                }
                return value;
            })}
            <div className="flex justify-end pt-3">
                <Button onClick={()=>setIsOpen(true)}>Add New Action</Button>
            </div>
        </Accordion.Body>
    </Accordion.Item>
    </>);
}