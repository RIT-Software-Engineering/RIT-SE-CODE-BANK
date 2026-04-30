import { Form } from "react-bootstrap"

/**
 * @import { CheckmarkOutputProps, NumberOutputProps, OutputContainerProps, OutputViewProps, SelectOutputProps, SelectMultiOutputProps, TextOutputProps, FileOutputProps } from "@se-code-bank/workflows-ecosystem"
 */

/**
 * @param {OutputViewProps} props
 */
export function OutputView(props) {
	return (
		<p className='my-2'>
			{props.output.name}: {props.previousValue ?? 'TBD'}
		</p>
	)
}



/**
 * @param {OutputContainerProps} props 
 */
export function OutputContainer(props) {
	return (
		<Form.Group className='flex gap-2 items-center'>
			<Form.Label className='w-max mb-0' htmlFor={props.output.key}>
				{props.output.name}
			</Form.Label>
			{props.children}
		</Form.Group>
	)
}

/**
 * @param {TextOutputProps} props
 */
export const TextOutput = ({ value, onChange, onBlur, required, placeholder, isInvalid, error }) => {
    return (
        <div className='shrink'>
            <Form.Control
                type='text'
                required={required ?? false}
                value={value}
                placeholder={`e.g. ${placeholder}`}
                onChange={onChange}
                onBlur={onBlur}
                isInvalid={isInvalid}
            />
            <Form.Control.Feedback type='invalid'>{error}</Form.Control.Feedback>
        </div>
    )
}

/**
 * @param {NumberOutputProps} props
 */
export const NumberOutput = ({ value, onChange, onBlur, required, placeholder, isInvalid, error }) => {
    return (
        <div className='shrink'>
            <Form.Control
                type='number'
                required={required ?? false}
                value={value}
                placeholder={`e.g. ${placeholder}`}
                onChange={onChange}
                onBlur={onBlur}
                isInvalid={isInvalid}
            />
            <Form.Control.Feedback type='invalid'>{error}</Form.Control.Feedback>
        </div>
    )
}

/**
 * @param {SelectOutputProps} props
 */
export const SelectOutput = ({ output, value, onChange, onBlur, required, isInvalid, error }) => {
    return (
        <div className='shrink'>
            <Form.Select
                required={required ?? false}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                isInvalid={isInvalid}
            >
                <option value=''>Select...</option>
                {output.validation?.options?.map(option => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </Form.Select>
            <Form.Control.Feedback type='invalid'>{error}</Form.Control.Feedback>
        </div>
    )
}

/**
 * @param {SelectMultiOutputProps} props
 */
export const SelectMultiOutput = ({ output, value, onChange, onBlur, isInvalid, error }) => {
    return (
        <div className='shrink'>
            <Form className="flex gap-2" onChange={onChange} onBlur={onBlur}>
            {output.validation?.options?.map(option => (
                <Form.Check
                key={option}
                type="checkbox"
                label={option}
                id={option}
                value={option}
                checked={value?.includes(option)}
                isInvalid={isInvalid}
                />
            ))}
            </Form>
            <Form.Control.Feedback type='invalid'>{error}</Form.Control.Feedback>
        </div>
    )
}

/**
 * @param {FileOutputProps} props
 */
export const FileOutput = ({ onChange, error }) => {
    return (
        <div className='shrink'>
            <Form.Control
                type='file'
                onChange={onChange}
                required
            />
            <Form.Control.Feedback type='invalid'>{error}</Form.Control.Feedback>
        </div>
    )
}

/**
 * @param {CheckmarkOutputProps} props
 */
export const CheckmarkOutput = ({ value, onChange, required }) => {
    return (
        <div className='shrink'>
            <Form.Check 
                type='checkbox' 
                required={required ?? false} 
                checked={value} 
                onChange={onChange} 
            />
        </div>
    )
}