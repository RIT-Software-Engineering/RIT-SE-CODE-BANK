/**
 * @import { CheckmarkOutputProps, NumberOutputProps, OutputContainerProps, OutputDefinitionProps, OutputValidatorRegistry, Renderer, SelectOutputProps, SelectMultiOutputProps, TextOutputProps } from '../../types/components.js'
 */

import { useState, useCallback, useEffect } from 'react'

/**
 * @typedef {{
 *  value: any,
 *  setValue: React.Dispatch<React.SetStateAction<any>>,
 *  submitted: boolean,
 *  validatorRegistry: React.RefObject<OutputValidatorRegistry>,
 *  disabled?: boolean
 * } & OutputDefinitionProps} OutputStateProps
 */

/**
 * @typedef {{ renderers: {
 *      OutputContainer: Renderer<OutputContainerProps>,
 *      NumberOutputRenderers: NumberOutputRenderers['renderers'],
 *      TextOutputRenderers: TextOutputRenderers['renderers'],
 *      SelectOutputRenderers: SelectOutputRenderers['renderers'],
 *      SelectMultiOutputRenderers: SelectMultiOutputRenderers['renderers'],
 *      CheckmarkOutputRenderers: CheckmarkOutputRenderers['renderers']
 * } }} OutputRenderers
 */
/**
 * @param {OutputStateProps & OutputRenderers} props
 */
export function Output(props) {
    const { output, renderers } = props

    let inputElement
    switch (output.type) {
        case 'number':
            inputElement = <NumberOutputController {...props}/>
            break
        case 'text':
            inputElement = <TextOutputController {...props}/>
            break
        case 'select':
            inputElement = <SelectOutputController {...props}/>
            break
        case 'checkmark':
            inputElement = <CheckmarkOutputController {...props}/>
            break
        case 'multiselect':
            inputElement = <SelectMultiOutputController {...props}/>
            break
        default:
            inputElement = <TextOutputController {...props}/>
            break
    }

    return (
        <renderers.OutputContainer output={output}>
            {inputElement}
        </renderers.OutputContainer>
    )
}

/**
 * @typedef {{
 *      renderers: {
 *          NumberOutput: Renderer<NumberOutputProps>
 *      }
 * }} NumberOutputRenderers
 */
/**
 * @param {OutputStateProps & OutputRenderers} props
 */
