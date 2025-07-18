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
import { upsertTimecard, getEmployeeTimecard } from "@/services/db-apis";
import { useAuth } from "@/contexts/AuthContext";

export default function Timecard() {
    const [timecard, setTimecard] = useState([]);
    const [jobPositionHistoryId, setJobPositionHistoryId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const { currentUser } = useAuth();

    // Effect to find the active job and fetch data on mount
    useEffect(() => {
        // **FIX**: This logic now robustly finds the first active job across all of an employee's records.
        let activeJob = null;
        const employeeRecords = currentUser?.candidate?.employees;

        if (employeeRecords && employeeRecords.length > 0) {
            for (const employee of employeeRecords) {
                const foundJob = employee.jobPositionHistory?.find(
                    (job) => job.jobPositionHistoryStatus === "ACTIVE"
                );
                if (foundJob) {
                    activeJob = foundJob;
                    break; // Stop searching once the first active job is found
                }
            }
        }

        if (!activeJob) {
            setIsLoading(false);
            return;
        }

        setJobPositionHistoryId(activeJob.id);

        const loadTimecard = async (jpHistoryId) => {
            setIsLoading(true);
            try {
                // 1. Set up the current week's structure with correct dates
                const today = new Date();
                const dayOfWeek = today.getDay(); // Sunday = 0
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - dayOfWeek);
                weekStart.setHours(0, 0, 0, 0);

                const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                let newTimecard = daysOfWeek.map((dayName, i) => {
                    const date = new Date(weekStart);
                    date.setDate(weekStart.getDate() + i);
                    return {
                        day: dayName,
                        date: formatDate(date),
                        ins: ["", "", ""],
                        outs: ["", "", ""],
                        total: 0,
                        notes: ""
                    };
                });

                // 2. Fetch data from the DB for the active job
                const data = await getEmployeeTimecard(jpHistoryId);

                // 3. Merge DB data into the new structure
                if (data && data.dailyEntries) {
                    const entriesMap = new Map(data.dailyEntries.map(entry => [formatDate(entry.day), entry]));
                    
                    newTimecard = newTimecard.map(dayRow => {
                        const dbDay = entriesMap.get(dayRow.date);
                        if (dbDay) {
                            return {
                                ...dayRow,
                                ins: [formatTime(dbDay.timeIn1), formatTime(dbDay.timeIn2), formatTime(dbDay.timeIn3)],
                                outs: [formatTime(dbDay.timeOut1), formatTime(dbDay.timeOut2), formatTime(dbDay.timeOut3)],
                                total: parseFloat(dbDay.duration) || 0,
                                notes: dbDay.notes || "",
                            };
                        }
                        return dayRow;
                    });
                }

                // 4. Set the final state
                setTimecard(newTimecard);

            } catch (error) {
                console.error("Failed to fetch timecard:", error);
                if (error.message.includes("404")) {
                    // It's not an error if a timecard doesn't exist yet, just means it's a new one.
                    console.log("No existing timecard found for this week. Starting fresh.");
                } else {
                    setAlertMessage("Could not load your timecard from the database.");
                    setShowAlert(true);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadTimecard(activeJob.id);

    }, [currentUser]);

    /**
     * Calculate the difference in hours between two time string ("HH:mm")
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
     * Update a single time input and recalculate that day's total hours
     */
    const handleTimeChange = (dayIdx, pairIdx, type, value) => {
        setTimecard((prev) => {
            const newTS = [...prev];
            const dayEntry = { ...newTS[dayIdx] };
            
            if (type === "in") {
                dayEntry.ins[pairIdx] = value;
            } else {
                dayEntry.outs[pairIdx] = value;
            }

            let dayTotal = 0;
            for (let i = 0; i < 3; i++) {
                dayTotal += hoursDiff(dayEntry.ins[i], dayEntry.outs[i]);
            }
            dayEntry.total = dayTotal;
            newTS[dayIdx] = dayEntry;
            return newTS;
        });
    };
    
    /**
     * Update the selected date for a specific day
     */
    const handleDateChange = (dayIdx, value) => {
        setTimecard((prev) => {
            const newTS = [...prev];
            newTS[dayIdx] = { ...newTS[dayIdx], date: value };
            return newTS;
        });
    };

    /**
     * Transforms frontend state to the format required by the backend API.
     */
    const transformForAPI = () => {
        const dailyEntries = timecard
            .filter(day => day.date && day.total > 0) // Only include days with a date and hours
            .map(day => ({
                date: day.date,
                notes: day.notes || "",
                duration: day.total,
                timeIn1: day.ins[0] || null,
                timeOut1: day.outs[0] || null,
                timeIn2: day.ins[1] || null,
                timeOut2: day.outs[1] || null,
                timeIn3: day.ins[2] || null,
                timeOut3: day.outs[2] || null,
            }));

        return {
            jobPositionHistoryId,
            dailyEntries,
        };
    };

    /**
     * Submits the timecard data to the database.
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
        } catch (error) {
            console.error("Failed to submit timecard:", error);
            setAlertMessage(error.message || "An error occurred while submitting.");
            setShowAlert(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClear = () => {
        setAlertMessage("Are you sure you want to clear all entries for this week?");
        const clearAction = () => {
            // Re-initialize the timecard with the current week's dates, but empty values
            const today = new Date();
            const dayOfWeek = today.getDay(); // Sunday = 0
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - dayOfWeek);
            weekStart.setHours(0, 0, 0, 0);

            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const clearedTimecard = daysOfWeek.map((dayName, i) => {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + i);
                return { day: dayName, date: formatDate(date), ins: ["", "", ""], outs: ["", "", ""], total: 0, notes: "" };
            });
            setTimecard(clearedTimecard);
        };
        setConfirmAction(() => clearAction);
        setShowConfirm(true);
    };

    const weeklyTotal = timecard.reduce((sum, d) => sum + d.total, 0);

    const handleExport = () => {
        const headers = [
            "Day", "Date", "Time In 1", "Time Out 1", "Time In 2", "Time Out 2", "Time In 3", "Time Out 3", "Total (hrs)"
        ];
        const dataRows = timecard.map(d => [
            d.day, d.date,
            d.ins[0] || '', d.outs[0] || '',
            d.ins[1] || '', d.outs[1] || '',
            d.ins[2] || '', d.outs[2] || '',
            (d.total || 0).toFixed(2)
        ].join(","));
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

    // Helper to format a Date object or ISO string into YYYY-MM-DD
    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toISOString().split('T')[0];
    };

    // Helper to format a Date object or ISO string into HH:MM
    const formatTime = (date) => {
        if (!date) return "";
        // Adjust for timezone offset to get correct time from UTC date
        const d = new Date(date);
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() + userTimezoneOffset).toTimeString().slice(0, 5);
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
            <h1 className="text-2xl sm:text-3xl font-bold text-rit-gray-900 mb-6 text-center">Weekly Timecard</h1>
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
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-rit-gray-200">
                        {timecard.map((dayEntry, dayIdx) => (
                        <tr key={dayEntry.day} className="hover:bg-gray-50">
                            <td className={`${tdClasses} font-medium text-gray-900`}>{dayEntry.day}</td>
                            <td className={tdClasses} style={{ minWidth: '150px' }}>
                            <input
                                type="date"
                                value={dayEntry.date}
                                onChange={e => handleDateChange(dayIdx, e.target.value)}
                                className={inputClasses}
                            />
                            </td>
                            {Array.from({ length: 3 }).map((_, i) => (
                            <React.Fragment key={i}>
                                <td className={tdClasses} style={{ minWidth: '120px' }}>
                                <input
                                    type="time"
                                    value={dayEntry.ins[i] || ''}
                                    onChange={e => handleTimeChange(dayIdx, i, 'in', e.target.value)}
                                    className={inputClasses}
                                />
                                </td>
                                <td className={tdClasses} style={{ minWidth: '120px' }}>
                                <input
                                    type="time"
                                    value={dayEntry.outs[i] || ''}
                                    onChange={e => handleTimeChange(dayIdx, i, 'out', e.target.value)}
                                    className={inputClasses}
                                />
                                </td>
                            </React.Fragment>
                            ))}
                            <td className={totalTdClasses}>{(dayEntry.total || 0).toFixed(2)}</td>
                        </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                        <td colSpan="8" className={`${tdClasses} text-right font-bold text-gray-600 uppercase`}>
                            Week Total:
                        </td>
                        <td className={`${totalTdClasses} text-lg ${weeklyTotal > 40 ? 'text-red-600' : 'text-gray-800'}`}>
                            {weeklyTotal.toFixed(2)}
                        </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div className="mt-8 flex justify-center space-x-4">
            <button
                onClick={handleClear}
                disabled={isSubmitting}
                className={`${buttonClasses} bg-rit-light-gray text-gray-800 hover:bg-rit-gray focus:ring-rit-gray-400 disabled:bg-rit-gray-300`}
            >
                Clear
            </button>
            <button
                onClick={handleExport}
                disabled={isSubmitting}
                className={`${buttonClasses} bg-rit-light-gray text-gray-800 hover:bg-rit-gray focus:ring-rit-gray-400 disabled:bg-rit-gray-300`}
            >
                Export
            </button>
            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`${buttonClasses} bg-rit-orange text-white hover:bg-rit-dark-orange focus:ring-rit-orange-dark disabled:bg-rit-gray-300`}
            >
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            </div>
        </div>

        {showAlert && (
            <AlertModal setShowAlert={setShowAlert} buttonClasses={buttonClasses} alertMessage={alertMessage} />
        )}

        {showConfirm && (
            <ConfirmModal confirmAction={confirmAction} setShowConfirm={setShowConfirm} alertMessage={alertMessage} />
        )}
        </div>
    );
}
