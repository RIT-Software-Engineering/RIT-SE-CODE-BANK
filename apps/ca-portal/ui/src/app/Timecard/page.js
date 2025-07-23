// app/Timecard/page.js
"use client";

import React, { useState, useEffect } from "react";
import {
    tableClasses,
    thClasses,
    tdClasses,
    inputClasses,
    totalTdClasses,
    buttonClasses,
} from "@/constants/timecardConstants";
import ConfirmModal from "@/components/timecard/ConfirmModal";
import AlertModal from "@/components/timecard/AlertModal";
import NotesModal from "@/components/timecard/NotesModal";
import { 
    upsertTimecard, 
    getMostRecentTimecard,
    upsertTimecardDay,
} from "@/services/db-apis";
import { useAuth } from "@/contexts/AuthContext";

export default function Timecard() {
    const [timecard, setTimecard] = useState([]);
    const [jobPositionHistoryId, setJobPositionHistoryId] = useState(null);
    const [weekStartDate, setWeekStartDate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [editingDay, setEditingDay] = useState(null);
    const [showNotesModal, setShowNotesModal] = useState(false);

    const { currentUser } = useAuth();

    /**
     * Format a date object or date string to a YYYY-MM-DD string,
     * adjusting for the user's local timezone.
     * @param {Date | string} date - The date to format.
     * @returns {string} Formatted date string in YYYY-MM-DD format.
     */
    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - userTimezoneOffset).toISOString().split("T")[0];
    };

    /**
     * Format a date or ISO string to a time string in HH:mm format,
     * adjusting for the user's local timezone.
     * @param {Date | string} date - The date or time to format.
     * @returns {string} Formatted time string in HH:mm format.
     */
    const formatTime = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() + userTimezoneOffset).toTimeString().slice(0, 5);
    };
    
    /**
     * Calculate the Friday that starts the week for a given date.
     * @param {Date} date - The reference date.
     * @returns {Date} Date object representing the Friday that starts the week.
     */
    const getWeekStartDate = (date) => {
        const d = new Date(date);
        const day = d.getDay(); // Sunday=0, ..., Friday=5, Saturday=6
        const diff = d.getDate() - day + (day < 5 ? -2 : 5);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    /**
     * Build an array of 7 day objects representing a week starting from Friday.
     * Each day object contains day label, date, time in/out arrays, total hours, and notes.
     * @param {Date} weekStart - The starting Friday date of the week.
     * @returns {Array<Object>} Array of day objects for the week.
     */
    const buildWeekDays = (weekStart) => {
        const dayLabels = ["Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
        return dayLabels.map((label, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            return {
                day: label,
                date: formatDate(d),
                ins: ["", "", ""],
                outs: ["", "", ""],
                total: 0,
                notes: "",
            };
        });
    };

    /**
     * Loads the last recorded timecard for a given job history ID,
     * populates the timecard state with daily entries, or initializes a new week.
     * @param {number} jobHistoryId - The job position history ID to load timecard for.
     * @returns {Promise<void>}
     */
    const loadLastRecordedTimecard = async (jobHistoryId) => {
        setIsLoading(true);
        try {
            const data = await getMostRecentTimecard(jobHistoryId);
            const weekStart = data ? new Date(data.weekStartDate) : getWeekStartDate(new Date());
            setWeekStartDate(weekStart);

            let fullWeek = buildWeekDays(weekStart);

            if (data?.dailyEntries) {
                const entriesMap = new Map(data.dailyEntries.map(entry => [formatDate(entry.day), entry]));
                fullWeek = fullWeek.map((dayEntry) => {
                    const dbEntry = entriesMap.get(dayEntry.date);
                    if (dbEntry) {
                        return {
                            ...dayEntry,
                            id: dbEntry.id,
                            ins: [formatTime(dbEntry.timeIn1), formatTime(dbEntry.timeIn2), formatTime(dbEntry.timeIn3)],
                            outs: [formatTime(dbEntry.timeOut1), formatTime(dbEntry.timeOut2), formatTime(dbEntry.timeOut3)],
                            total: parseFloat(dbEntry.duration) || 0,
                            notes: dbEntry.notes || "",
                        };
                    }
                    return dayEntry;
                });
            }
            setTimecard(fullWeek);
        } catch (error) {
            console.error("Failed to load last recorded timecard:", error);
            if (error.message.includes("404")) {
                const weekStart = getWeekStartDate(new Date());
                setTimecard(buildWeekDays(weekStart));
                setWeekStartDate(weekStart);
            } else {
                setAlertMessage("Could not load your timecard from the database.");
                setShowAlert(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let activeJob = null;
        const employeeRecords = currentUser?.candidate?.employees;
        if (employeeRecords?.length > 0) {
            for (const employee of employeeRecords) {
                const foundJob = employee.jobPositionHistory?.find(job => job.jobPositionHistoryStatus === "ACTIVE");
                if (foundJob) {
                    activeJob = foundJob;
                    break;
                }
            }
        }
        if (activeJob) {
            setJobPositionHistoryId(activeJob.id);
            loadLastRecordedTimecard(activeJob.id);
        } else {
            setIsLoading(false);
        }
    }, [currentUser]);

    /**
     * Calculates the difference in hours between two "HH:mm" time strings.
     * Handles crossing midnight by adding a day if end time is earlier than start time.
     * @param {string} startStr - Start time string in "HH:mm" format.
     * @param {string} endStr - End time string in "HH:mm" format.
     * @returns {number} Difference in hours as a decimal number.
     */
    const hoursDiff = (startStr, endStr) => {
        if (!startStr || !endStr) return 0;
        const [sh, sm] = startStr.split(":").map(Number);
        const [eh, em] = endStr.split(":").map(Number);
        const start = new Date(0);
        const end = new Date(0);
        start.setHours(sh, sm, 0, 0);
        end.setHours(eh, em, 0, 0);
        if (end < start) end.setDate(end.getDate() + 1);
        return (end - start) / 3600000;
    };

    /**
     * Handles updating a time input (time in/out) for a specific day and pair index,
     * recalculates the total hours for that day.
     * @param {number} dayIdx - Index of the day in the timecard array.
     * @param {number} pairIdx - Index of the time pair (0, 1, or 2).
     * @param {"in"|"out"} type - Indicates whether updating time in or time out.
     * @param {string} value - Time value in "HH:mm" format.
     */
    const handleTimeChange = (dayIdx, pairIdx, type, value) => {
        setTimecard(prev => {
            const newTS = [...prev];
            const dayEntry = { ...newTS[dayIdx] };
            type === "in" ? dayEntry.ins[pairIdx] = value : dayEntry.outs[pairIdx] = value;
            dayEntry.total = dayEntry.ins.reduce((acc, cur, i) => acc + hoursDiff(cur, dayEntry.outs[i]), 0);
            newTS[dayIdx] = dayEntry;
            return newTS;
        });
    };
    
    /**
     * Updates the date for a specific day entry in the timecard.
     * @param {number} dayIdx - Index of the day in the timecard array.
     * @param {string} value - New date string in "YYYY-MM-DD" format.
     */
    const handleDateChange = (dayIdx, value) => {
        setTimecard(prev => {
            const newTS = [...prev];
            newTS[dayIdx] = { ...newTS[dayIdx], date: value };
            return newTS;
        });
    };

    /**
     * Transforms the frontend timecard state into the API payload format,
     * ready for submission to the backend.
     * @returns {Object} API payload containing jobPositionHistoryId, dailyEntries, weekStartDate, and isCurrentWeek.
     */
    const transformForAPI = () => {
        const weekStart = weekStartDate || getWeekStartDate(new Date());
        const dailyEntries = timecard
            .filter(day => day.date)
            .map(day => ({
                date: day.date,
                notes: day.notes || "",
                duration: day.total || 0,
                timeIn1: day.ins[0] || null,
                timeOut1: day.outs[0] || null,
                timeIn2: day.ins[1] || null,
                timeOut2: day.outs[1] || null,
                timeIn3: day.ins[2] || null,
                timeOut3: day.outs[2] || null,
            }));

        return {
            jobPositionHistoryId,
            entries: dailyEntries,
            weekStartDate: weekStart,
            isCurrentWeek: true,
        };
    };

    /**
     * Handles submitting the current timecard by calling the upsert API,
     * shows success or error messages, and reloads the latest timecard after submission.
     * @returns {Promise<void>}
     */
    const handleSubmit = async () => {
        if (!jobPositionHistoryId) {
            setAlertMessage("No active job found to submit a timecard for.");
            setShowAlert(true);
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = transformForAPI();
            const response = await upsertTimecard(payload);
            setAlertMessage(response.message || "Timecard submitted successfully!");
            setShowAlert(true);
            // Refresh the timecard to get the new day IDs
            loadLastRecordedTimecard(jobPositionHistoryId);
        } catch (error) {
            console.error("Failed to submit timecard:", error);
            setAlertMessage(error.message || "An error occurred while submitting.");
            setShowAlert(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Prompts confirmation and clears all time and notes entries in the current week.
     */
    const handleClear = () => {
        setAlertMessage("Are you sure you want to clear all entries for this week?");
        setConfirmAction(() => () => {
            setTimecard(prev => prev.map(day => ({ ...day, ins: ["", "", ""], outs: ["", "", ""], total: 0, notes: "" })));
        });
        setShowConfirm(true);
    };

    /**
     * Updates notes for a specific day by calling the patch API,
     * updates local state and shows success or error messages.
     * @param {string|number} dayId - The unique ID of the day entry to update.
     * @param {string} newNotes - The updated notes text.
     * @returns {Promise<void>}
     */
    const handleSaveNotes = async (dayDate, newNotes) => {
        try {
            const payload = {
                jobPositionHistoryId,
                date: dayDate,
                notes: newNotes,
            };
            const updatedDay = await upsertTimecardDay(payload);
            setTimecard(prev => prev.map(day => day.date === dayDate ? { ...day, notes: newNotes, id: updatedDay.id } : day));
            setAlertMessage("Notes saved successfully!");
            setShowAlert(true);
        } catch (err) {
            console.error("Failed to update notes:", err);
            setAlertMessage("Failed to save notes.");
            setShowAlert(true);
        }
    };

    /**
     * Calculates the total hours worked for the entire week.
     * @returns {number} Sum of all daily totals in the timecard.
     */
    const weeklyTotal = timecard.reduce((sum, d) => sum + (d.total || 0), 0);

    /**
     * Exports the current timecard data as a CSV file including notes and totals.
     */
    const handleExport = () => {
        const headers = [
        "Day",
        "Date",
        "Time In 1",
        "Time Out 1",
        "Time In 2",
        "Time Out 2",
        "Time In 3",
        "Time Out 3",
        "Total (hrs)",
        "Notes",
        ];
        const dataRows = timecard.map((d) =>
        [
            d.day,
            d.date,
            d.ins[0] || "",
            d.outs[0] || "",
            d.ins[1] || "",
            d.outs[1] || "",
            d.ins[2] || "",
            d.outs[2] || "",
            (d.total || 0).toFixed(2),
            d.notes,
        ].join(",")
        );
        const totalRow = `\nWeek Total,,,,,,,,${weeklyTotal.toFixed(2)}`;
        const csvContent = [headers.join(","), ...dataRows].join("\n").concat(totalRow);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "timecard.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    if (isLoading) {
        return <div className="text-center py-20 text-gray-500"><p>Loading timecard...</p></div>;
    }

    if (!jobPositionHistoryId) {
        return <div className="text-center py-20 text-gray-500"><p>You do not have an active job position to submit a timecard for.</p></div>;
    }

    return (
        <div className="bg-rit-gray-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-7xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-rit-gray-900 mb-6 text-center">
                Weekly Timecard ({weekStartDate ? formatDate(weekStartDate) : "New Timecard"})
            </h1>

            <div className="overflow-x-auto rounded-lg border border-rit-light-gray-200">
                <table className={tableClasses}>
                <thead className="bg-rit-gray-50">
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
                    <th className={thClasses}>Notes</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-rit-gray-200">
                    {timecard.map((dayEntry, dayIdx) => (
                    <tr key={dayEntry.date} className="hover:bg-gray-50">
                        <td className={`${tdClasses} font-medium text-gray-900`}>{dayEntry.day}</td>
                        <td className={tdClasses} style={{ minWidth: "150px" }}>
                        <input type="date" value={dayEntry.date} onChange={(e) => handleDateChange(dayIdx, e.target.value)} className={inputClasses}/>
                        </td>
                        {Array.from({ length: 3 }).map((_, i) => (
                        <React.Fragment key={i}>
                            <td className={tdClasses} style={{ minWidth: "120px" }}>
                            <input type="time" value={dayEntry.ins[i] || ""} onChange={(e) => handleTimeChange(dayIdx, i, "in", e.target.value)} className={inputClasses}/>
                            </td>
                            <td className={tdClasses} style={{ minWidth: "120px" }}>
                            <input type="time" value={dayEntry.outs[i] || ""} onChange={(e) => handleTimeChange(dayIdx, i, "out", e.target.value)} className={inputClasses}/>
                            </td>
                        </React.Fragment>
                        ))}
                        <td className={totalTdClasses}>{(dayEntry.total || 0).toFixed(2)}</td>
                        <td className={tdClasses}>
                        <button
                            onClick={() => {
                            setEditingDay(dayEntry);
                            setShowNotesModal(true);
                            }}
                            className="text-blue-600 underline text-sm"
                        >
                            {dayEntry.notes ? "Edit Notes" : "Add Notes"}
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-50">
                    <tr>
                    <td colSpan="9" className={`${tdClasses} text-right font-bold text-gray-600 uppercase`}>
                        Week Total:
                    </td>
                    <td className={`${totalTdClasses} text-lg ${weeklyTotal > 40 ? "text-red-600" : "text-gray-800"}`}>
                        {weeklyTotal.toFixed(2)}
                    </td>
                    </tr>
                </tfoot>
                </table>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
                <button onClick={handleClear} disabled={isSubmitting} className={`${buttonClasses} bg-rit-light-gray text-gray-800 hover:bg-rit-gray focus:ring-rit-gray-400 disabled:bg-rit-gray-300`}>
                Clear
                </button>
                <button onClick={handleExport} disabled={isSubmitting} className={`${buttonClasses} bg-rit-light-gray text-gray-800 hover:bg-rit-gray focus:ring-rit-gray-400 disabled:bg-rit-gray-300`}>
                Export
                </button>
                <button onClick={handleSubmit} disabled={isSubmitting} className={`${buttonClasses} bg-rit-orange text-white hover:bg-rit-dark-orange focus:ring-rit-orange-dark disabled:bg-rit-gray-300`}>
                {isSubmitting ? "Submitting..." : "Submit"}
                </button>
            </div>
            </div>

            {showAlert && ( <AlertModal setShowAlert={setShowAlert} buttonClasses={buttonClasses} alertMessage={alertMessage} /> )}
            {showConfirm && ( <ConfirmModal confirmAction={confirmAction} setShowConfirm={setShowConfirm} alertMessage={alertMessage} /> )}
            {showNotesModal && editingDay && (
                <NotesModal
                    isOpen={showNotesModal}
                    dayEntry={editingDay}
                    onClose={() => setShowNotesModal(false)}
                    onSave={handleSaveNotes}
                />
            )}
        </div>
        );
}