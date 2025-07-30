// --- Reusable Helper Functions ---
export const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
export const formatTime = (timeString) => {
  if (!timeString) return '';

  return new Date(timeString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
};


/**
 * Converts a time string ("HH:mm") into a full UTC ISO string.
 * The date is set to a placeholder (Jan 1, 1970) as it's not relevant.
 * @param {string} timeString - The time to convert, in "HH:mm" format (e.g., "17:01").
 * @returns {string|null} A full ISO 8601 string in UTC (e.g., "1970-01-01T17:01:00.000Z"), or null if the format is invalid.
 */
export const convertTimeToUTCISO = (timeValue) => {
  if (!timeValue) return null;

  // Check if it's already a full ISO date-time string and return it directly.
  if (typeof timeValue === 'string' && timeValue.includes('T') && timeValue.includes('Z')) {
    return timeValue;
  }

  // Check if it's in "HH:mm" format and convert it.
  if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
    // Pad with seconds if they are missing, then create the full ISO string.
    const timeWithSeconds = timeValue.padEnd(8, ':00');
    return `1970-01-01T${timeWithSeconds}.000Z`;
  }
  
  console.error(`Unexpected time format: "${timeValue}". Could not convert to ISO string.`);
  return null;
};

/**
 * Converts a display time string (e.g., "5:32 PM") into the "HH:mm" format
 * required for an HTML time input's value.
 * @param {string} displayTime - The time string to convert, like "5:32 PM" or "9:00 AM".
 * @returns {string} The time in 24-hour "HH:mm" format, or an empty string if the input is invalid.
 */
export const convertDisplayTimeToInputValue = (displayTime) => {
  // Return an empty string if the input is invalid to prevent errors.
  if (!displayTime || typeof displayTime !== 'string') {
    return '';
  }

  // Use a regular expression to parse the hours, minutes, and AM/PM parts.
  const timeParts = displayTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

  if (!timeParts) {
    console.error('Invalid time format provided. Expected format like "5:32 PM".');
    return '';
  }

  let hours = parseInt(timeParts[1], 10);
  const minutes = timeParts[2];
  const ampm = timeParts[3].toUpperCase();

  // Convert hours to 24-hour format.
  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  }
  // Handle the midnight case (12:xx AM should be 00:xx).
  if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }

  // Format the hours to always have two digits (e.g., "09").
  const formattedHours = hours.toString().padStart(2, '0');

  // Return the final "HH:mm" string.
  return `${formattedHours}:${minutes}`;
}

export const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "accepted_offer": case "A": return "bg-green-100 text-green-800";
    case "onhold": return "bg-yellow-100 text-yellow-800";
    case "rejected": return "bg-red-100 text-red-800";
    case "pending_offer": return "bg-gray-500 text-white";
    case "inactive": return "bg-gray-100 text-gray-800";
    case "interview": default: return "bg-blue-100 text-blue-800";
  }
};