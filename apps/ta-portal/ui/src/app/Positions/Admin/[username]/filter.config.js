// src/app/Positions/Admin/[username]/filter.config.js

export const generatePositionsFilterConfig = (semesterOptions = []) => [
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
    id: 'semester',
    label: 'Semester',
    type: 'select',
    placeholder: 'Any Semester',
    options: semesterOptions,
    optionLabel: (semester) => `Semester ${semester}`,
  },
  {
    id: 'status',
    label: 'Position Status',
    type: 'checkbox',
    options: ['Active', 'Open', 'Filled', 'Onhold', 'Inactive', 'Pending Approval', 'Rejected']
  },
  {
    id: 'location',
    label: 'Location',
    type: 'radio',
    options: ["Remote", "Hybrid", "In-Person"]
  }
];