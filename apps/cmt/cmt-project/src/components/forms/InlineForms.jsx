import { Check, Edit, X } from "lucide-react"
import { useState } from "react"
import { Button, Form } from "react-bootstrap"

export function InlineForm({ label, value, onReset, onChange, onSubmit }) {
    return (
        <Form onSubmit={onSubmit} onReset={onReset} className='flex items-center gapw'>
            <Form.Label className='text-xl my-2 w-4/5'>{label}:</Form.Label>
            <Form.Control defaultValue={value} onChange={onChange}></Form.Control>
            <div className='flex'>
                <Button className='mx-1' variant='outline-danger' type='reset'>
                    <X />
                </Button>
                <Button className='mx-1' variant='outline-success' type='submit'>
                    <Check />
                </Button>
            </div>
        </Form>
    )
}

export function InlineFormHoverable({ label, value, onChange, onSubmit }) {
    const [editing, setEditing] = useState(false)

    return editing ? (
        <InlineForm
            label={label}
            value={value}
            onReset={() => setEditing(false)}
            onChange={onChange}
            onSubmit={async (e) => {
                await onSubmit(e)
                setEditing(false)
            }}
        />
    ) : (
        <div className="flex items-center gap-20">
            <div className=''>
                <p className={`text-xl my-2`}>
                    {' '}
                    {label}: {value}{' '}
                </p>
            </div>
            <div className='hidden group-hover:block'>
                <Button size='sm' title='Edit Course' variant='outline-secondary' onClick={() => setEditing(true)}>
                    <Edit className='size-6' />
                </Button>
            </div>
        </div>
    )
}