function NumberOutputController({ output, value, setValue, submitted, validatorRegistry, renderers, disabled }) {
    const [touched, setTouched] = useState(false)

    const getError = useCallback(nextValue => {
        if (output.isRequired && !nextValue && nextValue !== 0) return 'This field is required'

        const numValue = Number(nextValue)
        if (output?.validation?.min !== undefined && numValue < output.validation.min) return `Must be at least ${output.validation.min}`
        if (output?.validation?.max !== undefined && numValue > output.validation.max) return `Must be at most ${output.validation.max}`

        return null
    }, [output.isRequired, output.validation?.min, output.validation?.max])

    useEffect(() => {
        const validators = validatorRegistry.current
        validators[output.key] = getError
        return () => void delete validators[output.key]
    }, [getError, output, validatorRegistry])

    const error = getError(value)
    const showInvalid = error && (touched || submitted)

    return (
        <renderers.NumberOutputRenderers.NumberOutput
            disabled={disabled}
            output={output}
            submitted={submitted}
            required={output.isRequired ?? false}
            value={value}
            placeholder={output.placeholder}
            onChange={e => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            isInvalid={showInvalid}
            error={error}
        />
    )
}

/**
 * @typedef {{
 *      renderers: {
 *          TextOutput: Renderer<TextOutputProps>
 *      }
 * }} TextOutputRenderers
 */
/**
 * @param {OutputStateProps & OutputRenderers} props
 */
function TextOutputController({ output, value, setValue, submitted, validatorRegistry, renderers, disabled }) {
    const [touched, setTouched] = useState(false)

    const getError = useCallback(nextValue => {
        if (output.isRequired && !nextValue && nextValue !== 0) return 'This field is required'
        if (!nextValue) return null

        if (output?.validation?.minLength && nextValue.length < output.validation.minLength)
            return `Must be at least ${output.validation.minLength} characters`
        if (output?.validation?.maxLength && nextValue.length > output.validation.maxLength)
            return `Must be at most ${output.validation.maxLength} characters`
        return null
    }, [output.isRequired, output.validation?.minLength, output.validation?.maxLength])

    useEffect(() => {
        const validators = validatorRegistry.current
        validators[output.key] = getError
        return () => void delete validators[output.key]
    }, [getError, output, validatorRegistry])

    const error = getError(value)
    const showInvalid = error && (touched || submitted)

    return (
        <renderers.TextOutputRenderers.TextOutput
            disabled={disabled}
            output={output}
            submitted={submitted}
            required={output.isRequired ?? false}
            value={value}
            placeholder={output.placeholder}
            onChange={e => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            isInvalid={showInvalid}
            error={error}
        />
    )
}

/**
 * @typedef {{
 *      renderers: {
 *          SelectOutput: Renderer<SelectOutputProps>
 *      }
 * }} SelectOutputRenderers
 */
/**
 * @param {OutputStateProps & OutputRenderers} props
 */
function SelectOutputController({ output, value, setValue, submitted, validatorRegistry, renderers, disabled }) {
    const [touched, setTouched] = useState(false)

    const getError = useCallback(nextValue => {
        if (output.isRequired && !nextValue) return 'This field is required'
        return null
    }, [output.isRequired])

    useEffect(() => {
        const validators = validatorRegistry.current
        validators[output.key] = getError
        return () => void delete validators[output.key]
    }, [getError, output, validatorRegistry])

    const error = getError(value)
    const showInvalid = error && (touched || submitted)

    return (
        <renderers.SelectOutputRenderers.SelectOutput
            disabled={disabled}
            output={output}
            submitted={submitted}
            required={output.isRequired ?? false}
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            isInvalid={showInvalid}
            error={error}
        />
    )
}

/**
 * @typedef {{
 *      renderers: {
 *          SelectMultiOutput: Renderer<SelectMultiOutputProps>
 *      }
 * }} SelectMultiOutputRenderers
 */
/**
 * @param {OutputStateProps & OutputRenderers} props
 */
function SelectMultiOutputController({ output, value, setValue, submitted, validatorRegistry, renderers, disabled }) {
    const [touched, setTouched] = useState(false)

    const getError = useCallback(nextValue => {
        if (output.isRequired && !nextValue) return 'This field is required'
        return null
    }, [output.isRequired])

    useEffect(() => {
        const validators = validatorRegistry.current
        validators[output.key] = getError
        return () => void delete validators[output.key]
    }, [getError, output, validatorRegistry])

    const error = getError(value)
    const showInvalid = error && (touched || submitted)

    return (
        <renderers.SelectMultiOutputRenderers.SelectMultiOutput
            disabled={disabled}
            output={output}
            submitted={submitted}
            required={output.isRequired ?? false}
            value={value}
            onChange={e => {
                if (e.target.checked) {
                    if (value && typeof(value) !== 'string')
                        setValue([...value, e.target.value])
                    else if (value)
                        setValue([...value.split(', '), e.target.value])
                    else
                        setValue([e.target.value])
                } else
                    if (typeof(value) !== 'string')
                        setValue(value.filter(item => item !== e.target.value))
                    else 
                        setValue(value.split(', ').filter(item => item !== e.target.value))
            }}
            onBlur={() => setTouched(true)}
            isInvalid={showInvalid}
            error={error}
        />
    )
}

/**
 * @typedef {{
 *      renderers: {
 *          CheckmarkOutput: Renderer<CheckmarkOutputProps>
 *      }
 * }} CheckmarkOutputRenderers
 */
/**
 * @param {OutputStateProps & OutputRenderers} props
 */
function CheckmarkOutputController({ output, value, setValue, renderers, disabled }) {
    return (
        <renderers.CheckmarkOutputRenderers.CheckmarkOutput
            disabled={disabled}
            output={output}
            required={output.isRequired ?? false}
            value={value}
            onChange={e => setValue(e.target.checked)}
        />
    )
}
