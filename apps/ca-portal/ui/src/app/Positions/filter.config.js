// In your Positions.js file
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
    options: ["Online", "In-Person"]
  }
];