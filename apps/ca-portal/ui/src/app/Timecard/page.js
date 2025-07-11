// src/app/Timecard/page.js
"use client";

import React, { useState, useEffect } from "react";
import { defaultTimecard } from "@/constants/timecardConstants";
import {
  tableClasses,
  thClasses,
  tdClasses,
  inputClasses,
  totalTdClasses,
  buttonClasses,
} from "@/constants/timecardConstants";
// Import the new ConfirmModal component.
import ConfirmModal from "@/components/timecard/ConfirmModal";
import AlertModal from "@/components/timecard/AlertModal";
import ActionButtons from "@/components/timecard/ActionButtons";

export default function Timecard() {
  /**
   * Timecard state: Initialized with default, then loaded from localStorage on client.
   * `isMounted` tracks if the component has mounted on the client to safely access `localStorage`.
   */
  const [timecard, setTimecard] = useState(defaultTimecard);
  const [isMounted, setIsMounted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  // This state will hold the function to execute when the user confirms the action.
  const [confirmAction, setConfirmAction] = useState(null);

  /**
   * Effect to load from localStorage only on the client side after mount.
   */
  useEffect(() => {
    setIsMounted(true); // Mark as mounted
    const saved = localStorage.getItem("timecard");
    if (saved) {
      setTimecard(JSON.parse(saved));
    }
  }, []); // Empty dependency array means this runs once after the initial render on the client

  /**
   * Sync effect - whenever timecard changes, persist to localStorage.
   */
  useEffect(() => {
    if (isMounted) {
      // Only save to localStorage if the component has truly mounted on the client
      localStorage.setItem("timecard", JSON.stringify(timecard));
    }
  }, [timecard, isMounted]);

  /**
   * Calculate the difference in hours between two time string ("HH:mm")
   */
  const hoursDiff = (startStr, endStr) => {
    if (!startStr || !endStr) return 0;

    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);

    let start = new Date();
    let end = new Date();
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
      newTS[dayIdx] = { ...newTS[dayIdx] };

      if (type === "in") {
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
   */
  const handleDateChange = (dayIdx, value) => {
    setTimecard((prev) => {
      const newTS = [...prev];
      newTS[dayIdx] = { ...newTS[dayIdx], date: value };
      return newTS;
    });
  };

  /**
   * Save current timecard state to localStorage with a simple alert.
   */
  const handleSave = () => {
    if (isMounted) {
      localStorage.setItem("timecard", JSON.stringify(timecard));
      setAlertMessage("Timecard saved locally!");
      setShowAlert(true);
    }
  };

  /**
   * Sets up the confirmation modal for clearing all entries.
   */
  const handleClear = () => {
    if (isMounted) {
      // Set the confirmation message for the modal.
      setAlertMessage("Are you sure you want to clear all entries?");

      // Define the action to be performed on confirmation.
      const clearAction = () => {
        // **FIXED**: Use a deep copy of the default timecard to ensure a clean state reset.
        setTimecard(JSON.parse(JSON.stringify(defaultTimecard)));
        localStorage.removeItem("timecard");
      };

      // Store the action in state.
      setConfirmAction(() => clearAction);

      // Show the confirmation modal.
      setShowConfirm(true);
    }
  };

    /**
     * Total hours worked over the entire week
     * Summed from each day's total
     */
    const weeklyTotal = timecard.reduce((sum, d) => sum + d.total, 0);


    /**
     * Handles the CSV export by generating a file and triggering a download.
     */
    const handleExport = () => {
        if (!isMounted) return;
        
        const headers = [
            'Day', 'Date', 'Time In 1', 'Time Out 1', 'Time In 2', 'Time Out 2', 'Time In 3', 'Time Out 3', 'Total (hrs)'
        ];

        const dataRows = timecard.map(d => [
            d.day,
            d.date,
            d.ins[0] || '', d.outs[0] || '',
            d.ins[1] || '', d.outs[1] || '',
            d.ins[2] || '', d.outs[2] || '',
            (d.total || 0).toFixed(2)
        ].join(','));

        const totalRow = `\nWeek Total,,,,,,,,${weeklyTotal.toFixed(2)}`;

        const csvContent = [headers.join(','), ...dataRows].join('\n').concat(totalRow);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "timecard.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Styling classes
    const tableClasses = "min-w-full divide-y divide-gray-200 text-sm";
    const thClasses = "px-4 py-3 border border-gray-300 p-2 bg-rit-light-gray text-left text-xs font-medium text-gray-800 uppercase tracking-wider whitespace-nowrap";
    const tdClasses = "px-4 py-2 whitespace-nowrap text-gray-700";
    const inputClasses = "w-full p-1.5 rounded-md border-rit-gray-300 shadow-sm focus:ring-2 focus:ring-rit-orange sm:text-sm";
    const totalTdClasses = "px-4 py-2 whitespace-nowrap text-rit-gray-800 font-bold";
    const buttonClasses = "px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";

    return (
        <div className="bg-rit-gray-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-7xl">
                <h1 className="text-2xl sm:text-3xl font-bold text-rit-gray-900 mb-6 text-center">Weekly Timecard</h1>

                {/* UI FIX: This div makes the table scrollable on small screens */}
                <div className="overflow-x-auto rounded-lg border border-rit-light-gray-200">
                    {isMounted ? (
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
                                        <td className={tdClasses} style={{minWidth: '150px'}}>
                                            <input
                                                type="date"
                                                value={dayEntry.date}
                                                onChange={e => handleDateChange(dayIdx, e.target.value)}
                                                className={inputClasses}
                                            />
                                        </td>
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <React.Fragment key={i}>
                                                <td className={tdClasses} style={{minWidth: '120px'}}>
                                                    <input
                                                        type="time"
                                                        value={dayEntry.ins[i]}
                                                        onChange={e => handleTimeChange(dayIdx, i, 'in', e.target.value)}
                                                        className={inputClasses}
                                                    />
                                                </td>
                                                <td className={tdClasses} style={{minWidth: '120px'}}>
                                                    <input
                                                        type="time"
                                                        value={dayEntry.outs[i]}
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
                                    <td className={`${totalTdClasses} text-lg ${weeklyTotal > 10 ? 'text-red-600' : 'text-gray-800'}`}>
                                        {weeklyTotal.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            <p>Loading timecard...</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-center space-x-4">
                    
                    <button
                        onClick={handleClear}
                        disabled={!isMounted}
                        className={`${buttonClasses} bg-rit-light-gray text-gray-800 hover:bg-rit-gray focus:ring-rit-gray-400 disabled:bg-rit-gray-300`}
                    >
                        Clear All
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!isMounted}
                        className={`${buttonClasses} bg-rit-light-gray text-gray-800 hover:bg-rit-gray focus:ring-rit-gray-400 disabled:bg-rit-gray-300`}
                    >
                        Export to CSV
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isMounted}
                        className={`${buttonClasses} bg-rit-orange text-white hover:bg-rit-gray focus:ring-rit-gray-400 disabled:bg-rit-gray-300`}
                    >
                        Save
                    </button>
                </div>
            </div>

            {/* Custom Alert Modal */}
            {showAlert && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full mx-4">
                        <p className="text-lg mb-4 text-gray-800">{alertMessage}</p>
                        <button
                            onClick={() => setShowAlert(false)}
                            className={`${buttonClasses} w-full bg-blue-600 text-white hover:bg-blue-700`}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full mx-4">
                        <p className="text-lg mb-6 text-gray-800">{alertMessage}</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => { if(confirmAction) confirmAction(); }}
                                className={`${buttonClasses} flex-1 bg-red-600 text-white hover:bg-red-700`}
                            >
                                Yes, Clear
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className={`${buttonClasses} flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300`}
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
