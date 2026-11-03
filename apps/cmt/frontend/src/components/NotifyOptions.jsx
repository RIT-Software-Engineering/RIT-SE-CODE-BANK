import { Form } from "react-bootstrap"

export function NotifyOptions({value, onChange, max=null}){
    const minLocalTime = toLocalInput(new Date())
    const maxLocalTime = max ? toLocalInput(new Date(max)) : undefined

    return (
        <Form.Group>
            <Form.Label>Student Notification</Form.Label>
            <Form.Select value={value.option} onChange={e => onChange({...value, option: e.target.value})}>
                <option value="none">Do not send a notification</option>
                <option value="now">Send a notification now</option>
                <option value="later">Schedule a notification for later</option>
            </Form.Select>

            {value.option === 'later' && (
                <Form.Control type="datetime-local" className="mt-2"
                    value={value.sendAt} min={minLocalTime} max={maxLocalTime}
                    onChange={e => onChange({...value, sendAt: e.target.value})}
                />
            )}
        </Form.Group>
    )
}

export const emptyNotifyBody = {option: 'none', sendAt: ''}
export const isNotifyReady = value => value.option !== 'later' || Boolean(value.sendAt)

export function toNotifyBody(value){
    return {
        notify: value.option,
        sendAt: value.option === 'later' && value.sendAt ? new Date(value.sendAt).toISOString() : undefined
    }
}
 
function toLocalInput(date){
    const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return shifted.toISOString().slice(0, 16)
}