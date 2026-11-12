import { useCallback, useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import { CMTJsonFetch } from '../utils/api.js'

export function NotesPanel({ courseId }) {
    const [open, setOpen] = useState(true)
    const [notes, setNotes] = useState([])
    const [text, setText] = useState('')
    const [showArchived, setShowArchived] = useState(false)
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)

    const load = useCallback(
        () => CMTJsonFetch('GET', `notes/course/${courseId}?archive=${showArchived ? 1 : 0}`)
            .then(json => { setNotes(json.notes ?? []); setError(null) })
            .catch(() => setError('Could not load your notes.')),
        [courseId, showArchived]
    )
    useEffect(() => { void load() }, [load])

    async function addNote(event) {
        event.preventDefault()
        if (!text.trim() || busy) return
        setBusy(true)
        try {
            await CMTJsonFetch('POST', `notes/course/${courseId}`, { text })
            setText('')
            await load()
        } catch {
            setError('Could not save the note.')
        } finally {
            setBusy(false)
        }
    }

    async function setStatus(note, status) {
        try {
            await CMTJsonFetch('PATCH', `notes/course/${courseId}/${note.id}`, { status })
            await load()
        } catch {
            setError('Could not update the note.')
        }
    }

    const openCount = notes.filter(note => note.status === 'open').length

    if (!open) {
        return (
            <button
                className="fixed right-0 top-1/3 z-40 rounded-l border bg-white px-2 py-3 shadow"
                style={{ writingMode: 'vertical-rl' }}
                onClick={() => setOpen(true)}
            >
                My notes ({openCount})
            </button>
        )
    }

    return (
        <aside className="fixed right-0 top-24 bottom-4 z-40 flex w-80 flex-col rounded-l border bg-white shadow">
            <div className="flex items-center justify-between border-b p-3">
                <strong>My notes</strong>
                <button onClick={() => setOpen(false)} aria-label="Minimize notes">–</button>
            </div>

            <form onSubmit={addNote} className="border-b p-3">
                <textarea
                    className="mb-2 w-full rounded border p-2"
                    rows={3}
                    maxLength={2000}
                    placeholder="Note to self..."
                    value={text}
                    onChange={event => setText(event.target.value)}
                />
                <Button type="submit" size="sm" disabled={busy || !text.trim()}>Add note</Button>
            </form>

            {error && <p className="px-3 pt-2 text-sm text-red-600">{error}</p>}

            <ul className="flex-1 space-y-2 overflow-y-auto p-3">
                {notes.length === 0 && <li className="text-sm text-gray-500">No notes yet.</li>}
                {notes.map(note => (
                    <li key={note.id} className="rounded border p-2">
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                checked={note.status === 'done'}
                                disabled={note.status === 'archived'}
                                onChange={() => setStatus(note, note.status === 'done' ? 'open' : 'done')}
                                aria-label="Mark done"
                            />
                            <span className={`flex-1 whitespace-pre-wrap break-words ${note.status !== 'open' ? 'text-gray-500' : ''} ${note.status === 'done' ? 'line-through' : ''}`}>
                                {note.text}
                            </span>
                        </div>
                        <div className="mt-1 text-right">
                            <button
                                className="text-sm underline"
                                onClick={() => setStatus(note, note.status === 'archived' ? 'open' : 'archived')}
                            >
                                {note.status === 'archived' ? 'Restore' : 'Archive'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            <div className="border-t p-2 text-sm">
                <label>
                    <input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)} /> Show archived
                </label>
            </div>
        </aside>
    )
}
