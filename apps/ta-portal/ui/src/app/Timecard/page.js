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
   * Update the Interview date for a specific day
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
   */
  const weeklyTotal = timecard.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 flex flex-col items-center w-full">
      <div className="bg-white p-4 sm:p-8 rounded-lg shadow-xl w-full max-w-7xl">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Weekly Timecard
        </h2>

        {/* Conditional rendering for hydration safety */}
        {isMounted ? (
          // **FIXED**: Added a div wrapper with overflow-x-auto to handle table scrolling on small screens.
          <div className="overflow-x-auto">
            <table className={tableClasses}>
              {/* Table header */}
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
              {/* Table body */}
              <tbody>
                {timecard.map((dayEntry, dayIdx) => (
                  <tr key={dayEntry.day}>
                    <td className={tdClasses}>{dayEntry.day}</td>
                    <td className={tdClasses}>
                      <input
                        type="date"
                        value={dayEntry.date}
                        onChange={(e) => handleDateChange(dayIdx, e.target.value)}
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
                            onChange={(e) =>
                              handleTimeChange(dayIdx, i, "in", e.target.value)
                            }
                            className={inputClasses}
                          />
                        </td>
                        <td className={tdClasses}>
                          <input
                            type="time"
                            value={dayEntry.outs[i]}
                            onChange={(e) =>
                              handleTimeChange(dayIdx, i, "out", e.target.value)
                            }
                            className={inputClasses}
                          />
                        </td>
                      </React.Fragment>
                    ))}
                    {/* Daily total */}
                    <td className={totalTdClasses}>
                      {dayEntry.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Table footer */}
              <tfoot>
                <tr>
                  <td colSpan="8" className={`${tdClasses} text-right font-bold`}>
                    <strong>Week Total:</strong>
                  </td>
                  <td
                    className={`${totalTdClasses} ${
                      weeklyTotal > 10 ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {weeklyTotal.toFixed(2)} hrs
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-600">
            Loading timecard data...
          </div>
        )}

        {/* Action Buttons */}
        <ActionButtons handleClear={handleClear} handleSave={handleSave} buttonClasses={buttonClasses}/>
      </div>

      {/* Custom Alert Modal for simple notifications */}
      {showAlert && (
        <AlertModal setShowAlert={setShowAlert} buttonClasses={buttonClasses} alertMessage={alertMessage} />
      )}

      {/* Custom Confirm Modal with correct props for the new component */}
      {showConfirm && (
        <ConfirmModal
          alertMessage={alertMessage}
          confirmAction={confirmAction}
          setShowConfirm={setShowConfirm}
        />
      )}
    </div>
  );
}
