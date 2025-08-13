"use client";

import React from 'react';

const progressStages = [
  { status: 'PENDING_APPROVAL', label: 'Pending', tooltip: 'Position is awaiting admin approval.' },
  { status: 'OPEN', label: 'Open', tooltip: 'Position is open and accepting applications.' },
  { status: 'FILLED', label: 'Filled', tooltip: 'All available spots for this position have been filled.' },
  { status: 'ACTIVE', label: 'Active', tooltip: 'The position is currently active for the semester.' },
];

const otherStates = {
  REJECTED: { label: 'Rejected', color: 'bg-red-500', icon: '✕', tooltip: 'This position submission was rejected by an admin.' },
  ONHOLD: { label: 'On Hold', color: 'bg-yellow-500', icon: '⏸', tooltip: 'This position is temporarily on hold.' },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-400', icon: '!', tooltip: 'This position is no longer active.' },
};

export default function PositionTracker({ currentStep }) {
  const currentIndex = progressStages.findIndex(stage => stage.status === currentStep);

  if (otherStates[currentStep]) {
    const stateInfo = otherStates[currentStep];
    return (
      <div className="w-full font-sans relative group mt-2">
        <div className={`w-full h-7 flex items-center justify-center space-x-2 rounded-full text-white text-xs font-semibold ${stateInfo.color}`}>
          <span>{stateInfo.icon}</span>
          <span>{stateInfo.label}</span>
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
          {stateInfo.tooltip}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans mt-2">
      <div className="flex w-full h-7 space-x-1">
        {progressStages.map((stage, index) => {
          const isCompleted = currentIndex > -1 && index <= currentIndex;
          let stageColor = 'bg-gray-200';
          let textColor = 'text-gray-500';

          if (isCompleted) {
            stageColor = 'bg-gray-700';
            textColor = 'text-white';
          }
          
          if (index === currentIndex) {
            stageColor = 'bg-rit-orange';
          }

          const roundedClasses = 
            index === 0 ? 'rounded-l-full' : 
            index === progressStages.length - 1 ? 'rounded-r-full' : '';

          return (
            <div key={stage.status} className="relative flex-1 group">
              <div
                className={`w-full h-full flex items-center justify-center transition-colors duration-500 ${stageColor} ${roundedClasses}`}
              >
                <span className={`text-xs font-semibold text-center z-10 px-1 ${textColor}`}>
                  {stage.label}
                </span>
              </div>
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