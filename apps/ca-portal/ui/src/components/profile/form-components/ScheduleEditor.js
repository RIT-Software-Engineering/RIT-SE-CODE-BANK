import { useState, useEffect } from "react";

// A reusable icon for a clean UI
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-red-500">
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

/**
 * Formats a date-time string for a time input's value, consistently using UTC.
 * @param {string} timeString - The full ISO date string from the database or a "HH:mm" string.
 * @returns {string} The time formatted as "HH:mm".
 */
const formatTimeToInputValue = (timeString) => {
  if (!timeString) return "";

  // If the value is already "HH:mm" (from a user edit), return it directly.
  if (typeof timeString === 'string' && timeString.match(/^\d{2}:\d{2}$/)) {
    return timeString;
  }
  
  // Otherwise, parse the full date string and get its UTC time components.
  try {
    const date = new Date(timeString);
    // Use getUTCHours() and getUTCMinutes() to ignore the local timezone.
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting time:", error);
    return "";
  }
};


export default function ScheduleEditor({
  initialSchedules = [],
  onSchedulesChange,
}) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: "Monday",
    startTime: "",
    endTime: "",
  });

  const triggerParentUpdate = (updatedSchedules) => {
    setSchedules(updatedSchedules);
    if (onSchedulesChange) {
      onSchedulesChange(updatedSchedules);
    }
  };

  const handleTimeChange = (index, field, value) => {
    const updatedSchedules = schedules.map((schedule, i) => {
      if (i === index) {
        return { ...schedule, [field]: value };
      }
      return schedule;
    });
    triggerParentUpdate(updatedSchedules);
  };

  const handleRemoveSchedule = (index) => {
    const updatedSchedules = schedules.filter((_, i) => i !== index);
    triggerParentUpdate(updatedSchedules);
  };

  const handleNewScheduleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSchedule = () => {
    if (!newSchedule.startTime || !newSchedule.endTime) {
      alert("Please set a start and end time.");
      return;
    }
    const updatedSchedules = [...schedules, newSchedule];
    triggerParentUpdate(updatedSchedules);
    setNewSchedule({ dayOfWeek: "Monday", startTime: "", endTime: "" });
  };


  console.log("Current schedules:", schedules);
  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-800">
        Edit Weekly Schedule
      </h3>
      <div className="space-y-3">
        {schedules.map((schedule, index) => (
          <div
            key={schedule.id || index}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center p-2 rounded-md bg-white border"
          >
            <span className="font-medium text-gray-700 capitalize">
              {schedule.dayOfWeek.toLowerCase()}
            </span>
            <input
              type="time"
              value={schedule.startTime}
              onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm"
            />
            <input
              type="time"
              value={schedule.endTime}
              onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm"
            />
            <button
              type="button"
              onClick={() => handleRemoveSchedule(index)}
              className="p-1"
              aria-label="Remove schedule"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
       <div className="pt-4 border-t">
         <h4 className="text-md font-semibold text-gray-700 mb-2">Add a New Day</h4>
         <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
            <select
              name="dayOfWeek"
              value={newSchedule.dayOfWeek}
              onChange={handleNewScheduleInputChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
            </select>
            <input
              type="time"
              name="startTime"
              value={newSchedule.startTime}
              onChange={handleNewScheduleInputChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm"
            />
            <input
              type="time"
              name="endTime"
              value={newSchedule.endTime}
              onChange={handleNewScheduleInputChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm"
            />
            <button
              type="button"
              onClick={handleAddSchedule}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
         </div>
      </div>
    </div>
  );
}
