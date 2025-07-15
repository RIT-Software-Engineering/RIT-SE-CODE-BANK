import { useState, useEffect } from "react";

export default function ScheduleEditor({
  initialSchedules = [],
  onSchedulesChange,
}) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: "MONDAY",
    startTime: "",
    endTime: "",
  });
  console.log(initialSchedules)

  // This function now correctly formats the time based on the user's local timezone.
  const formatTimeToInputValue = (timeString) => {
    if (!timeString || typeof timeString !== "string") {
      return "";
    }

    // If the value is already in "HH:mm" format (from an edit), return it directly.
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }

    try {
      // Otherwise, parse the full ISO string from the database.
      const date = new Date(timeString);

      // Get hours and minutes in the local timezone.
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      // Return the time in the "HH:mm" format required by the input.
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

  // This function is the core of the unified form.
  // It updates the state directly when you type in an input.
  const handleTimeChange = (index, field, value) => {
    const updatedSchedules = schedules.map((schedule, i) => {
      if (i === index) {
        // Return a new object with the updated time
        return { ...schedule, [field]: value };
      }
      return schedule;
    });
    setSchedules(updatedSchedules);
    // Notify the parent component of the change
    if (onSchedulesChange) {
      onSchedulesChange(updatedSchedules);
    }
  };

  const handleRemoveSchedule = (index) => {
    const updatedSchedules = schedules.filter((_, i) => i !== index);
    setSchedules(updatedSchedules);
    if (onSchedulesChange) {
      onSchedulesChange(updatedSchedules);
    }
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
    setSchedules(updatedSchedules);
    if (onSchedulesChange) {
      onSchedulesChange(updatedSchedules);
    }
    setNewSchedule({ dayOfWeek: "MONDAY", startTime: "", endTime: "" });
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-800">
        Edit Weekly Schedule
      </h3>

      {/* This section maps over the existing schedules and renders them as editable inputs */}
      <div className="space-y-3">
        {schedules.map((schedule, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center p-2 rounded-md bg-white border"
          >
            {/* The day is displayed as text, but could also be a disabled input */}
            <span className="font-medium text-gray-700 capitalize">
              {schedule.dayOfWeek.toLowerCase()}
            </span>

            {/* The time inputs are directly editable */}
            <input
              type="time"
              value={formatTimeToInputValue(schedule.startTime)}
              onChange={(e) =>
                handleTimeChange(index, "startTime", e.target.value)
              }
              className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <input
              type="time"
              value={formatTimeToInputValue(schedule.endTime)}
              onChange={(e) =>
                handleTimeChange(index, "endTime", e.target.value)
              }
              className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={() => handleRemoveSchedule(index)}
              className="p-1"
              aria-label="Remove schedule"
            >
              {/* <TrashIcon /> */}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
