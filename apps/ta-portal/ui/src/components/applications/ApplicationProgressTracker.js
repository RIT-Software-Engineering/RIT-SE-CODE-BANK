import React from 'react';

// =============================================================================
// Redesigned Application Tracker Component (Final Segmented Bar Version)
// =============================================================================

const progressStages = [
  { status: 'APPLIED', label: 'Applied', tooltip: 'The student\'s application has been successfully submitted.' },
  { status: 'INTERVIEW', label: 'Interview', tooltip: 'The student has been selected for an interview.' },
  { status: 'PENDING_OFFER', label: 'Offer', tooltip: 'An offer is being prepared or is pending a review by the student.' },
  { status: 'ACCEPTED_OFFER', label: 'Accepted', tooltip: 'Offer has been accepted by the student and is awaiting final review by the administration.' },
  { status: 'HIRED', label: 'Hired', tooltip: 'Welcome aboard! The student is now hired for this position.' },
];

const otherStates = {
  REJECTED: { label: 'Rejected', color: 'bg-red-500', icon: '✕', tooltip: 'The student has been rejected for this position.' },
  DECLINED_OFFER: { label: 'Declined', color: 'bg-red-500', icon: '✕', tooltip: 'The student has declined the offer for this position.' },
  ONHOLD: { label: 'On Hold', color: 'bg-yellow-500', icon: '⏸', tooltip: 'The student has been placed on hold for this position.' },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-400', icon: '!', tooltip: 'The application is no longer active.' },
};

/**
 * A visual component that displays application progress in a horizontal segmented bar.
 * This version uses a simple, robust design that avoids layout bugs.
 * @param {object} props
 * @param {string} props.currentStep - The current status of the application (e.g., 'INTERVIEW', 'REJECTED').
 */
export default function ApplicationTracker({ currentStep }) {
  const currentIndex = progressStages.findIndex(stage => stage.status === currentStep);

  // Handle terminal states like Rejected or On Hold
  if (otherStates[currentStep]) {
    const stateInfo = otherStates[currentStep];
    return (
      <div className="w-full font-sans relative group">
        {/* This div is now a full-width bar, matching the height of the progress bar */}
        <div className={`w-full h-8 flex items-center justify-center space-x-2 rounded-full text-white text-sm font-semibold ${stateInfo.color}`}>
          <span>{stateInfo.icon}</span>
          <span>{stateInfo.label}</span>
        </div>
        
        {/* Tooltip positioned relative to the full-width container */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
          {stateInfo.tooltip}
        </div>
      </div>
    );
  }

  // Handle in-progress/non-terminal stages like Applied or Interview
  return (
    <div className="w-full font-sans">
      {/* This container uses flexbox and a gap to create the segmented look */}
      <div className="flex w-full h-8 space-x-1">
        {progressStages.map((stage, index) => {
          const isCompleted = currentIndex > -1 && index <= currentIndex;
          
          let stageColor = 'bg-gray-200';
          let textColor = 'text-gray-500';

          if (isCompleted) {
            stageColor = 'bg-gray-800'; 
            textColor = 'text-white';
          }
          
          // Add a special highlight for the very last completed step
          if (index === currentIndex) {
            stageColor = 'bg-rit-orange'; 
          }

          // Apply rounded corners to the first and last segments
          const roundedClasses = 
            index === 0 ? 'rounded-l-full' : 
            index === progressStages.length - 1 ? 'rounded-r-full' : '';

          return (
            <div key={stage.status} className="relative flex-1 group">
              <div
                className={`w-full h-full flex items-center justify-center transition-colors duration-500 ${stageColor} ${roundedClasses}`}
              >
                <span className={`text-xs sm:text-sm font-semibold text-center z-10 px-2 ${textColor}`}>
                  {stage.label}
                </span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                {stage.tooltip}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
