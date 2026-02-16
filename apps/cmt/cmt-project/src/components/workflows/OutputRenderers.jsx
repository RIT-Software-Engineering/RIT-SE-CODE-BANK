import { useState } from "react";
import { Form } from "react-bootstrap";

export function WorkflowActionOutputRenderer({ output, value, setValue },) {
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
        if (output?.validation?.minLength) if (value?.length < output.validation.minLength) { setInvalidMessage("Too short"); return false }
        if (output?.validation?.maxLength) if (value?.length > output.validation.maxLength) { setInvalidMessage("Too long"); return false }
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