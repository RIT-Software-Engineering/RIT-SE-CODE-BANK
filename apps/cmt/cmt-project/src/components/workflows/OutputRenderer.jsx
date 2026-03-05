import { useState, useEffect, useCallback } from "react";
import { Form } from "react-bootstrap";

/**
 * @import { ParsedMetadata } from "./typedefs"
 * @import { AbstractActionRenderer } from "./ActionRenderers/GenericActionRenderer"
 */

/**
 * @typedef {{
 *  output: ParsedMetadata["outputs"][number],
 *  value: any,
 *  setValue: React.Dispatch<React.SetStateAction<any>>,
 *  submitted: boolean,
 *  validatorRegistry: React.RefObject<Object>
 * }} OutputRendererProps 
 */

/**
 * A controlled form element that renders an input field based on the given output.
 * A description of the purpose of the validatorRegistry can be seen in {@link AbstractActionRenderer}
 * 
 * @param {OutputRendererProps} props
 */
export function OutputRenderer({ output, value, setValue, submitted, validatorRegistry }) {
    
    let inputElement
    switch (output.type) {
        case "number":
            inputElement = <NumberOutputRenderer output={output} value={value} setValue={setValue} submitted={submitted} validatorRegistry={validatorRegistry}/>
            break
        case "select":
            inputElement = <SelectOutputRenderer output={output} value={value} setValue={setValue} submitted={submitted} validatorRegistry={validatorRegistry} />
            break
        case "checkmark":
            inputElement = <CheckboxOutputRenderer output={output} value={value} setValue={setValue} />
            break
        default: // case "text"
            inputElement = <TextOutputRenderer output={output} value={value} setValue={setValue} submitted={submitted} validatorRegistry={validatorRegistry} />
    }

    return (
        <Form.Group className="flex gap-2 items-center">
            <Form.Label className="w-max text-xl mb-0">{output.name}</Form.Label>
            {inputElement}
        </Form.Group>
    )
}


/**
 * @param {OutputRendererProps} props
 */
export function TextOutputRenderer({ output, value, setValue, submitted, validatorRegistry }) {
    const [touched, setTouched] = useState(false)

    const getError = useCallback(() => {
        if (output.isRequired && !value && value !== 0) return "This field is required";
        if (!value) return null;

        if (output?.validation?.minLength && value.length < output.validation.minLength) return `Must be at least ${output.validation.minLength} characters`;
        if (output?.validation?.maxLength && value.length > output.validation.maxLength) return `Must be at most ${output.validation.maxLength} characters`;
        return null;
    }, [output.isRequired, output.validation?.minLength, output.validation?.maxLength, value])

    useEffect(() => {
        const validators = validatorRegistry.current
        validators[output.key] = getError
        return () => void delete validators[output.key]
    }, [getError, output, validatorRegistry])

    const error = getError();
    const showInvalid = error && (touched || submitted);

    return (
        <div className="shrink">
            <Form.Control
                type={"text"}
                required={output.isRequired ?? false}
                value={value}
                placeholder={output.placeholder}
                onChange={e => setValue(e.target.value)}
                onBlur={() => setTouched(true)}
                isInvalid={showInvalid}
            />
            <Form.Control.Feedback type="invalid">
                {error}
            </Form.Control.Feedback>
        </div>
    );
}

/**
 * @param {OutputRendererProps} props
 */
export function NumberOutputRenderer({ output, value, setValue, submitted, validatorRegistry }) {
    const [touched, setTouched] = useState(false)

    const getError = useCallback(() => {
        if (output.isRequired && !value && value !== 0) return "This field is required";
        
        const numValue = Number(value);
        if (output?.validation?.min !== undefined && numValue < output.validation.min) return `Must be at least ${output.validation.min}`;
        if (output?.validation?.max !== undefined && numValue > output.validation.max) return `Must be at most ${output.validation.max}`;

        return null;
    }, [output.isRequired, output.validation?.min, output.validation?.max, value])

    useEffect(() => {
        const validators = validatorRegistry.current
        validators[output.key] = getError
        return () => void delete validators[output.key]
    }, [getError, output, validatorRegistry])

    const error = getError();
    const showInvalid = error && (touched || submitted);

    return (
        <div className="shrink">
            <Form.Control
                type="number"
                required={output.isRequired ?? false}
                value={value}
                placeholder={output.placeholder}
                onChange={e => setValue(e.target.value)}
                onBlur={() => setTouched(true)}
                isInvalid={showInvalid}
            />
            <Form.Control.Feedback type="invalid">
                {error}
            </Form.Control.Feedback>
        </div>
    );
}

/**
 * @param {Omit<OutputRendererProps, "submitted" | "validatorRegistry">} props
 */
export function CheckboxOutputRenderer({ output, value, setValue }) {
    return (
        <div className="shrink">
            <Form.Check
                type="checkbox"
                required={output.isRequired ?? false}
                checked={value}
                onChange={e => setValue(e.target.checked)}
            />
        </div>
    );
}

/**
 * @param {OutputRendererProps} props
 */
export function SelectOutputRenderer({ output, value, setValue, submitted, validatorRegistry }) {
    const [touched, setTouched] = useState(false)

    const getError = useCallback(() => {
        if (output.isRequired && !value) return "This field is required";
        return null;
    }, [output.isRequired, value])

    useEffect(() => {
        const validators = validatorRegistry.current
        validators[output.key] = getError
        return () => void delete validators[output.key]
    }, [getError, output, validatorRegistry])

    const error = getError();
    const showInvalid = error && (touched || submitted);

    return (
        <div className="shrink">
            <Form.Select
                required={output.isRequired ?? false}
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={() => setTouched(true)}
                isInvalid={showInvalid}
            >
                <option value="">Select...</option>
                {output.validation?.options?.map(option => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
                {error}
            </Form.Control.Feedback>
        </div>
    );
}
