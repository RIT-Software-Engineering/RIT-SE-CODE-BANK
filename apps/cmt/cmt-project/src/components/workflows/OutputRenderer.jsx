import { useState } from "react";
import { Form } from "react-bootstrap";

export function OutputRenderer({ output, value, setValue }) {
    const [touched, setTouched] = useState(false);
    const [invalidMessage, setInvalidMessage] = useState("")
    
    let inputElement
    switch (output.type) {
        case "number":
            inputElement = <NumberOutputRenderer output={output} value={value} setValue={setValue} touched={touched} setTouched={setTouched} invalidMessage={invalidMessage} setInvalidMessage={setInvalidMessage}/>
            break
        case "select":
            inputElement = <SelectOutputRenderer output={output} value={value} setValue={setValue} />
            break
        case "checkbox":
            inputElement = <CheckboxOutputRenderer output={output} value={value} setValue={setValue} />
            break
        default: // case "text"
            inputElement = <TextOutputRenderer output={output} value={value} setValue={setValue} touched={touched} setTouched={setTouched} invalidMessage={invalidMessage} setInvalidMessage={setInvalidMessage}/>
    } 

    // TODO: should we keep the star
    // const star = output.isRequired ? <span style={{color:"red"}}>*</span> : <></>
    const star = <></>

    return (
        <Form.Group className="flex gap-2 items-center">
            <Form.Label className="w-max text-xl mb-0">{output.name} {star}</Form.Label>
            {inputElement}
        </Form.Group>
    )
}

function TextOutputRenderer({ output, value, setValue, touched, setTouched, invalidMessage, setInvalidMessage }) {
    
    function isValid(value) {
        if (output?.validation?.minLength) if (value?.length < output.validation.minLength) { setInvalidMessage("Too short."); return false }
        if (output?.validation?.maxLength) if (value?.length > output.validation.maxLength) { setInvalidMessage("Too long."); return false }
        return true
    }

    return (<div className="shrink">
        <Form.Control
            type={"text"}
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
    </div>)
}

function NumberOutputRenderer({ output, value, setValue, touched, setTouched, invalidMessage, setInvalidMessage }) {
    
    function isValid(value) {
        if (output?.validation?.min) if (value < output.validation.min) { setInvalidMessage("Too small."); return false }
        if (output?.validation?.max) if (value > output.validation.max) { setInvalidMessage("Too big."); return false }
        return true
    }

    return (<div className="shrink">
        <Form.Control
            type="number"
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
    </div>)
}

export function CheckboxOutputRenderer({ output, value, setValue }) {
    return (<div className="shrink">
        <Form.Check
            type="checkbox"
            required={output.isRequired ?? false}
            checked={value}
            onChange={e => setValue(e.target.checked)}
        />
    </div>)
}

function SelectOutputRenderer({ output, value, setValue }) {
    return (<div className="shrink">
        <Form.Select
            required={output.isRequired ?? false}
            value={value}
            onChange={e => setValue(e.target.value)}
        >
            {output.validation.options.map(
                option => <option key={option} value={option}> {option} </option>
            )}
        </Form.Select>
    </div>)
}