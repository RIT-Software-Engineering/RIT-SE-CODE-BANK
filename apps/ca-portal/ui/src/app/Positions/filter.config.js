// src/app/Positions/filter.config.js

export const positionFilterConfig = [
  {
    id: 'days',
    label: 'Day of the Week',
    type: 'checkbox',
    options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  {
    id: 'level',
    label: 'Course Level',
    type: 'select',
    placeholder: 'Any Level',
    options: ["100", "200", "300", "400", "500", "600"],
    optionLabel: (level) => `${level}-level` // Custom label for the options
  },
  {
    id: 'location',
    label: 'Location',
    type: 'radio',
    options: ["Remote", "Hybrid", "In-Person"]
  },
  {
    id: 'eligibility',
    label: 'Eligibility',
    type: 'radio',
    options: ["Eligible", "Not Eligible", "Any"]
  },
  {
    id: 'applied',
    label: 'Applied',
    type: 'radio',
    options: ["Applied", "Not Applied", "Any"]
  }
];