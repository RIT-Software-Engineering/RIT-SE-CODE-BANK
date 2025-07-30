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
    type: 'checkbox',
    options: ["100-level", "200-level", "300-level", "400-level", "500-level", "600-level", "700-level"]
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