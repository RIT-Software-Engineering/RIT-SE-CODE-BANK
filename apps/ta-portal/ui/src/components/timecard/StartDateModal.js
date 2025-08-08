// components/timecard/StartDateModal.js
"use client";

import React, { useState, useEffect } from 'react';

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => new Date().toISOString().slice(0, 10);

export default function StartDateModal({ isOpen, onClose, onConfirm, isSubmitting }) {
    const [startDate, setStartDate] = useState(getTodayString());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
        setStartDate(getTodayString());
        setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const selectedDate = new Date(`${startDate}T00:00:00`);
        if (selectedDate.getDay() !== 5) { 
        setError('Please select a Friday as the start date.');
        return;
        }
        setError('');
        onConfirm(selectedDate);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
            Select New Timecard Start Date
            </h2>
            <p className="text-sm text-gray-600 mb-4">
            Please select the starting Friday for the new timecard week.
            </p>
            <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border rounded-md p-2 mb-2"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="flex justify-end gap-3 mt-4">
            <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded disabled:opacity-50"
            >
                Cancel
            </button>
            <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rit-orange hover:bg-gray-900 text-white rounded disabled:opacity-50"
            >
                {isSubmitting ? "Submitting..." : "Confirm & Start New Timecard"}
            </button>
            </div>
        </div>
        </div>
    );
}