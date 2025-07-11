// --- Reusable Helper Functions ---
export const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "selected": case "hired": return "bg-green-100 text-green-800";
    case "on hold": return "bg-yellow-100 text-yellow-800";
    case "rejected": return "bg-red-100 text-red-800";
    case "withdrawn": return "bg-gray-500 text-white";
    case "applied": default: return "bg-blue-100 text-blue-800";
  }
};