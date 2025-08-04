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
import NotesModal from "@/components/timecard/NotesModal";
import ConfirmationModal from "@/components/common/models/ConfirmationModal";
import { useNotification } from "@/contexts/NotificationContext";
import { 
    upsertTimecard, 
    getAllTimecardsForJob,
    upsertTimecardDay,
} from "@/services/db-apis";
import { useAuth } from "@/contexts/AuthContext";
import TimecardHistory from "@/components/timecard/TimecardHistory";

import { Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";


export default function Timecard() {
    // --- STATE MANAGEMENT ---
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();

    const [currentTimecard, setCurrentTimecard] = useState([]);
    const [previousTimecards, setPreviousTimecards] = useState([]);
    const [jobPositionHistoryId, setJobPositionHistoryId] = useState(null);
    const [weekStartDate, setWeekStartDate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [notesModal, setNotesModal] = useState({ show: false, day: null });

    // --- HELPER & UTILITY FUNCTIONS ---
    const formatDate = (date) => date ? new Date(date).toISOString().slice(0, 10) : "";
    const formatTime = (date) => date ? new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) : "";
    
    const getWeekStartDateFor = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day < 5 ? -2 : 5);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const buildWeekFrom = (weekStart) => {
        const dayLabels = ["Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
        return dayLabels.map((label, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            return { day: label, date: formatDate(date), ins: ["", "", ""], outs: ["", "", ""], total: 0, notes: "" };
        });
    };

    const hoursDiff = (startStr, endStr) => {
        if (!startStr || !endStr) return 0;
        const [sh, sm] = startStr.split(":").map(Number);
        const [eh, em] = endStr.split(":").map(Number);
        let start = new Date(0, 0, 0, sh, sm);
        let end = new Date(0, 0, 0, eh, em);
        if (end < start) end.setDate(end.getDate() + 1);
        return (end - start) / 3600000;
    };

    // --- DATA LOADING & SIDE EFFECTS ---
    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        
        const loadInitialData = async () => {
            const employeeRecords = currentUser.candidate?.employees;
            const activeJob = employeeRecords?.flatMap(e => e.jobPositionHistory).find(j => j.jobPositionHistoryStatus === "ACTIVE");
            
            if (activeJob) {
                setJobPositionHistoryId(activeJob.id);
                await loadAllTimecards(activeJob.id);
            } else {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [currentUser]);

    const loadAllTimecards = async (jobHistoryId) => {
        setLoading(true);
        setError(null);
        try {
            const allTimecards = await getAllTimecardsForJob(jobHistoryId);
            const mostRecent = allTimecards.length > 0 ? allTimecards[0] : null;
            
            setPreviousTimecards(allTimecards.length > 1 ? allTimecards.slice(1) : []);

            const weekStart = mostRecent ? new Date(mostRecent.weekStartDate) : getWeekStartDateFor(new Date());
            setWeekStartDate(weekStart);

            let editableWeek = buildWeekFrom(weekStart);
            if (mostRecent?.dailyEntries) {
                const entriesMap = new Map(mostRecent.dailyEntries.map(entry => [formatDate(entry.day), entry]));
                editableWeek = editableWeek.map((day) => {
                    const dbEntry = entriesMap.get(day.date);
                    return dbEntry ? { ...day, id: dbEntry.id, ins: [formatTime(dbEntry.timeIn1), formatTime(dbEntry.timeIn2), formatTime(dbEntry.timeIn3)], outs: [formatTime(dbEntry.timeOut1), formatTime(dbEntry.timeOut2), formatTime(dbEntry.timeOut3)], total: parseFloat(dbEntry.duration) || 0, notes: dbEntry.notes || "" } : day;
                });
            }
            setCurrentTimecard(editableWeek);

        } catch (err) {
            console.error("Failed to load timecards:", err);
            setError(err.message || "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // --- EVENT HANDLERS ---
    const handleTimeChange = (dayIdx, pairIdx, type, value) => {
        setCurrentTimecard(prev => {
            const newTimecard = [...prev];
            const dayEntry = { ...newTimecard[dayIdx] };
            type === "in" ? (dayEntry.ins[pairIdx] = value) : (dayEntry.outs[pairIdx] = value);
            dayEntry.total = dayEntry.ins.reduce((acc, cur, i) => acc + hoursDiff(cur, dayEntry.outs[i]), 0);
            newTimecard[dayIdx] = dayEntry;
            return newTimecard;
        });
    };

    const handleSaveProgress = async () => {
        if (!jobPositionHistoryId) {
            showNotification("No active job found.", "error");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                jobPositionHistoryId, weekStartDate, isCurrentWeek: true,
                entries: currentTimecard.map(day => ({
                    date: day.date, notes: day.notes || "", duration: day.total || 0,
                    timeIn1: day.ins[0] || null, timeOut1: day.outs[0] || null,
                    timeIn2: day.ins[1] || null, timeOut2: day.outs[1] || null,
                    timeIn3: day.ins[2] || null, timeOut3: day.outs[2] || null,
                })),
            };
            await upsertTimecard(payload);
            showNotification("Progress saved successfully!", "success");
        } catch (error) {
            showNotification(error.message || "Failed to save progress.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinalSubmit = async () => {
        setShowSubmitConfirm(false);
        await handleSaveProgress();
    };

    const handleClearConfirm = () => {
        setCurrentTimecard(buildWeekFrom(weekStartDate));
        setShowClearConfirm(false);
        showNotification("Timecard has been cleared.", "success");
    };

    const handleSaveNotes = (date, notes) => {
        setCurrentTimecard(prev => prev.map(d => d.date === date ? { ...d, notes } : d));
        showNotification("Notes updated. Click 'Save Progress' to save to the database.", "success");
    };

    const handleExport = () => {
        const headers = ["Day", "Date", "Time In 1", "Time Out 1", "Time In 2", "Time Out 2", "Time In 3", "Time Out 3", "Total (hrs)", "Notes"];
        const rows = currentTimecard.map(d => [d.day, d.date, d.ins[0], d.outs[0], d.ins[1], d.outs[1], d.ins[2], d.outs[2], d.total.toFixed(2), `"${d.notes.replace(/"/g, '""')}"`].join(","));
        const totalRow = `\nWeek Total,,,,,,,,${weeklyTotal.toFixed(2)}`;
        const csv = [headers.join(","), ...rows].join("\n").concat(totalRow);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const name = currentUser?.name.replace(/\s+/g, '_') || 'user';
        const week = formatDate(weekStartDate);
        link.download = `${name}_timecard_${week}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const weeklyTotal = currentTimecard.reduce((sum, d) => sum + (d.total || 0), 0);

    if (loading) return <div className="text-center py-20 text-gray-500">Loading timecard...</div>;
    if (error) return <div className="text-center py-20 text-red-600">Error: {error}</div>;
    if (!jobPositionHistoryId) return <div className="text-center py-20 text-gray-500">You do not have an active job position.</div>;

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-7xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">Weekly Timecard</h1>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className={tableClasses}>
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={thClasses}>Day</th><th className={thClasses}>Date</th><th className={thClasses}>Time In 1</th><th className={thClasses}>Time Out 1</th><th className={thClasses}>Time In 2</th><th className={thClasses}>Time Out 2</th><th className={thClasses}>Time In 3</th><th className={thClasses}>Time Out 3</th><th className={thClasses}>Total (hrs)</th><th className={thClasses}>Notes</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentTimecard.map((day, dayIdx) => (
                                    <tr key={day.date} className="hover:bg-gray-50">
                                        <td className={`${tdClasses} font-medium text-gray-900`}>{day.day}</td>
                                        <td className={tdClasses}><input type="date" value={day.date} readOnly className={`${inputClasses} bg-gray-100 cursor-not-allowed`}/></td>
                                        {Array.from({ length: 3 }).map((_, pairIdx) => (
                                            <React.Fragment key={pairIdx}>
                                                <td className={tdClasses}><input type="time" value={day.ins[pairIdx] || ""} onChange={(e) => handleTimeChange(dayIdx, pairIdx, "in", e.target.value)} className={inputClasses}/></td>
                                                <td className={tdClasses}><input type="time" value={day.outs[pairIdx] || ""} onChange={(e) => handleTimeChange(dayIdx, pairIdx, "out", e.target.value)} className={inputClasses}/></td>
                                            </React.Fragment>
                                        ))}
                                        <td className={totalTdClasses}>{(day.total || 0).toFixed(2)}</td>
                                        <td className={tdClasses}><button onClick={() => setNotesModal({ show: true, day: day })} className="text-blue-600 underline text-sm">{day.notes ? "Edit Notes" : "Add Notes"}</button></td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan="9" className={`${tdClasses} text-right font-bold text-gray-600 uppercase`}>Week Total:</td>
                                    <td className={`${totalTdClasses} text-lg ${weeklyTotal > 40 ? "text-red-600" : "text-gray-800"}`}>{weeklyTotal.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="mt-8 flex justify-center space-x-4">
                        <button onClick={() => setShowClearConfirm(true)} disabled={submitting || !!error} className={`${buttonClasses} bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50`}>Clear</button>
                        <button onClick={handleExport} disabled={submitting} className={`${buttonClasses} bg-gray-200 text-gray-800 hover:bg-gray-300`}>Export</button>
                        <button onClick={handleSaveProgress} disabled={submitting || !!error} className={`${buttonClasses} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}>{submitting ? "Saving..." : "Save"}</button>
                        <button onClick={() => setShowSubmitConfirm(true)} disabled={submitting || !!error} className={`${buttonClasses} bg-rit-orange text-white hover:bg-gray-900 disabled:opacity-50`}>Submit</button>
                    </div>
                </div>

                {previousTimecards.length > 0 && (
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-7xl mx-auto mt-8">
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6" fontWeight={600}>Previous Timecards</Typography></AccordionSummary>
                            <AccordionDetails>
                                {previousTimecards.map(timecard => (
                                    <Accordion key={timecard.id}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Timecard for week of {formatDate(timecard.weekStartDate)}</Typography></AccordionSummary>
                                        <AccordionDetails><TimecardHistory timecard={timecard} /></AccordionDetails>
                                    </Accordion>
                                ))}
                            </AccordionDetails>
                        </Accordion>
                    </div>
                )}
            </div>
            
            <ConfirmationModal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} onConfirm={handleClearConfirm} title="Clear Timecard">
                Are you sure you want to clear all entries for this week? This action cannot be undone.
            </ConfirmationModal>
            <ConfirmationModal isOpen={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} onConfirm={handleFinalSubmit} title="Submit Timecard" isConfirming={submitting}>
                Are you sure you are ready to submit your timecard for the week? This will create a new weekly timecard.
            </ConfirmationModal>
            {notesModal.show && <NotesModal isOpen={notesModal.show} dayEntry={notesModal.day} onClose={() => setNotesModal({ show: false, day: null })} onSave={handleSaveNotes} />}
        </>
    );
}