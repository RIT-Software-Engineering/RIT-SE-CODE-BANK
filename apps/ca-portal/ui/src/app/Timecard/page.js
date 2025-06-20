// src/app/Timecard/page.js
'use client';

import React, { useState, useEffect } from 'react';

export default function Timecard() {
    /**
     * Default structure for each day in the timecard (Friday -> Thursday)
     * Each entry holds:
     * - day: Name of day
     * - date: Selected date string (YYYY-MM-DD)
     * - ins: Array of three "Time In" strings (HH:mm)
     * - outs: Array of three "Time Out" strings (HH:mm)
     * - total: Computed total hours for the day
     */
    const defaultTimecard = [
        { day: 'Friday', date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Saturday', date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Sunday', date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Monday', date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Tuesday', date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Wednesday', date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Thursday', date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
    ];

    /**
     * Timecard state: Initialized with default, then loaded from localStorage on client.
     * `isMounted` tracks if the component has mounted on the client to safely access `localStorage`.
     */
    const [timecard, setTimecard] = useState(defaultTimecard);
    const [isMounted, setIsMounted] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // Function to execute on confirm

    /**
     * Effect to load from localStorage only on the client side after mount.
     */
    useEffect(() => {
        setIsMounted(true); // Mark as mounted
        const saved = localStorage.getItem('timecard');
        if (saved) {
            setTimecard(JSON.parse(saved));
        }
    }, []); // Empty dependency array means this runs once after the initial render on the client

    /**
     * Sync effect - whenever timecard changes, persist to localStorage.
     * This effect runs AFTER the initial hydration, so localStorage is safe here.
     */
    useEffect(() => {
        if (isMounted) { // Only save to localStorage if the component has truly mounted on the client
            localStorage.setItem('timecard', JSON.stringify(timecard));
        }
    }, [timecard, isMounted]);

    /**
     * Calculate the difference in hours between two time string ("HH:mm")
     * @param {string} startStr - Start time in "HH:mm" format
     * @param {string} endStr - End time in "HH:mm" format
     * @returns {number} Difference in hours (fractional)
     */
    const hoursDiff = (startStr, endStr) => {
        if (!startStr || !endStr) return 0;

        const [sh, sm] = startStr.split(':').map(Number);
        const [eh, em] = endStr.split(':').map(Number);

        let start = new Date();
        let end = new Date();
        start.setHours(sh, sm, 0, 0);
        end.setHours(eh, em, 0, 0);

        if (end < start) end.setDate(end.getDate() + 1);

        return (end - start) / 3600000;
    };

    /**
     * Update a single time input and recalculate that day's total hours
     * @param {number} dayIdx - Index of day in timecard
     * @param {number} pairIdx - Which in/out pair (0-2)
     * @param {'in'|'out'} type - Field type (either "in" or "out")
     * @param {string} value  - New time value HH:mm
     */
    const handleTimeChange = (dayIdx, pairIdx, type, value) => {
        setTimecard(prev => {
            const newTS = [...prev];
            newTS[dayIdx] = { ...newTS[dayIdx] };

            if (type === 'in') {
                newTS[dayIdx].ins[pairIdx] = value;
            } else {
                newTS[dayIdx].outs[pairIdx] = value;
            }

            let dayTotal = 0;
            for (let i = 0; i < 3; i++) {
                dayTotal += hoursDiff(newTS[dayIdx].ins[i], newTS[dayIdx].outs[i]);
            }

            newTS[dayIdx].total = dayTotal;
            return newTS;
        });
    };

    /**
     * Update the selected date for a specific day
     * @param {number} dayIdx - Index of day
     * @param {string} value - New date string (YYYY-MM-DD)
     */
    const handleDateChange = (dayIdx, value) => {
        setTimecard(prev => {
            const newTS = [...prev];
            newTS[dayIdx] = { ...newTS[dayIdx], date: value };
            return newTS;
        });
    };

    /**
     * Save current timecard state to localStorage with confirmation (via custom modal)
     */
    const handleSave = () => {
        if (isMounted) {
            localStorage.setItem('timecard', JSON.stringify(timecard));
            setAlertMessage('Timecard saved locally!');
            setShowAlert(true);
        }
    };

    /**
     * Clear all entries, reset to default, and remove from localStorage (via custom modal)
     */
    const handleClear = () => {
        if (isMounted) {
            setAlertMessage('Are you sure you want to clear all entries?');
            setConfirmAction(() => () => { // Set a function to be called on confirm
                setTimecard(defaultTimecard);
                localStorage.removeItem('timecard');
                setShowConfirm(false); // Close confirm modal
            });
            setShowConfirm(true); // Show confirm modal
        }
    };

    /**
     * Total hours worked over the entire week
     * Summed from each day's total
     */
    const weeklyTotal = timecard.reduce((sum, d) => sum + d.total, 0);

    // Styling classes
    const tableClasses = "border-collapse w-full text-sm";
    const thClasses = "border border-gray-300 p-2 bg-rit-light-gray text-gray-800 font-semibold text-left";
    const tdClasses = "border border-gray-300 p-2 text-gray-700";
    const inputClasses = "w-full p-1 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rit-orange";
    const totalTdClasses = "border border-gray-300 p-3 text-gray-800 font-bold";
    const buttonClasses = "px-4 py-2 rounded-lg transition-colors duration-200 ease-in-out";

    return (
        <div className="min-h-screen bg-white p-6 flex flex-col items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Weekly Timecard</h2>

                {/* Conditional rendering for hydration safety */}
                {isMounted ? (
                    <table className={tableClasses}>
                        {/* Table header with column labels */}
                        <thead>
                            <tr>
                                <th className={thClasses}>Day</th>
                                <th className={thClasses}>Date</th>
                                <th className={thClasses}>Time In 1</th>
                                <th className={thClasses}>Time Out 1</th>
                                <th className={thClasses}>Time In 2</th>
                                <th className={thClasses}>Time Out 2</th>
                                <th className={thClasses}>Time In 3</th>
                                <th className={thClasses}>Time Out 3</th>
                                <th className={thClasses}>Total (hrs)</th>
                            </tr>
                        </thead>
                        {/* Table body - one row per day */}
                        <tbody>
                            {timecard.map((dayEntry, dayIdx) => (
                                <tr key={dayEntry.day}>
                                    <td className={tdClasses}>{dayEntry.day}</td>
                                    <td className={tdClasses}>
                                        <input
                                            type="date"
                                            value={dayEntry.date}
                                            onChange={e => handleDateChange(dayIdx, e.target.value)}
                                            className={inputClasses}
                                        />
                                    </td>
                                    {/* Time In / Time Out pairs */}
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <React.Fragment key={i}>
                                            <td className={tdClasses}>
                                                <input
                                                    type="time"
                                                    value={dayEntry.ins[i]}
                                                    onChange={e => handleTimeChange(dayIdx, i, 'in', e.target.value)}
                                                    className={inputClasses}
                                                />
                                            </td>
                                            <td className={tdClasses}>
                                                <input
                                                    type="time"
                                                    value={dayEntry.outs[i]}
                                                    onChange={e => handleTimeChange(dayIdx, i, 'out', e.target.value)}
                                                    className={inputClasses}
                                                />
                                            </td>
                                        </React.Fragment>
                                    ))}
                                    {/* Daily total hours cell */}
                                    <td className={totalTdClasses}>{dayEntry.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        {/* Table footer containing weekly total hours */}
                        <tfoot>
                            <tr>
                                <td colSpan="8" className={`${tdClasses} text-right font-bold`}>
                                    <strong>Week Total:</strong>
                                </td>
                                <td className={`${totalTdClasses} ${weeklyTotal > 10 ? 'text-red-600' : 'text-gray-800'}`}>
                                    {weeklyTotal.toFixed(2)} hrs
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                ) : (
                    <div className="text-center py-10 text-gray-600">Loading timecard data...</div>
                )}

                {/* Buttons - Save, Clear, Export */}
                <div className="mt-8 flex justify-center space-x-4">
                    {/* Save button */}
                    <button
                        onClick={handleSave}
                        className={`${buttonClasses} bg-rit-orange text-white hover:bg-rit-dark-gray`}
                    >
                        Save
                    </button>
                    {/* Clear button */}
                    <button
                        onClick={handleClear}
                        className={`${buttonClasses} bg-gray-300 text-gray-800 hover:bg-gray-400`}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Custom Alert Modal */}
            {showAlert && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                        <p className="text-lg mb-4">{alertMessage}</p>
                        <button
                            onClick={() => setShowAlert(false)}
                            className={`${buttonClasses} bg-rit-orange text-white hover:bg-rit-dark-gray`}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                        <p className="text-lg mb-4">{alertMessage}</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => { confirmAction(); setShowConfirm(false); }}
                                className={`${buttonClasses} bg-red-600 text-white hover:bg-red-700`}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className={`${buttonClasses} bg-gray-300 text-gray-800 hover:bg-gray-400`}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
