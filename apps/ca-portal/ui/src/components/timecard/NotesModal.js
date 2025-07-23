// components/NotesModal.js
import React, { useState, useEffect } from 'react';

export default function NotesModal({ dayEntry, isOpen, onClose, onSave }) {
    const [noteInput, setNoteInput] = useState('');

    useEffect(() => {
        if (dayEntry?.notes) {
        setNoteInput(dayEntry.notes);
        } else {
        setNoteInput('');
        }
    }, [dayEntry]);

    if (!isOpen || !dayEntry) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">
            Edit Notes for {dayEntry.day} ({dayEntry.date})
            </h2>
            <textarea
            className="w-full border rounded-md p-2 mb-4"
            rows={6}
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            />
            <div className="flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
            >
                Cancel
            </button>
            <button
                onClick={async () => {
                await onSave(dayEntry.date, noteInput);
                onClose();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
                Save
            </button>
            </div>
        </div>
        </div>
    );
}