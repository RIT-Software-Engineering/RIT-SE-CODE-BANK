// app/applications/filter.config.js

export const generateApplicationsFilterConfig = (semesterOptions = []) => [
  {
    id: 'status',
    label: 'Application Status',
    type: 'checkbox',
    options: ['Applied', 'Accepted', 'Pending Acceptance', 'Selected', 'Onhold', 'Rejected', 'Inactive'],
  },
  {
    id: 'level',
    label: 'Course Level',
    type: 'select',
    placeholder: 'Any Level',
    options: ["100", "200", "300", "400", "500", "600", "700"],
    optionLabel: (level) => `${level}-level`,
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
    id: 'hasApplications',
    label: 'Has Applications',
    type: 'radio',
    options: ["Yes", "No", "Any"],
  }
];