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

export const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "selected": case "accepted": return "bg-green-100 text-green-800";
    case "onhold": return "bg-yellow-100 text-yellow-800";
    case "rejected": return "bg-red-100 text-red-800";
    case "pending_acceptance": return "bg-gray-500 text-white";
    case "inactive": return "bg-gray-100 text-gray-800";
    case "applied": default: return "bg-blue-100 text-blue-800";
  }
};