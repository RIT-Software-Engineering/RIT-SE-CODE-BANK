import { useState } from "react"
import { Button, Form } from "react-bootstrap"
import { CMTFetch } from "../utils/api"

const ActionType = {
    Simple: "Simple"
}

const StateType = {
    completed: "completed",
    inProgress: "inProgress",
    notStarted: "notStarted",
    hidden: "hidden"
}

export function WorkflowRendererTester() {
    const [workflow, setWorkflow] = useState({
        actions: [ // 1 action
            {
                name: "Course Information",
                description: "Enter Course Information",
                actionType: ActionType.Simple,
                metadata: [
                    { code: "COURSE_INFORMATION" },
                    { outputs: [
                        {
                            name: "Course Name",
                            type: "text",
                            isRequired: true,
                            initialValue: "",
                            placeholder: "Freshman Seminar",
                            validation: {
                                minLength: 3,
                                maxLength: 30
                            },
                        },
                        {
                            name: "Course Code",
                            type: "text",
                            isRequired: true,
                            initialValue: "",
                            placeholder: "SWEN 101",
                        }
                    ]}
                ],
                state: StateType.notStarted,
                callback: `course/uuid-crazy-style`
            }
        ]
    })

    const [courseData, setCourseData] = useState({
        id: "uuid-crazy-style",
        courseName: "whateever"
    })

    function refresh() {
        // CMTFetch("GET", "i dont know what", { professorID: 10, courseId: "1 unbillion"}).then(response => {
        //     setCourseData(await response.json().courseData)
        //     setWorkflow(await response.json().workflow)
        // })
    }
    function fakeRefresh() {
        console.log()
        setWorkflow(prev => ({
            ...prev,
            actions: prev.actions.map((action, i) =>
            i === 0
                ? { ...action, state: StateType.completed }
                : action
            )
        }));
    }

    // I guess this can happen in the frontend, but its a lot of logic.
    workflow.actions.forEach(action => {
        switch (action.metadata[0].code) { // for the love of god, why is metadata an array of objects
            case "COURSE_INFORMATION":
                action.callback = `/course/${courseData.id}`
                break
            default:
                throw Error("Unrecognized Code whatever")
        }
    })
    
    return (<>
        {/* <CourseInfo courseData={courseData} /> */}
        <h1> course info!</h1>
        <WorkflowRenderer workflow={workflow} refresh={fakeRefresh}/>
    </>)
}

export function WorkflowRenderer({ workflow, refresh }) {
    console.log(workflow)
    const nextAction = workflow.actions.find(action => action.state === StateType.notStarted)
    if (!nextAction) return <h1> All Done! </h1>
    
    return <SimpleWorkflowActionFormRenderer action={nextAction} refresh={refresh} />
}

function SimpleWorkflowActionFormRenderer({ action, refresh }) {
    // In the database, metadata is stored as an array of key-value pairs. This is weird, since arrays are difficult to search through.
    // Additionally, as soon as I nest data, I still have to call JSON.parse
    // Anyways, this turns that array of objects into one big object.
    const metadata = action.metadata.reduce((previousValue, currentValue) => ({ ...previousValue, ...currentValue}))
    
    const [outputValues, setOutputValues] = useState(metadata.outputs.map(output => output.initialValue)) // Initialize with array of the Workflows specified initial (or default) values
    
    // TODO: consider replacing/supplementing this with a central notification system? Or maybe this is a fun system that works. I dont really like notification systems where we dont need them.
    const [submitButtonName, setSubmitButtonName] = useState("Submit")
    const [submitButtonVariant, setSubmitButtonVariant] = useState("primary")
    
    function submitAction (e) {
        e.preventDefault()
        // CMTFetch("PUT", action.callback, outputValues).then(() => {
            setSubmitButtonName("Submitted!")
            setSubmitButtonVariant("success")
            setTimeout(refresh, 500)
        // })
        
    }
console.log(action)
    return (<>
        <Form onSubmit={submitAction}>
            {metadata.outputs.map((output, i) =>
                <WorkflowActionOutputRenderer
                output={output}
                value={outputValues[i]}
                setValue={value => setOutputValues(prevValues => prevValues.toSpliced(i, 1, value))}
                />
            )}
            <Button type="submit" variant={submitButtonVariant}>{submitButtonName}</Button>
        </Form>
    </>)
}

function WorkflowActionOutputRenderer({ output, value, setValue },) {
    const [touched, setTouched] = useState(false);
    const [invalidMessage, setInvalidMessage] = useState("")
    
    let inputElement
    switch (output.type) {
        case "number":
            // TODO: add other types inputElement = <WorkflowActionOutputNumberInputRenderer output={output} value={value} setValue={setValue} touched={touched} setTouched={setTouched} invalidMessage={invalidMessage} setInvalidMessage={setInvalidMessage}/>
            break
        case "select":
            // TODO: add other types inputElement = <WorkflowActionOutputSelectInputRenderer output={output} value={value} setValue={setValue} touched={touched} setTouched={setTouched} invalidMessage={invalidMessage} setInvalidMessage={setInvalidMessage}/>
            break
        default: // case "text"
            inputElement = <WorkflowActionOutputTextInputRenderer output={output} value={value} setValue={setValue} touched={touched} setTouched={setTouched} invalidMessage={invalidMessage} setInvalidMessage={setInvalidMessage}/>
    } 

    return (
        <Form.Group className="pb-4">
            <Form.Label>{output.name} {output.isRequired ? <span style={{color:"red"}}>*</span> : <></>}</Form.Label>
            {inputElement}
        </Form.Group>
    )
}

function WorkflowActionOutputTextInputRenderer({ output, value, setValue, touched, setTouched, invalidMessage, setInvalidMessage }) {
    
    function isValid(value) {
        if (output?.validation?.minLength) if (value.length < output.validation.minLength) { setInvalidMessage("Too short"); return false }
        if (output?.validation?.maxLength) if (value.length > output.validation.maxLength) { setInvalidMessage("Too long"); return false }
        return true
    }

    return (<>
        <Form.Control
            type={output.type}
            required={output.isRequired ?? false}
            value={value}
            placeholder={output.placeholder}
            
            onChange={e => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            
            isInvalid={touched && !isValid(value)}
        />
        <Form.Control.Feedback type="invalid">
            {invalidMessage}
        </Form.Control.Feedback>
    </>)
}
