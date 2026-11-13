import { useCallback, useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import { CMTJsonFetch } from '../utils/api.js'

// using ET as the default for now. consider localization needs later
//using sv-SE (Swedish) locale so the format matches that of the dueAt field (YYYY-MM-DDTHH:mm) - the alternative is longer and more confusing
const nowET = () => new Date().toLocaleString('sv-SE', {timeZone: 'America/New_York'}).slice(0, 16).replace(' ', 'T');
const isDue = note => note.status === 'open' && note.dueAt && note.dueAt <= nowET();
const formatDue = dueAt => new Date(dueAt).toLocaleString([], {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
}) + ' ET';

export function NotesPanel({ courseId }) {
    const [open, setOpen] = useState(true)
    const [notes, setNotes] = useState([])
    const [text, setText] = useState('')
    const [showArchived, setShowArchived] = useState(false)
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const [dueAt, setDueAt] = useState('');
    const [, setSeconds] = useState(0);
    const [tab, setTab] = useState('notes')

    useEffect(() => {
        const timer = setInterval(() => setSeconds(prevSec => prevSec + 1), 60000);
        return () => clearInterval(timer);
    }, [])

    const load = useCallback(
        () => CMTJsonFetch('GET', `notes/course/${courseId}?archive=${showArchived ? 1 : 0}`)
            .then(json => { setNotes(json.notes ?? []); setError(null) })
            .catch(() => setError('Could not load your notes.')),
        [courseId, showArchived]
    )
    useEffect(() => { void load() }, [load])

    async function addNote(event) {
        event.preventDefault()
        if (!text.trim() || busy || (isReminders && !dueAt)) return
        setBusy(true)
        try {
            await CMTJsonFetch('POST', `notes/course/${courseId}`, {text, dueAt: isReminders ? dueAt : null})
            setText('')
            setDueAt('');
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
    const dueCount = notes.filter(isDue).length;
    const isReminders = tab === 'reminders';
    const byDue = (a, b) => Number(isDue(b)) - Number(isDue(a)) || a.dueAt.localeCompare(b.dueAt);
    const visible = notes.filter(note => isReminders ? note.dueAt : !note.dueAt);
    if (isReminders) visible.sort(byDue);

    if (!open) {
        return (
            <button
                className="sticky top-24 shrink-0 self-start rounded-l border bg-white px-2 py-3 shadow"
                style={{ writingMode: 'vertical-rl' }}
                onClick={() => setOpen(true)}
            >
                My notes ({openCount})
            </button>
        )
    }

    return (
        <aside className="sticky top-24 flex h-[calc(100vh-7rem)] w-80 shrink-0 flex-col self-start rounded-l border bg-white shadow">
            <div className="flex items-center justify-between border-b p-3">
                <strong>My notes</strong>
                <button onClick={() => setOpen(false)} aria-label="Minimize notes">-</button>
            </div>

            <div className="flex border-b text-sm">
                {['notes', 'reminders'].map(name => (
                    <button key={name} className={`flex-1 p-2 ${tab === name ? 'border-b-2 border-black font-semibold' : 'text-gray-500'}`} onClick={() => setTab(name)}>
                        {name === 'notes' ? 'Notes' : `Reminders${dueCount > 0 ? ` (${dueCount})` : ''}`}
                    </button>
                ))}
            </div>
            
            <form onSubmit={addNote} className="border-b p-3">
                {isReminders && (<input type='datetime-local' className='mb-2 w-full rounded border p-1'
                    value={dueAt} onChange={event => setDueAt(event.target.value)}
                />)}
                <textarea
                    className="mb-2 w-full rounded border p-2"
                    rows={3}
                    maxLength={2000}
                    placeholder={isReminders ? "Reminder to..." : "Note to self..."}
                    value={text}
                    onChange={event => setText(event.target.value)}
                />
                <Button type="submit" size="sm" disabled={busy || !text.trim()}>{isReminders ? 'Add reminder' : 'Add note'}</Button>
            </form>

            {error && <p className="px-3 pt-2 text-sm text-red-600">{error}</p>}

            {dueCount > 0 && (
                <p className="mx-3 mt-2 rounded bg-amber-100 p-2 text-sm">{dueCount} note{dueCount > 1 ? 's' : ''} due</p>
            )}
            <ul className="flex-1 space-y-2 overflow-y-auto p-3">
                {visible.length === 0 && <li className="text-sm text-gray-500">{isReminders ? 'No reminders yet.' : 'No notes yet.'}</li>}
                {visible.map(note => (
                    <li key={note.id} className={`rounded border p-2 ${isDue(note) ? 'border-red-400' : ''}`}>
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
                            {note.dueAt && (
                                <div className={`text-sm ${isDue(note) ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
                                    Due: {formatDue(note.dueAt)}
                                </div>
                            )}
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
